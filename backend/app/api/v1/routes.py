"""
Phase 3 & Phase 4 REST API Endpoints (`routes.py`)
Implements:
- Device Inventory listing, filtering, IP/MAC/Hostname search, and Management Plane updates
- IP & MAC Historical Lookup (`/api/v1/lookup/ip/{ip}`, `/api/v1/lookup/mac/{mac}`)
- Subnet Registration & Approval (`/api/v1/subnets`)
- Alert Management (List, Acknowledge, Resolve with Audit Logging)
"""

from datetime import datetime, timezone
import math
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ...core.security import get_db, require_roles
from ...models import (
    Alert,
    AlertSeverity,
    AlertStatus,
    AuditLog,
    Department,
    Device,
    DeviceEvent,
    DeviceEventType,
    DeviceInterface,
    DeviceRelationship,
    DeviceStatus,
    DeviceType,
    NetworkSubnet,
    ScanJob,
    ScanJobStatus,
    SystemSetting,
    User,
    UserRole,
)
from ...schemas.inventory import (
    AlertAcknowledgeRequest,
    AlertResolveRequest,
    DeviceManagementUpdateRequest,
    SubnetApproveRequest,
    SubnetCreateRequest,
)

router = APIRouter(prefix="/api/v1")


def record_audit_log(
    db: Session,
    *,
    user: User,
    action: str,
    target_type: str,
    target_id: Optional[str],
    request: Optional[Request] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
) -> None:
    """Appends an immutable entry to `audit_logs`."""
    client_ip = request.client.host if (request and request.client) else None
    user_agent = request.headers.get("user-agent") if request else None
    db.add(
        AuditLog(
            user_id=user.id,
            username=user.username,
            action=action,
            target_type=target_type,
            target_id=target_id,
            client_ip=client_ip,
            user_agent=user_agent,
            old_values=old_values,
            new_values=new_values,
        )
    )


