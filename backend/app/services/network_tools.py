"""
Enterprise Network Diagnostic & Discovery Tools Module.
Designed for System Administrators and Network Engineers (Windows, Linux, macOS).
Supports:
- Async ICMP Ping (Single host & Full /24 Subnet Sweep)
- ARP Cache Inspection & MAC Address Resolution
- Targeted TCP Port Probe (SSH, RDP, HTTP, HTTPS, SMB, Printer 9100)
- Wake-on-LAN (WOL Magic Packet)
- Traceroute / Path Discovery
"""

import asyncio
import ipaddress
import logging
import platform
import re
import socket
import struct
import subprocess
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger("network_tools")

# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------
@dataclass
class PingResult:
    ip: str
    is_alive: bool
    status: str  # "ONLINE" | "OFFLINE" | "TIMEOUT"
    latency_ms: Optional[float] = None
    packet_loss_percent: float = 100.0


@dataclass
class ArpDevice:
    ip: str
    mac: str
    vendor: str = "Unknown"
    interface: str = ""


@dataclass
class HostAuditResult:
    ip: str
    mac: Optional[str] = None
    vendor: Optional[str] = None
    hostname: Optional[str] = None
    is_alive: bool = False
    latency_ms: Optional[float] = None
    open_ports: List[int] = field(default_factory=list)
    os_hint: Optional[str] = None


# -----------------------------------------------------------------------------
# 1. ICMP PING ENGINE (ASYNC & MULTI-PLATFORM)
# -----------------------------------------------------------------------------
RTT_WIN_REGEX = re.compile(r"Average\s*=\s*(\d+(?:\.\d+)?)ms", re.IGNORECASE)
RTT_NIX_REGEX = re.compile(r"rtt min/avg/max/mdev\s*=\s*[\d.]+/([\d.]+)/", re.IGNORECASE)
RTT_SINGLE_REGEX = re.compile(r"time[=<](\d+(?:\.\d+)?)\s*ms", re.IGNORECASE)


async def ping_host_async(ip: str, count: int = 2, timeout_ms: int = 1000) -> PingResult:
    """Sends async ICMP echo requests to an IPv4 host with latency calculation."""
    is_windows = platform.system().lower() == "windows"
    if is_windows:
        cmd = ["ping", "-n", str(count), "-w", str(timeout_ms), ip]
    else:
        timeout_sec = max(1, int(round(timeout_ms / 1000.0)))
        cmd = ["ping", "-c", str(count), "-W", str(timeout_sec), "-i", "0.2", ip]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_bytes, _ = await asyncio.wait_for(
            proc.communicate(),
            timeout=(count * (timeout_ms / 1000.0)) + 2.5,
        )
        output = stdout_bytes.decode("utf-8", errors="ignore")

        # Parse Latency
        latency: Optional[float] = None
        match_win = RTT_WIN_REGEX.search(output)
        if match_win:
            latency = float(match_win.group(1))
        else:
            match_nix = RTT_NIX_REGEX.search(output)
            if match_nix:
                latency = float(match_nix.group(1))
            else:
                matches = RTT_SINGLE_REGEX.findall(output)
                if matches:
                    floats = [float(m) for m in matches]
                    latency = sum(floats) / len(floats)

        # Parse Packet Loss
        loss_match = re.search(r"(\d+)%\s*(?:packet\s*)?loss", output, re.IGNORECASE)
        loss = float(loss_match.group(1)) if loss_match else (0.0 if latency is not None else 100.0)

        is_alive = (loss < 100.0) or (latency is not None)
        return PingResult(
            ip=ip,
            is_alive=is_alive,
            status="ONLINE" if is_alive else "OFFLINE",
            latency_ms=latency,
            packet_loss_percent=loss,
        )
    except Exception as exc:
        logger.debug("Ping failed for %s: %s", ip, exc)
        return PingResult(ip=ip, is_alive=False, status="TIMEOUT", packet_loss_percent=100.0)


async def ping_subnet_async(cidr: str, concurrency: int = 50) -> List[PingResult]:
    """Sweeps an entire IPv4 subnet concurrently with throttled Semaphore."""
    net = ipaddress.ip_network(cidr, strict=False)
    hosts = [str(ip) for ip in net.hosts()]
    sem = asyncio.Semaphore(concurrency)

    async def _worker(ip: str):
        async with sem:
            return await ping_host_async(ip, count=2, timeout_ms=800)

    tasks = [_worker(ip) for ip in hosts]
    return await asyncio.gather(*tasks)


