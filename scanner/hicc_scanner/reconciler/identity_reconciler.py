"""
Identity Reconciliation & Deduplicated Alert Engine (`identity_reconciler.py`)
Enforces core HICC V1.0 architectural rules:
1. Stable UUID device identity (matches by MAC first, then Serial/Hostname, then current IP).
2. Two-Plane Data Separation: NEVER overwrites manual IT fields (`department_id`, `assigned_user`,
   `location`, `notes`, `device_code`, `display_name`, or `device_type_id` when `is_type_locked=True`).
3. Preserves full IP and MAC change history in `device_interfaces`.
4. Consecutive failure threshold (`consecutive_failures >= threshold`) before marking a device OFFLINE.
5. Deduplicated Alert generation using `dedup_key` (never creates duplicate active alerts).
"""

from datetime import datetime, timezone
from pathlib import Path
import sys
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models import (  # noqa: E402
    Alert,
    AlertSeverity,
    AlertStatus,
    AlertType,
    Device,
    DeviceEvent,
    DeviceEventType,
    DeviceInterface,
    DeviceObservation,
    DeviceStatus,
    DeviceType,
    DeviceTypeCode,
    ScanJob,
    ScanResult,
    SnmpMetric,
)
from ..config import HostObservation  # noqa: E402
from ..oui_lookup import normalize_mac  # noqa: E402


def upsert_deduplicated_alert(
    session: Session,
    *,
    dedup_key: str,
    alert_type: str,
    severity: str,
    title: str,
    description: str,
    device_id: Optional[uuid.UUID] = None,
    subnet_id: Optional[uuid.UUID] = None,
    context_data: Optional[dict] = None,
) -> tuple[Alert, bool]:
    """
    Creates a new OPEN alert or increments `occurrence_count` if an active (`OPEN` or `ACKNOWLEDGED`)
    alert with the same `dedup_key` already exists.
    Returns `(alert_instance, is_newly_created)`.
    """
    now = datetime.now(timezone.utc)
    existing = session.scalar(
        select(Alert).where(
            Alert.dedup_key == dedup_key,
            Alert.status.in_([AlertStatus.OPEN.value, AlertStatus.ACKNOWLEDGED.value]),
        )
    )
    if existing is not None:
        existing.occurrence_count += 1
        existing.last_occurred_at = now
        if context_data:
            existing.context_data = {**(existing.context_data or {}), **context_data}
        return existing, False

    new_alert = Alert(
        device_id=device_id,
        subnet_id=subnet_id,
        dedup_key=dedup_key,
        alert_type=alert_type,
        severity=severity,
        title=title,
        description=description,
        status=AlertStatus.OPEN.value,
        occurrence_count=1,
        context_data=context_data or {},
        detected_at=now,
        last_occurred_at=now,
    )
    session.add(new_alert)
    return new_alert, True


def auto_resolve_alert_by_key(session: Session, dedup_key: str, resolution_note: str) -> bool:
    """Automatically resolves an active alert when the underlying condition recovers."""
    existing = session.scalar(
        select(Alert).where(
            Alert.dedup_key == dedup_key,
            Alert.status.in_([AlertStatus.OPEN.value, AlertStatus.ACKNOWLEDGED.value]),
        )
    )
    if existing is not None:
        existing.status = AlertStatus.RESOLVED.value
        existing.resolved_at = datetime.now(timezone.utc)
        existing.resolution_note = resolution_note
        return True
    return False


def get_device_type_map(session: Session) -> dict[str, DeviceType]:
    """Loads all DeviceType records keyed by their `code`."""
    types = session.scalars(select(DeviceType)).all()
    return {dt.code: dt for dt in types}


