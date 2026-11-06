"""
Module 2.5: SNMP Scanner (`snmp_scanner.py`)
Supports SNMPv3 (`authPriv` / `authNoPriv` preferred) and approved SNMPv2c profiles.
Collects standard MIB-II system identity (`sysDescr`, `sysObjectID`, `sysUpTime`, `sysName`),
interface counts (`ifNumber`), and Printer-MIB counters (`prtMarkerLifeCount`, `prtGeneralSerialNumber`).
Strictly uses READ-ONLY (`GET`) operations; never performs `SNMP SET`.
"""

import logging
from typing import Optional

from ..config import SnmpObservation

logger = logging.getLogger(__name__)

# Standard Read-Only OIDs
OID_SYS_DESCR = "1.3.6.1.2.1.1.1.0"
OID_SYS_OBJECT_ID = "1.3.6.1.2.1.1.2.0"
OID_SYS_UPTIME = "1.3.6.1.2.1.1.3.0"
OID_SYS_NAME = "1.3.6.1.2.1.1.5.0"
OID_SYS_LOCATION = "1.3.6.1.2.1.1.6.0"
OID_IF_NUMBER = "1.3.6.1.2.1.2.1.0"
OID_PRINTER_SERIAL = "1.3.6.1.2.1.43.5.1.1.17.1"
OID_PRINTER_PAGE_COUNT = "1.3.6.1.2.1.43.10.2.1.4.1.1"


async def poll_snmp_device(
    ip_address: str,
    protocol: str = "SNMP_V3",
    port: int = 161,
    username: Optional[str] = None,
    auth_secret: Optional[str] = None,
    priv_secret: Optional[str] = None,
    community: Optional[str] = None,
    is_credential_approved: bool = True,
    timeout_sec: float = 1.5,
) -> SnmpObservation:
    """
    Polls a switch or printer over SNMPv3 (preferred) or approved SNMPv2c.
    Returns `SnmpObservation(reachable=False)` if credentials are not approved or host does not respond.
    """
    obs = SnmpObservation(reachable=False)
    if not is_credential_approved:
        logger.warning("Skipping SNMP poll for %s: credential profile is not approved.", ip_address)
        return obs

    try:
        from pysnmp.hlapi.v3arch.asyncio import (  # type: ignore
            CommunityData,
            ContextData,
            ObjectIdentity,
            ObjectType,
            SnmpEngine,
            UdpTransportTarget,
            UsmUserData,
            get_cmd,
            usmAesCfb128Protocol,
            usmHMACSHAAuthProtocol,
        )

        if protocol == "SNMP_V3":
            if not username:
                return obs
            auth_data = UsmUserData(
                userName=username,
                authKey=auth_secret,
                privKey=priv_secret,
                authProtocol=usmHMACSHAAuthProtocol if auth_secret else None,
                privProtocol=usmAesCfb128Protocol if priv_secret else None,
            )
        elif protocol == "SNMP_V2C":
            if not community:
                return obs
            auth_data = CommunityData(community, mpModel=1)
        else:
            return obs

        transport = await UdpTransportTarget.create((ip_address, port), timeout=timeout_sec, retries=1)
        oids = [
            ObjectType(ObjectIdentity(OID_SYS_DESCR)),
            ObjectType(ObjectIdentity(OID_SYS_OBJECT_ID)),
            ObjectType(ObjectIdentity(OID_SYS_UPTIME)),
            ObjectType(ObjectIdentity(OID_SYS_NAME)),
            ObjectType(ObjectIdentity(OID_SYS_LOCATION)),
            ObjectType(ObjectIdentity(OID_IF_NUMBER)),
            ObjectType(ObjectIdentity(OID_PRINTER_SERIAL)),
            ObjectType(ObjectIdentity(OID_PRINTER_PAGE_COUNT)),
        ]

        error_indication, error_status, _, var_binds = await get_cmd(
            SnmpEngine(),
            auth_data,
            transport,
            ContextData(),
            *oids,
        )
        if error_indication or error_status:
            return obs

        obs.reachable = True
        for oid_obj, val_obj in var_binds:
            oid_str = str(oid_obj)
            val_str = val_obj.prettyPrint()
            if not val_str or "No Such" in val_str:
                continue
            if oid_str.endswith("1.1.1.0"):
                obs.sys_descr = val_str
            elif oid_str.endswith("1.1.2.0"):
                obs.sys_object_id = val_str
            elif oid_str.endswith("1.1.3.0") and val_str.isdigit():
                obs.uptime_ticks = int(val_str)
            elif oid_str.endswith("1.1.5.0"):
                obs.sys_name = val_str
            elif oid_str.endswith("1.1.6.0"):
                obs.sys_location = val_str
            elif oid_str.endswith("2.1.0") and val_str.isdigit():
                obs.total_interfaces = int(val_str)
            elif "43.5.1.1.17" in oid_str:
                obs.serial_number = val_str
            elif "43.10.2.1.4" in oid_str and val_str.isdigit():
                obs.printer_page_count = int(val_str)

    except ImportError:
        logger.debug("pysnmp not installed; skipping SNMP collection for %s.", ip_address)
    except Exception as exc:
        logger.debug("SNMP query failed for %s: %s", ip_address, exc)

    return obs