# -----------------------------------------------------------------------------
# 2. ARP DISCOVERY (OS TABLE & MAC RESOLUTION)
# -----------------------------------------------------------------------------
MAC_REGEX = re.compile(r"([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})")
IP_REGEX = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def normalize_mac(mac: str) -> str:
    """Normalizes MAC to XX:XX:XX:XX:XX:XX uppercase."""
    clean = re.sub(r"[^0-9A-Fa-f]", "", mac).upper()
    if len(clean) == 12:
        return ":".join(clean[i : i + 2] for i in range(0, 12, 2))
    return mac.upper()


def get_local_arp_table() -> List[ArpDevice]:
    """Reads OS ARP cache via native CLI ('arp -a' or 'ip neigh') without requiring root."""
    results: List[ArpDevice] = []
    is_windows = platform.system().lower() == "windows"

    try:
        if is_windows:
            output = subprocess.check_output(["arp", "-a"], text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                line = line.strip()
                if not line or "Interface" in line:
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    ip = parts[0]
                    mac = parts[1]
                    if IP_REGEX.match(ip) and MAC_REGEX.match(mac):
                        norm_mac = normalize_mac(mac)
                        if norm_mac != "FF:FF:FF:FF:FF:FF":
                            results.append(ArpDevice(ip=ip, mac=norm_mac))
        else:
            output = subprocess.check_output(["ip", "neigh"], text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "lladdr" in parts:
                    ip_idx = 0
                    mac_idx = parts.index("lladdr") + 1
                    ip = parts[ip_idx]
                    mac = parts[mac_idx]
                    if IP_REGEX.match(ip) and MAC_REGEX.match(mac):
                        results.append(ArpDevice(ip=ip, mac=normalize_mac(mac)))
    except Exception as exc:
        logger.warning("Failed to read OS ARP table: %s", exc)

    return results


# -----------------------------------------------------------------------------
# 3. TARGETED TCP SERVICE PROBING
# -----------------------------------------------------------------------------
KEY_SERVICES = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    80: "HTTP",
    135: "RPC",
    139: "NetBIOS",
    443: "HTTPS",
    445: "SMB",
    3389: "RDP",
    8080: "HTTP-Alt",
    9100: "RAW-Printer",
}


async def probe_tcp_ports(ip: str, ports: Optional[List[int]] = None, timeout_sec: float = 0.5) -> List[int]:
    """Tests TCP connection for critical infrastructure ports."""
    target_ports = ports or list(KEY_SERVICES.keys())
    open_ports: List[int] = []

    async def _check(port: int):
        try:
            conn = asyncio.open_connection(ip, port)
            _, writer = await asyncio.wait_for(conn, timeout=timeout_sec)
            writer.close()
            await writer.wait_closed()
            open_ports.append(port)
        except Exception:
            pass

    await asyncio.gather(*[_check(p) for p in target_ports])
    return sorted(open_ports)


# -----------------------------------------------------------------------------
# 4. WAKE-ON-LAN (WOL MAGIC PACKET)
# -----------------------------------------------------------------------------
def wake_on_lan(mac_address: str, broadcast_ip: str = "255.255.255.255", port: int = 9) -> bool:
    """
    Constructs and broadcasts a WOL Magic Packet.
    Format: 6 bytes 0xFF followed by 16 repetitions of the target MAC address (102 bytes total).
    """
    clean_mac = re.sub(r"[^0-9A-Fa-f]", "", mac_address)
    if len(clean_mac) != 12:
        raise ValueError(f"Invalid MAC address format: '{mac_address}'")

    mac_bytes = bytes.fromhex(clean_mac)
    magic_packet = b"\xff" * 6 + (mac_bytes * 16)

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.sendto(magic_packet, (broadcast_ip, port))
        logger.info("Wake-on-LAN Magic Packet sent to %s via %s:%s", mac_address, broadcast_ip, port)
        return True
    except Exception as exc:
        logger.error("Failed to send WOL to %s: %s", mac_address, exc)
        return False


# -----------------------------------------------------------------------------
# 5. QUICK TRACEROUTE / PATH DISCOVERY
# -----------------------------------------------------------------------------
def quick_traceroute(target_host: str, max_hops: int = 15) -> List[str]:
    """Runs OS-native traceroute command and yields path hops."""
    is_windows = platform.system().lower() == "windows"
    cmd = ["tracert", "-d", "-h", str(max_hops), "-w", "500", target_host] if is_windows else ["traceroute", "-n", "-m", str(max_hops), "-w", "1", target_host]

    hops: List[str] = []
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for line in proc.stdout or []:
            line = line.strip()
            if line and re.match(r"^\d+", line):
                hops.append(line)
    except Exception as exc:
        logger.error("Traceroute error for %s: %s", target_host, exc)
    return hops
