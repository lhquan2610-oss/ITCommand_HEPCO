"""
Unit tests for HICC V1.0 Scanner Engine (`test_scanner_engine.py`):
- SubnetGuard security enforcement (blocks public IPs, loopback, oversized ranges)
- IEEE OUI normalization & vendor lookup
- Multi-signal Device Fingerprinting & Confidence Scoring (`UNKNOWN` when < 60%)
- Multi-protocol alive check & ICMP-blocked detection
"""

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCANNER_DIR = PROJECT_ROOT / "scanner"
BACKEND_DIR = PROJECT_ROOT / "backend"
for p in (SCANNER_DIR, BACKEND_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from hicc_scanner.config import HostObservation, OnvifObservation, SnmpObservation  # noqa: E402
from hicc_scanner.fingerprinter import classify_host_observation  # noqa: E402
from hicc_scanner.oui_lookup import lookup_oui_vendor, normalize_mac  # noqa: E402
from hicc_scanner.subnet_guard import SubnetSecurityError, validate_rfc1918_cidr  # noqa: E402


def test_subnet_guard_blocks_public_and_oversized_subnets() -> None:
    """SubnetGuard must reject public Internet IPs and subnets larger than /22."""
    # Valid RFC1918 /24
    net = validate_rfc1918_cidr("192.168.10.0/24")
    assert str(net) == "192.168.10.0/24"

    # Public IP (Google DNS) must raise SubnetSecurityError
    try:
        validate_rfc1918_cidr("8.8.8.0/24")
        raise AssertionError("Expected SubnetSecurityError for public IP range 8.8.8.0/24")
    except SubnetSecurityError:
        pass

    # Oversized /16 range must raise SubnetSecurityError
    try:
        validate_rfc1918_cidr("10.0.0.0/16")
        raise AssertionError("Expected SubnetSecurityError for oversized /16 subnet")
    except SubnetSecurityError:
        pass


def test_mac_normalization_and_oui_lookup() -> None:
    assert normalize_mac("3c-d9-2b-aa-bb-cc") == "3C:D9:2B:AA:BB:CC"
    assert normalize_mac("4419.b611.2233") == "44:19:B6:11:22:33"
    assert normalize_mac("00:00:00:00:00:00") is None

    vendor, hint = lookup_oui_vendor("44:19:b6:11:22:33")
    assert vendor == "Hangzhou Hikvision Digital"
    assert hint == "CAMERA"


def test_icmp_blocked_windows_workstation_remains_online_and_classified() -> None:
    """A Windows PC blocking Ping (icmp_alive=False) but responding to ARP and TCP 135/445 must be ONLINE and WORKSTATION."""
    obs = HostObservation(
        ip_address="192.168.10.25",
        scan_mode="LOCAL_L2",
        mac_address="F8:B1:56:AA:BB:CC",  # Dell Inc.
        icmp_alive=False,
        open_tcp_ports=[135, 139, 445],
        hostname="DESKTOP-HEPCO01",
    )
    assert obs.is_alive is True
    assert obs.icmp_blocked is True

    decision = classify_host_observation(obs)
    assert decision.device_type_code == "WORKSTATION"
    assert decision.confidence_score >= 80


def test_network_printer_classification_via_jetdirect_and_snmp() -> None:
    obs = HostObservation(
        ip_address="192.168.10.200",
        mac_address="3C:D9:2B:10:20:30",  # HP Inc.
        icmp_alive=True,
        latency_ms=1.8,
        open_tcp_ports=[80, 515, 631, 9100],
        snmp=SnmpObservation(
            reachable=True,
            sys_descr="HP LaserJet Pro MFP M428fdn",
            printer_page_count=15420,
        ),
    )
    decision = classify_host_observation(obs)
    assert decision.device_type_code == "PRINTER"
    assert decision.confidence_score == 100


def test_ip_camera_classification_via_onvif_and_rtsp() -> None:
    obs = HostObservation(
        ip_address="192.168.20.55",
        mac_address="44:19:B6:01:02:03",
        icmp_alive=True,
        open_tcp_ports=[80, 554, 8000],
        onvif=OnvifObservation(
            reachable=True,
            manufacturer="Hikvision",
            model="DS-2CD2143G2-I",
            rtsp_open=True,
        ),
    )
    decision = classify_host_observation(obs)
    assert decision.device_type_code == "CAMERA"
    assert decision.confidence_score >= 90


def test_insufficient_evidence_classifies_as_unknown() -> None:
    """When a host only responds to Ping with an unknown MAC and no open service ports, it MUST be UNKNOWN."""
    obs = HostObservation(
        ip_address="192.168.10.99",
        mac_address="12:34:56:78:9A:BC",
        icmp_alive=True,
        latency_ms=2.4,
        open_tcp_ports=[],
    )
    decision = classify_host_observation(obs)
    assert decision.device_type_code == "UNKNOWN"
    assert decision.confidence_score < 60


if __name__ == "__main__":
    test_subnet_guard_blocks_public_and_oversized_subnets()
    test_mac_normalization_and_oui_lookup()
    test_icmp_blocked_windows_workstation_remains_online_and_classified()
    test_network_printer_classification_via_jetdirect_and_snmp()
    test_ip_camera_classification_via_onvif_and_rtsp()
    test_insufficient_evidence_classifies_as_unknown()
    print("[PASS] All HICC V1.0 Scanner Engine unit tests succeeded.")
