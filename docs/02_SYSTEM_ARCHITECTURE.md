# 02. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Tài liệu này mô tả chi tiết kiến trúc tổng thể, sự phân tách giữa các phân hệ, luồng dữ liệu thời gian thực và cơ chế đối soát định danh thiết bị của hệ thống **HEPCO IT COMMAND CENTER (HICC V1.0)**.

---

## 1. Sơ đồ Kiến trúc Tổng thể (High-Level Architecture)

Hệ thống HICC V1.0 được thiết kế theo kiến trúc **Modular Monolith kết hợp Standalone Worker Engine**, đóng gói và vận hành hoàn toàn trên hạ tầng máy chủ nội bộ (On-Premise Server) của HEPCO.

```mermaid
flowchart TB
    subgraph LAN["Mạng Nội Bộ HEPCO (Approved LAN Subnets)"]
        PC["Máy tính / Laptop\n(ICMP, TCP 135/445, NetBIOS)"]
        PRN["Máy in mạng\n(TCP 9100/515/631, SNMP)"]
        SW["Switch quản trị\n(SNMPv3/v2c, LLDP/ARP Table)"]
        CAM["Camera IP\n(ONVIF UDP 3702, RTSP 554, HTTP)"]
    end

    subgraph HICC_HOST["Máy Chủ Nội Bộ HICC (Ubuntu Server 24.04 LTS)"]
        subgraph SCANNER_LAYER["Phân hệ Scanner Engine (Python 3.12 Independent CLI / Worker)"]
            SCHED["APScheduler / Job Runner"]
            GUARD["Subnet Guard\n(Kiểm tra phạm vi phê duyệt)"]
            DISC["Discovery Modules\n(ARP, ICMP, TCP, DNS/NetBIOS)"]
            PROTO["Protocol Collectors\n(PySNMP v3/v2c, ONVIF Probe)"]
            FP["Fingerprinting & Confidence Engine"]
            RECON["Identity Reconciliation\n& Alert Evaluator"]
        end

        subgraph DATA_LAYER["Tầng Lưu Trữ Dữ Liệu"]
            PG[("PostgreSQL 16\n(Asset, History, Metrics, Alerts)")]
        end

        subgraph BACKEND_LAYER["Phân hệ Backend API (FastAPI + SQLAlchemy 2.0)"]
            REST["RESTful API v1\n(Auth, Inventory, Subnets, Reports)"]
            WS["WebSocket Hub\n(Real-time Status & Alert Push)"]
            SEC["Security & RBAC Middleware\n(JWT + Argon2 + Audit Logger)"]
        end

        subgraph FRONTEND_LAYER["Phân hệ Giao diện & Reverse Proxy"]
            NGINX["Nginx Reverse Proxy\n(TLS Termination, Static Hosting)"]
            UI["React 19 + TypeScript + Vite\n(Tailwind CSS, shadcn/ui, Recharts)"]
        end
    end

    USER["Nhân sự CNTT / Quản trị viên HEPCO"]

    SCHED --> GUARD
    GUARD -->|Chỉ quét Subnet hợp lệ| DISC
    DISC <-->|Gói tin L2/L3/L4| LAN
    PROTO <-->|SNMP / ONVIF| LAN
    DISC --> FP
    PROTO --> FP
    FP --> RECON
    RECON -->|Ghi nhận kết quả & Cảnh báo| PG
    RECON -->|Thông báo sự kiện mới| WS

    PG <--> REST
    SEC --> REST
    REST <--> NGINX
    WS <--> NGINX
    UI <--> NGINX
    USER -->|HTTPS Nội bộ| NGINX
```

---

## 2. Chi tiết Các Phân hệ Kỹ thuật