def find_existing_device(session: Session, obs: HostObservation) -> Optional[Device]:
    """
    Matches an observation to an existing `Device` record using priority:
    1. Canonical MAC address (`last_mac_address` or historical `device_interfaces.mac_address`)
    2. Hardware Serial Number (if collected via SNMP/ONVIF)
    3. Current IP address (`last_ip_address` when MAC is unavailable on Routed L3)
    """
    norm_mac = normalize_mac(obs.mac_address)
    if norm_mac:
        by_mac = session.scalar(select(Device).where(Device.last_mac_address == norm_mac))
        if by_mac is not None:
            return by_mac

        iface = session.scalar(
            select(DeviceInterface)
            .where(DeviceInterface.mac_address == norm_mac)
            .order_by(DeviceInterface.last_seen.desc())
        )
        if iface is not None:
            return session.get(Device, iface.device_id)

    serial = (obs.snmp.serial_number if obs.snmp else None) or (
        obs.onvif.serial_number if obs.onvif else None
    )
    if serial:
        by_serial = session.scalar(select(Device).where(Device.serial_number == serial))
        if by_serial is not None:
            return by_serial

    by_ip = session.scalar(select(Device).where(Device.last_ip_address == obs.ip_address))
    return by_ip


def reconcile_host_observation(
    session: Session,
    obs: HostObservation,
    scan_job: ScanJob,
    device_type_map: dict[str, DeviceType],
) -> tuple[Optional[Device], bool, int]:
    """
    Reconciles a single `HostObservation` into PostgreSQL.
    Returns `(device_or_none, is_new_device, alerts_created_count)`.
    """
    now = obs.observed_at
    norm_mac = normalize_mac(obs.mac_address)
    alerts_created = 0

    # Record raw ScanResult for alive hosts
    classification = obs.classification
    matched_type_code = classification.device_type_code if classification else DeviceTypeCode.UNKNOWN.value
    conf_score = classification.confidence_score if classification else 0

    if obs.is_alive:
        raw_result = ScanResult(
            scan_job_id=scan_job.id,
            ip_address=obs.ip_address,
            mac_address=norm_mac,
            mac_vendor=obs.mac_vendor,
            hostname=obs.hostname,
            is_alive=True,
            response_time_ms=obs.latency_ms,
            open_ports=obs.open_tcp_ports,
            raw_fingerprint={
                "signals": classification.signals if classification else [],
                "http_banner": obs.http_banner,
                "icmp_blocked": obs.icmp_blocked,
            },
            matched_device_type=matched_type_code,
            confidence_score=conf_score,
            observed_at=now,
        )
        session.add(raw_result)

    # Check for L2 ARP IP Conflict (Multiple MACs claiming same IP in same scan cycle)
    if obs.conflicting_macs:
        all_macs = [norm_mac] + obs.conflicting_macs if norm_mac else obs.conflicting_macs
        _, created = upsert_deduplicated_alert(
            session,
            dedup_key=f"IP_CONFLICT:{obs.ip_address}",
            alert_type=AlertType.IP_CONFLICT.value,
            severity=AlertSeverity.CRITICAL.value,
            title=f"Xung đột địa chỉ IP {obs.ip_address}",
            description=(
                f"Phát hiện nhiều địa chỉ MAC ({', '.join(all_macs)}) cùng phản hồi cho địa chỉ IP {obs.ip_address}."
            ),
            subnet_id=obs.subnet_id,
            context_data={"ip_address": obs.ip_address, "mac_addresses": all_macs},
        )
        if created:
            alerts_created += 1

    existing_device = find_existing_device(session, obs)

    # If host is not alive and has never been seen before, ignore empty IP slot
    if not obs.is_alive and existing_device is None:
        return None, False, alerts_created

    unknown_dtype = device_type_map.get(DeviceTypeCode.UNKNOWN.value)
    target_dtype = device_type_map.get(matched_type_code, unknown_dtype)
    assert target_dtype is not None, "DeviceType catalog must be seeded before scanning."

    # CASE 1: Brand new device discovered on the network
    if existing_device is None:
        new_dev = Device(
            hostname=obs.hostname,
            discovered_hostname=obs.hostname,
            device_type_id=target_dtype.id,
            is_type_locked=False,
            confidence_score=conf_score,
            manufacturer=classification.manufacturer if classification else obs.mac_vendor,
            model=classification.model if classification else None,
            serial_number=(obs.snmp.serial_number if obs.snmp else None)
            or (obs.onvif.serial_number if obs.onvif else None),
            os_family=classification.os_family if classification else None,
            primary_subnet_id=obs.subnet_id,
            status=DeviceStatus.ONLINE.value,
            is_new=True,
            is_authorized=False,
            icmp_blocked=obs.icmp_blocked,
            consecutive_failures=0,
            last_ip_address=obs.ip_address,
            last_mac_address=norm_mac,
            first_seen=now,
            last_seen=now,
        )
        session.add(new_dev)
        session.flush()

        session.add(
            DeviceInterface(
                device_id=new_dev.id,
                ip_address=obs.ip_address,
                mac_address=norm_mac,
                mac_vendor=obs.mac_vendor,
                is_current=True,
                is_primary=True,
                first_seen=now,
                last_seen=now,
            )
        )
        session.add(
            DeviceObservation(
                device_id=new_dev.id,
                scan_job_id=scan_job.id,
                observed_ip=obs.ip_address,
                observed_mac=norm_mac,
                status=DeviceStatus.ONLINE.value,
                latency_ms=obs.latency_ms,
                packet_loss=obs.packet_loss,
                open_ports=obs.open_tcp_ports,
                probe_method=obs.primary_probe_method,
                observed_at=now,
            )
        )
        session.add(
            DeviceEvent(
                device_id=new_dev.id,
                event_type=DeviceEventType.NEW_DEVICE.value,
                severity=AlertSeverity.WARNING.value,
                new_value=f"{obs.ip_address} ({norm_mac or 'No-MAC'})",
                description=(
                    f"Phát hiện thiết bị mới lần đầu kết nối mạng tại IP {obs.ip_address} "
                    f"(MAC: {norm_mac or 'N/A'}, Phân loại: {target_dtype.name}, Độ tin cậy: {conf_score}%)."
                ),
                occurred_at=now,
            )
        )
        _, created = upsert_deduplicated_alert(
            session,
            dedup_key=f"NEW_DEVICE:{new_dev.id}",
            alert_type=AlertType.NEW_DEVICE.value,
            severity=AlertSeverity.WARNING.value,
            title=f"Thiết bị mới xuất hiện: {obs.hostname or obs.ip_address}",
            description=(
                f"Thiết bị mới vừa kết nối mạng tại IP {obs.ip_address}, MAC {norm_mac or 'N/A'} "
                f"({obs.mac_vendor or 'Unknown Vendor'})."
            ),
            device_id=new_dev.id,
            subnet_id=obs.subnet_id,
            context_data={"ip": obs.ip_address, "mac": norm_mac, "type": target_dtype.code},
        )
        if created:
            alerts_created += 1

        _save_snmp_metrics_if_present(session, new_dev.id, obs, now)
        return new_dev, True, alerts_created

    # CASE 2: Existing device reconciliation (STRICTLY PRESERVES MANUAL IT FIELDS)
    dev = existing_device
    if obs.is_alive:
        previous_status = dev.status
        previous_ip = str(dev.last_ip_address) if dev.last_ip_address else None
        previous_mac = str(dev.last_mac_address).upper() if dev.last_mac_address else None

        dev.last_seen = now
        dev.consecutive_failures = 0
        dev.icmp_blocked = obs.icmp_blocked

        if obs.hostname:
            dev.discovered_hostname = obs.hostname
            if not dev.hostname:
                dev.hostname = obs.hostname

        # Only update device_type_id if NOT locked by IT staff and new classification is confident
        if not dev.is_type_locked and conf_score >= dev.confidence_score and conf_score >= 60:
            dev.device_type_id = target_dtype.id
            dev.confidence_score = conf_score

        if classification and classification.manufacturer and not dev.manufacturer:
            dev.manufacturer = classification.manufacturer
        if classification and classification.model and not dev.model:
            dev.model = classification.model
        if classification and classification.os_family and not dev.os_family:
            dev.os_family = classification.os_family

        # Detect IP Address Change
        if previous_ip and previous_ip != obs.ip_address:
            dev.last_ip_address = obs.ip_address
            _update_device_interface_history(session, dev.id, obs.ip_address, norm_mac, obs.mac_vendor, now)
            session.add(
                DeviceEvent(
                    device_id=dev.id,
                    event_type=DeviceEventType.IP_CHANGED.value,
                    severity=AlertSeverity.INFO.value,
                    previous_value=previous_ip,
                    new_value=obs.ip_address,
                    description=f"Thiết bị thay đổi địa chỉ IP từ {previous_ip} sang {obs.ip_address}.",
                    occurred_at=now,
                )
            )
            _, created = upsert_deduplicated_alert(
                session,
                dedup_key=f"IP_CHANGED:{dev.id}:{obs.ip_address}",
                alert_type=AlertType.IP_CHANGED.value,
                severity=AlertSeverity.INFO.value,
                title=f"Thay đổi địa chỉ IP: {dev.display_name or dev.hostname or dev.id}",
                description=f"Thiết bị (MAC {norm_mac or previous_mac}) đã đổi IP từ {previous_ip} sang {obs.ip_address}.",
                device_id=dev.id,
                subnet_id=obs.subnet_id,
            )
            if created:
                alerts_created += 1
        else:
            dev.last_ip_address = obs.ip_address
            _update_device_interface_history(session, dev.id, obs.ip_address, norm_mac, obs.mac_vendor, now)

        # Detect abnormal MAC change on a static IP
        if norm_mac and previous_mac and norm_mac != previous_mac and previous_ip == obs.ip_address:
            dev.last_mac_address = norm_mac
            session.add(
                DeviceEvent(
                    device_id=dev.id,
                    event_type=DeviceEventType.MAC_CHANGED.value,
                    severity=AlertSeverity.HIGH.value,
                    previous_value=previous_mac,
                    new_value=norm_mac,
                    description=f"Địa chỉ MAC tại IP {obs.ip_address} thay đổi từ {previous_mac} sang {norm_mac}.",
                    occurred_at=now,
                )
            )
            _, created = upsert_deduplicated_alert(
                session,
                dedup_key=f"MAC_ANOMALY:{dev.id}:{norm_mac}",
                alert_type=AlertType.MAC_ANOMALY.value,
                severity=AlertSeverity.HIGH.value,
                title=f"Thay đổi MAC bất thường tại IP {obs.ip_address}",
                description=f"IP {obs.ip_address} trước đây gắn với MAC {previous_mac}, nay phản hồi MAC {norm_mac}.",
                device_id=dev.id,
                subnet_id=obs.subnet_id,
            )
            if created:
                alerts_created += 1
        elif norm_mac and not previous_mac:
            dev.last_mac_address = norm_mac

        # Handle state recovery from OFFLINE -> ONLINE
        if previous_status == DeviceStatus.OFFLINE.value:
            dev.status = DeviceStatus.ONLINE.value
            session.add(
                DeviceEvent(
                    device_id=dev.id,
                    event_type=DeviceEventType.STATE_ONLINE.value,
                    severity=AlertSeverity.INFO.value,
                    previous_value=DeviceStatus.OFFLINE.value,
                    new_value=DeviceStatus.ONLINE.value,
                    description=f"Thiết bị khôi phục kết nối tại IP {obs.ip_address}.",
                    occurred_at=now,
                )
            )
            auto_resolve_alert_by_key(
                session,
                f"DEVICE_OFFLINE:{dev.id}",
                f"Thiết bị tự động khôi phục kết nối lúc {now.isoformat()}.",
            )
        elif dev.status != DeviceStatus.MAINTENANCE.value:
            dev.status = DeviceStatus.ONLINE.value

        session.add(
            DeviceObservation(
                device_id=dev.id,
                scan_job_id=scan_job.id,
                observed_ip=obs.ip_address,
                observed_mac=norm_mac or dev.last_mac_address,
                status=DeviceStatus.ONLINE.value,
                latency_ms=obs.latency_ms,
                packet_loss=obs.packet_loss,
                open_ports=obs.open_tcp_ports,
                probe_method=obs.primary_probe_method,
                observed_at=now,
            )
        )
        _save_snmp_metrics_if_present(session, dev.id, obs, now)
        return dev, False, alerts_created

    # CASE 3: Existing device did NOT respond in this cycle
    if dev.status == DeviceStatus.MAINTENANCE.value:
        return dev, False, alerts_created

    dev.consecutive_failures += 1
    dtype_obj = session.get(DeviceType, dev.device_type_id)
    threshold = dtype_obj.default_offline_threshold if dtype_obj else 3

    session.add(
        DeviceObservation(
            device_id=dev.id,
            scan_job_id=scan_job.id,
            observed_ip=obs.ip_address,
            observed_mac=dev.last_mac_address,
            status="TIMEOUT",
            latency_ms=None,
            packet_loss=100.0,
            open_ports=[],
            probe_method="ICMP",
            observed_at=now,
        )
    )

    if dev.consecutive_failures >= threshold and dev.status != DeviceStatus.OFFLINE.value:
        prev_st = dev.status
        dev.status = DeviceStatus.OFFLINE.value
        session.add(
            DeviceEvent(
                device_id=dev.id,
                event_type=DeviceEventType.STATE_OFFLINE.value,
                severity=AlertSeverity.HIGH.value,
                previous_value=prev_st,
                new_value=DeviceStatus.OFFLINE.value,
                description=(
                    f"Thiết bị không phản hồi sau {dev.consecutive_failures} chu kỳ kiểm tra liên tiếp "
                    f"(Ngưỡng: {threshold}). Chuyển trạng thái sang OFFLINE."
                ),
                occurred_at=now,
            )
        )
        _, created = upsert_deduplicated_alert(
            session,
            dedup_key=f"DEVICE_OFFLINE:{dev.id}",
            alert_type=AlertType.DEVICE_OFFLINE.value,
            severity=AlertSeverity.HIGH.value,
            title=f"Mất kết nối thiết bị: {dev.display_name or dev.hostname or obs.ip_address}",
            description=(
                f"Thiết bị tại IP {obs.ip_address} (MAC: {dev.last_mac_address or 'N/A'}) "
                f"không phản hồi qua {dev.consecutive_failures} chu kỳ quét liên tiếp."
            ),
            device_id=dev.id,
            subnet_id=obs.subnet_id,
        )
        if created:
            alerts_created += 1

    return dev, False, alerts_created


