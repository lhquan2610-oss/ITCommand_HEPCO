# HEPCO IT COMMAND CENTER (HICC V1.0)

**Hệ thống Quản lý, Giám sát và Kiểm kê Thiết bị CNTT Nội bộ (On-Premise Network Inventory & Monitoring System)**  
**Đơn vị sử dụng:** Công ty Cổ phần Môi trường và Công trình Đô thị Huế (HEPCO) – Bộ phận CNTT  
**Môi trường triển khai:** Internal LAN / On-premise  

---

## 1. Giới thiệu Tổng quan

**HICC V1.0** là nền tảng giám sát hạ tầng mạng và kiểm kê tài sản CNTT tập trung được thiết kế chuyên biệt cho môi trường mạng nội bộ của HEPCO (quy mô 100–150 thiết bị ban đầu, mở rộng 500–1.000 thiết bị).

### Năng lực cốt lõi:
- **Kiểm kê tự động Agentless:** Phát hiện thiết bị đang kết nối LAN (Máy tính/Laptop, Máy in mạng, Switch, Camera IP) mà không cần cài đặt phần mềm lên máy trạm.
- **Giám sát đa giao thức chính xác:** Kết hợp **ARP (Layer 2) + ICMP Ping + Targeted TCP Service Probe + SNMPv3/v2c + ONVIF** để xác định trạng thái Online/Offline thực tế, loại bỏ cảnh báo giả trên máy tính Windows chặn Ping.
- **Định danh bền vững bằng UUID:** Lưu đầy đủ lịch sử thay đổi IP và MAC (`device_interfaces`), phát hiện tức thời xung đột IP (`IP_CONFLICT`) và thiết bị lạ mới xuất hiện (`NEW_DEVICE`).
- **Bảo toàn dữ liệu Quản trị Tài sản (Two-Plane Reconciliation):** Các trường quản lý do nhân viên CNTT nhập (Mã tài sản, Phòng ban, Người sử dụng, Vị trí lắp đặt, Ghi chú) được tách biệt hoàn toàn và **không bao giờ bị lần quét tiếp theo ghi đè**.

---

## 2. Cấu trúc Thư mục Dự án

```text
HEPCO-IT-COMMAND-CENTER/
├── docs/                               # Bộ 09 tài liệu kỹ thuật & kiến trúc (Tiếng Việt)
│   ├── 01_PROJECT_OVERVIEW.md          # Tổng quan dự án, mục tiêu và phạm vi
│   ├── 02_SYSTEM_ARCHITECTURE.md       # Kiến trúc hệ thống & luồng dữ liệu
│   ├── 03_DATABASE_DESIGN.md           # Thiết kế PostgreSQL, ERD & chính sách lưu trữ
│   ├── 04_NETWORK_SCANNER_DESIGN.md    # Thiết kế chi tiết 7 module Scanner Engine
│   ├── 05_API_SPECIFICATION.md         # Đặc tả RESTful API & WebSocket
│   ├── 06_SECURITY_DESIGN.md           # Thiết kế bảo mật, phân quyền RBAC & mã hóa
│   ├── 07_DEPLOYMENT_GUIDE.md          # Hướng dẫn triển khai Docker/Ubuntu & Backup/Restore
│   ├── 08_TEST_PLAN.md                 # Kế hoạch kiểm thử & tiêu chí nghiệm thu
│   └── 09_DEVELOPMENT_ROADMAP.md       # Lộ trình triển khai & danh sách thông tin cần cấp
├── backend/                            # FastAPI + SQLAlchemy 2.0 + Pydantic Backend
│   ├── app/
│   │   ├── api/v1/                     # REST API & WebSocket Routers
│   │   ├── core/                       # Cấu hình, Bảo mật JWT/Argon2, Mã hóa Fernet
│   │   ├── models/                     # SQLAlchemy 2.0 ORM Models (17 bảng)
│   │   ├── schemas/                    # Pydantic v2 Schemas
│   │   └── services/                   # Dịch vụ nghiệp vụ & Alert Engine
│   └── requirements.txt
├── scanner/                            # Standalone Network Scanner Engine (CLI & Worker)
│   ├── hicc_scanner/                   # ARP, ICMP, TCP, DNS/NetBIOS, SNMP, ONVIF, Fingerprinter
│   └── requirements.txt
├── frontend/                           # React + TypeScript + Vite + Tailwind + shadcn/ui
├── database/                           # Quản lý Migration & Seed dữ liệu chuẩn
│   ├── alembic.ini                     # Cấu hình Alembic
│   ├── migrations/                     # Lịch sử phiên bản schema PostgreSQL
│   └── seeds/                          # Kịch bản nạp danh mục chuẩn (không chứa mock data)
├── deployment/                         # Cấu hình Nginx Reverse Proxy, Dockerfiles, Systemd
├── tests/                              # Unit Tests & Integration Tests
├── scripts/                            # Kịch bản sao lưu (backup_db.sh) & phục hồi (restore_db.sh)
├── .env.example                        # Mẫu biến môi trường chuẩn
├── .gitignore
├── docker-compose.yml                  # Điều phối triển khai On-premise
└── README.md
```

---

## 3. Trạng thái Triển khai Hiện tại

- **[HOÀN THÀNH] PHASE 0:** Khởi tạo cấu trúc Repository chuẩn và hoàn thiện đầy đủ 09 tài liệu kỹ thuật chuyên sâu trong thư mục `docs/`.
- **[HOÀN THÀNH] PHASE 1:** Thiết kế ERD PostgreSQL, xây dựng đầy đủ SQLAlchemy 2.0 Models, Alembic Migration ban đầu (`20261105_0001_initial_hicc_schema.py`), kịch bản Seed danh mục (`initial_seed.py`) và kiểm thử cấu trúc Schema.
- **[CHỜ DUYỆT CHUYỂN GIAI ĐOẠN] PHASE 2:** Xây dựng Scanner Engine độc lập chạy qua CLI và kiểm thử trên mạng LAN được phê duyệt.
- **[CHƯA TRIỂN KHAI] PHASE 3 – 5:** Device Inventory API, Alert Engine và Frontend Dashboard (chỉ thực hiện sau khi Scanner Engine được kiểm thử ổn định).
