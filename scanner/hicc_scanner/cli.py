"""
Standalone CLI & Scheduled Worker Entrypoint for HICC Scanner Engine (`cli.py`).
Can be executed independently of the Frontend Dashboard:
- `python -m hicc_scanner.cli check-env`
- `python -m hicc_scanner.cli register-subnet --cidr 192.168.10.0/24 --name "LAN Van Phong" --approve`
- `python -m hicc_scanner.cli scan --subnet 192.168.10.0/24 --type FULL_DISCOVERY`
- `python -m hicc_scanner.cli dry-run --subnet 192.168.10.0/28`
- `python -m hicc_scanner.cli daemon`
"""

import argparse
import asyncio
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import sys

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models import NetworkSubnet, ScanJobType, SubnetScanMode  # noqa: E402
from .config import ScannerConfig  # noqa: E402
from .pipeline import collect_subnet_observations, execute_approved_subnet_scan  # noqa: E402
from .subnet_guard import validate_rfc1918_cidr  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hicc_scanner.cli")


def cmd_check_env(config: ScannerConfig) -> int:
    """Verifies database connectivity and displays registered/approved subnets."""
    print("=== HICC V1.0 SCANNER ENGINE - ENVIRONMENT CHECK ===")
    print(f"Network Interface : {config.network_interface}")
    print(f"ICMP Concurrency  : {config.max_concurrency_icmp} (Count={config.icmp_count}, Timeout={config.icmp_timeout_ms}ms)")
    print(f"TCP Concurrency   : {config.max_concurrency_tcp} (Ports={config.targeted_tcp_ports})")

    try:
        engine = create_engine(config.database_url)
        with Session(engine) as session:
            subnets = session.scalars(select(NetworkSubnet)).all()
            print(f"Database Status   : CONNECTED ({len(subnets)} subnets registered)")
            for sn in subnets:
                state = "APPROVED" if sn.is_approved else "UNAPPROVED"
                print(f"  - {sn.cidr:<18} | Mode={sn.scan_mode:<9} | {state:<10} | {sn.name}")
        return 0
    except Exception as exc:
        print(f"Database Status   : ERROR ({exc})")
        return 1


def cmd_register_subnet(
    config: ScannerConfig,
    cidr: str,
    name: str,
    scan_mode: str,
    vlan_id: int | None,
    approve: bool,
) -> int:
    """Registers or updates an internal RFC1918 subnet in PostgreSQL."""
    net = validate_rfc1918_cidr(cidr)
    canonical = str(net)
    engine = create_engine(config.database_url)
    with Session(engine) as session:
        existing = session.scalar(select(NetworkSubnet).where(NetworkSubnet.cidr == canonical))
        if existing is None:
            existing = NetworkSubnet(
                name=name,
                cidr=canonical,
                scan_mode=scan_mode,
                vlan_id=vlan_id,
                is_approved=approve,
                is_active=True,
                approved_at=datetime.now(timezone.utc) if approve else None,
            )
            session.add(existing)
        else:
            existing.name = name
            existing.scan_mode = scan_mode
            existing.vlan_id = vlan_id
            existing.is_approved = approve
            if approve and existing.approved_at is None:
                existing.approved_at = datetime.now(timezone.utc)
        session.commit()
        print(
            f"[OK] Subnet {canonical} ('{name}') saved with is_approved={approve}, scan_mode={scan_mode}."
        )
    return 0


