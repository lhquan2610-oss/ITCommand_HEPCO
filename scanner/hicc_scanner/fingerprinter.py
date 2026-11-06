"""
Module 2.7: Device Fingerprinting & Confidence Scoring (`fingerprinter.py`)
Classifies network devices into `WORKSTATION`, `PRINTER`, `SWITCH`, `CAMERA`, `SERVER`,
`ROUTER`, `ACCESS_POINT`, or `UNKNOWN` based on multi-signal evidence:
- SNMP `sysDescr`, `sysObjectID`, Printer-MIB counters (+50 pts)
- ONVIF `NetworkVideoTransmitter` / RTSP + Camera SDK ports (+45 pts)
- Targeted TCP service ports (+30 pts)
- IEEE OUI MAC vendor (+20 pts)
- Hostname / HTTP Banner patterns (+15 pts)

Rule: If the highest confidence score is `< 60`, the device MUST be classified as `UNKNOWN`
(never guesses when evidence is insufficient).
"""

from .config import ClassificationDecision, HostObservation
from .oui_lookup import lookup_oui_vendor

CONFIDENCE_THRESHOLD = 60


def classify_host_observation(obs: HostObservation) -> ClassificationDecision:
    """
    Evaluates all collected signals for `obs` and returns a `ClassificationDecision`
    with a bounded confidence score (`0` to `100`).
    """
    scores: dict[str, int] = {
        "WORKSTATION": 0,
        "PRINTER": 0,
        "SWITCH": 0,
        "CAMERA": 0,
        "SERVER": 0,
        "ROUTER": 0,
        "ACCESS_POINT": 0,
    }
    signals: list[str] = []

    vendor_name, oui_type_hint = lookup_oui_vendor(obs.mac_address)
    manufacturer = vendor_name or obs.mac_vendor
    model: str | None = None
    os_family: str | None = None

    # 1. OUI MAC Vendor Signal (+20 pts)
    if oui_type_hint and oui_type_hint in scores:
        scores[oui_type_hint] += 20
        signals.append(f"OUI_VENDOR:{manufacturer}->{oui_type_hint}(+20)")

    # 2. SNMP Signals (+50 pts)
    if obs.snmp and obs.snmp.reachable:
        sys_descr = (obs.snmp.sys_descr or "").lower()
        if obs.snmp.printer_page_count is not None or obs.snmp.serial_number and "printer" in sys_descr:
            scores["PRINTER"] += 55
            signals.append("SNMP:Printer-MIB(+55)")
        if any(k in sys_descr for k in ("laserjet", "officejet", "canon", "ricoh", "brother", "epson")):
            scores["PRINTER"] += 50
            signals.append("SNMP:sysDescr_Printer(+50)")
        if any(k in sys_descr for k in ("cisco ios", "nx-os", "procurve", "arubaos", "jetstream", "ruijie", "switch")):
            scores["SWITCH"] += 55
            os_family = obs.snmp.sys_descr[:80] if obs.snmp.sys_descr else "Switch OS"
            signals.append("SNMP:sysDescr_Switch(+55)")
        if any(k in sys_descr for k in ("routeros", "fortigate", "pfsense")):
            scores["ROUTER"] += 55
            signals.append("SNMP:sysDescr_Router(+55)")
        if "windows" in sys_descr:
            scores["WORKSTATION"] += 45
            os_family = "Windows"
            signals.append("SNMP:sysDescr_Windows(+45)")
        elif "linux" in sys_descr and scores["SWITCH"] == 0 and scores["PRINTER"] == 0:
            scores["SERVER"] += 35
            os_family = "Linux"
            signals.append("SNMP:sysDescr_Linux(+35)")

    # 3. ONVIF & Camera Signals (+45 pts)
    if obs.onvif:
        if obs.onvif.reachable:
            scores["CAMERA"] += 50
            signals.append("ONVIF:WS-Discovery_Match(+50)")
            if obs.onvif.manufacturer:
                manufacturer = obs.onvif.manufacturer
            if obs.onvif.model:
                model = obs.onvif.model
        elif obs.onvif.rtsp_open:
            scores["CAMERA"] += 25
            signals.append("RTSP:Port_554_Open(+25)")

    # 4. Targeted TCP Service Ports (+30 to +45 pts)
    ports = set(obs.open_tcp_ports)
    if 9100 in ports or 515 in ports or 631 in ports:
        # RAW JetDirect (9100), LPD (515), or IPP (631) without Windows SMB
        if 445 not in ports:
            scores["PRINTER"] += 45
            signals.append("TCP:Printer_Ports_9100_515_631(+45)")
        else:
            scores["PRINTER"] += 20
            signals.append("TCP:Printer_Port_Shared(+20)")

    if 8000 in ports or 37777 in ports or (554 in ports and 8899 in ports):
        scores["CAMERA"] += 45
        signals.append("TCP:Camera_SDK_Ports(+45)")

    if 135 in ports and 445 in ports:
        scores["WORKSTATION"] += 45
        os_family = os_family or "Windows"
        signals.append("TCP:Windows_RPC_SMB_135_445(+45)")
    elif 445 in ports or 139 in ports or 3389 in ports:
        scores["WORKSTATION"] += 35
        os_family = os_family or "Windows"
        signals.append("TCP:SMB_RDP_139_445_3389(+35)")

    if 22 in ports and not ({135, 445, 9100, 554} & ports):
        if oui_type_hint == "SWITCH":
            scores["SWITCH"] += 40
            signals.append("TCP:SSH_on_Switch_OUI(+40)")
        else:
            scores["SERVER"] += 25
            signals.append("TCP:SSH_22(+25)")

    # 5. Hostname & HTTP Banner Patterns (+15 to +25 pts)
    hostname_upper = (obs.hostname or "").upper()
    if hostname_upper:
        if any(hostname_upper.startswith(p) for p in ("DESKTOP-", "LAPTOP-", "PC-", "WIN-", "HEPCO-PC")):
            scores["WORKSTATION"] += 25
            os_family = os_family or "Windows"
            signals.append("HOSTNAME:Workstation_Pattern(+25)")
        elif any(hostname_upper.startswith(p) for p in ("NPI", "BRN", "CANON", "PRN-", "HP-")):
            scores["PRINTER"] += 25
            signals.append("HOSTNAME:Printer_Pattern(+25)")
        elif any(hostname_upper.startswith(p) for p in ("SW-", "SWITCH-", "CORE-", "ACCESS-")):
            scores["SWITCH"] += 25
            signals.append("HOSTNAME:Switch_Pattern(+25)")
        elif any(hostname_upper.startswith(p) for p in ("IPC-", "CAM-", "NVR-", "HIK-")):
            scores["CAMERA"] += 25
            signals.append("HOSTNAME:Camera_Pattern(+25)")

    banner_lower = (obs.http_banner or "").lower()
    if banner_lower:
        if any(k in banner_lower for k in ("hikvision", "dahua", "webcamera", "ipcamera", "net surveillance")):
            scores["CAMERA"] += 35
            signals.append("HTTP:Camera_Banner(+35)")
        elif any(k in banner_lower for k in ("laserjet", "jetdirect", "canon http", "brother", "ricoh", "syncthru")):
            scores["PRINTER"] += 35
            signals.append("HTTP:Printer_Banner(+35)")
        elif any(k in banner_lower for k in ("cisco", "aruba", "tp-link", "ruijie", "switch")):
            scores["SWITCH"] += 35
            signals.append("HTTP:Switch_Banner(+35)")

    best_type, best_score = max(scores.items(), key=lambda kv: kv[1])
    bounded_score = min(100, best_score)

    if bounded_score < CONFIDENCE_THRESHOLD:
        return ClassificationDecision(
            device_type_code="UNKNOWN",
            confidence_score=bounded_score,
            manufacturer=manufacturer,
            model=model,
            os_family=os_family,
            signals=signals,
        )

    return ClassificationDecision(
        device_type_code=best_type,
        confidence_score=bounded_score,
        manufacturer=manufacturer,
        model=model,
        os_family=os_family,
        signals=signals,
    )