@router.get("/devices")
def list_devices(
    search: Optional[str] = Query(default=None, description="Search by IP, MAC, Hostname, Device Code, or User"),
    device_type: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    department_id: Optional[uuid.UUID] = Query(default=None),
    is_new: Optional[bool] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Paginated device inventory with search across IP, MAC, Hostname, Asset Code, and Assigned User."""
    stmt = (
        select(Device, DeviceType, Department)
        .join(DeviceType, Device.device_type_id == DeviceType.id)
        .outerjoin(Department, Device.department_id == Department.id)
    )

    if search and search.strip():
        q = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Device.hostname.ilike(q),
                Device.discovered_hostname.ilike(q),
                Device.display_name.ilike(q),
                Device.device_code.ilike(q),
                Device.assigned_user.ilike(q),
                func.cast(Device.last_ip_address, func.TEXT).ilike(q),
                func.cast(Device.last_mac_address, func.TEXT).ilike(q),
            )
        )

    if device_type:
        stmt = stmt.where(DeviceType.code == device_type.upper())
    if status_filter:
        stmt = stmt.where(Device.status == status_filter.upper())
    if department_id:
        stmt = stmt.where(Device.department_id == department_id)
    if is_new is not None:
        stmt = stmt.where(Device.is_new.is_(is_new))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(
        stmt.order_by(Device.last_seen.desc().nullslast())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    items = [
        {
            "id": str(dev.id),
            "device_code": dev.device_code,
            "hostname": dev.hostname,
            "discovered_hostname": dev.discovered_hostname,
            "display_name": dev.display_name,
            "device_type_code": dtype.code,
            "device_type_name": dtype.name,
            "is_type_locked": dev.is_type_locked,
            "confidence_score": dev.confidence_score,
            "manufacturer": dev.manufacturer,
            "model": dev.model,
            "department_id": str(dev.department_id) if dev.department_id else None,
            "department_name": dept.name if dept else None,
            "assigned_user": dev.assigned_user,
            "location": dev.location,
            "notes": dev.notes,
            "status": dev.status,
            "is_new": dev.is_new,
            "is_authorized": dev.is_authorized,
            "icmp_blocked": dev.icmp_blocked,
            "last_ip_address": str(dev.last_ip_address) if dev.last_ip_address else None,
            "last_mac_address": str(dev.last_mac_address) if dev.last_mac_address else None,
            "first_seen": dev.first_seen,
            "last_seen": dev.last_seen,
        }
        for dev, dtype, dept in rows
    ]

    return {
        "data": items,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, math.ceil(total / limit)),
        },
    }


@router.patch("/devices/{device_id}/management")
def update_device_management_plane(
    device_id: uuid.UUID,
    payload: DeviceManagementUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.IT, UserRole.ADMIN)),
):
    """
    Updates the manual IT management fields of a device (`department_id`, `assigned_user`,
    `location`, `notes`, `device_code`, `display_name`, and locked `device_type`).
    These fields are strictly protected from being overwritten by future network scans.
    """
    dev = db.get(Device, device_id)
    if dev is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "DEVICE_NOT_FOUND", "message": "Device not found."},
        )

    old_snapshot = {
        "device_code": dev.device_code,
        "display_name": dev.display_name,
        "department_id": str(dev.department_id) if dev.department_id else None,
        "assigned_user": dev.assigned_user,
        "location": dev.location,
        "notes": dev.notes,
        "is_type_locked": dev.is_type_locked,
        "is_authorized": dev.is_authorized,
    }

    if payload.device_code is not None:
        dev.device_code = payload.device_code.strip() or None
    if payload.display_name is not None:
        dev.display_name = payload.display_name.strip() or None
    if payload.department_id is not None:
        dev.department_id = payload.department_id
    if payload.assigned_user is not None:
        dev.assigned_user = payload.assigned_user.strip() or None
    if payload.location is not None:
        dev.location = payload.location.strip() or None
    if payload.notes is not None:
        dev.notes = payload.notes

    if payload.device_type_code:
        dtype = db.scalar(select(DeviceType).where(DeviceType.code == payload.device_type_code.upper()))
        if dtype is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error_code": "INVALID_DEVICE_TYPE", "message": f"Unknown device_type_code '{payload.device_type_code}'."},
            )
        dev.device_type_id = dtype.id
        dev.is_type_locked = payload.lock_device_type

    if payload.is_authorized is not None:
        dev.is_authorized = payload.is_authorized
    if payload.mark_reviewed:
        dev.is_new = False

    new_snapshot = {
        "device_code": dev.device_code,
        "display_name": dev.display_name,
        "department_id": str(dev.department_id) if dev.department_id else None,
        "assigned_user": dev.assigned_user,
        "location": dev.location,
        "notes": dev.notes,
        "is_type_locked": dev.is_type_locked,
        "is_authorized": dev.is_authorized,
    }

    db.add(
        DeviceEvent(
            device_id=dev.id,
            event_type=DeviceEventType.ASSET_UPDATED.value,
            severity="INFO",
            description=f"Nhân viên CNTT ({current_user.username}) cập nhật thông tin quản lý thiết bị.",
            details={"old": old_snapshot, "new": new_snapshot},
        )
    )
    record_audit_log(
        db,
        user=current_user,
        action="DEVICE_MANAGEMENT_UPDATE",
        target_type="DEVICE",
        target_id=str(dev.id),
        request=request,
        old_values=old_snapshot,
        new_values=new_snapshot,
    )
    db.commit()
    return {"status": "updated", "device_id": str(dev.id), "management": new_snapshot}


@router.get("/lookup/ip/{ip_address}")
def lookup_ip_history(
    ip_address: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Returns current and historical devices that have bound to a specific IPv4 address."""
    rows = db.execute(
        select(DeviceInterface, Device)
        .join(Device, DeviceInterface.device_id == Device.id)
        .where(DeviceInterface.ip_address == ip_address)
        .order_by(DeviceInterface.is_current.desc(), DeviceInterface.last_seen.desc())
    ).all()

    return {
        "ip_address": ip_address,
        "bindings": [
            {
                "device_id": str(dev.id),
                "hostname": dev.hostname,
                "display_name": dev.display_name,
                "mac_address": str(iface.mac_address) if iface.mac_address else None,
                "mac_vendor": iface.mac_vendor,
                "is_current": iface.is_current,
                "first_seen": iface.first_seen,
                "last_seen": iface.last_seen,
                "device_status": dev.status,
            }
            for iface, dev in rows
        ],
    }


@router.get("/lookup/mac/{mac_address}")
def lookup_mac_history(
    mac_address: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Returns the device and full historical IP timeline associated with a MAC address."""
    rows = db.execute(
        select(DeviceInterface, Device)
        .join(Device, DeviceInterface.device_id == Device.id)
        .where(DeviceInterface.mac_address == mac_address)
        .order_by(DeviceInterface.is_current.desc(), DeviceInterface.last_seen.desc())
    ).all()

    return {
        "mac_address": mac_address,
        "bindings": [
            {
                "device_id": str(dev.id),
                "hostname": dev.hostname,
                "display_name": dev.display_name,
                "ip_address": str(iface.ip_address),
                "mac_vendor": iface.mac_vendor,
                "is_current": iface.is_current,
                "first_seen": iface.first_seen,
                "last_seen": iface.last_seen,
                "device_status": dev.status,
            }
            for iface, dev in rows
        ],
    }


@router.post("/subnets", status_code=status.HTTP_201_CREATED)
def create_subnet(
    payload: SubnetCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Registers a new internal subnet (defaults to `is_approved = False` until explicitly approved)."""
    subnet = NetworkSubnet(
        name=payload.name,
        cidr=payload.cidr,
        gateway_ip=payload.gateway_ip,
        vlan_id=payload.vlan_id,
        scan_mode=payload.scan_mode,
        is_approved=False,
        is_active=True,
        description=payload.description,
    )
    db.add(subnet)
    db.flush()
    record_audit_log(
        db,
        user=current_user,
        action="SUBNET_CREATE",
        target_type="SUBNET",
        target_id=str(subnet.id),
        request=request,
        new_values={"cidr": payload.cidr, "name": payload.name},
    )
    db.commit()
    return {"id": str(subnet.id), "cidr": str(subnet.cidr), "is_approved": subnet.is_approved}


@router.patch("/subnets/{subnet_id}/approve")
def approve_subnet(
    subnet_id: uuid.UUID,
    payload: SubnetApproveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Approves or revokes scanning permission for a subnet (`Admin` only)."""
    subnet = db.get(NetworkSubnet, subnet_id)
    if subnet is None:
        raise HTTPException(status_code=404, detail={"error_code": "SUBNET_NOT_FOUND", "message": "Subnet not found."})

    old_approved = subnet.is_approved
    subnet.is_approved = payload.is_approved
    subnet.approved_by = current_user.id if payload.is_approved else None
    subnet.approved_at = datetime.now(timezone.utc) if payload.is_approved else None

    record_audit_log(
        db,
        user=current_user,
        action="SUBNET_APPROVE_CHANGE",
        target_type="SUBNET",
        target_id=str(subnet.id),
        request=request,
        old_values={"is_approved": old_approved},
        new_values={"is_approved": subnet.is_approved},
    )
    db.commit()
    return {"id": str(subnet.id), "cidr": str(subnet.cidr), "is_approved": subnet.is_approved}


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: uuid.UUID,
    payload: AlertAcknowledgeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.IT, UserRole.ADMIN)),
):
    """Marks an OPEN alert as ACKNOWLEDGED by IT staff."""
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail={"error_code": "ALERT_NOT_FOUND", "message": "Alert not found."})

    alert.status = AlertStatus.ACKNOWLEDGED.value
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    if payload.note:
        alert.resolution_note = payload.note

    record_audit_log(
        db,
        user=current_user,
        action="ALERT_ACKNOWLEDGE",
        target_type="ALERT",
        target_id=str(alert.id),
        request=request,
        new_values={"status": alert.status, "note": payload.note},
    )
    db.commit()
    return {"id": str(alert.id), "status": alert.status, "acknowledged_at": alert.acknowledged_at}


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: uuid.UUID,
    payload: AlertResolveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.IT, UserRole.ADMIN)),
):
    """Resolves an active alert with a mandatory resolution note."""
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail={"error_code": "ALERT_NOT_FOUND", "message": "Alert not found."})

    alert.status = AlertStatus.RESOLVED.value
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolution_note = payload.resolution_note

    record_audit_log(
        db,
        user=current_user,
        action="ALERT_RESOLVE",
        target_type="ALERT",
        target_id=str(alert.id),
        request=request,
        new_values={"status": alert.status, "resolution_note": payload.resolution_note},
    )
    db.commit()
    return {"id": str(alert.id), "status": alert.status, "resolved_at": alert.resolved_at}


@router.get("/alerts")
def list_alerts(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    severity: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Lists alerts with status and severity filters."""
    stmt = select(Alert).order_by(Alert.detected_at.desc())
    if status_filter:
        stmt = stmt.where(Alert.status == status_filter.upper())
    if severity:
        stmt = stmt.where(Alert.severity == severity.upper())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    return {
        "data": [
            {
                "id": str(a.id),
                "device_id": str(a.device_id) if a.device_id else None,
                "dedup_key": a.dedup_key,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "description": a.description,
                "status": a.status,
                "occurrence_count": a.occurrence_count,
                "context_data": a.context_data,
                "detected_at": a.detected_at,
                "last_occurred_at": a.last_occurred_at,
                "acknowledged_at": a.acknowledged_at,
                "resolved_at": a.resolved_at,
                "resolution_note": a.resolution_note,
            }
            for a in items
        ],
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, math.ceil(total / limit)),
        },
    }


@router.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Aggregated live metrics for the executive dark mode dashboard."""
    total_devices = db.scalar(select(func.count(Device.id))) or 0
    online_count = db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.ONLINE.value)) or 0
    offline_count = db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.OFFLINE.value)) or 0
    unknown_count = db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.UNKNOWN.value)) or 0
    new_devices_count = db.scalar(select(func.count(Device.id)).where(Device.is_new.is_(True))) or 0

    open_alerts = db.scalars(
        select(Alert).where(Alert.status.in_([AlertStatus.OPEN.value, AlertStatus.ACKNOWLEDGED.value]))
    ).all()
    critical_alerts = sum(1 for a in open_alerts if a.severity == AlertSeverity.CRITICAL.value)
    high_alerts = sum(1 for a in open_alerts if a.severity == AlertSeverity.HIGH.value)
    warning_alerts = sum(1 for a in open_alerts if a.severity == AlertSeverity.WARNING.value)

    last_scan = db.scalar(select(ScanJob).order_by(ScanJob.started_at.desc()))

    return {
        "metrics": {
            "total_devices": total_devices,
            "online": online_count,
            "offline": offline_count,
            "unknown": unknown_count,
            "new_devices": new_devices_count,
            "open_alerts_total": len(open_alerts),
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "warning_alerts": warning_alerts,
        },
        "last_scan": {
            "id": str(last_scan.id) if last_scan else None,
            "target_cidr": last_scan.target_cidr if last_scan else None,
            "job_type": last_scan.job_type if last_scan else None,
            "status": last_scan.status if last_scan else "IDLE",
            "hosts_up": last_scan.hosts_up if last_scan else 0,
            "duration_ms": last_scan.duration_ms if last_scan else None,
            "started_at": last_scan.started_at if last_scan else None,
        } if last_scan else None,
    }


@router.get("/dashboard/status-distribution")
def get_status_distribution(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Distribution of devices by type and online/offline status for Recharts widgets."""
    types = db.scalars(select(DeviceType)).all()
    devices = db.scalars(select(Device)).all()

    type_map = {t.id: t.name for t in types}
    distribution: dict[str, dict[str, int]] = {}

    for d in devices:
        tname = type_map.get(d.device_type_id, "Chưa phân loại")
        if tname not in distribution:
            distribution[tname] = {"online": 0, "offline": 0, "total": 0}
        distribution[tname]["total"] += 1
        if d.status == DeviceStatus.ONLINE.value:
            distribution[tname]["online"] += 1
        elif d.status == DeviceStatus.OFFLINE.value:
            distribution[tname]["offline"] += 1

    chart_data = [
        {
            "name": name,
            "online": counts["online"],
            "offline": counts["offline"],
            "total": counts["total"],
        }
        for name, counts in distribution.items()
    ]
    return {"distribution": chart_data}


@router.get("/dashboard/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Recent device events, recently lost devices, and newly detected devices."""
    recent_events = db.scalars(
        select(DeviceEvent).order_by(DeviceEvent.occurred_at.desc()).limit(15)
    ).all()
    recent_offline = db.scalars(
        select(Device).where(Device.status == DeviceStatus.OFFLINE.value).order_by(Device.last_seen.desc()).limit(10)
    ).all()
    recent_new = db.scalars(
        select(Device).where(Device.is_new.is_(True)).order_by(Device.first_seen.desc()).limit(10)
    ).all()

    return {
        "events": [
            {
                "id": str(e.id),
                "device_id": str(e.device_id),
                "event_type": e.event_type,
                "severity": e.severity,
                "description": e.description,
                "occurred_at": e.occurred_at,
            }
            for e in recent_events
        ],
        "recently_offline": [
            {
                "id": str(d.id),
                "hostname": d.display_name or d.hostname or "Unknown",
                "ip": str(d.last_ip_address) if d.last_ip_address else "-",
                "mac": str(d.last_mac_address) if d.last_mac_address else "-",
                "last_seen": d.last_seen,
            }
            for d in recent_offline
        ],
        "newly_detected": [
            {
                "id": str(d.id),
                "hostname": d.display_name or d.hostname or "New Host",
                "ip": str(d.last_ip_address) if d.last_ip_address else "-",
                "mac": str(d.last_mac_address) if d.last_mac_address else "-",
                "first_seen": d.first_seen,
            }
            for d in recent_new
        ],
    }


@router.get("/subnets")
def list_subnets(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Lists all configured network subnets and their host counts."""
    subnets = db.scalars(select(NetworkSubnet).order_by(NetworkSubnet.created_at.desc())).all()
    items = []
    for s in subnets:
        cnt = db.scalar(select(func.count(Device.id)).where(Device.primary_subnet_id == s.id)) or 0
        items.append({
            "id": str(s.id),
            "name": s.name,
            "cidr": str(s.cidr),
            "gateway_ip": str(s.gateway_ip) if s.gateway_ip else None,
            "vlan_id": s.vlan_id,
            "scan_mode": s.scan_mode,
            "is_approved": s.is_approved,
            "is_active": s.is_active,
            "last_scanned_at": s.last_scanned_at,
            "device_count": cnt,
        })
    return {"data": items}


@router.get("/scans")
def list_scans(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Lists scan job history."""
    stmt = select(ScanJob).order_by(ScanJob.started_at.desc())
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    scans = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    return {
        "data": [
            {
                "id": str(s.id),
                "job_type": s.job_type,
                "target_cidr": s.target_cidr,
                "trigger_source": s.trigger_source,
                "scanner_host": s.scanner_host,
                "status": s.status,
                "total_hosts_scanned": s.total_hosts_scanned,
                "hosts_up": s.hosts_up,
                "hosts_down": s.hosts_down,
                "new_devices_found": s.new_devices_found,
                "alerts_generated": s.alerts_generated,
                "duration_ms": s.duration_ms,
                "error_message": s.error_message,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
            }
            for s in scans
        ],
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, math.ceil(total / limit)),
        },
    }


@router.get("/topology")
def get_topology(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Verified topology relationships for the interactive network map."""
    rels = db.scalars(select(DeviceRelationship).where(DeviceRelationship.is_active.is_(True))).all()
    nodes = db.scalars(select(Device)).all()

    node_dict = {
        str(d.id): {
            "id": str(d.id),
            "label": d.display_name or d.hostname or str(d.last_ip_address) or "Device",
            "ip": str(d.last_ip_address) if d.last_ip_address else "-",
            "status": d.status,
            "type_id": str(d.device_type_id),
        }
        for d in nodes
    }

    links = [
        {
            "id": str(r.id),
            "source": str(r.parent_device_id),
            "target": str(r.child_device_id),
            "port": r.parent_port or "Uplink",
            "protocol": r.discovery_protocol,
        }
        for r in rels
    ]

    return {"nodes": list(node_dict.values()), "links": links}


@router.get("/departments")
def list_departments(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Lists company departments."""
    depts = db.scalars(select(Department).where(Department.is_active.is_(True))).all()
    return [{"id": str(d.id), "code": d.code, "name": d.name, "location": d.location} for d in depts]


@router.get("/device-types")
def list_device_types(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.VIEWER, UserRole.IT, UserRole.ADMIN)),
):
    """Lists device type taxonomy."""
    types = db.scalars(select(DeviceType)).all()
    return [{"id": str(t.id), "code": t.code, "name": t.name, "icon_name": t.icon_name} for t in types]


@router.get("/settings")
def list_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Lists system configurations."""
    settings = db.scalars(select(SystemSetting)).all()
    return [{"key": s.key, "value": s.value, "category": s.category, "description": s.description} for s in settings]