def cmd_scan(config: ScannerConfig, subnet_cidr: str, job_type: str, dry_run: bool) -> int:
    """Executes either a dry-run console scan or a full PostgreSQL-backed scan job."""
    validate_rfc1918_cidr(subnet_cidr)
    if dry_run:
        print(f"[DRY-RUN] Scanning approved RFC1918 range {subnet_cidr} without database writes...")
        observations = asyncio.run(
            collect_subnet_observations(
                target_cidr=subnet_cidr,
                config=config,
                scan_mode=SubnetScanMode.LOCAL_L2.value,
                job_type=job_type,
            )
        )
        alive_hosts = [o for o in observations if o.is_alive]
        print(f"\nDiscovered {len(alive_hosts)} / {len(observations)} active hosts:")
        print("-" * 105)
        print(f"{'IP Address':<16} {'MAC Address':<19} {'Hostname':<22} {'Type':<14} {'Conf':<6} {'Latency':<9} {'Ports'}")
        print("-" * 105)
        for h in alive_hosts:
            dtype = h.classification.device_type_code if h.classification else "UNKNOWN"
            conf = f"{h.classification.confidence_score}%" if h.classification else "0%"
            lat = f"{h.latency_ms}ms" if h.latency_ms is not None else ("ICMP-BLK" if h.icmp_blocked else "-")
            print(
                f"{h.ip_address:<16} {(h.mac_address or 'N/A'):<19} {(h.hostname or '-'):<22} "
                f"{dtype:<14} {conf:<6} {lat:<9} {h.open_tcp_ports}"
            )
        return 0

    summary = asyncio.run(
        execute_approved_subnet_scan(
            target_cidr=subnet_cidr,
            config=config,
            job_type=job_type,
        )
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


def cmd_daemon(config: ScannerConfig) -> int:
    """Starts the APScheduler background worker for all approved active subnets."""
    from apscheduler.schedulers.blocking import BlockingScheduler  # type: ignore

    scheduler = BlockingScheduler(timezone="Asia/Ho_Chi_Minh")

    def _run_scheduled_cycle(job_type: str) -> None:
        engine = create_engine(config.database_url)
        with Session(engine) as session:
            approved_subnets = session.scalars(
                select(NetworkSubnet).where(
                    NetworkSubnet.is_approved.is_(True),
                    NetworkSubnet.is_active.is_(True),
                )
            ).all()
            cidrs = [str(s.cidr) for s in approved_subnets]

        for cidr in cidrs:
            try:
                logger.info("Starting scheduled %s on approved subnet %s", job_type, cidr)
                asyncio.run(
                    execute_approved_subnet_scan(
                        target_cidr=cidr,
                        config=config,
                        job_type=job_type,
                        trigger_source="SCHEDULED",
                    )
                )
            except Exception as exc:
                logger.error("Scheduled scan %s failed on %s: %s", job_type, cidr, exc)

    scheduler.add_job(
        _run_scheduled_cycle,
        "interval",
        seconds=60,
        args=[ScanJobType.PING_SWEEP.value],
        id="status_check_60s",
        max_instances=1,
    )
    scheduler.add_job(
        _run_scheduled_cycle,
        "interval",
        seconds=300,
        args=[ScanJobType.ARP_DISCOVERY.value],
        id="discovery_5m",
        max_instances=1,
    )
    scheduler.add_job(
        _run_scheduled_cycle,
        "interval",
        seconds=900,
        args=[ScanJobType.FULL_DISCOVERY.value],
        id="full_discovery_15m",
        max_instances=1,
    )

    logger.info("HICC V1.0 Scheduled Scanner Daemon started. Press Ctrl+C to exit.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("HICC V1.0 Scanner Daemon stopped.")
    return 0


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="hicc-scanner",
        description="HEPCO IT COMMAND CENTER (HICC V1.0) - Standalone Network Scanner CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("check-env", help="Verify scanner configuration and approved subnets in PostgreSQL")

    reg = sub.add_parser("register-subnet", help="Register and optionally approve an internal LAN subnet")
    reg.add_argument("--cidr", required=True, help="Internal RFC1918 CIDR (e.g. 192.168.10.0/24)")
    reg.add_argument("--name", required=True, help="Descriptive name of the subnet/VLAN")
    reg.add_argument(
        "--scan-mode",
        choices=[SubnetScanMode.LOCAL_L2.value, SubnetScanMode.ROUTED_L3.value],
        default=SubnetScanMode.LOCAL_L2.value,
    )
    reg.add_argument("--vlan", type=int, default=None, help="Optional VLAN ID (1-4094)")
    reg.add_argument("--approve", action="store_true", help="Mark subnet as approved for scanning")

    scan_p = sub.add_parser("scan", help="Execute a network scan on an approved subnet")
    scan_p.add_argument("--subnet", required=True, help="Target subnet CIDR (must be RFC1918 & approved)")
    scan_p.add_argument(
        "--type",
        default=ScanJobType.FULL_DISCOVERY.value,
        choices=[t.value for t in ScanJobType],
        help="Scan job type",
    )
    scan_p.add_argument(
        "--dry-run",
        action="store_true",
        help="Run discovery and print table to stdout without writing to PostgreSQL",
    )

    sub.add_parser("daemon", help="Run the continuous APScheduler scanner worker")
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()
    config = ScannerConfig()

    if args.command == "check-env":
        return cmd_check_env(config)
    if args.command == "register-subnet":
        return cmd_register_subnet(
            config=config,
            cidr=args.cidr,
            name=args.name,
            scan_mode=args.scan_mode,
            vlan_id=args.vlan,
            approve=args.approve,
        )
    if args.command == "scan":
        return cmd_scan(
            config=config,
            subnet_cidr=args.subnet,
            job_type=args.type,
            dry_run=args.dry_run,
        )
    if args.command == "daemon":
        return cmd_daemon(config)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
