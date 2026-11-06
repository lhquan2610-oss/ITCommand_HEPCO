"""
Module 2.4: DNS & NetBIOS Hostname Discovery (`hostname_resolver.py`)
Resolves authentic device hostnames using:
1. Reverse DNS (PTR record via internal DNS or system resolver)
2. NetBIOS Node Status Query (UDP Port 137) for Windows workstations/printers
Strictly returns `(None, None)` if no authentic hostname can be retrieved (never fabricates fake names).
"""

import asyncio
import socket
import struct
from typing import Optional

# Standard NetBIOS Node Status Request packet (UDP 137) for wildcard '*'
NETBIOS_NBSTAT_QUERY = (
    b"\x82\x28\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00"
    b"\x20\x43\x4b\x41\x41\x41\x41\x41\x41\x41\x41\x41"
    b"\x41\x41\x41\x41\x41\x41\x41\x41\x41\x41\x41\x41"
    b"\x41\x41\x41\x41\x41\x41\x41\x41\x41\x00\x00\x21\x00\x01"
)


def query_netbios_hostname(ip_address: str, timeout_sec: float = 1.0) -> Optional[str]:
    """
    Sends a UDP 137 NetBIOS Adapter Status query and extracts the primary Workstation/Server name `<00>` or `<20>`.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout_sec)
    try:
        sock.sendto(NETBIOS_NBSTAT_QUERY, (ip_address, 137))
        data, _ = sock.recvfrom(1024)
        if len(data) < 57:
            return None
        num_names = data[56]
        offset = 57
        for _ in range(num_names):
            if offset + 18 > len(data):
                break
            raw_entry = data[offset : offset + 18]
            name_bytes = raw_entry[:15]
            suffix_type = raw_entry[15]
            flags = struct.unpack(">H", raw_entry[16:18])[0]
            is_group_name = bool(flags & 0x8000)

            # Unique Workstation Service (0x00) or File Server Service (0x20)
            if not is_group_name and suffix_type in (0x00, 0x20):
                decoded = name_bytes.decode("ascii", errors="ignore").strip()
                if decoded and not decoded.startswith("__"):
                    return decoded
            offset += 18
    except Exception:
        return None
    finally:
        sock.close()
    return None


def query_reverse_dns(ip_address: str) -> Optional[str]:
    """Performs a standard PTR reverse DNS lookup."""
    try:
        hostname, _, _ = socket.gethostbyaddr(ip_address)
        cleaned = hostname.strip().rstrip(".")
        if cleaned and cleaned != ip_address:
            return cleaned
    except Exception:
        return None
    return None


async def resolve_device_hostname(
    ip_address: str,
    snmp_sys_name: Optional[str] = None,
) -> tuple[Optional[str], Optional[str]]:
    """
    Resolves device hostname in priority order:
    1. SNMP `sysName.0` (if already collected)
    2. Reverse DNS (`PTR`)
    3. NetBIOS Node Status (`UDP 137`)
    Returns `(hostname, source_method)` or `(None, None)` if unavailable.
    """
    if snmp_sys_name and snmp_sys_name.strip():
        return snmp_sys_name.strip(), "SNMP"

    ptr_name = await asyncio.to_thread(query_reverse_dns, ip_address)
    if ptr_name:
        return ptr_name, "REVERSE_DNS"

    nb_name = await asyncio.to_thread(query_netbios_hostname, ip_address, 1.0)
    if nb_name:
        return nb_name, "NETBIOS"

    return None, None
