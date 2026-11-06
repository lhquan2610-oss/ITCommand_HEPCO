# 08. KẾ HOẠCH KIỂM THỬ VÀ TIÊU CHÍ NGHIỆM THU (TEST PLAN & ACCEPTANCE CRITERIA)

Tài liệu này xác lập kế hoạch kiểm thử toàn diện cho hệ thống **HEPCO IT COMMAND CENTER (HICC V1.0)** từ cấp độ Cơ sở dữ liệu (Phase 1), Scanner Engine độc lập (Phase 2), Quản lý tài sản & Cảnh báo (Phase 3–4) cho đến Dashboard thực tế (Phase 5).

---

## 1. Chiến lược và Nguyên tắc Kiểm thử

1. **Kiểm thử theo Cổng Giai đoạn (Stage-Gate Verification):**
   - **Cổng 1 (Database Gate):** Phải khởi tạo được toàn bộ bảng từ đầu qua Alembic Migration, nạp Seed thành công và vượt qua bài kiểm thử ràng buộc khóa ngoại/chống trùng lặp trước khi chạy Scanner.
   - **Cổng 2 (Scanner CLI Gate):** Scanner Engine phải chạy độc lập bằng CLI trên dải mạng LAN được HEPCO phê duyệt, nhận diện đúng thiết bị thực tế và ghi chính xác vào PostgreSQL trước khi xây dựng Dashboard.
   - **Cổng 3 (System & UI Gate):** Dashboard hiển thị khớp 100% với dữ liệu trong PostgreSQL, tốc độ phản hồi đạt chuẩn và không dùng bất kỳ dữ liệu giả nào.
2. **An toàn Hạ tầng trong Kiểm thử:**
   - Giai đoạn đầu kiểm thử trên **01 Subnet `/24` văn phòng hoặc VLAN thử nghiệm** đã được Trưởng bộ phận CNTT phê duyệt.
   - Theo dõi tải CPU của Switch và máy in mạng trong suốt quá trình quét thử nghiệm.

---

## 2. Danh mục Kịch bản Kiểm thử Chi tiết (Test Cases)

### 2.1. Nhóm Kiểm thử Cơ sở Dữ liệu & Bảo toàn Lịch sử (`TC-DB`)

