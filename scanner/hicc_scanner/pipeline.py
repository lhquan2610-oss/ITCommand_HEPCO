"""
Main Pipeline Orchestrator for HICC Scanner Engine (`pipeline.py`)
Coordinates SubnetGuard verification, L2 ARP Discovery, L3 ICMP Monitoring,
L4 Targeted TCP Service Detection, DNS/NetBIOS Hostname Resolution,
SNMPv3/v2c Polling, ONVIF Camera Probing, Device Fingerprinting, and PostgreSQL Reconciliation.
"""

import asyncio
from datetime import datetime, timezone
import ipaddress
import logging
from pathlib import Path
import socket
import sys
import time
from typing import Optional

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models import (  # noqa: E402
    Device,
    NetworkSubnet,
    ScanJob,
    ScanJobStatus,
    TriggerSource,
)
from .collectors.arp_scanner import discover_arp_subnet  # noqa: E402
from .collectors.hostname_resolver import resolve_device_hostname  # noqa: E402
from .collectors.icmp_scanner import sweep_icmp_hosts  # noqa: E402
from .collectors.onvif_scanner import check_onvif_camera  # noqa: E402
from .collectors.tcp_scanner import scan_host_tcp_services  # noqa: E402
from .config import HostObservation, ScannerConfig  # noqa: E402
from .fingerprinter import classify_host_observation  # noqa: E402
from .oui_lookup import lookup_oui_vendor  # noqa: E402
from .reconciler.identity_reconciler import (  # noqa: E402
    get_device_type_map,
    reconcile_host_observation,
)
from .subnet_guard import validate_rfc1918_cidr, verify_approved_subnet_in_db  # noqa: E402

logger = logging.getLogger(__name__)


async def collect_subnet_observations(
    target_cidr: str,
    config: ScannerConfig,
    scan_mode: str = "LOCAL_L2",
    subnet_id: Optional[object] = None,
    known_ips: Optional[set[str]] = None,
    job_type: str = "FULL_DISCOVERY",
) -> list[HostObservation]:
    """
    Executes the multi-protocol discovery pipeline across `target_cidr` without requiring a DB write
    (can be used in dry-run CLI inspection or full DB-backed scan jobs).
    """
    network = validate_rfc1918_cidr(target_cidr)
    host_ips = [str(ip) for ip in network.hosts()]

    # Step 1: L2 ARP Discovery (only if LOCAL_L2)
    arp_map = await asyncio.to_thread(
        discover_arp_subnet,
        str(network),
        scan_mode,
        config.network_interface,
    )

    # Step 2: L3 ICMP Sweep across all usable IPs in the subnet
    icmp_map = await sweep_icmp_hosts(
        host_ips,
        concurrency=config.max_concurrency_icmp,
        count=config.icmp_count,
        timeout_ms=config.icmp_timeout_ms,
    )

    # Refresh OS ARP cache if Scapy raw socket was not used on LOCAL_L2
    if scan_mode == "LOCAL_L2" and not arp_map:
        arp_map = await asyncio.to_thread(
            discover_arp_subnet,
            str(network),
            scan_mode,
            config.network_interface,
        )

    # Identify candidate IPs for deeper L4/L7 inspection
    candidate_ips: set[str] = set(arp_map.keys())
    for ip_str, icmp_res in icmp_map.items():
        if icmp_res.is_alive:
            candidate_ips.add(ip_str)
    if known_ips:
        candidate_ips.update(known_ips)

    # For FULL_DISCOVERY on a /24, also probe quick Windows/Printer/Camera signature ports
    # on non-responding IPs to catch ICMP-blocked hosts on routed VLANs
    quick_alive_ports = (80, 135, 445, 554, 9100)
    tcp_semaphore = asyncio.Semaphore(config.max_concurrency_tcp)

    async def _enrich_host(ip_str: str) -> HostObservation:
        arp_entry = arp_map.get(ip_str)
        icmp_entry = icmp_map.get(ip_str)
        mac_addr = arp_entry.primary_mac if arp_entry else None
        vendor_name = arp_entry.mac_vendor if arp_entry else None
        if mac_addr and not vendor_name:
            vendor_name, _ = lookup_oui_vendor(mac_addr)

        obs = HostObservation(
            ip_address=ip_str,
            subnet_id=subnet_id,  # type: ignore[arg-type]
            scan_mode=scan_mode,
            mac_address=mac_addr,
            conflicting_macs=arp_entry.conflicting_macs if arp_entry else [],
            mac_vendor=vendor_name,
            icmp_alive=icmp_entry.is_alive if icmp_entry else False,
            latency_ms=icmp_entry.latency_ms if icmp_entry else None,
            packet_loss=icmp_entry.packet_loss if icmp_entry else 100.0,
        )

        should_scan_tcp = (
            ip_str in candidate_ips
            or job_type in ("FULL_DISCOVERY", "TCP_SERVICE")
        )
        if should_scan_tcp:
            ports_to_check = (
                config.targeted_tcp_ports
                if (obs.is_alive or ip_str in candidate_ips)
                else quick_alive_ports
            )
            async with tcp_semaphore:
                tcp_res = await scan_host_tcp_services(
                    ip_str,
                    ports=ports_to_check,
                    timeout_ms=config.tcp_timeout_ms,
                )
            obs.open_tcp_ports = tcp_res.open_ports
            obs.http_banner = tcp_res.http_banner

        if obs.is_alive:
            if job_type in ("FULL_DISCOVERY", "HOSTNAME_REFRESH", "ARP_DISCOVERY"):
                hostname, h_source = await resolve_device_hostname(ip_str)
                obs.hostname = hostname
                obs.hostname_source = h_source

            if job_type in ("FULL_DISCOVERY", "ONVIF_PROBE") or (
                {554, 8000, 8899, 37777} & set(obs.open_tcp_ports)
            ):
                obs.onvif = await check_onvif_camera(ip_str, obs.open_tcp_ports)

            obs.classification = classify_host_observation(obs)

        return obs

    enrich_tasks = [_enrich_host(ip) for ip in host_ips]
    observations = await asyncio.gather(*enrich_tasks)
    return list(observations)


