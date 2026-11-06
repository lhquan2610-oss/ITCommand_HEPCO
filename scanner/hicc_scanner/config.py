"""
Runtime configuration and typed data transfer objects (DTOs) for HICC Scanner Engine.
All comments and docstrings are written in English.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import os
from typing import Any, Optional
import uuid


@dataclass(slots=True)
class ScannerConfig:
    """Configuration parameters for the standalone HICC Network Scanner."""

    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://hicc_user:hicc_password@localhost:5432/hicc_db",
        )
    )
    network_interface: str = field(
        default_factory=lambda: os.getenv("SCANNER_NETWORK_INTERFACE", "eth0")
    )
    max_concurrency_icmp: int = field(
        default_factory=lambda: int(os.getenv("SCANNER_MAX_CONCURRENCY_ICMP", "64"))
    )
    max_concurrency_tcp: int = field(
        default_factory=lambda: int(os.getenv("SCANNER_MAX_CONCURRENCY_TCP", "32"))
    )
    icmp_count: int = field(
        default_factory=lambda: int(os.getenv("SCANNER_ICMP_COUNT", "3"))
    )
    icmp_timeout_ms: int = field(
        default_factory=lambda: int(os.getenv("SCANNER_ICMP_TIMEOUT_MS", "1000"))
    )
    tcp_timeout_ms: int = field(
        default_factory=lambda: int(os.getenv("SCANNER_TCP_TIMEOUT_MS", "1200"))
    )
    internal_dns_server: Optional[str] = field(
        default_factory=lambda: os.getenv("INTERNAL_DNS_SERVER") or None
    )
    credential_master_key: Optional[str] = field(
        default_factory=lambda: os.getenv("HICC_CREDENTIAL_MASTER_KEY") or None
    )

    # Targeted service ports for device classification without aggressive port scanning
    targeted_tcp_ports: tuple[int, ...] = (
        22,     # SSH (Linux / Network Switches)
        80,     # HTTP Web Management
        135,    # Microsoft EPMAP / RPC (Windows Workstation/Server)
        139,    # NetBIOS Session Service
        443,    # HTTPS Web Management
        445,    # Microsoft SMB (Windows Workstation/Server)
        515,    # Line Printer Daemon (Network Printer)
        554,    # RTSP Streaming (IP Camera / NVR)
        631,    # Internet Printing Protocol (IPP Printer)
        3389,   # Windows Remote Desktop (RDP)
        8000,   # Hikvision Camera/NVR Control Port
        8899,   # Common ONVIF HTTP Service Port
        9100,   # HP JetDirect / RAW Network Printing
        37777,  # Dahua Camera/NVR Control Port
    )


@dataclass(slots=True)
class SnmpObservation:
    """Data collected from SNMPv3 or approved SNMPv2c queries."""

    reachable: bool = False
    sys_name: Optional[str] = None
    sys_descr: Optional[str] = None
    sys_object_id: Optional[str] = None
    sys_location: Optional[str] = None
    uptime_ticks: Optional[int] = None
    serial_number: Optional[str] = None
    total_interfaces: Optional[int] = None
    active_interfaces: Optional[int] = None
    printer_page_count: Optional[int] = None
    printer_status: Optional[str] = None
    interface_stats: list[dict[str, Any]] = field(default_factory=list)
    lldp_neighbors: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class OnvifObservation:
    """Data collected from ONVIF WS-Discovery or Device Management service."""

    reachable: bool = False
    xaddrs: list[str] = field(default_factory=list)
    scopes: list[str] = field(default_factory=list)
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    firmware_version: Optional[str] = None
    serial_number: Optional[str] = None
    rtsp_open: bool = False


@dataclass(slots=True)
class ClassificationDecision:
    """Output of the weighted Device Fingerprinting Engine."""

    device_type_code: str
    confidence_score: int
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    os_family: Optional[str] = None
    signals: list[str] = field(default_factory=list)


@dataclass(slots=True)
class HostObservation:
    """Aggregated multi-protocol observation for a single IP in a scan cycle."""

    ip_address: str
    subnet_id: Optional[uuid.UUID] = None
    scan_mode: str = "LOCAL_L2"
    mac_address: Optional[str] = None
    conflicting_macs: list[str] = field(default_factory=list)
    mac_vendor: Optional[str] = None
    icmp_alive: bool = False
    latency_ms: Optional[float] = None
    packet_loss: float = 100.0
    open_tcp_ports: list[int] = field(default_factory=list)
    http_banner: Optional[str] = None
    hostname: Optional[str] = None
    hostname_source: Optional[str] = None
    snmp: Optional[SnmpObservation] = None
    onvif: Optional[OnvifObservation] = None
    classification: Optional[ClassificationDecision] = None
    observed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_alive(self) -> bool:
        """
        Multi-protocol alive check:
        A host is considered ONLINE if it responds to ARP (L2), ICMP (L3),
        any targeted TCP service port, SNMP, or ONVIF.
        """
        if self.mac_address is not None and self.scan_mode == "LOCAL_L2":
            return True
        if self.icmp_alive:
            return True
        if self.open_tcp_ports:
            return True
        if self.snmp and self.snmp.reachable:
            return True
        if self.onvif and self.onvif.reachable:
            return True
        return False

    @property
    def icmp_blocked(self) -> bool:
        """True when the host is alive via ARP/TCP/SNMP/ONVIF but blocks ICMP Ping."""
        return self.is_alive and not self.icmp_alive

    @property
    def primary_probe_method(self) -> str:
        """Returns the primary protocol that confirmed the host is online."""
        if self.icmp_alive:
            return "ICMP"
        if self.mac_address and self.scan_mode == "LOCAL_L2":
            return "ARP"
        if self.open_tcp_ports:
            return "TCP_SYN"
        if self.snmp and self.snmp.reachable:
            return "SNMP"
        if self.onvif and self.onvif.reachable:
            return "ONVIF"
        return "ICMP"
