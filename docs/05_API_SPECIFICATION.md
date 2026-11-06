# 05. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)

Tài liệu này định nghĩa chi tiết hệ thống RESTful API và WebSocket của **HEPCO IT COMMAND CENTER (HICC V1.0)** được xây dựng trên nền tảng **FastAPI (Python 3.12+)**, tuân thủ chuẩn OpenAPI 3.1.

---

## 1. Quy ước Chung (API Conventions)

- **Base URL:** `/api/v1`
- **Định dạng dữ liệu:** `application/json; charset=utf-8`
- **Định dạng Thời gian:** Chuẩn ISO 8601 có múi giờ (`2026-11-05T15:30:00+07:00`).
- **Xác thực (Authentication):** Sử dụng `Bearer <JWT_ACCESS_TOKEN>` trong HTTP Header `Authorization`.
- **Cấu trúc Phản hồi Danh sách (Pagination Standard):**
  ```json
  {
    "data": [ ... ],
    "meta": {
      "total": 142,
      "page": 1,
      "limit": 20,
      "total_pages": 8
    }
  }
  ```
- **Cấu trúc Phản hồi Lỗi Chuẩn hóa (Standard Error Format):**
  ```json
  {
    "error_code": "SUBNET_NOT_APPROVED",
    "message": "Dải mạng 192.168.99.0/24 chưa được phê duyệt để thực hiện quét.",
    "details": {
      "cidr": "192.168.99.0/24"
    },
    "timestamp": "2026-11-05T15:30:00+07:00"
  }
  ```

---

## 2. Danh mục Endpoint Chi tiết theo Phân hệ

### 2.1. Xác thực & Quản lý Phiên (`Auth` – `/api/v1/auth`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public (LAN) | Đăng nhập bằng `username` và `password`; trả về `access_token`, `refresh_token` và thông tin vai trò (`admin`/`it`/`viewer`). Ghi nhận vào `audit_logs`. |
| `POST` | `/api/v1/auth/refresh` | Authenticated | Cấp lại `access_token` mới từ `refresh_token` hợp lệ. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Thu hồi phiên đăng nhập hiện tại và ghi nhật ký kiểm toán. |
| `GET` | `/api/v1/auth/me` | `viewer` | Lấy thông tin hồ sơ người dùng đang đăng nhập. |
| `PUT` | `/api/v1/auth/change-password` | `viewer` | Đổi mật khẩu cá nhân (kiểm tra độ mạnh mật khẩu và băm Argon2id). |

---

### 2.2. Tổng quan Điều hành (`Dashboard` – `/api/v1/dashboard`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary` | `viewer` | Trả về số liệu tổng hợp thực tế: Tổng thiết bị, số lượng `ONLINE`, `OFFLINE`, `UNKNOWN`, thiết bị mới (`is_new=true`), tổng cảnh báo đang mở theo mức độ, thông tin phiên quét gần nhất. |
| `GET` | `/api/v1/dashboard/status-distribution` | `viewer` | Thống kê phân bổ trạng thái theo từng loại thiết bị (Máy tính, Máy in, Switch, Camera, Chưa xác định) để vẽ biểu đồ Recharts. |
| `GET` | `/api/v1/dashboard/recent-activity` | `viewer` | Danh sách 10 thiết bị vừa mất kết nối, 10 thiết bị mới xuất hiện và 10 sự kiện biến động IP/MAC gần nhất. |

---

