"""
Offline IEEE OUI (Organizationally Unique Identifier) Vendor Lookup for HICC V1.0.
Normalizes MAC addresses to `AA:BB:CC:DD:EE:FF` and identifies enterprise hardware vendors
(Workstations, Printers, Managed Switches, IP Cameras) without requiring Internet access.
"""

import re
from typing import Optional

# Curated offline OUI prefix dictionary for enterprise IT hardware commonly deployed in Vietnam/HEPCO
OUI_VENDOR_MAP: dict[str, tuple[str, str]] = {
    # Managed Switches & Networking (Cisco, Aruba/HPE, TP-Link, Ruijie, Ubiquiti, Mikrotik)
    "00:00:0C": ("Cisco Systems", "SWITCH"),
    "00:1B:54": ("Cisco Systems", "SWITCH"),
    "F8:B7:E2": ("Cisco Systems", "SWITCH"),
    "B4:99:BA": ("Hewlett Packard Enterprise / Aruba", "SWITCH"),
    "38:21:C7": ("Hewlett Packard Enterprise / Aruba", "SWITCH"),
    "50:C7:BF": ("TP-Link Technologies", "SWITCH"),
    "E8:DE:27": ("TP-Link Technologies", "SWITCH"),
    "58:69:6C": ("Ruijie Networks", "SWITCH"),
    "00:74:9C": ("Ruijie Networks", "SWITCH"),
    "24:5A:4C": ("Ubiquiti Inc.", "ACCESS_POINT"),
    "78:8A:20": ("Ubiquiti Inc.", "ACCESS_POINT"),
    "4C:5E:0C": ("MikroTikls SIA", "ROUTER"),
    # Network Printers (HP, Canon, Brother, Ricoh, Epson)
    "3C:D9:2B": ("HP Inc.", "PRINTER"),
    "A0:B3:CC": ("HP Inc.", "PRINTER"),
    "00:1E:8F": ("Canon Inc.", "PRINTER"),
    "18:0C:AC": ("Canon Inc.", "PRINTER"),
    "00:80:77": ("Brother Industries", "PRINTER"),
    "30:05:5C": ("Brother Industries", "PRINTER"),
    "00:00:74": ("Ricoh Company", "PRINTER"),
    "00:26:73": ("Ricoh Company", "PRINTER"),
    "00:00:48": ("Seiko Epson", "PRINTER"),
    # IP Cameras & NVRs (Hikvision, Dahua, Axis, Hanwha)
    "44:19:B6": ("Hangzhou Hikvision Digital", "CAMERA"),
    "C0:56:E3": ("Hangzhou Hikvision Digital", "CAMERA"),
    "BC:AD:28": ("Hangzhou Hikvision Digital", "CAMERA"),
    "28:57:BE": ("Hangzhou Hikvision Digital", "CAMERA"),
    "3C:EF:8C": ("Zhejiang Dahua Technology", "CAMERA"),
    "E0:50:8B": ("Zhejiang Dahua Technology", "CAMERA"),
    "90:02:A9": ("Zhejiang Dahua Technology", "CAMERA"),
    "00:40:8C": ("Axis Communications", "CAMERA"),
    "AC:CC:8E": ("Axis Communications", "CAMERA"),
    "00:09:18": ("Hanwha Vision (Samsung Techwin)", "CAMERA"),
    # Workstations / Laptops / Servers (Dell, Intel, Lenovo, Realtek, Asus)
    "F8:B1:56": ("Dell Inc.", "WORKSTATION"),
    "D4:BE:D9": ("Dell Inc.", "WORKSTATION"),
    "00:14:22": ("Dell Inc.", "WORKSTATION"),
    "AC:1F:6B": ("Super Micro Computer", "SERVER"),
    "00:50:56": ("VMware Virtual NIC", "SERVER"),
    "00:15:5D": ("Microsoft Hyper-V Virtual NIC", "SERVER"),
    "E8:6A:64": ("Lenovo", "WORKSTATION"),
    "60:F6:77": ("Intel Corporate", "WORKSTATION"),
    "8C:EC:4B": ("Dell Inc.", "WORKSTATION"),
    "00:E0:4C": ("Realtek Semiconductor", "WORKSTATION"),
}

MAC_HEX_REGEX = re.compile(r"^[0-9A-F]{12}$")


def normalize_mac(raw_mac: Optional[str]) -> Optional[str]:
    """
    Normalizes any valid MAC string (e.g. `a0-b3-cc-11-22-33` or `a0b3.cc11.2233`)
    into canonical uppercase colon-separated format `AA:BB:CC:DD:EE:FF`.
    Returns None if input is empty or invalid.
    """
    if not raw_mac:
        return None
    cleaned = re.sub(r"[^0-9A-Fa-f]", "", raw_mac).upper()
    if not MAC_HEX_REGEX.match(cleaned):
        return None
    if cleaned in {"000000000000", "FFFFFFFFFFFF"}:
        return None
    return ":".join(cleaned[i : i + 2] for i in range(0, 12, 2))


def lookup_oui_vendor(mac_address: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """
    Looks up the hardware manufacturer and hinted device category from a MAC address.
    Returns `(vendor_name, hinted_device_type_code)`.
    """
    normalized = normalize_mac(mac_address)
    if not normalized:
        return None, None
    prefix = normalized[:8]
    if prefix in OUI_VENDOR_MAP:
        return OUI_VENDOR_MAP[prefix]
    return None, None