### 2.1. Phân hệ Scanner Engine (`scanner/`)
- **Đặc tính cốt lõi:** Hoạt động hoàn toàn độc lập với Frontend và có thể thực thi trực tiếp qua giao diện dòng lệnh (`python -m hicc_scanner.cli ...`) hoặc chạy nền theo lịch trình (`APScheduler`).
- **Tách biệt tiến trình:** Scanner Engine kết nối trực tiếp vào PostgreSQL thông qua tầng Repository chuẩn hóa và gửi thông báo sự kiện sang Backend qua kênh `PostgreSQL LISTEN/NOTIFY` hoặc Internal Webhook. Nhờ đó, ngay cả khi Web Server bảo trì, tiến trình giám sát mạng và ghi nhận lịch sử vẫn không bị gián đoạn.
- **Quyền hạn hệ điều hành:** Container hoặc dịch vụ chạy Scanner được cấp quyền tối thiểu `CAP_NET_RAW` và `CAP_NET_ADMIN` trên Linux để gửi gói tin ARP/ICMP thô mà không cần chạy toàn bộ hệ thống dưới quyền `root` không kiểm soát.

### 2.2. Phân hệ Cơ sở dữ liệu (`database/` – PostgreSQL 16)
- Sử dụng các kiểu dữ liệu chuyên biệt cho hạ tầng mạng của PostgreSQL như `INET` (địa chỉ IP), `CIDR` (dải mạng Subnet), `MACADDR` (địa chỉ vật lý MAC) và `JSONB` (lưu trữ linh hoạt danh sách cổng mở, thông số mở rộng SNMP/ONVIF).
- Quản lý phiên bản lược đồ (Schema Versioning) chặt chẽ bằng **Alembic**.

### 2.3. Phân hệ Backend API (`backend/` – FastAPI)
- Cung cấp các API bất đồng bộ (`async/await`) hiệu năng cao với thời gian phản hồi mục tiêu dưới 200ms cho các truy vấn thông thường và dưới 2 giây cho các truy vấn tổng hợp Dashboard.
- Tích hợp **Pydantic v2** để kiểm tra kiểu dữ liệu đầu vào/đầu ra nghiêm ngặt.
- Cung cấp **WebSocket Endpoint (`/api/v1/ws/events`)** giúp đẩy trạng thái thiết bị vừa Online/Offline hoặc cảnh báo khẩn cấp lên màn hình điều hành ngay khi phát hiện.

### 2.4. Phân hệ Frontend Dashboard (`frontend/` – React + TypeScript)
- Thiết kế theo chuẩn **Desktop-First Dark Mode** mang màu sắc nhận diện thương hiệu HEPCO (Xanh môi trường kết hợp Cyan kỹ thuật).
- Chỉ kết nối dữ liệu thực từ REST API và WebSocket; không chứa bất kỳ mảng dữ liệu mẫu cố định nào trong mã nguồn giao diện.

---

## 3. Luồng Xử lý Dữ liệu và Đối soát Định danh (Data & Identity Flow)

Một trong những bài toán kiến trúc quan trọng nhất của HICC V1.0 là: **Làm sao nhận diện đúng một thiết bị khi IP thay đổi, và làm sao không ghi đè dữ liệu do nhân viên CNTT đã nhập?**

```mermaid
sequenceDiagram
    participant S as Scanner Engine
    participant G as Subnet Guard
    participant N as Mạng LAN HEPCO
    participant R as Reconciliation Engine
    participant DB as PostgreSQL
    participant A as Alert Engine

    S->>DB: 1. Tải danh sách Subnet có is_approved = true & is_active = true
    S->>G: 2. Kiểm tra CIDR mục tiêu (Chặn tuyệt đối Public IP / Unapproved Subnet)
    G->>N: 3. Thực thi ARP Scan + ICMP Ping + Targeted TCP Probe
    N-->>S: 4. Phản hồi (IP, MAC, Latency, Open Ports, Hostname, SNMP/ONVIF)
    S->>R: 5. Chuyển hồ sơ quan sát thô (Raw Observation)
    R->>DB: 6. Tìm kiếm thiết bị theo ưu tiên: (1) MAC Address -> (2) SNMP Serial/SysName -> (3) Hostname cố định -> (4) IP hiện hành
    alt Thiết bị chưa từng tồn tại
        R->>DB: Tạo bản ghi `devices` mới (status=ONLINE, is_new=true) + `device_interfaces`
        R->>A: Kích hoạt cảnh báo NEW_DEVICE_DETECTED
    else Thiết bị đã tồn tại nhưng đổi IP
        R->>DB: Cập nhật `device_interfaces` (đánh dấu IP cũ is_current=false, thêm IP mới is_current=true)
        R->>DB: Chỉ cập nhật trường kỹ thuật (`last_seen`, `status`, `discovered_*`), GIỮ NGUYÊN trường quản lý (`department_id`, `assigned_user`, `location`, `notes`)
        R->>A: Kích hoạt cảnh báo IP_CHANGED
    else Phát hiện 1 IP trả về 2 MAC khác nhau trong cửa sổ ngắn
        R->>DB: Ghi nhận sự kiện `IP_CONFLICT` vào `device_events`
        R->>A: Kích hoạt cảnh báo nghiêm trọng IP_CONFLICT (Severity: CRITICAL)
    end
    R->>DB: 7. Lưu bản ghi `device_observations` và cập nhật `scan_jobs`
```

