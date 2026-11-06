# 06. THIẾT KẾ BẢO MẬT HỆ THỐNG (SECURITY DESIGN)

Tài liệu này quy định các nguyên tắc, kiến trúc và biện pháp kiểm soát an toàn thông tin cho hệ thống **HEPCO IT COMMAND CENTER (HICC V1.0)** khi triển khai và vận hành trong mạng nội bộ của HEPCO.

---

## 1. Nguyên tắc Bảo mật Cốt lõi (Security Principles)

1. **Tuân thủ Tuyệt đối Phạm vi Được Phê duyệt (Strict Scope Enforcement):**
   - Hệ thống **chỉ quét các Subnet nội bộ đã được phê duyệt (`is_approved = TRUE`)** trong cơ sở dữ liệu.
   - Chặn cứng ở tầng mã nguồn (`SubnetGuard`) đối với mọi dải IP Public (Internet), IP Loopback, Multicast hoặc các Subnet nội bộ chưa được cấp phép.
2. **Quét Thụ động & Thăm dò An toàn (Non-Intrusive Probing):**
   - **Tuyệt đối không thực hiện:** Khai thác lỗ hổng (Exploitation), dò mật khẩu (Brute-force), gửi gói tin dị dạng (Fuzzing/DoS), hoặc thực thi lệnh từ xa (Remote Code Execution) trên máy trạm và thiết bị mạng.
   - Không tự ý ghi hoặc thay đổi cấu hình (`SNMP SET` bị vô hiệu hóa hoàn toàn; chỉ sử dụng `SNMP GET` / `GETNEXT` / `GETBULK` ở chế độ Read-Only).
   - Không can thiệp vào cấu hình DHCP Server, Router, Switch, Firewall đang vận hành.
3. **Đặc quyền Tối thiểu (Principle of Least Privilege):**
   - Phân tách quyền hạn rõ ràng giữa tài khoản người dùng Web, tài khoản dịch vụ hệ điều hành chạy Scanner và tài khoản truy cập PostgreSQL.

---

## 2. Xác thực và Phân quyền Người dùng (Authentication & RBAC)

### 2.1. Bảo mật Mật khẩu và Phiên đăng nhập
- **Thuật toán băm mật khẩu:** Sử dụng **Argon2id** (`argon2-cffi`, cấu hình bộ nhớ `64 MB`, `iterations = 3`, `parallelism = 4`) hoặc **bcrypt** (`cost factor = 12`). Không bao giờ lưu mật khẩu dạng rõ (Plaintext) hoặc băm yếu (MD5/SHA1).
- **Cơ chế Token:**
  - `Access Token` (JWT ký bằng `HS256` với khóa bí mật tối thiểu 256-bit): Thời hạn ngắn (`30 phút`).
  - `Refresh Token`: Thời hạn `7 ngày`, có khả năng thu hồi khi người dùng đăng xuất hoặc khi Admin khóa tài khoản.
- **Chống dò mật khẩu đăng nhập (Rate Limiting):** Giới hạn tối đa `5 lần` đăng nhập sai liên tiếp trong `15 phút` trên cùng một địa chỉ IP hoặc tên tài khoản.

### 2.2. Ma trận Phân quyền (Role-Based Access Control - RBAC)

| Nhóm Chức năng / Thao tác | `viewer` (Chỉ xem) | `it` (Chuyên viên CNTT) | `admin` (Quản trị viên) |
| :--- | :---: | :---: | :---: |
| Xem Dashboard, Danh sách thiết bị, Lịch sử IP/MAC, Sơ đồ mạng | Được phép | Được phép | Được phép |
| Xuất báo cáo kiểm kê thiết bị (CSV / Excel) | Được phép | Được phép | Được phép |
| Cập nhật thông tin quản lý thiết bị (Phòng ban, Người dùng, Vị trí, Ghi chú) | Từ chối (`403`) | Được phép | Được phép |
| Tiếp nhận (`Acknowledge`) và Đóng (`Resolve`) cảnh báo | Từ chối (`403`) | Được phép | Được phép |
| Kích hoạt quét thủ công trên Subnet **đã được phê duyệt** | Từ chối (`403`) | Được phép | Được phép |
| Thêm mới / Phê duyệt / Khóa Subnet được phép quét (`network_subnets`) | Từ chối (`403`) | Từ chối (`403`) | **Chỉ Admin** |
| Quản lý thông tin xác thực SNMPv3 / SNMPv2c / ONVIF (`device_credentials`) | Từ chối (`403`) | Từ chối (`403`) | **Chỉ Admin** |
| Quản lý tài khoản người dùng & Xem nhật ký kiểm toán (`audit_logs`) | Từ chối (`403`) | Từ chối (`403`) | **Chỉ Admin** |
| Thay đổi cấu hình hệ thống & Chu kỳ quét (`system_settings`) | Từ chối (`403`) | Từ chối (`403`) | **Chỉ Admin** |

