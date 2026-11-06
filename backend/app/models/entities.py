"""
PostgreSQL SQLAlchemy 2.0 ORM Models for HEPCO IT COMMAND CENTER (HICC V1.0).
Defines all 16 core and extended tables with UUID primary keys, INET/CIDR/MACADDR types,
check constraints, foreign keys, and composite indexes.
"""

from datetime import datetime, timezone
from typing import Any, Optional
import uuid

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import CIDR, INET, JSONB, MACADDR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import (
    AlertSeverity,
    AlertStatus,
    DeviceStatus,
    ScanJobStatus,
    SubnetScanMode,
    TriggerSource,
    UserRole,
)


class Department(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Organizational departments and branches within HEPCO."""

    __tablename__ = "departments"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    users: Mapped[list["User"]] = relationship("User", back_populates="department")
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="department")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """System operators and administrators with RBAC roles."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'it', 'viewer')",
            name="valid_user_role",
        ),
    )

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=UserRole.VIEWER.value, nullable=False)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="users")


class DeviceType(UUIDPrimaryKeyMixin, Base):
    """Standardized device classifications (Workstation, Printer, Switch, Camera, etc.)."""

    __tablename__ = "device_types"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    default_offline_threshold: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    devices: Mapped[list["Device"]] = relationship("Device", back_populates="device_type")