def _update_device_interface_history(
    session: Session,
    device_id: uuid.UUID,
    ip_address: str,
    mac_address: Optional[str],
    mac_vendor: Optional[str],
    now: datetime,
) -> None:
    """Preserves full IP/MAC history in `device_interfaces` without deleting old bindings."""
    current_ifaces = session.scalars(
        select(DeviceInterface).where(
            DeviceInterface.device_id == device_id,
            DeviceInterface.is_current.is_(True),
        )
    ).all()

    matched_current: Optional[DeviceInterface] = None
    for iface in current_ifaces:
        same_ip = str(iface.ip_address) == ip_address
        same_mac = (mac_address is None) or (
            iface.mac_address is not None and str(iface.mac_address).upper() == mac_address
        )
        if same_ip and same_mac:
            matched_current = iface
        else:
            iface.is_current = False

    if matched_current is not None:
        matched_current.last_seen = now
        if mac_address and not matched_current.mac_address:
            matched_current.mac_address = mac_address
        if mac_vendor and not matched_current.mac_vendor:
            matched_current.mac_vendor = mac_vendor
    else:
        session.add(
            DeviceInterface(
                device_id=device_id,
                ip_address=ip_address,
                mac_address=mac_address,
                mac_vendor=mac_vendor,
                is_current=True,
                is_primary=True,
                first_seen=now,
                last_seen=now,
            )
        )


def _save_snmp_metrics_if_present(
    session: Session,
    device_id: uuid.UUID,
    obs: HostObservation,
    now: datetime,
) -> None:
    if obs.snmp and obs.snmp.reachable:
        session.add(
            SnmpMetric(
                device_id=device_id,
                sys_name=obs.snmp.sys_name,
                sys_descr=obs.snmp.sys_descr,
                sys_object_id=obs.snmp.sys_object_id,
                uptime_ticks=obs.snmp.uptime_ticks,
                total_interfaces=obs.snmp.total_interfaces,
                active_interfaces=obs.snmp.active_interfaces,
                printer_page_count=obs.snmp.printer_page_count,
                printer_status=obs.snmp.printer_status,
                interface_stats=obs.snmp.interface_stats,
                collected_at=now,
            )
        )
