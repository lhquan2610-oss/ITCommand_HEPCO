# 01. TỔNG QUAN DỰ ÁN: HEPCO IT COMMAND CENTER (HICC V1.0)

**Tên dự án:** HEPCO IT COMMAND CENTER  
**Tên viết tắt:** HICC  
**Phiên bản:** V1.0  
**Đơn vị sử dụng:** Công ty Cổ phần Môi trường và Công trình Đô thị Huế (HEPCO) – Bộ phận CNTT  
**Môi trường triển khai:** Internal LAN / On-premise  
**Ngày ban hành tài liệu:** 05/11/2026  

---

## 1. Bối cảnh và Bài toán Thực tế tại HEPCO

Công ty Cổ phần Môi trường và Công trình Đô thị Huế (HEPCO) vận hành hạ tầng CNTT nội bộ phục vụ công tác điều hành, quản lý nhân sự, kế toán, quản lý trạm thu phí, xe chuyên dụng và giám sát an ninh. Hạ tầng hiện tại có quy mô ban đầu từ **100–150 thiết bị mạng** và dự kiến mở rộng lên **500–1.000 thiết bị** trong các giai đoạn tiếp theo.

### Các thách thức hiện hữu của Bộ phận CNTT:
1. **Quản lý thủ công rời rạc:** Danh sách IP, địa chỉ MAC, máy tính, máy in mạng, switch và camera IP thường được theo dõi qua bảng tính tĩnh, dễ dẫn đến sai lệch khi DHCP cấp phát lại IP hoặc khi nhân sự di chuyển vị trí làm việc.
2. **Khó phát hiện thiết bị lạ (Shadow IT / Rogue Devices):** Thiết bị cá nhân hoặc bộ phát Wi-Fi tự phát cắm vào mạng LAN không được nhận diện tức thời, gây nguy cơ mất an toàn thông tin hoặc xung đột IP.
3. **Xung đột IP và thay đổi phần cứng âm thầm:** Khi xảy ra trùng lặp IP (IP Conflict) hoặc thay thế card mạng/thiết bị, việc truy vết lịch sử (`IP X trước đây thuộc về máy nào, từ bao giờ`) tốn nhiều thời gian.
4. **Phản ứng bị động khi sự cố xảy ra:** Khi một Switch nhánh, Máy in dùng chung hoặc Camera IP mất kết nối, Bộ phận CNTT thường chỉ biết khi người dùng phản ánh thay vì nhận cảnh báo chủ động.
5. **Độ nhiễu giám sát cao trên môi trường Windows:** Nhiều máy trạm Windows bật tường lửa chặn gói tin ICMP Echo (Ping), khiến các công cụ ping đơn thuần báo "Offline giả" dù máy vẫn đang làm việc bình thường.

---

## 2. Mục tiêu của Hệ thống HICC V1.0

HICC V1.0 được xây dựng như một **Hệ thống Quản lý, Giám sát và Kiểm kê Thiết bị CNTT Nội bộ (On-Premise Network Inventory & Monitoring System)** hoạt động thực tế trên mạng LAN của HEPCO, giải quyết triệt để 8 mục tiêu cốt lõi:

1. **Kiểm kê tự động thiết bị LAN:** Quét định kỳ và theo yêu cầu trên các dải mạng (Subnet) được phê duyệt để lập danh mục sống (Live Inventory).
2. **Phát hiện tức thời thiết bị mới:** Nhận diện ngay khi có địa chỉ MAC hoặc IP lần đầu xuất hiện trên mạng nội bộ.
3. **Định danh đa chiều:** Thu thập và đối chiếu IP, MAC Address, Nhà sản xuất phần cứng (OUI Vendor), Hostname (DNS/NetBIOS/mDNS/SNMP) và phân loại thiết bị đi kèm chỉ số độ tin cậy (Confidence Score).
4. **Theo dõi trạng thái Online/Offline chính xác:** Kết hợp đa giao thức (ARP + ICMP + TCP Probe + SNMP) để loại bỏ cảnh báo giả trên máy tính chặn Ping.
5. **Quản lý chuyên sâu 4 nhóm thiết bị trọng tâm:**
   - **Máy tính để bàn / Laptop** (Workstations)
   - **Máy in mạng** (Network Printers – theo dõi trạng thái in, cổng 9100/IPP/SNMP)
   - **Thiết bị chuyển mạch** (Network Switches – thu thập thông tin qua SNMPv3/v2c)
   - **Camera IP** (ONVIF / RTSP / HTTP quản trị)
6. **Phát hiện bất thường hạ tầng:** Cảnh báo tự động khi có xung đột IP (1 IP đi kèm >1 MAC trong một chu kỳ), biến động IP (DHCP Roaming), hoặc giả mạo/thay đổi MAC bất thường.
7. **Lưu trữ lịch sử toàn diện:** Ghi nhận đầy đủ lịch sử các phiên quét (`scan_jobs`), chuỗi thời gian độ trễ/trạng thái (`device_observations`), và nhật ký biến động vòng đời thiết bị (`device_events`).
8. **Bảo toàn dữ liệu Quản trị Tài sản CNTT (ITAM Reconciliation):** Tách biệt hoàn toàn dữ liệu kỹ thuật do Scanner tự động cập nhật và dữ liệu quản lý do chuyên viên CNTT nhập (Mã tài sản, Phòng ban, Người được giao, Vị trí lắp đặt, Ghi chú) — **cam kết 100% không ghi đè dữ liệu quản trị thủ công trong các chu kỳ quét tiếp theo**.

