# 07. HƯỚNG DẪN TRIỂN KHAI VÀ KHÔI PHỤC DỮ LIỆU (DEPLOYMENT & RECOVERY GUIDE)

Tài liệu này hướng dẫn chi tiết quy trình cài đặt, cấu hình mạng, triển khai bằng **Docker Compose** hoặc cài đặt trực tiếp trên **Ubuntu Server 24.04 LTS**, cùng quy trình sao lưu và khôi phục dữ liệu (Backup & Restore) cho hệ thống **HEPCO IT COMMAND CENTER (HICC V1.0)**.

---

## 1. Yêu cầu Hạ tầng Máy chủ Nội bộ (On-Premise Requirements)

### 1.1. Cấu hình Phần cứng / Máy ảo Khuyến nghị

| Thông số | Quy mô 100 – 150 Thiết bị (Ban đầu) | Quy mô 500 – 1.000 Thiết bị (Mở rộng) |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU (x86_64, 2.4 GHz+) | 4 vCPU (x86_64, 2.6 GHz+) |
| **RAM** | 4 GB RAM | 8 GB – 16 GB RAM |
| **Ổ cứng (SSD/NVMe)** | 50 GB SSD | 120 GB NVMe SSD |
| **Hệ điều hành** | Ubuntu Server 24.04 LTS (64-bit) | Ubuntu Server 24.04 LTS (64-bit) |
| **Card mạng (NIC)** | 01 cổng Gigabit Ethernet kết nối trực tiếp vào LAN nội bộ HEPCO (hoặc cổng Trunk VLAN nếu muốn quét ARP L2 trên nhiều VLAN) | 01–02 cổng Gigabit Ethernet (cấu hình 802.1Q VLAN Sub-interfaces nếu cần ARP L2 đa VLAN) |

### 1.2. Yêu cầu Kết nối Mạng Nội bộ (Firewall / Switch ACL)
Từ địa chỉ IP cố định của máy chủ HICC tới các Subnet được phê duyệt cần được phép đi qua các giao thức sau:
- **ARP (Layer 2):** Trong cùng Broadcast Domain / VLAN.
- **ICMP:** Echo Request (Type 8) và nhận Echo Reply (Type 0).
- **UDP Outbound:** Port `161` (SNMP Polling), `137` (NetBIOS Name Query), `53` (Internal DNS), `3702` (ONVIF WS-Discovery), `5353` (mDNS).
- **TCP Outbound:** Các cổng nhận diện dịch vụ (`22`, `80`, `135`, `139`, `443`, `445`, `515`, `554`, `631`, `3389`, `8000`, `8899`, `9100`, `37777`).

---

## 2. Quy trình Triển khai Chuẩn bằng Docker Compose

### Bước 1: Chuẩn bị môi trường trên Ubuntu Server 24.04 LTS
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git nmap iputils-ping net-tools
```

### Bước 2: Thiết lập biến môi trường (`.env`)
Sao chép tệp mẫu và tạo khóa bảo mật riêng cho máy chủ HEPCO:
```bash
cd HEPCO-IT-COMMAND-CENTER
cp .env.example .env
chmod 600 .env
```
Sinh khóa mã hóa `HICC_CREDENTIAL_MASTER_KEY` và `JWT_SECRET_KEY`:
```bash
python3 -c "from cryptography.fernet import Fernet; print('HICC_CREDENTIAL_MASTER_KEY=' + Fernet.generate_key().decode())"
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```
> [!WARNING]
> Tuyệt đối lưu trữ an toàn giá trị `HICC_CREDENTIAL_MASTER_KEY`. Nếu mất khóa này khi khôi phục sang máy chủ mới, các mật khẩu SNMP/ONVIF đã mã hóa trong bảng `device_credentials` sẽ cần phải nhập lại.

### Bước 3: Lưu ý Cấu hình Mạng cho Container `scanner`
Để module **ARP Discovery** nhìn thấy địa chỉ MAC thực của thiết bị trong mạng LAN nội bộ, dịch vụ `scanner` trong `docker-compose.yml` trên máy chủ Linux cần chạy ở chế độ **`network_mode: "host"`** kèm quyền `cap_add: [NET_RAW, NET_ADMIN]`. Nếu chạy trong bridge network cô lập của Docker, gói tin ARP sẽ chỉ nhìn thấy bridge ảo của Docker chứ không nhìn thấy mạng LAN vật lý.

### Bước 4: Khởi tạo Database, Chạy Migration và Seed Danh mục Chuẩn
```bash
# Khởi chạy dịch vụ PostgreSQL
docker compose up -d postgres