### 2.3. Kiểm kê & Quản lý Thiết bị (`Devices` – `/api/v1/devices`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/devices` | `viewer` | Lấy danh sách thiết bị có phân trang; hỗ trợ tìm kiếm theo `ip`, `mac`, `hostname`, `device_code`, `assigned_user` và lọc theo `device_type`, `status`, `department_id`, `subnet_id`, `is_new`. |
| `GET` | `/api/v1/devices/{device_id}` | `viewer` | Xem hồ sơ chi tiết 1 thiết bị kèm danh sách giao diện mạng hiện hành (`device_interfaces`), thông số SNMP/ONVIF mới nhất. |
| `POST` | `/api/v1/devices` | `it` | Khai báo trước một thiết bị vào danh mục tài sản (trước hoặc sau khi cắm vào mạng). |
| `PATCH` | `/api/v1/devices/{device_id}/management` | `it` | **Cập nhật thông tin Quản trị Tài sản:** `device_code`, `display_name`, `department_id`, `assigned_user`, `location`, `notes`, `device_type_id` (tự động bật `is_type_locked = true`), `is_authorized`, `is_new = false`. |
| `GET` | `/api/v1/devices/{device_id}/interfaces` | `viewer` | Xem toàn bộ lịch sử thay đổi IP và MAC của thiết bị từ lúc `first_seen` đến nay. |
| `GET` | `/api/v1/devices/{device_id}/observations` | `viewer` | Lấy chuỗi thời gian độ trễ (`latency_ms`), `packet_loss` và trạng thái của thiết bị (lọc theo 24h, 7 ngày, 30 ngày). |
| `GET` | `/api/v1/devices/{device_id}/events` | `viewer` | Xem nhật ký vòng đời thiết bị (`device_events`). |
| `POST` | `/api/v1/devices/{device_id}/probe` | `it` | Kích hoạt kiểm tra kết nối tức thời (On-demand Ping + TCP + SNMP/ONVIF) cho riêng 1 thiết bị. |

#### Ví dụ Payload Cập nhật Quản trị Thiết bị (`PATCH /api/v1/devices/{id}/management`):
```json
{
  "device_code": "HEPCO-PC-0108",
  "display_name": "Máy tính Kế toán Thanh toán 02",
  "device_type_code": "WORKSTATION",
  "lock_device_type": true,
  "department_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "assigned_user": "Nguyễn Thị Minh Châu",
  "location": "Phòng Tài chính Kế toán - Tầng 2",
  "is_authorized": true,
  "mark_reviewed": true,
  "notes": "Máy cài phần mềm MISA, cố định IP theo MAC trên DHCP"
}
```
> [!NOTE]
> Endpoint này chỉ cập nhật các cột thuộc **Management Plane** và ghi nhật ký vào `device_events` + `audit_logs`. Các tiến trình quét tự động của Scanner Engine tuyệt đối không ghi đè các trường này.

---

### 2.4. Tra cứu Nhanh IP & MAC (`Lookup` – `/api/v1/lookup`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lookup/ip/{ip_address}` | `viewer` | Tra cứu một địa chỉ IP: hiện tại đang gắn với thiết bị/MAC nào, và lịch sử trước đây những thiết bị nào từng sử dụng IP này. |
| `GET` | `/api/v1/lookup/mac/{mac_address}` | `viewer` | Tra cứu một địa chỉ MAC: thông tin hãng sản xuất OUI, thiết bị sở hữu, cổng Switch kết nối (nếu có) và lịch sử tất cả các IP mà MAC này từng nhận. |
| `GET` | `/api/v1/lookup/conflicts` | `viewer` | Danh sách các xung đột IP hoặc bất thường MAC đang diễn ra hoặc đã ghi nhận. |

---

### 2.5. Quản lý Dải mạng & Điều khiển Scanner (`Subnets & Scans` – `/api/v1/subnets`, `/api/v1/scans`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/subnets` | `viewer` | Danh sách các Subnet LAN được khai báo kèm trạng thái phê duyệt và thống kê số IP đang sử dụng. |
| `POST` | `/api/v1/subnets` | `admin` | Thêm mới một Subnet nội bộ (mặc định `is_approved = false` cho đến khi xác nhận). |
| `PATCH` | `/api/v1/subnets/{subnet_id}/approve` | `admin` | Phê duyệt hoặc thu hồi quyền quét trên một Subnet (`is_approved = true/false`). |
| `POST` | `/api/v1/scans/trigger` | `it` | Kích hoạt một phiên quét thủ công (`PING_SWEEP`, `ARP_DISCOVERY`, `FULL_DISCOVERY`) trên một Subnet đã được phê duyệt. |
| `GET` | `/api/v1/scans` | `viewer` | Lịch sử các phiên quét (`scan_jobs`) kèm thời gian chạy, số host phát hiện và trạng thái. |
| `GET` | `/api/v1/scans/{scan_job_id}/results` | `viewer` | Xem chi tiết kết quả thô (`scan_results`) của một phiên quét cụ thể. |

