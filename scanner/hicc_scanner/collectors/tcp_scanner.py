"""
Module 2.3: TCP Service Detection (`tcp_scanner.py`)
Probes a strictly bounded set of service ports (HTTP/HTTPS, SSH, SMB/RPC, Raw Printing 9100/IPP/LPD,
RTSP 554, ONVIF/Camera SDK ports) to detect ICMP-blocked hosts and gather device classification signals.
Never performs full 65,535 port scans.
"""

import asyncio
from dataclasses import dataclass, field
import re
from typing import Optional

TITLE_REGEX = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SERVER_HEADER_REGEX = re.compile(r"^Server:\s*(.+)$", re.IGNORECASE | re.MULTILINE)


@dataclass(slots=True)
class TcpScanResult:
    """Result of targeted TCP service probing on a single host."""

    ip_address: str
    open_ports: list[int] = field(default_factory=list)
    http_banner: Optional[str] = None


async def check_single_tcp_port(ip_address: str, port: int, timeout_sec: float = 1.2) -> bool:
    """Attempts a non-intrusive TCP handshake on `(ip_address, port)`."""
    try:
        conn = asyncio.open_connection(ip_address, port)
        reader, writer = await asyncio.wait_for(conn, timeout=timeout_sec)
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
        return True
    except Exception:
        return False


async def fetch_lightweight_http_banner(ip_address: str, port: int = 80, timeout_sec: float = 1.5) -> Optional[str]:
    """
    Fetches the HTTP `Server` header and HTML `<title>` from port 80 if open,
    helping identify Printer, Switch, or IP Camera web management interfaces.
    """
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(ip_address, port),
            timeout=timeout_sec,
        )
        request = (
            f"GET / HTTP/1.1\r\n"
            f"Host: {ip_address}\r\n"
            f"User-Agent: HICC-Inventory-Scanner/1.0\r\n"
            f"Connection: close\r\n\r\n"
        )
        writer.write(request.encode("ascii"))
        await writer.drain()
        raw_bytes = await asyncio.wait_for(reader.read(4096), timeout=timeout_sec)
        writer.close()
        text = raw_bytes.decode("utf-8", errors="ignore")

        parts: list[str] = []
        srv_match = SERVER_HEADER_REGEX.search(text)
        if srv_match:
            parts.append(f"Server: {srv_match.group(1).strip()}")
        title_match = TITLE_REGEX.search(text)
        if title_match:
            clean_title = " ".join(title_match.group(1).split())
            if clean_title:
                parts.append(f"Title: {clean_title[:100]}")
        return " | ".join(parts) if parts else None
    except Exception:
        return None


async def scan_host_tcp_services(
    ip_address: str,
    ports: tuple[int, ...],
    timeout_ms: int = 1200,
) -> TcpScanResult:
    """Scans the approved list of targeted TCP ports on a single host."""
    timeout_sec = max(0.3, timeout_ms / 1000.0)
    tasks = [check_single_tcp_port(ip_address, p, timeout_sec=timeout_sec) for p in ports]
    port_flags = await asyncio.gather(*tasks)

    open_ports = sorted([port for port, is_open in zip(ports, port_flags) if is_open])
    banner: Optional[str] = None
    if 80 in open_ports:
        banner = await fetch_lightweight_http_banner(ip_address, port=80, timeout_sec=timeout_sec)

    return TcpScanResult(ip_address=ip_address, open_ports=open_ports, http_banner=banner)
