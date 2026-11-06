"""
Module 2.1: ARP Discovery (`arp_scanner.py`)
Discovers active hosts within the same Layer-2 Broadcast Domain (`LOCAL_L2`).
Collects IP-to-MAC mappings, detects multiple MACs claiming the same IP (IP Conflict),
and strictly skips direct L2 ARP guessing when `scan_mode == 'ROUTED_L3'`.
"""

import ipaddress
import logging
import platform
import re
import subprocess
from dataclasses import dataclass, field
from typing import Optional

from ..oui_lookup import lookup_oui_vendor, normalize_mac

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ArpEntry:
    """Represents an L2 ARP observation for a single IPv4 address."""

    ip_address: str
    primary_mac: str
    mac_vendor: Optional[str] = None
    conflicting_macs: list[str] = field(default_factory=list)


def discover_arp_subnet(
    target_cidr: str,
    scan_mode: str = "LOCAL_L2",
    interface: Optional[str] = None,
    timeout_sec: float = 1.5,
) -> dict[str, ArpEntry]:
    """
    Executes Layer-2 ARP discovery on `target_cidr`.
    Rule enforcement:
    - If `scan_mode != 'LOCAL_L2'`, returns an empty dict immediately because ARP frames
      do not cross L3 routers (prevents assigning Gateway MAC to routed hosts).
    - Uses Scapy `srp(Ether/ARP)` when privileges and Npcap/libpcap are available,
      falling back cleanly to reading the OS neighbor/ARP table after ICMP/UDP priming.
    """
    if scan_mode != "LOCAL_L2":
        logger.info(
            "Skipping direct L2 ARP broadcast for %s because scan_mode is '%s'.",
            target_cidr,
            scan_mode,
        )
        return {}

    network = ipaddress.ip_network(target_cidr, strict=False)
    ip_to_macs: dict[str, set[str]] = {}

    # Attempt active Scapy L2 ARP broadcast first
    try:
        from scapy.all import ARP, Ether, conf, srp  # type: ignore

        conf.verb = 0
        packet = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=str(network))
        ans, _ = srp(packet, timeout=timeout_sec, retry=1, iface=interface, verbose=False)
        for _, rcv in ans:
            ip_str = str(rcv.psrc)
            mac_norm = normalize_mac(str(rcv.hwsrc))
            if ip_str and mac_norm:
                ip_to_macs.setdefault(ip_str, set()).add(mac_norm)
    except Exception as exc:
        logger.debug("Scapy L2 ARP broadcast unavailable (%s); falling back to OS ARP cache.", exc)
        os_arp = read_os_arp_table(network)
        for ip_str, mac_norm in os_arp.items():
            ip_to_macs.setdefault(ip_str, set()).add(mac_norm)

    results: dict[str, ArpEntry] = {}
    for ip_str, mac_set in ip_to_macs.items():
        sorted_macs = sorted(mac_set)
        primary_mac = sorted_macs[0]
        vendor, _ = lookup_oui_vendor(primary_mac)
        conflicts = sorted_macs[1:] if len(sorted_macs) > 1 else []
        results[ip_str] = ArpEntry(
            ip_address=ip_str,
            primary_mac=primary_mac,
            mac_vendor=vendor,
            conflicting_macs=conflicts,
        )

    return results


def read_os_arp_table(target_network: ipaddress.IPv4Network) -> dict[str, str]:
    """
    Reads the local operating system's ARP / neighbor cache (`ip neigh` on Linux or `arp -a` on Windows)
    and filters entries belonging to `target_network`.
    """
    entries: dict[str, str] = {}
    system_name = platform.system().lower()

    try:
        if system_name == "linux":
            proc = subprocess.run(
                ["ip", "neigh", "show"],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
            for line in proc.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 5 and "lladdr" in parts:
                    ip_str = parts[0]
                    idx = parts.index("lladdr")
                    if idx + 1 < len(parts):
                        mac_norm = normalize_mac(parts[idx + 1])
                        if mac_norm and _ip_in_net(ip_str, target_network):
                            entries[ip_str] = mac_norm
        else:
            proc = subprocess.run(
                ["arp", "-a"],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
            line_pattern = re.compile(r"(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F:-]{17})")
            for line in proc.stdout.splitlines():
                match = line_pattern.search(line)
                if match:
                    ip_str, raw_mac = match.group(1), match.group(2)
                    mac_norm = normalize_mac(raw_mac)
                    if mac_norm and _ip_in_net(ip_str, target_network):
                        entries[ip_str] = mac_norm
    except Exception as exc:
        logger.warning("Failed to parse OS ARP cache: %s", exc)

    return entries


def _ip_in_net(ip_str: str, network: ipaddress.IPv4Network) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
        return isinstance(addr, ipaddress.IPv4Address) and addr in network and addr != network.broadcast_address
    except ValueError:
        return False