---

## 3. Bảo vệ Thông tin Xác thực Thiết bị (SNMP & ONVIF Secrets Protection)

Hệ thống cần lưu trữ thông tin xác thực để truy vấn Switch, Máy in và Camera IP. Để đảm bảo an toàn:
1. **Mã hóa dữ liệu nhạy cảm khi lưu trữ (Encryption at Rest):**
   - Các trường `encrypted_community`, `encrypted_auth_secret`, `encrypted_priv_secret` trong bảng `device_credentials` được mã hóa bằng thuật toán đối xứng **Fernet (AES-128-CBC kèm xác thực HMAC-SHA256)** thông qua thư viện `cryptography`.
   - Khóa giải mã chủ (`HICC_CREDENTIAL_MASTER_KEY`) được nạp từ biến môi trường bảo mật của máy chủ (`.env` với quyền `chmod 600`), tách biệt hoàn toàn khỏi cơ sở dữ liệu.
2. **Che giấu trên API và Giao diện (Secret Masking):**
   - Không có bất kỳ API nào trả ngược mật khẩu SNMP hoặc Community String ra chuỗi JSON cho Frontend. API chỉ trả về trạng thái `has_secret: true` và giao diện hiển thị `••••••••`.
3. **Ưu tiên Giao thức An toàn:**
   - Mặc định khuyến nghị và ưu tiên cấu hình **SNMPv3 (`authPriv` - SHA256/AES)**.
   - Giao thức **SNMPv2c** chỉ được sử dụng ở chế độ Read-Only cho các thiết bị nội bộ không hỗ trợ SNMPv3 và phải có xác nhận phê duyệt của Admin.

---

## 4. Giới hạn Quyền của Tiến trình Scanner trên Hệ điều hành

Khi triển khai trên Ubuntu Server 24.04 LTS hoặc Docker:
- Không chạy dịch vụ Web API với quyền `root`.
- Tiến trình Scanner cần tạo gói tin Raw Socket cho ARP và ICMP nên được cấp quyền hạt nhân tối thiểu thông qua Linux Capabilities:
  - Với Systemd Service: `AmbientCapabilities=CAP_NET_RAW CAP_NET_ADMIN`, `NoNewPrivileges=true`, chạy dưới tài khoản hệ thống riêng `hicc-scanner`.
  - Với Docker Compose: Sử dụng `cap_add: [NET_RAW, NET_ADMIN]` và `cap_drop: [ALL]`.

---

## 5. Nhật ký Kiểm toán (Audit Logging) và Sao lưu Khôi phục

### 5.1. Nhật ký Kiểm toán Bất biến (`audit_logs`)
Mọi sự kiện nhạy cảm sau đây đều bắt buộc ghi vào bảng `audit_logs` kèm theo `user_id`, `username`, `client_ip`, `old_values`, `new_values` và `created_at`:
- Đăng nhập thành công / Đăng nhập thất bại.
- Tạo mới, sửa đổi hoặc phê duyệt Subnet được phép quét.
- Kích hoạt lệnh quét mạng thủ công (qua API hoặc CLI).
- Chỉnh sửa thông tin quản trị của thiết bị (đổi phòng ban, người dùng, khóa loại thiết bị).
- Thêm/sửa hồ sơ xác thực SNMP/ONVIF.
- Tiếp nhận hoặc đóng cảnh báo an ninh/hạ tầng.

### 5.2. Chính sách Sao lưu Bảo mật (Secure Backup)
- Bản sao lưu cơ sở dữ liệu PostgreSQL (`pg_dump` định dạng nén `.dump`) được lưu tại phân vùng riêng với quyền truy cập giới hạn chỉ cho tài khoản quản trị máy chủ (`chmod 600`), đảm bảo dữ liệu kiểm kê hạ tầng mạng không bị rò rỉ.