---

### 2.6. Quản lý Cảnh báo (`Alerts` – `/api/v1/alerts`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/alerts` | `viewer` | Danh sách cảnh báo lọc theo `status` (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`), `severity`, `alert_type`, `device_id`. |
| `POST` | `/api/v1/alerts/{alert_id}/acknowledge` | `it` | Tiếp nhận xử lý cảnh báo (cập nhật `status = ACKNOWLEDGED`, `acknowledged_by`, `acknowledged_at`). |
| `POST` | `/api/v1/alerts/{alert_id}/resolve` | `it` | Đóng cảnh báo sau khi đã khắc phục kèm ghi chú xử lý (`resolution_note`). |
| `GET` | `/api/v1/alert-rules` | `viewer` | Xem danh sách quy tắc sinh cảnh báo. |
| `PATCH` | `/api/v1/alert-rules/{rule_id}` | `admin` | Điều chỉnh ngưỡng kích hoạt (`threshold_count`), `cooldown_minutes` hoặc bật/tắt quy tắc. |

---

### 2.7. Báo cáo, Phòng ban, Người dùng & Cấu hình (`Reports, Admin & Settings`)

| Phương thức | Endpoint | Quyền tối thiểu | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/topology` | `viewer` | Lấy dữ liệu liên kết thiết bị thực tế (`device_relationships`) để hiển thị trên trang Network Map. |
| `GET` | `/api/v1/reports/inventory-export` | `viewer` | Xuất báo cáo kiểm kê thiết bị CNTT thực tế ra định dạng CSV / Excel theo phòng ban hoặc loại thiết bị. |
| `GET` | `/api/v1/departments` | `viewer` | Danh sách phòng ban HEPCO (Admin/IT có quyền thêm/sửa). |
| `GET` | `/api/v1/users` | `admin` | Quản lý danh sách tài khoản người dùng hệ thống. |
| `GET` | `/api/v1/audit-logs` | `admin` | Tra cứu nhật ký kiểm toán bảo mật hệ thống. |
| `GET` / `PUT` | `/api/v1/settings` | `admin` | Xem và cập nhật cấu hình chu kỳ quét, ngưỡng cảnh báo và thời gian lưu trữ dữ liệu. |

---

## 3. Giao thức Cập nhật Thời gian thực (WebSocket Specification)

- **Endpoint:** `ws://<server-host>/api/v1/ws/events?token=<JWT_ACCESS_TOKEN>`
- **Các loại Sự kiện Đẩy (Server-to-Client Events):**
  1. `SCAN_JOB_PROGRESS`: Cập nhật tiến độ phiên quét đang chạy (`RUNNING` -> `COMPLETED`).
  2. `DEVICE_STATUS_CHANGED`: Khi một thiết bị chuyển trạng thái (`ONLINE` <-> `OFFLINE`) hoặc thay đổi IP.
  3. `ALERT_CREATED` / `ALERT_UPDATED`: Khi có cảnh báo mới phát sinh hoặc được kỹ thuật viên tiếp nhận/xử lý.
- **Cơ chế Dự phòng (Fallback Polling):** Nếu kết nối WebSocket bị ngắt do cấu hình Proxy nội bộ, Frontend tự động chuyển sang cơ chế Polling định kỳ mỗi `15–30 giây` qua React Query để đảm bảo dữ liệu trên màn hình luôn được làm mới.
