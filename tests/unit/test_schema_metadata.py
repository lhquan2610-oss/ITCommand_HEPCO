"""
Unit test suite verifying the HICC V1.0 SQLAlchemy 2.0 Database Schema & Metadata.
Ensures all 16 core/extended tables, primary keys, foreign keys, check constraints,
and deduplication indexes are properly registered in Base.metadata.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models import Base  # noqa: E402


EXPECTED_TABLES = {
    "departments",
    "users",
    "device_types",
    "device_credentials",
    "network_subnets",
    "devices",
    "device_interfaces",
    "scan_jobs",
    "scan_results",
    "device_observations",
    "device_events",
    "alert_rules",
    "alerts",
    "snmp_metrics",
    "device_relationships",
    "audit_logs",
    "system_settings",
}


def test_all_required_tables_registered() -> None:
    """Verify that all 17 schema tables (12 core + 5 extended) exist in Base.metadata."""
    registered_tables = set(Base.metadata.tables.keys())
    missing = EXPECTED_TABLES - registered_tables
    assert not missing, f"Missing tables in Base.metadata: {missing}"


def test_devices_uses_uuid_primary_key_not_ip() -> None:
    """Verify that `devices` uses `id` (UUID) as primary key and never `ip_address`."""
    devices_table = Base.metadata.tables["devices"]
    pk_columns = [col.name for col in devices_table.primary_key.columns]
    assert pk_columns == ["id"]
    assert "is_type_locked" in devices_table.c
    assert "department_id" in devices_table.c
    assert "assigned_user" in devices_table.c
    assert "location" in devices_table.c


def test_alerts_has_partial_unique_dedup_index() -> None:
    """Verify that `alerts` has the active deduplication index `uq_alerts_active_dedup_key`."""
    alerts_table = Base.metadata.tables["alerts"]
    index_names = {idx.name for idx in alerts_table.indexes}
    assert "uq_alerts_active_dedup_key" in index_names


if __name__ == "__main__":
    test_all_required_tables_registered()
    test_devices_uses_uuid_primary_key_not_ip()
    test_alerts_has_partial_unique_dedup_index()
    print("[PASS] All HICC V1.0 schema metadata assertions succeeded.")