---

## 3. Phạm vi Hệ thống và Giới hạn Kỹ thuật (V1.0)

### 3.1. Trong phạm vi (In-Scope)
- Hoạt động hoàn toàn nội bộ (On-premise), không phụ thuộc kết nối Internet hay dịch vụ Cloud bên ngoài.
- Kiến trúc **Agentless 100%** trong phiên bản V1.0 (không yêu cầu cài đặt phần mềm Agent lên máy trạm của nhân viên).
- Quét và giám sát các Subnet IPv4 nội bộ được quản trị viên khai báo và bật cờ phê duyệt (`is_approved = TRUE`).
- Cung cấp CLI độc lập cho **Scanner Engine**, RESTful API + WebSocket qua **FastAPI**, cơ sở dữ liệu **PostgreSQL**, và giao diện điều hành **React TypeScript**.

### 3.2. Ngoài phạm vi và Giới hạn Minh bạch (Out-of-Scope & Explicit Boundaries)
- **Không tự ý quét ngoài phạm vi:** Tuyệt đối không quét ra Internet (Public IP) hoặc các dải mạng chưa được phê duyệt trong bảng `network_subnets`.
- **Giới hạn L2/L3 đối với địa chỉ MAC:** Giao thức ARP chỉ thu thập được địa chỉ MAC thực của thiết bị nằm trong cùng Broadcast Domain (cùng VLAN/L2) với máy chủ Scanner. Đối với các Subnet nằm qua bộ định tuyến (Routed L3 VLAN), Scanner không tự suy đoán MAC từ gói tin qua Gateway mà chỉ thu thập MAC nếu truy vấn được bảng ARP/FDB từ Switch/Router thông qua SNMP được cấp quyền.
- **Giới hạn Agentless trên máy trạm:** Do không cài Agent và không dùng kỹ thuật xâm nhập trái phép, HICC V1.0 không cam kết thu thập thông số CPU/RAM thời gian thực, sức khỏe ổ cứng SMART, danh sách phần mềm đã cài đặt hoặc tài khoản Windows nội bộ của máy trạm.
- **Giới hạn Camera IP:** HICC V1.0 kiểm tra kết nối, phát hiện thiết bị qua ONVIF/RTSP và thu thập Model/Firmware khi camera hỗ trợ; không thực hiện giải mã hoặc phát luồng video trực tiếp (Live Video Streaming) trên Dashboard.
- **Giới hạn Sơ đồ mạng (Network Map):** Chỉ xây dựng liên kết vật lý/logic khi thu thập được dữ liệu thực tế từ bảng SNMP/LLDP/CDP hoặc cấu hình cổng Switch xác thực; không vẽ sơ đồ kết nối giả định.

---

## 4. Nguyên tắc Triển khai Cốt lõi (Engineering Principles)

1. **Scanner-First & Real-Data-Only:** Nền tảng cơ sở dữ liệu và độ chính xác của Scanner Engine là ưu tiên số một. Không xây dựng giao diện mô phỏng hay sử dụng dữ liệu giả (Mock Data).
2. **Định danh bền vững bằng UUID:** Địa chỉ IP có thể thay đổi theo DHCP, Hostname có thể đổi tên, Card mạng có thể thay thế. Mọi thiết bị trong HICC được định danh duy nhất bằng `UUID` bất biến, gắn kết với lịch sử các giao diện mạng (`device_interfaces`).
3. **An toàn mạng doanh nghiệp (Network Safety):** Không quét vét cạn 65.535 cổng TCP gây quá tải thiết bị mạng hoặc kích hoạt hệ thống phòng vệ; chỉ kiểm tra danh sách cổng dịch vụ đặc trưng (Targeted Service Ports) với tốc độ kiểm soát (Rate-limited).
4. **Kiểm toán và Phân quyền chặt chẽ:** Mọi thao tác thay đổi cấu hình quét, phê duyệt Subnet, chỉnh sửa thông tin tài sản hoặc xác nhận cảnh báo đều được ghi vết vào `audit_logs` kèm theo tài khoản và địa chỉ IP thực hiện.

---

## 5. Đối tượng Sử dụng và Phân quyền

| Vai trò (Role) | Đối tượng tại HEPCO | Quyền hạn trong hệ thống HICC V1.0 |
| :--- | :--- | :--- |
| **Admin** (`admin`) | Trưởng bộ phận CNTT / Quản trị hệ thống chính | Toàn quyền cấu hình hệ thống, phê duyệt/khóa Subnet được phép quét, quản lý thông tin xác thực SNMP/ONVIF, quản lý người dùng, kích hoạt quét toàn diện và cấu hình quy tắc cảnh báo. |
| **IT Staff** (`it`) | Chuyên viên CNTT / Kỹ thuật viên mạng & phần cứng | Xem toàn bộ dữ liệu giám sát, thực hiện quét theo phạm vi đã được duyệt, cập nhật thông tin quản lý thiết bị (Phòng ban, Người dùng, Vị trí, Mã tài sản), tiếp nhận (Acknowledge) và xử lý (Resolve) cảnh báo. |
| **Viewer** (`viewer`) | Lãnh đạo phụ trách / Cán bộ kiểm kê tài sản | Quyền chỉ đọc (Read-only): Theo dõi Dashboard, xem danh mục thiết bị, tra cứu lịch sử trạng thái và xuất báo cáo thống kê định kỳ. Không được phép kích hoạt quét hoặc sửa đổi dữ liệu. |
