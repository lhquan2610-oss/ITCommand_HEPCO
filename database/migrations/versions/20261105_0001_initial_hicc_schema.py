"""Initial HICC V1.0 PostgreSQL Schema (16 core and extended tables)

Revision ID: 20261105_0001
Revises: None
Create Date: 2026-11-05 15:20:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20261105_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgcrypto for UUID generation if needed at DB level
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    # 1. departments
    op.create_table(
        "departments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_departments")),
        sa.UniqueConstraint("code", name=op.f("uq_departments_code")),
    )

    # 2. users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), server_default=sa.text("'viewer'"), nullable=False),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role IN ('admin', 'it', 'viewer')", name=op.f("ck_users_valid_user_role")),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], name=op.f("fk_users_department_id_departments"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        sa.UniqueConstraint("username", name=op.f("uq_users_username")),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)

    # 3. device_types
    op.create_table(
        "device_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("icon_name", sa.String(length=50), nullable=True),
        sa.Column("default_offline_threshold", sa.Integer(), server_default=sa.text("3"), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_types")),
        sa.UniqueConstraint("code", name=op.f("uq_device_types_code")),
    )

    # 4. device_credentials
    op.create_table(
        "device_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("protocol", sa.String(length=20), nullable=False),
        sa.Column("port", sa.Integer(), server_default=sa.text("161"), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=True),
        sa.Column("snmp_security_level", sa.String(length=30), nullable=True),
        sa.Column("snmp_auth_protocol", sa.String(length=20), nullable=True),
        sa.Column("snmp_priv_protocol", sa.String(length=20), nullable=True),
        sa.Column("encrypted_community", sa.Text(), nullable=True),
        sa.Column("encrypted_auth_secret", sa.Text(), nullable=True),
        sa.Column("encrypted_priv_secret", sa.Text(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("protocol IN ('SNMP_V3', 'SNMP_V2C', 'ONVIF')", name=op.f("ck_device_credentials_valid_credential_protocol")),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_device_credentials_created_by_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_credentials")),
        sa.UniqueConstraint("name", name=op.f("uq_device_credentials_name")),
    )

    # 5. network_subnets
    op.create_table(
        "network_subnets",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("cidr", postgresql.CIDR(), nullable=False),
        sa.Column("gateway_ip", postgresql.INET(), nullable=True),
        sa.Column("vlan_id", sa.Integer(), nullable=True),
        sa.Column("scan_mode", sa.String(length=20), server_default=sa.text("'LOCAL_L2'"), nullable=False),
        sa.Column("is_approved", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("ping_interval_sec", sa.Integer(), server_default=sa.text("60"), nullable=False),
        sa.Column("discovery_interval_sec", sa.Integer(), server_default=sa.text("300"), nullable=False),
        sa.Column("default_credential_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_scanned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("scan_mode IN ('LOCAL_L2', 'ROUTED_L3')", name=op.f("ck_network_subnets_valid_subnet_scan_mode")),
        sa.CheckConstraint("vlan_id IS NULL OR (vlan_id >= 1 AND vlan_id <= 4094)", name=op.f("ck_network_subnets_valid_vlan_id_range")),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], name=op.f("fk_network_subnets_approved_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["default_credential_id"], ["device_credentials.id"], name=op.f("fk_network_subnets_default_credential_id_device_credentials"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_network_subnets")),
        sa.UniqueConstraint("cidr", name=op.f("uq_network_subnets_cidr")),
    )

    # 6. devices
    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_code", sa.String(length=64), nullable=True),
        sa.Column("hostname", sa.String(length=255), nullable=True),
        sa.Column("discovered_hostname", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("device_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_type_locked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("confidence_score", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("manufacturer", sa.String(length=150), nullable=True),
        sa.Column("model", sa.String(length=150), nullable=True),
        sa.Column("serial_number", sa.String(length=150), nullable=True),
        sa.Column("os_family", sa.String(length=100), nullable=True),
        sa.Column("firmware_version", sa.String(length=100), nullable=True),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("primary_subnet_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("credential_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_user", sa.String(length=150), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'UNKNOWN'"), nullable=False),
        sa.Column("is_new", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_authorized", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("icmp_blocked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("consecutive_failures", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_ip_address", postgresql.INET(), nullable=True),
        sa.Column("last_mac_address", postgresql.MACADDR(), nullable=True),
        sa.Column("custom_metadata", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("confidence_score >= 0 AND confidence_score <= 100", name=op.f("ck_devices_valid_confidence_score_range")),
        sa.CheckConstraint("status IN ('ONLINE', 'OFFLINE', 'UNREACHABLE', 'UNKNOWN', 'MAINTENANCE')", name=op.f("ck_devices_valid_device_status")),
        sa.ForeignKeyConstraint(["credential_id"], ["device_credentials.id"], name=op.f("fk_devices_credential_id_device_credentials"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], name=op.f("fk_devices_department_id_departments"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["device_type_id"], ["device_types.id"], name=op.f("fk_devices_device_type_id_device_types"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["primary_subnet_id"], ["network_subnets.id"], name=op.f("fk_devices_primary_subnet_id_network_subnets"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_devices")),
        sa.UniqueConstraint("device_code", name=op.f("uq_devices_device_code")),
    )
    op.create_index("idx_devices_department", "devices", ["department_id"], unique=False)
    op.create_index("idx_devices_last_ip", "devices", ["last_ip_address"], unique=False)
    op.create_index("idx_devices_last_mac", "devices", ["last_mac_address"], unique=False)
    op.create_index("idx_devices_status_type", "devices", ["status", "device_type_id"], unique=False)
    op.create_index(op.f("ix_devices_hostname"), "devices", ["hostname"], unique=False)

    # 7. device_interfaces
    op.create_table(
        "device_interfaces",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=False),
        sa.Column("mac_address", postgresql.MACADDR(), nullable=True),
        sa.Column("interface_name", sa.String(length=100), server_default=sa.text("'eth0'"), nullable=False),
        sa.Column("if_index", sa.Integer(), nullable=True),
        sa.Column("mac_vendor", sa.String(length=150), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_device_interfaces_device_id_devices"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_interfaces")),
    )
    op.create_index("idx_device_interfaces_device_current", "device_interfaces", ["device_id", "is_current"], unique=False)
    op.create_index("idx_device_interfaces_ip_current", "device_interfaces", ["ip_address", "is_current"], unique=False)
    op.create_index("idx_device_interfaces_mac", "device_interfaces", ["mac_address"], unique=False)

    # 8. scan_jobs
    op.create_table(
        "scan_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("job_type", sa.String(length=40), nullable=False),
        sa.Column("subnet_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("target_cidr", sa.String(length=64), nullable=False),
        sa.Column("trigger_source", sa.String(length=30), server_default=sa.text("'SCHEDULED'"), nullable=False),
        sa.Column("triggered_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scanner_host", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'PENDING'"), nullable=False),
        sa.Column("total_hosts_scanned", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("hosts_up", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("hosts_down", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("new_devices_found", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("alerts_generated", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("scan_summary", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')", name=op.f("ck_scan_jobs_valid_scan_job_status")),
        sa.ForeignKeyConstraint(["subnet_id"], ["network_subnets.id"], name=op.f("fk_scan_jobs_subnet_id_network_subnets"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["triggered_by"], ["users.id"], name=op.f("fk_scan_jobs_triggered_by_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_scan_jobs")),
    )
    op.create_index("idx_scan_jobs_started_at", "scan_jobs", [sa.text("started_at DESC")], unique=False)

    # 9. scan_results
    op.create_table(
        "scan_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("scan_job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=False),
        sa.Column("mac_address", postgresql.MACADDR(), nullable=True),
        sa.Column("mac_vendor", sa.String(length=150), nullable=True),
        sa.Column("hostname", sa.String(length=255), nullable=True),
        sa.Column("is_alive", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("open_ports", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("raw_fingerprint", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("matched_device_type", sa.String(length=50), nullable=True),
        sa.Column("confidence_score", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_scan_results_device_id_devices"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["scan_job_id"], ["scan_jobs.id"], name=op.f("fk_scan_results_scan_job_id_scan_jobs"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_scan_results")),
    )
    op.create_index("idx_scan_results_job_ip", "scan_results", ["scan_job_id", "ip_address"], unique=False)

    # 10. device_observations
    op.create_table(
        "device_observations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scan_job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("observed_ip", postgresql.INET(), nullable=False),
        sa.Column("observed_mac", postgresql.MACADDR(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("latency_ms", sa.Float(), nullable=True),
        sa.Column("packet_loss", sa.Float(), server_default=sa.text("0.0"), nullable=False),
        sa.Column("open_ports", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("probe_method", sa.String(length=30), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_device_observations_device_id_devices"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["scan_job_id"], ["scan_jobs.id"], name=op.f("fk_device_observations_scan_job_id_scan_jobs"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_observations")),
    )
    op.create_index("idx_observations_device_time", "device_observations", ["device_id", sa.text("observed_at DESC")], unique=False)
    op.create_index("idx_observations_observed_at", "device_observations", [sa.text("observed_at DESC")], unique=False)

    # 11. device_events
    op.create_table(
        "device_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), server_default=sa.text("'INFO'"), nullable=False),
        sa.Column("previous_value", sa.String(length=255), nullable=True),
        sa.Column("new_value", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_device_events_device_id_devices"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_events")),
    )
    op.create_index("idx_device_events_device_time", "device_events", ["device_id", sa.text("occurred_at DESC")], unique=False)
    op.create_index("idx_device_events_type", "device_events", ["event_type"], unique=False)

    # 12. alert_rules
    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("threshold_count", sa.Integer(), server_default=sa.text("3"), nullable=False),
        sa.Column("cooldown_minutes", sa.Integer(), server_default=sa.text("30"), nullable=False),
        sa.Column("auto_resolve", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("conditions", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_alert_rules")),
        sa.UniqueConstraint("code", name=op.f("uq_alert_rules_code")),
    )

    # 13. alerts
    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("subnet_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("dedup_key", sa.String(length=255), nullable=False),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'OPEN'"), nullable=False),
        sa.Column("occurrence_count", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("context_data", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("acknowledged_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.CheckConstraint("severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')", name=op.f("ck_alerts_valid_alert_severity")),
        sa.CheckConstraint("status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED')", name=op.f("ck_alerts_valid_alert_status")),
        sa.ForeignKeyConstraint(["acknowledged_by"], ["users.id"], name=op.f("fk_alerts_acknowledged_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_alerts_device_id_devices"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"], name=op.f("fk_alerts_resolved_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["rule_id"], ["alert_rules.id"], name=op.f("fk_alerts_rule_id_alert_rules"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subnet_id"], ["network_subnets.id"], name=op.f("fk_alerts_subnet_id_network_subnets"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_alerts")),
    )
    op.create_index("idx_alerts_detected_at", "alerts", [sa.text("detected_at DESC")], unique=False)
    op.create_index("idx_alerts_status_severity", "alerts", ["status", "severity"], unique=False)
    op.create_index(
        "uq_alerts_active_dedup_key",
        "alerts",
        ["dedup_key"],
        unique=True,
        postgresql_where=sa.text("status IN ('OPEN', 'ACKNOWLEDGED')"),
    )

    # 14. snmp_metrics
    op.create_table(
        "snmp_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sys_name", sa.String(length=255), nullable=True),
        sa.Column("sys_descr", sa.Text(), nullable=True),
        sa.Column("sys_object_id", sa.String(length=150), nullable=True),
        sa.Column("uptime_ticks", sa.BigInteger(), nullable=True),
        sa.Column("cpu_load_percent", sa.Float(), nullable=True),
        sa.Column("memory_used_percent", sa.Float(), nullable=True),
        sa.Column("total_interfaces", sa.Integer(), nullable=True),
        sa.Column("active_interfaces", sa.Integer(), nullable=True),
        sa.Column("printer_page_count", sa.Integer(), nullable=True),
        sa.Column("printer_status", sa.String(length=100), nullable=True),
        sa.Column("interface_stats", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], name=op.f("fk_snmp_metrics_device_id_devices"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_snmp_metrics")),
    )
    op.create_index("idx_snmp_metrics_device_time", "snmp_metrics", ["device_id", sa.text("collected_at DESC")], unique=False)

    # 15. device_relationships
    op.create_table(
        "device_relationships",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("parent_device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_port", sa.String(length=100), nullable=True),
        sa.Column("child_port", sa.String(length=100), nullable=True),
        sa.Column("discovery_protocol", sa.String(length=30), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["child_device_id"], ["devices.id"], name=op.f("fk_device_relationships_child_device_id_devices"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_device_id"], ["devices.id"], name=op.f("fk_device_relationships_parent_device_id_devices"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_device_relationships")),
    )
    op.create_index("idx_device_rel_parent_child", "device_relationships", ["parent_device_id", "child_device_id"], unique=True)

    # 16. audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("username", sa.String(length=64), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.String(length=100), nullable=True),
        sa.Column("client_ip", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("old_values", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_values", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_audit_logs_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_logs")),
    )
    op.create_index("idx_audit_logs_created_at", "audit_logs", [sa.text("created_at DESC")], unique=False)
    op.create_index("idx_audit_logs_user_action", "audit_logs", ["user_id", "action"], unique=False)

    # 17. system_settings
    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], name=op.f("fk_system_settings_updated_by_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("key", name=op.f("pk_system_settings")),
    )


def downgrade() -> None:
    op.drop_table("system_settings")
    op.drop_index("idx_audit_logs_user_action", table_name="audit_logs")
    op.drop_index("idx_audit_logs_created_at", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("idx_device_rel_parent_child", table_name="device_relationships")
    op.drop_table("device_relationships")
    op.drop_index("idx_snmp_metrics_device_time", table_name="snmp_metrics")
    op.drop_table("snmp_metrics")
    op.drop_index("uq_alerts_active_dedup_key", table_name="alerts")
    op.drop_index("idx_alerts_status_severity", table_name="alerts")
    op.drop_index("idx_alerts_detected_at", table_name="alerts")
    op.drop_table("alerts")
    op.drop_table("alert_rules")
    op.drop_index("idx_device_events_type", table_name="device_events")
    op.drop_index("idx_device_events_device_time", table_name="device_events")
    op.drop_table("device_events")
    op.drop_index("idx_observations_observed_at", table_name="device_observations")
    op.drop_index("idx_observations_device_time", table_name="device_observations")
    op.drop_table("device_observations")
    op.drop_index("idx_scan_results_job_ip", table_name="scan_results")
    op.drop_table("scan_results")
    op.drop_index("idx_scan_jobs_started_at", table_name="scan_jobs")
    op.drop_table("scan_jobs")
    op.drop_index("idx_device_interfaces_mac", table_name="device_interfaces")
    op.drop_index("idx_device_interfaces_ip_current", table_name="device_interfaces")
    op.drop_index("idx_device_interfaces_device_current", table_name="device_interfaces")
    op.drop_table("device_interfaces")
    op.drop_index(op.f("ix_devices_hostname"), table_name="devices")
    op.drop_index("idx_devices_status_type", table_name="devices")
    op.drop_index("idx_devices_last_mac", table_name="devices")
    op.drop_index("idx_devices_last_ip", table_name="devices")
    op.drop_index("idx_devices_department", table_name="devices")
    op.drop_table("devices")
    op.drop_table("network_subnets")
    op.drop_table("device_credentials")
    op.drop_table("device_types")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
    op.drop_table("departments")
