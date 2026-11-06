"""
Module 2.6: ONVIF Scanner (`onvif_scanner.py`)
Discovers IP Cameras supporting ONVIF via UDP 3702 WS-Discovery (`dn:NetworkVideoTransmitter`)
and verifies camera service health via RTSP (TCP 554) or ONVIF HTTP endpoints.
Does not decode or stream live video in HICC V1.0.
"""

import asyncio
import re
import socket
from urllib.parse import unquote
import uuid

from ..config import OnvifObservation

WS_DISCOVERY_MULTICAST_IP = "239.255.255.250"
WS_DISCOVERY_PORT = 3702

XADDRS_REGEX = re.compile(r"<[^>]*:?XAddrs[^>]*>(.*?)</[^>]*:?XAddrs>", re.IGNORECASE | re.DOTALL)
SCOPES_REGEX = re.compile(r"<[^>]*:?Scopes[^>]*>(.*?)</[^>]*:?Scopes>", re.IGNORECASE | re.DOTALL)


def build_ws_discovery_probe() -> bytes:
    """Constructs a standard ONVIF WS-Discovery Probe SOAP envelope for NetworkVideoTransmitter."""
    msg_id = f"uuid:{uuid.uuid4()}"
    xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
            xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
            xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery"
            xmlns:dn="http://www.onvif.org/ver10/network/wsdl">
  <e:Header>
    <w:MessageID>{msg_id}</w:MessageID>
    <w:To e:mustUnderstand="true">urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
    <w:Action a:mustUnderstand="true" xmlns:a="http://www.w3.org/2005/08/addressing">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>
  </e:Header>
  <e:Body>
    <d:Probe>
      <d:Types>dn:NetworkVideoTransmitter</d:Types>
    </d:Probe>
  </e:Body>
</e:Envelope>"""
    return xml_payload.encode("utf-8")


def parse_onvif_probe_response(xml_text: str) -> OnvifObservation:
    """Extracts XAddrs, Scopes, hardware model, and manufacturer from an ONVIF ProbeMatch XML."""
    obs = OnvifObservation(reachable=True)

    x_match = XADDRS_REGEX.search(xml_text)
    if x_match:
        obs.xaddrs = [u.strip() for u in x_match.group(1).split() if u.strip()]

    s_match = SCOPES_REGEX.search(xml_text)
    if s_match:
        obs.scopes = [s.strip() for s in s_match.group(1).split() if s.strip()]
        for scope in obs.scopes:
            decoded = unquote(scope)
            lower = decoded.lower()
            if "onvif://www.onvif.org/hardware/" in lower:
                obs.model = decoded.split("/")[-1].strip() or obs.model
            elif "onvif://www.onvif.org/name/" in lower:
                name_val = decoded.split("/")[-1].strip()
                if name_val and not obs.manufacturer:
                    obs.manufacturer = name_val

    return obs


def probe_unicast_onvif_udp(ip_address: str, timeout_sec: float = 1.2) -> OnvifObservation:
    """Sends a direct UDP 3702 WS-Discovery probe to a target IP address."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout_sec)
    try:
        sock.sendto(build_ws_discovery_probe(), (ip_address, WS_DISCOVERY_PORT))
        data, _ = sock.recvfrom(8192)
        xml_text = data.decode("utf-8", errors="ignore")
        if "ProbeMatch" in xml_text or "NetworkVideoTransmitter" in xml_text:
            return parse_onvif_probe_response(xml_text)
    except Exception:
        pass
    finally:
        sock.close()
    return OnvifObservation(reachable=False)


async def check_onvif_camera(ip_address: str, open_tcp_ports: list[int]) -> OnvifObservation:
    """
    Checks if a host responds to ONVIF WS-Discovery (UDP 3702) or exposes RTSP/ONVIF camera ports.
    """
    obs = await asyncio.to_thread(probe_unicast_onvif_udp, ip_address, 1.0)
    if 554 in open_tcp_ports:
        obs.rtsp_open = True
    if 8899 in open_tcp_ports and not obs.reachable:
        obs.reachable = True
    return obs
