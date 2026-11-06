"""
Domain Enumerations and Constants for HEPCO IT COMMAND CENTER (HICC V1.0).
Centralizes all status codes, roles, device types, scan job types, and alert severities.
"""

from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    IT = "it"
    VIEWER = "viewer"


class DeviceTypeCode(StrEnum):
    WORKSTATION = "WORKSTATION"
    PRINTER = "PRINTER"
    SWITCH = "SWITCH"
    CAMERA = "CAMERA"
    SERVER = "SERVER"
    ROUTER = "ROUTER"
    ACCESS_POINT = "ACCESS_POINT"
    UNKNOWN = "UNKNOWN"


class DeviceStatus(StrEnum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    UNREACHABLE = "UNREACHABLE"
    UNKNOWN = "UNKNOWN"
    MAINTENANCE = "MAINTENANCE"


class SubnetScanMode(StrEnum):
    LOCAL_L2 = "LOCAL_L2"
    ROUTED_L3 = "ROUTED_L3"


class CredentialProtocol(StrEnum):
    SNMP_V3 = "SNMP_V3"
    SNMP_V2C = "SNMP_V2C"
    ONVIF = "ONVIF"


class ScanJobType(StrEnum):
    PING_SWEEP = "PING_SWEEP"
    ARP_DISCOVERY = "ARP_DISCOVERY"
    TCP_SERVICE = "TCP_SERVICE"
    HOSTNAME_REFRESH = "HOSTNAME_REFRESH"
    SNMP_POLL = "SNMP_POLL"
    ONVIF_PROBE = "ONVIF_PROBE"
    FULL_DISCOVERY = "FULL_DISCOVERY"


class ScanJobStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TriggerSource(StrEnum):
    SCHEDULED = "SCHEDULED"
    MANUAL_CLI = "MANUAL_CLI"
    MANUAL_API = "MANUAL_API"


class ProbeMethod(StrEnum):
    ARP = "ARP"
    ICMP = "ICMP"
    TCP_SYN = "TCP_SYN"
    SNMP = "SNMP"
    ONVIF = "ONVIF"


class DeviceEventType(StrEnum):
    NEW_DEVICE = "NEW_DEVICE"
    STATE_ONLINE = "STATE_ONLINE"
    STATE_OFFLINE = "STATE_OFFLINE"
    IP_CHANGED = "IP_CHANGED"
    MAC_CHANGED = "MAC_CHANGED"
    IP_CONFLICT = "IP_CONFLICT"
    HOSTNAME_CHANGED = "HOSTNAME_CHANGED"
    ASSET_UPDATED = "ASSET_UPDATED"


class AlertType(StrEnum):
    NEW_DEVICE = "NEW_DEVICE"
    DEVICE_OFFLINE = "DEVICE_OFFLINE"
    DEVICE_RECOVERED = "DEVICE_RECOVERED"
    IP_CHANGED = "IP_CHANGED"
    IP_CONFLICT = "IP_CONFLICT"
    MAC_ANOMALY = "MAC_ANOMALY"
    SNMP_UNREACHABLE = "SNMP_UNREACHABLE"
    CAMERA_UNREACHABLE = "CAMERA_UNREACHABLE"
    SCANNER_FAILURE = "SCANNER_FAILURE"


class AlertSeverity(StrEnum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(StrEnum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    SUPPRESSED = "SUPPRESSED"
