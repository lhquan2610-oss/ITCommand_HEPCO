"""
Initial Database Seed Script for HEPCO IT COMMAND CENTER (HICC V1.0).
Populates reference catalogs ONLY (Device Types, HEPCO Departments, Default Alert Rules,
System Settings, and Initial Admin Account).
Does NOT insert any fake or mock network devices.
"""

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models import (  # noqa: E402
    AlertRule,
    AlertSeverity,
    AlertType,
    Department,
    DeviceType,
    DeviceTypeCode,
    SystemSetting,
    User,
    UserRole,
)

DEFAULT_DEPARTMENTS = [
    {"code": "CNTT", "name": "Bộ phận Công nghệ Thông tin", "location": "Văn phòng Công ty HEPCO"},
    {"code": "BGĐ", "name": "Ban Giám đốc", "location": "Văn phòng Công ty HEPCO"},
    {"code": "TCKT", "name": "Phòng Tài chính Kế toán", "location": "Văn phòng Công ty HEPCO"},
    {"code": "TCHC", "name": "Phòng Tổ chức Hành chính", "location": "Văn phòng Công ty HEPCO"},
    {"code": "KHKD", "name": "Phòng Kế hoạch Kinh doanh", "location": "Văn phòng Công ty HEPCO"},
    {"code": "KTAT", "name": "Phòng Kỹ thuật - An toàn", "location": "Văn phòng Công ty HEPCO"},
]

DEFAULT_DEVICE_TYPES = [
    {
        "code": DeviceTypeCode.WORKSTATION.value,
        "name": "Máy tính / Laptop",
        "icon_name": "Monitor",
        "default_offline_threshold": 3,
        "description": "Máy tính để bàn và Laptop làm việc của cán bộ nhân viên",
    },
    {
        "code": DeviceTypeCode.PRINTER.value,
        "name": "Máy in mạng",
        "icon_name": "Printer",
        "default_offline_threshold": 3,
        "description": "Máy in và máy photocopy kết nối mạng LAN",
    },
    {
        "code": DeviceTypeCode.SWITCH.value,
        "name": "Switch mạng",
        "icon_name": "Network",
        "default_offline_threshold": 2,
        "description": "Thiết bị chuyển mạch L2/L3 trong hạ tầng mạng LAN",
    },
    {
        "code": DeviceTypeCode.CAMERA.value,
        "name": "Camera IP / NVR",
        "icon_name": "Video",
        "default_offline_threshold": 3,
        "description": "Camera giám sát an ninh hỗ trợ ONVIF/RTSP và đầu ghi hình",
    },
    {
        "code": DeviceTypeCode.SERVER.value,
        "name": "Máy chủ (Server)",
        "icon_name": "Server",
        "default_offline_threshold": 2,
        "description": "Máy chủ vật lý và máy chủ ảo hóa nội bộ",
    },
    {
        "code": DeviceTypeCode.ROUTER.value,
        "name": "Router / Firewall",
        "icon_name": "Shield",
        "default_offline_threshold": 2,
        "description": "Thiết bị định tuyến và tường lửa biên",
    },
    {
        "code": DeviceTypeCode.ACCESS_POINT.value,
        "name": "Bộ phát Wi-Fi (AP)",
        "icon_name": "Wifi",
        "default_offline_threshold": 3,
        "description": "Điểm truy cập mạng không dây nội bộ",
    },
    {
        "code": DeviceTypeCode.UNKNOWN.value,
        "name": "Chưa xác định",
        "icon_name": "HelpCircle",
        "default_offline_threshold": 3,
        "description": "Thiết bị chưa đủ dữ liệu nhận diện (Confidence < 60%)",
    },
]

DEFAULT_ALERT_RULES = [
    {
        "code": "RULE_NEW_DEVICE",
        "name": "Phát hiện thiết bị mới xuất hiện trên mạng LAN",
        "alert_type": AlertType.NEW_DEVICE.value,
        "severity": AlertSeverity.WARNING.value,
        "threshold_count": 1,
        "cooldown_minutes": 60,
        "auto_resolve": False,
    },
    {
        "code": "RULE_DEVICE_OFFLINE",
        "name": "Thiết bị mất kết nối vượt ngưỡng kiểm tra liên tiếp",
        "alert_type": AlertType.DEVICE_OFFLINE.value,
        "severity": AlertSeverity.HIGH.value,
        "threshold_count": 3,
        "cooldown_minutes": 15,
        "auto_resolve": True,
    },
    {
        "code": "RULE_IP_CONFLICT",
        "name": "Phát hiện xung đột địa chỉ IP (Nhiều MAC dùng chung 1 IP)",
        "alert_type": AlertType.IP_CONFLICT.value,
        "severity": AlertSeverity.CRITICAL.value,
        "threshold_count": 1,
        "cooldown_minutes": 10,
        "auto_resolve": False,
    },
    {
        "code": "RULE_IP_CHANGED",
        "name": "Thiết bị thay đổi địa chỉ IP",
        "alert_type": AlertType.IP_CHANGED.value,
        "severity": AlertSeverity.INFO.value,
        "threshold_count": 1,
        "cooldown_minutes": 30,
        "auto_resolve": True,
    },
    {
        "code": "RULE_MAC_ANOMALY",
        "name": "Thay đổi địa chỉ MAC bất thường trên thiết bị cố định",
        "alert_type": AlertType.MAC_ANOMALY.value,
        "severity": AlertSeverity.HIGH.value,
        "threshold_count": 1,
        "cooldown_minutes": 30,
        "auto_resolve": False,
    },
    {
        "code": "RULE_SNMP_UNREACHABLE",
        "name": "Thiết bị Switch/Máy in không phản hồi truy vấn SNMP",
        "alert_type": AlertType.SNMP_UNREACHABLE.value,
        "severity": AlertSeverity.WARNING.value,
        "threshold_count": 3,
        "cooldown_minutes": 30,
        "auto_resolve": True,
    },
    {
        "code": "RULE_CAMERA_UNREACHABLE",
        "name": "Camera IP mất kết nối dịch vụ ONVIF/RTSP",
        "alert_type": AlertType.CAMERA_UNREACHABLE.value,
        "severity": AlertSeverity.HIGH.value,
        "threshold_count": 3,
        "cooldown_minutes": 15,
        "auto_resolve": True,
    },
]