# Thực thi Alembic Migration để tạo toàn bộ 16 bảng, chỉ mục và ràng buộc
docker compose run --rm backend alembic -c /app/database/alembic.ini upgrade head

# Nạp dữ liệu danh mục ban đầu (Device Types, Alert Rules, System Settings, Admin Account)
docker compose run --rm backend python /app/database/seeds/initial_seed.py
```

### Bước 5: Kiểm thử Scanner CLI trước khi bật dịch vụ tự động
```bash
# Kiểm tra kết nối Database và danh sách Subnet
docker compose run --rm scanner python -m hicc_scanner.cli check-env

# Chạy thử nghiệm phiên quét trên Subnet đã được Admin phê duyệt
docker compose run --rm scanner python -m hicc_scanner.cli scan --subnet 192.168.10.0/24 --type full
```

### Bước 6: Khởi chạy toàn bộ Hệ thống
```bash
docker compose up -d
docker compose ps
```

---

## 3. Quy trình Sao lưu và Khôi phục Dữ liệu (Backup & Disaster Recovery)

### 3.1. Sao lưu Tự động Hàng ngày (`scripts/backup_db.sh`)
Hệ thống cung cấp kịch bản sao lưu cơ sở dữ liệu PostgreSQL nén theo chuẩn Custom Format (`pg_dump -Fc`), lưu giữ bản sao lưu trong 30 ngày gần nhất:
```bash
# Chạy sao lưu thủ công bất kỳ lúc nào
./scripts/backup_db.sh
```
Cấu hình Cronjob trên máy chủ Ubuntu chạy tự động vào `01:30 AM` mỗi ngày:
```cron
30 1 * * * /opt/HEPCO-IT-COMMAND-CENTER/scripts/backup_db.sh >> /var/log/hicc_backup.log 2>&1
```

### 3.2. Quy trình Khôi phục Dữ liệu (`scripts/restore_db.sh`)
Khi cần khôi phục cơ sở dữ liệu từ bản sao lưu (`.dump`):
1. Tạm dừng tiến trình `scanner` và `backend` để ngắt các kết nối đang ghi vào DB:
   ```bash
   docker compose stop scanner backend
   ```
2. Thực thi kịch bản khôi phục:
   ```bash
   ./scripts/restore_db.sh /var/backups/hicc/hicc_db_20261105_013000.dump
   ```
3. Kiểm tra lại phiên bản Migration và khởi động lại dịch vụ:
   ```bash
   docker compose run --rm backend alembic -c /app/database/alembic.ini current
   docker compose start backend scanner
   ```

---

## 4. Vận hành, Giám sát Log và Xử lý Sự cố Thường gặp

| Tình huống | Nguyên nhân phổ biến | Cách kiểm tra & Khắc phục |
| :--- | :--- | :--- |
| Scanner báo lỗi `PermissionError: Operation not permitted` khi quét ARP/ICMP | Tiến trình Python thiếu quyền tạo Raw Socket (`CAP_NET_RAW`). | Trên Linux: cấp quyền `sudo setcap cap_net_raw,cap_net_admin+eip $(readlink -f $(which python3))` hoặc chạy qua container có `cap_add: [NET_RAW, NET_ADMIN]`. |
| Quét thấy IP Online nhưng cột `MAC Address` trống (`NULL`) | Thiết bị nằm ở VLAN khác (`ROUTED_L3`) hoặc container Scanner đang chạy ở chế độ Docker Bridge thay vì `network_mode: host`. | Chuyển `scanner` sang `network_mode: host` đối với cùng VLAN; hoặc cấu hình SNMP cho Core Switch/Gateway đối với mạng chia nhiều VLAN. |
| Máy tính Windows đang bật nhưng Ping báo Timeout | Windows Defender Firewall chặn gói tin ICMPv4 Echo Request. | Bình thường: HICC tự động phát hiện qua ARP (cùng LAN) hoặc cổng TCP `135/445` và vẫn giữ trạng thái `ONLINE` kèm cờ `icmp_blocked = true`. |