---

## 4. Cơ chế Tách biệt Dữ liệu Tự động và Dữ liệu Quản trị (Two-Plane Data Model)

Để đảm bảo nguyên tắc **"Lần quét tiếp theo không được ghi đè trường quản lý thủ công"**, bảng `devices` và logic cập nhật được thiết kế chia làm 2 mặt phẳng dữ liệu rõ rệt:

| Nhóm trường dữ liệu | Các cột tiêu biểu trong Database | Quyền ghi của Scanner Engine | Quyền ghi của Nhân viên CNTT |
| :--- | :--- | :--- | :--- |
| **Mặt phẳng Khám phá Tự động (Discovery Plane)** | `discovered_hostname`, `discovered_os`, `manufacturer`, `discovered_model`, `device_type_confidence`, `status`, `first_seen`, `last_seen`, `consecutive_failures` | **Có** (Cập nhật tự động mỗi chu kỳ quét) | Chỉ xem (Hoặc xác nhận chuyển thành dữ liệu chuẩn) |
| **Mặt phẳng Quản trị Tài sản (Management Plane)** | `device_code` (Mã TS), `display_name`, `department_id`, `assigned_user`, `location`, `notes`, `is_type_locked`, `is_authorized` | **KHÔNG** (Tuyệt đối không chạm tới khi thiết bị đã tồn tại) | **Có** (Cập nhật qua giao diện Inventory) |

> [!IMPORTANT]
> Khi cờ `is_type_locked = TRUE` (nhân viên CNTT đã xác nhận thủ công loại thiết bị là Máy in, Switch, Camera hoặc Máy tính), bộ phân loại tự động (Fingerprinting Engine) sẽ vẫn tính toán kết quả trong log quét nhưng **không tự động thay đổi** `device_type_id` của thiết bị đó nữa.

---

## 5. Chiến lược Mở rộng (Scalability: 150 -> 1.000 Thiết bị)

- **Từ 100 – 150 thiết bị (Quy mô ban đầu):** Một tiến trình Scanner Worker bất đồng bộ (`asyncio` + `scapy`/`nmap` worker pool) quét một dải `/24` hoàn tất trong khoảng 20–45 giây với mức tiêu thụ tài nguyên rất thấp (< 1 vCPU, < 512MB RAM).
- **Mở rộng lên 500 – 1.000 thiết bị (Nhiều VLAN / Subnet):**
  - Thiết kế bảng `network_subnets` cho phép cấu hình chu kỳ quét riêng cho từng VLAN (ví dụ: VLAN Server/Switch quét mỗi 30 giây; VLAN Máy trạm văn phòng quét mỗi 60 giây).
  - Các bảng lịch sử lớn (`device_observations`, `snmp_metrics`) được đánh chỉ mục tổ hợp `(device_id, observed_at DESC)` và đi kèm tác vụ dọn dẹp/nén dữ liệu định kỳ (Data Retention Policy), đảm bảo truy vấn Dashboard luôn dưới 2 giây sau nhiều năm vận hành.
