"""
Module 2.2: ICMP Monitoring (`icmp_scanner.py`)
Asynchronously pings hosts in an approved subnet, measuring round-trip latency (ms)
and packet loss percentage across multiple probes.
Distinguishes between ONLINE, TIMEOUT, and UNREACHABLE without marking a host offline
from a single dropped packet.
"""

import asyncio
from dataclasses import dataclass
import platform
import re
from typing import Optional


@dataclass(slots=True)
class IcmpResult:
    """Result of multi-packet ICMP echo probing for a single IPv4 host."""

    ip_address: str
    is_alive: bool
    status: str  # ONLINE | TIMEOUT | UNREACHABLE
    latency_ms: Optional[float] = None
    packet_loss: float = 100.0


RTT_WINDOWS_REGEX = re.compile(r"Average\s*=\s*(\d+(?:\.\d+)?)ms", re.IGNORECASE)
RTT_LINUX_REGEX = re.compile(r"rtt min/avg/max/mdev\s*=\s*[\d.]+/([\d.]+)/", re.IGNORECASE)
TIME_SINGLE_REGEX = re.compile(r"time[=<](\d+(?:\.\d+)?)\s*ms", re.IGNORECASE)


async def probe_icmp_host(
    ip_address: str,
    count: int = 3,
    timeout_ms: int = 1000,
) -> IcmpResult:
    """
    Sends `count` ICMP Echo Requests to `ip_address` and calculates average RTT latency
    and packet loss percentage.
    """
    is_windows = platform.system().lower() == "windows"
    if is_windows:
        cmd = ["ping", "-n", str(count), "-w", str(timeout_ms), ip_address]
    else:
        timeout_sec = max(1, int(round(timeout_ms / 1000.0)))
        cmd = ["ping", "-c", str(count), "-W", str(timeout_sec), "-i", "0.2", ip_address]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_bytes, _ = await asyncio.wait_for(
            proc.communicate(),
            timeout=(count * (timeout_ms / 1000.0)) + 3.0,
        )
        output = stdout_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return IcmpResult(ip_address=ip_address, is_alive=False, status="TIMEOUT", packet_loss=100.0)

    lowered = output.lower()
    if "destination host unreachable" in lowered or "destination net unreachable" in lowered:
        return IcmpResult(ip_address=ip_address, is_alive=False, status="UNREACHABLE", packet_loss=100.0)

    samples = [float(m.group(1)) for m in TIME_SINGLE_REGEX.finditer(output)]
    if samples:
        received = len(samples)
        packet_loss = round(max(0.0, ((count - received) / count) * 100.0), 1)
        avg_latency = round(sum(samples) / received, 2)
        return IcmpResult(
            ip_address=ip_address,
            is_alive=True,
            status="ONLINE",
            latency_ms=avg_latency,
            packet_loss=packet_loss,
        )

    # Fallback parser for Windows/Linux summary line
    win_match = RTT_WINDOWS_REGEX.search(output)
    linux_match = RTT_LINUX_REGEX.search(output)
    if proc.returncode == 0 and (win_match or linux_match):
        avg_val = float((win_match or linux_match).group(1))  # type: ignore[union-attr]
        return IcmpResult(
            ip_address=ip_address,
            is_alive=True,
            status="ONLINE",
            latency_ms=round(avg_val, 2),
            packet_loss=0.0,
        )

    return IcmpResult(ip_address=ip_address, is_alive=False, status="TIMEOUT", packet_loss=100.0)


async def sweep_icmp_hosts(
    ip_addresses: list[str],
    concurrency: int = 64,
    count: int = 3,
    timeout_ms: int = 1000,
) -> dict[str, IcmpResult]:
    """Concurrently probes a list of IPv4 addresses using a bounded semaphore."""
    semaphore = asyncio.Semaphore(concurrency)

    async def _worker(ip: str) -> IcmpResult:
        async with semaphore:
            return await probe_icmp_host(ip, count=count, timeout_ms=timeout_ms)

    tasks = [_worker(ip) for ip in ip_addresses]
    results_list = await asyncio.gather(*tasks)
    return {res.ip_address: res for res in results_list}