class DeviceCredential(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Encrypted SNMPv3/v2c and ONVIF authentication profiles."""

    __tablename__ = "device_credentials"
    __table_args__ = (
        CheckConstraint(
            "protocol IN ('SNMP_V3', 'SNMP_V2C', 'ONVIF')",
            name="valid_credential_protocol",
        ),
    )

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    protocol: Mapped[str] = mapped_column(String(20), nullable=False)
    port: Mapped[int] = mapped_column(Integer, default=161, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    snmp_security_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    snmp_auth_protocol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    snmp_priv_protocol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    encrypted_community: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_auth_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_priv_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class NetworkSubnet(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Approved internal LAN subnets governed by SubnetGuard."""

    __tablename__ = "network_subnets"
    __table_args__ = (
        CheckConstraint(
            "scan_mode IN ('LOCAL_L2', 'ROUTED_L3')",
            name="valid_subnet_scan_mode",
        ),
        CheckConstraint(
            "vlan_id IS NULL OR (vlan_id >= 1 AND vlan_id <= 4094)",
            name="valid_vlan_id_range",
        ),
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    cidr: Mapped[str] = mapped_column(CIDR, unique=True, nullable=False)
    gateway_ip: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    vlan_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    scan_mode: Mapped[str] = mapped_column(
        String(20),
        default=SubnetScanMode.LOCAL_L2.value,
        nullable=False,
    )
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ping_interval_sec: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    discovery_interval_sec: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    default_credential_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("device_credentials.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_scanned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    devices: Mapped[list["Device"]] = relationship("Device", back_populates="primary_subnet")
    scan_jobs: Mapped[list["ScanJob"]] = relationship("ScanJob", back_populates="subnet")


class Device(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Core IT Asset and Network Device entity.
    Separates automatic discovery fields from manual IT management fields.
    """

    __tablename__ = "devices"
    __table_args__ = (
        CheckConstraint(
            "status IN ('ONLINE', 'OFFLINE', 'UNREACHABLE', 'UNKNOWN', 'MAINTENANCE')",
            name="valid_device_status",
        ),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 100",
            name="valid_confidence_score_range",
        ),
        Index("idx_devices_status_type", "status", "device_type_id"),
        Index("idx_devices_last_ip", "last_ip_address"),
        Index("idx_devices_last_mac", "last_mac_address"),
        Index("idx_devices_department", "department_id"),
    )

    # Management & Identity Plane
    device_code: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    discovered_hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    device_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("device_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    is_type_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Hardware & OS Fingerprinting Plane
    manufacturer: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    os_family: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Manual IT Asset Management Plane (Never overwritten by Scanner)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    primary_subnet_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("network_subnets.id", ondelete="SET NULL"),
        nullable=True,
    )
    credential_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("device_credentials.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_user: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Operational State Plane
    status: Mapped[str] = mapped_column(
        String(20),
        default=DeviceStatus.UNKNOWN.value,
        nullable=False,
    )
    is_new: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_authorized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    icmp_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    last_ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    last_mac_address: Mapped[Optional[str]] = mapped_column(MACADDR, nullable=True)
    custom_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    device_type: Mapped["DeviceType"] = relationship("DeviceType", back_populates="devices")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="devices")
    primary_subnet: Mapped[Optional["NetworkSubnet"]] = relationship("NetworkSubnet", back_populates="devices")
    interfaces: Mapped[list["DeviceInterface"]] = relationship(
        "DeviceInterface",
        back_populates="device",
        cascade="all, delete-orphan",
    )
    observations: Mapped[list["DeviceObservation"]] = relationship(
        "DeviceObservation",
        back_populates="device",
        cascade="all, delete-orphan",
    )
    events: Mapped[list["DeviceEvent"]] = relationship(
        "DeviceEvent",
        back_populates="device",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert",
        back_populates="device",
        cascade="all, delete-orphan",
    )
    snmp_metrics: Mapped[list["SnmpMetric"]] = relationship(
        "SnmpMetric",
        back_populates="device",
        cascade="all, delete-orphan",
    )


class DeviceInterface(UUIDPrimaryKeyMixin, Base):
    """Tracks current and historical IP and MAC bindings for a device."""

    __tablename__ = "device_interfaces"
    __table_args__ = (
        Index("idx_device_interfaces_device_current", "device_id", "is_current"),
        Index("idx_device_interfaces_ip_current", "ip_address", "is_current"),
        Index("idx_device_interfaces_mac", "mac_address"),
    )

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    ip_address: Mapped[str] = mapped_column(INET, nullable=False)
    mac_address: Mapped[Optional[str]] = mapped_column(MACADDR, nullable=True)
    interface_name: Mapped[str] = mapped_column(String(100), default="eth0", nullable=False)
    if_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mac_vendor: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    device: Mapped["Device"] = relationship("Device", back_populates="interfaces")


class ScanJob(UUIDPrimaryKeyMixin, Base):
    """Execution record of a scheduled or manual network scan job."""

    __tablename__ = "scan_jobs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')",
            name="valid_scan_job_status",
        ),
        Index("idx_scan_jobs_started_at", text("started_at DESC")),
    )

    job_type: Mapped[str] = mapped_column(String(40), nullable=False)
    subnet_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("network_subnets.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_cidr: Mapped[str] = mapped_column(String(64), nullable=False)
    trigger_source: Mapped[str] = mapped_column(
        String(30),
        default=TriggerSource.SCHEDULED.value,
        nullable=False,
    )
    triggered_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    scanner_host: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default=ScanJobStatus.PENDING.value,
        nullable=False,
    )
    total_hosts_scanned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hosts_up: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hosts_down: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_devices_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alerts_generated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scan_summary: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    subnet: Mapped[Optional["NetworkSubnet"]] = relationship("NetworkSubnet", back_populates="scan_jobs")
    results: Mapped[list["ScanResult"]] = relationship(
        "ScanResult",
        back_populates="scan_job",
        cascade="all, delete-orphan",
    )


class ScanResult(UUIDPrimaryKeyMixin, Base):
    """Raw per-host discovery output captured within a specific ScanJob."""

    __tablename__ = "scan_results"
    __table_args__ = (
        Index("idx_scan_results_job_ip", "scan_job_id", "ip_address"),
    )

    scan_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scan_jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="SET NULL"),
        nullable=True,
    )
    ip_address: Mapped[str] = mapped_column(INET, nullable=False)
    mac_address: Mapped[Optional[str]] = mapped_column(MACADDR, nullable=True)
    mac_vendor: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_alive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    response_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    open_ports: Mapped[list[int]] = mapped_column(
        JSONB,
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    raw_fingerprint: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    matched_device_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    scan_job: Mapped["ScanJob"] = relationship("ScanJob", back_populates="results")


class DeviceObservation(UUIDPrimaryKeyMixin, Base):
    """Time-series reachability, latency, packet loss, and open port observations."""

    __tablename__ = "device_observations"
    __table_args__ = (
        Index("idx_observations_device_time", "device_id", text("observed_at DESC")),
        Index("idx_observations_observed_at", text("observed_at DESC")),
    )

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    scan_job_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scan_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    observed_ip: Mapped[str] = mapped_column(INET, nullable=False)
    observed_mac: Mapped[Optional[str]] = mapped_column(MACADDR, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    latency_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    packet_loss: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    open_ports: Mapped[list[int]] = mapped_column(
        JSONB,
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    probe_method: Mapped[str] = mapped_column(String(30), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    device: Mapped["Device"] = relationship("Device", back_populates="observations")


class DeviceEvent(UUIDPrimaryKeyMixin, Base):
    """Lifecycle and state transition events for a device (IP change, MAC change, status change)."""

    __tablename__ = "device_events"
    __table_args__ = (
        Index("idx_device_events_device_time", "device_id", text("occurred_at DESC")),
        Index("idx_device_events_type", "event_type"),
    )

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default=AlertSeverity.INFO.value, nullable=False)
    previous_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    device: Mapped["Device"] = relationship("Device", back_populates="events")


class AlertRule(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Configurable rules and thresholds for the Alert Engine."""

    __tablename__ = "alert_rules"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    threshold_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    cooldown_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    auto_resolve: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    conditions: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )


class Alert(UUIDPrimaryKeyMixin, Base):
    """
    Operational and security alerts with deduplication support.
    Partial unique index `uq_alerts_active_dedup_key` prevents duplicate active alerts.
    """

    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint(
            "severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')",
            name="valid_alert_severity",
        ),
        CheckConstraint(
            "status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED')",
            name="valid_alert_status",
        ),
        Index(
            "uq_alerts_active_dedup_key",
            "dedup_key",
            unique=True,
            postgresql_where=text("status IN ('OPEN', 'ACKNOWLEDGED')"),
        ),
        Index("idx_alerts_status_severity", "status", "severity"),
        Index("idx_alerts_detected_at", text("detected_at DESC")),
    )

    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=True,
    )
    subnet_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("network_subnets.id", ondelete="SET NULL"),
        nullable=True,
    )
    rule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("alert_rules.id", ondelete="SET NULL"),
        nullable=True,
    )
    dedup_key: Mapped[str] = mapped_column(String(255), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default=AlertStatus.OPEN.value,
        nullable=False,
    )
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    context_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    acknowledged_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    device: Mapped[Optional["Device"]] = relationship("Device", back_populates="alerts")