| Mã TC | Tên kịch bản kiểm thử | Các bước thực hiện | Kết quả kỳ vọng (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **TC-DB-01** | Khởi tạo Database từ đầu bằng Alembic | Tạo DB trống -> Chạy `alembic upgrade head` -> Chạy `initial_seed.py`. | Khởi tạo đủ 16 bảng, đầy đủ Index, Unique Constraint, Check Constraint mà không phát sinh lỗi. |
| **TC-DB-02** | Kiểm tra chống ghi đè dữ liệu quản lý thủ công | 1. Scanner tạo thiết bị A.<br>2. IT gán `department_id`, `assigned_user`, `location`, `notes` và khóa `is_type_locked = true`.<br>3. Chạy lại Scanner lần 2 trên thiết bị A. | `last_seen`, `latency_ms` được cập nhật mới; nhưng `department_id`, `assigned_user`, `location`, `notes`, `device_type_id` **giữ nguyên 100%**. |
| **TC-DB-03** | Lưu lịch sử thay đổi IP và không xóa khi Offline | Thiết bị A đổi từ `IP_1` sang `IP_2`, sau đó tắt máy chuyển sang `OFFLINE`. | Bảng `device_interfaces` giữ cả `IP_1` (`is_current=false`) và `IP_2` (`is_current=true`). Hồ sơ thiết bị và lịch sử `device_observations` được giữ nguyên vẹn. |
| **TC-DB-04** | Sao lưu và Phục hồi Database | Chạy `backup_db.sh` -> Xóa thử DB -> Chạy `restore_db.sh`. | Khôi phục toàn vẹn 100% số lượng thiết bị, lịch sử quét và cấu hình. |

---

### 2.2. Nhóm Kiểm thử Scanner Engine trên Mạng LAN Thực tế (`TC-SCAN`)

| Mã TC | Tên kịch bản kiểm thử | Các bước thực hiện | Kết quả kỳ vọng (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **TC-SCAN-01** | Chặn quét Subnet chưa phê duyệt hoặc IP Internet | Chạy CLI quét `8.8.8.8/32` hoặc một Subnet nội bộ có `is_approved = false`. | Scanner từ chối thực thi ngay lập tức (`SubnetSecurityError`), không phát bất kỳ gói tin nào ra mạng, ghi log cảnh báo. |
| **TC-SCAN-02** | Phát hiện IP & MAC trong cùng LAN (ARP + ICMP) | Chạy CLI `arp-scan` và `ping-sweep` trên Subnet LAN được duyệt. | Phát hiện đúng 100% thiết bị đang bật trong cùng VLAN; thu thập đúng địa chỉ MAC và tên hãng sản xuất OUI. |
| **TC-SCAN-03** | Xử lý máy tính Windows chặn Ping (ICMP Blocked) | Chọn 01 máy tính Windows bật Firewall chặn ICMP nhưng vẫn mở mạng LAN. Chạy quét 4 chu kỳ liên tiếp. | Thiết bị vẫn được ghi nhận `ONLINE` (nhờ phản hồi ARP và cổng TCP 135/445), cột `icmp_blocked = true`, **không báo Offline giả**. |
| **TC-SCAN-04** | Thu thập Hostname thực tế | Chạy module Hostname Discovery trên dải máy trạm và máy in. | Thu thập đúng Computer Name qua Reverse DNS / NetBIOS / SNMP; nếu thiết bị không cung cấp tên thì để `NULL`, không tự sinh tên giả. |
| **TC-SCAN-05** | Thu thập SNMP từ Switch và Máy in | Cấu hình SNMP Read-only cho 01 Switch quản trị và 01 Máy in mạng -> Chạy `snmp-poll`. | Thu thập đúng `sysDescr`, `sysName`, `sysUpTime`, trạng thái các cổng Switch và tổng số trang in (`prtMarkerLifeCount`) của máy in. |
| **TC-SCAN-06** | Phát hiện Camera IP qua ONVIF / RTSP | Chạy `onvif-probe` trên VLAN/Subnet có Camera IP. | Phát hiện đúng các Camera IP đang hoạt động, phân loại chính xác vào nhóm `CAMERA` kèm điểm tin cậy `confidence_score >= 60`. |
| **TC-SCAN-07** | Phân loại `UNKNOWN` khi thiếu dữ liệu | Giả lập 01 thiết bị chỉ phản hồi Ping, đóng toàn bộ cổng TCP/SNMP/ONVIF và OUI không đặc trưng. | Hệ thống phân loại là `UNKNOWN` với `confidence_score < 60`, không tự suy đoán bừa là PC hay Camera. |

---

### 2.3. Nhóm Kiểm thử Biến động Mạng & Alert Engine (`TC-ALERT`)

| Mã TC | Tên kịch bản kiểm thử | Các bước thực hiện | Kết quả kỳ vọng (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **TC-ALERT-01** | Phát hiện Thiết bị Mới (`NEW_DEVICE`) | Kết nối 01 laptop/thiết bị chưa từng có trong DB vào LAN và chạy Discovery. | Tạo bản ghi thiết bị với `is_new = true`, sinh sự kiện `NEW_DEVICE` và tạo cảnh báo mới. |
| **TC-ALERT-02** | Ngưỡng Offline & Tự động Khôi phục | Rút dây mạng 01 thiết bị test qua 1 chu kỳ -> Cắm lại; sau đó rút hẳn qua 3 chu kỳ liên tiếp -> Cắm lại. | - Rút 1 chu kỳ: Chưa báo Offline (`consecutive_failures = 1`).<br>- Rút đủ 3 chu kỳ: Chuyển `OFFLINE`, phát cảnh báo `DEVICE_OFFLINE`.<br>- Cắm lại: Chuyển `ONLINE`, phát sự kiện `DEVICE_RECOVERED`. |
| **TC-ALERT-03** | Phát hiện Thay đổi IP (`IP_CHANGED`) | Đổi địa chỉ IP của 01 máy tính test (giữ nguyên MAC) sang IP mới trong cùng Subnet. | Nhận diện đúng vẫn là `device_id` (UUID) cũ, cập nhật IP mới vào `device_interfaces` (`is_current=true`), lưu lịch sử IP cũ và sinh cảnh báo `IP_CHANGED`. |
| **TC-ALERT-04** | Phát hiện Xung đột IP (`IP_CONFLICT`) | Cấu hình thử nghiệm 02 thiết bị test dùng trùng 01 địa chỉ IP tĩnh trong phòng Lab. | Phát hiện 2 địa chỉ MAC khác nhau phản hồi cùng 1 IP, sinh ngay cảnh báo mức `CRITICAL` (`IP_CONFLICT`). |
| **TC-ALERT-05** | Chống tạo Cảnh báo Trùng lặp (Deduplication) | Để 01 thiết bị ở trạng thái `OFFLINE` suốt 10 chu kỳ quét liên tiếp. | Chỉ có **duy nhất 01 bản ghi cảnh báo `OPEN`** cho sự cố đó, cột `occurrence_count` tăng lên `10`, không tạo ra 10 cảnh báo rác. |

---

### 2.4. Nhóm Kiểm thử Hiệu năng, Bảo mật & Nghiệm thu Tổng thể (`TC-PERF & TC-SEC`)

| Hạng mục Nghiệm thu | Chỉ tiêu Kỹ thuật Mục tiêu | Phương pháp Đo lường Thực tế |
| :--- | :--- | :--- |
| **Tốc độ truy vấn Dashboard** | `< 2.0 giây` (Mục tiêu `< 500ms`) | Đo thời gian phản hồi thực tế của API `/api/v1/dashboard/summary` với dữ liệu 150–1.000 thiết bị. |
| **Độ trễ cập nhật trạng thái** | `1 – 2 phút` | Đo thời gian từ lúc thiết bị ngắt kết nối vật lý (sau 3 chu kỳ kiểm tra 30–60s) đến khi hiển thị trên giao diện. |
| **Thời gian quét 01 Subnet `/24`** | Mục tiêu `30 – 60 giây` (trong điều kiện LAN tiêu chuẩn) | Ghi nhận tự động qua cột `duration_ms` trong bảng `scan_jobs` khi chạy thực tế tại mạng HEPCO. |
| **An toàn vận hành thiết bị** | `0%` gián đoạn | Kiểm tra hoạt động in ấn, truyền hình ảnh camera và lưu lượng switch trong 48 giờ chạy liên tục. |
| **Phân quyền Bảo mật (RBAC)** | Chặn `100%` truy cập trái phép | Dùng tài khoản `viewer` gọi API sửa thiết bị hoặc kích hoạt quét -> Phải nhận mã `403 Forbidden`. |