async def execute_approved_subnet_scan(
    target_cidr: str,
    config: ScannerConfig,
    job_type: str = "FULL_DISCOVERY",
    trigger_source: str = TriggerSource.MANUAL_CLI.value,
) -> dict[str, object]:
    """
    Verifies that `target_cidr` is approved in PostgreSQL, executes the scan pipeline,
    reconciles all discovered and previously known devices, and updates the `ScanJob` summary.
    """
    engine = create_engine(config.database_url)
    start_ts = time.perf_counter()

    with Session(engine) as session:
        subnet_obj: NetworkSubnet = verify_approved_subnet_in_db(  # type: ignore[assignment]
            session,
            target_cidr,
            NetworkSubnet,
        )
        scan_mode = subnet_obj.scan_mode
        subnet_id = subnet_obj.id

        existing_devices = session.scalars(
            select(Device).where(Device.primary_subnet_id == subnet_id)
        ).all()
        known_ips = {str(d.last_ip_address) for d in existing_devices if d.last_ip_address}

        scan_job = ScanJob(
            job_type=job_type,
            subnet_id=subnet_id,
            target_cidr=str(validate_rfc1918_cidr(target_cidr)),
            trigger_source=trigger_source,
            scanner_host=socket.gethostname(),
            status=ScanJobStatus.RUNNING.value,
            started_at=datetime.now(timezone.utc),
        )
        session.add(scan_job)
        session.commit()
        session.refresh(scan_job)
        job_id = scan_job.id

    try:
        observations = await collect_subnet_observations(
            target_cidr=target_cidr,
            config=config,
            scan_mode=scan_mode,
            subnet_id=subnet_id,
            known_ips=known_ips,
            job_type=job_type,
        )

        with Session(engine) as session:
            job_record = session.get(ScanJob, job_id)
            assert job_record is not None
            dtype_map = get_device_type_map(session)

            hosts_up = 0
            hosts_down = 0
            new_devices_count = 0
            alerts_count = 0

            for obs in observations:
                if obs.is_alive:
                    hosts_up += 1
                elif obs.ip_address in known_ips:
                    hosts_down += 1

                _, is_new, created_alerts = reconcile_host_observation(
                    session=session,
                    obs=obs,
                    scan_job=job_record,
                    device_type_map=dtype_map,
                )
                if is_new:
                    new_devices_count += 1
                alerts_count += created_alerts

            duration_ms = int((time.perf_counter() - start_ts) * 1000)
            job_record.status = ScanJobStatus.COMPLETED.value
            job_record.total_hosts_scanned = len(observations)
            job_record.hosts_up = hosts_up
            job_record.hosts_down = hosts_down
            job_record.new_devices_found = new_devices_count
            job_record.alerts_generated = alerts_count
            job_record.duration_ms = duration_ms
            job_record.completed_at = datetime.now(timezone.utc)

            subnet_rec = session.get(NetworkSubnet, subnet_id)
            if subnet_rec is not None:
                subnet_rec.last_scanned_at = datetime.now(timezone.utc)

            session.commit()

            return {
                "scan_job_id": str(job_record.id),
                "target_cidr": job_record.target_cidr,
                "scan_mode": scan_mode,
                "status": job_record.status,
                "total_hosts_scanned": job_record.total_hosts_scanned,
                "hosts_up": hosts_up,
                "hosts_down": hosts_down,
                "new_devices_found": new_devices_count,
                "alerts_generated": alerts_count,
                "duration_ms": duration_ms,
            }

    except Exception as exc:
        with Session(engine) as session:
            job_record = session.get(ScanJob, job_id)
            if job_record is not None:
                job_record.status = ScanJobStatus.FAILED.value
                job_record.error_message = str(exc)
                job_record.completed_at = datetime.now(timezone.utc)
                session.commit()
        raise