DEFAULT_SYSTEM_SETTINGS = [
    {
        "key": "scanner.status_check_interval_sec",
        "value": {"seconds": 60, "min": 30, "max": 300},
        "category": "SCANNER",
        "description": "Chu kỳ kiểm tra trạng thái Online/Offline (30-60 giây)",
    },
    {
        "key": "scanner.discovery_interval_sec",
        "value": {"seconds": 300},
        "category": "SCANNER",
        "description": "Chu kỳ quét phát hiện thiết bị mới (5 phút)",
    },
    {
        "key": "scanner.snmp_poll_interval_sec",
        "value": {"seconds": 300},
        "category": "SCANNER",
        "description": "Chu kỳ thu thập thông số SNMP từ Switch và Máy in (5 phút)",
    },
    {
        "key": "scanner.full_scan_interval_sec",
        "value": {"seconds": 900},
        "category": "SCANNER",
        "description": "Chu kỳ quét toàn diện Full Discovery Scan (15 phút)",
    },
    {
        "key": "scanner.hostname_refresh_interval_sec",
        "value": {"seconds": 1800},
        "category": "SCANNER",
        "description": "Chu kỳ làm mới Hostname qua DNS/NetBIOS/mDNS (30 phút)",
    },
    {
        "key": "retention.observations_days",
        "value": {"days": 30},
        "category": "RETENTION",
        "description": "Số ngày lưu trữ dữ liệu quan sát chi tiết từng phút (device_observations)",
    },
    {
        "key": "retention.events_days",
        "value": {"days": 365},
        "category": "RETENTION",
        "description": "Số ngày lưu trữ nhật ký sự kiện và cảnh báo",
    },
]


def seed_reference_data(session: Session) -> None:
    """Idempotently inserts reference catalogs into PostgreSQL."""
    for dept_data in DEFAULT_DEPARTMENTS:
        existing = session.scalar(select(Department).where(Department.code == dept_data["code"]))
        if not existing:
            session.add(Department(**dept_data))

    for dtype_data in DEFAULT_DEVICE_TYPES:
        existing = session.scalar(select(DeviceType).where(DeviceType.code == dtype_data["code"]))
        if not existing:
            session.add(DeviceType(**dtype_data))

    for rule_data in DEFAULT_ALERT_RULES:
        existing = session.scalar(select(AlertRule).where(AlertRule.code == rule_data["code"]))
        if not existing:
            session.add(AlertRule(**rule_data))

    for setting_data in DEFAULT_SYSTEM_SETTINGS:
        existing = session.scalar(select(SystemSetting).where(SystemSetting.key == setting_data["key"]))
        if not existing:
            session.add(SystemSetting(**setting_data))

    session.flush()

    # Create initial Admin user if not exists (Password must be rotated on first login)
    admin_user = session.scalar(select(User).where(User.username == "admin"))
    if not admin_user:
        cntt_dept = session.scalar(select(Department).where(Department.code == "CNTT"))
        initial_hash = os.getenv(
            "INITIAL_ADMIN_PASSWORD_HASH",
            "$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_ROTATE_ON_DEPLOY",
        )
        session.add(
            User(
                username="admin",
                email="cntt@hepco.com.vn",
                full_name="Quản trị viên Hệ thống HICC",
                password_hash=initial_hash,
                role=UserRole.ADMIN.value,
                department_id=cntt_dept.id if cntt_dept else None,
                is_active=True,
            )
        )

    session.commit()


def main() -> None:
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://hicc_user:hicc_password@localhost:5432/hicc_db",
    )
    engine = create_engine(database_url)
    with Session(engine) as session:
        seed_reference_data(session)
    print("[HICC Seed] Reference catalogs initialized successfully.")


if __name__ == "__main__":
    main()