class SnmpMetric(UUIDPrimaryKeyMixin, Base):
    """Time-series SNMP telemetry collected from managed switches and network printers."""

    __tablename__ = "snmp_metrics"
    __table_args__ = (
        Index("idx_snmp_metrics_device_time", "device_id", text("collected_at DESC")),
    )

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    sys_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sys_descr: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sys_object_id: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    uptime_ticks: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    cpu_load_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    memory_used_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_interfaces: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active_interfaces: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    printer_page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    printer_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interface_stats: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB,
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    device: Mapped["Device"] = relationship("Device", back_populates="snmp_metrics")


class DeviceRelationship(UUIDPrimaryKeyMixin, Base):
    """Verified L2/L3 topology links between switches and endpoints (LLDP/CDP/SNMP FDB)."""

    __tablename__ = "device_relationships"
    __table_args__ = (
        Index("idx_device_rel_parent_child", "parent_device_id", "child_device_id", unique=True),
    )

    parent_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    child_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_port: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    child_port: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    discovery_protocol: Mapped[str] = mapped_column(String(30), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AuditLog(UUIDPrimaryKeyMixin, Base):
    """Immutable security and operational audit trail."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_created_at", text("created_at DESC")),
        Index("idx_audit_logs_user_action", "user_id", "action"),
    )

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    username: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    client_ip: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    old_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SystemSetting(Base):
    """Dynamic runtime configuration store for scanner intervals and retention policies."""

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
