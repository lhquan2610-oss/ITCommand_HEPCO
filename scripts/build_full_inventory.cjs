const fs = require('fs');
const path = require('path');

// Read audited raw inventory
const rawPath = path.join(__dirname, '../audit_device_inventory.json');
const rawContent = fs.readFileSync(rawPath, 'utf8').replace(/^\uFEFF/, '');
const rawItems = JSON.parse(rawContent);

// Known explicit data from lan_device_audit_report.md
const EXPLICIT_MAP = {
  // === MÁY CHỦ (SERVERS) ===
  '10.0.0.1': {
    code: 'TS-SRV-001',
    name: 'DSERVER (Domain Controller / DNS / Gateway)',
    category: 'SERVER',
    vendor: 'Dell PowerEdge Server',
    user: 'Bộ phận CNTT (Lê Hồng Quân)',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Windows Server 2019 Datacenter, Active Directory DS, DNS chính, Global Catalog, Exchange Schema'
  },
  '10.0.0.5': {
    code: 'TS-SRV-002',
    name: 'DSERVER (Primary DNS Server)',
    category: 'SERVER',
    vendor: 'Dell PowerEdge Server',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'DNS Server chính dải nội bộ hepco.com.vn'
  },
  '10.0.0.8': {
    code: 'TS-SRV-003',
    name: 'B-SERVER (Web / App / Hóa Đơn / QLXe)',
    category: 'SERVER',
    vendor: 'HPE ProLiant DL80 Gen9 (S/N: SGH740VEV7)',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Windows Server 2016 Datacenter, Chạy các web app: giaoban, web2026, xanhmt, hoadondientu, qlxe'
  },
  '10.0.0.16': {
    code: 'TS-SRV-004',
    name: 'SERVER-PC (Workgroup File & FTP Server)',
    category: 'SERVER',
    vendor: 'IBM System x Server',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Máy chủ lưu trữ độc lập (Workgroup), cung cấp FTP (port 21), File Share SMB (445), RDP (3389)'
  },
  '10.1.1.7': {
    code: 'TS-SRV-005',
    name: 'Máy Chủ CNTT (cntt.hepco.com.vn)',
    category: 'SERVER',
    vendor: 'MSI Workstation',
    user: 'Bộ phận CNTT (Lê Hồng Quân)',
    dept: 'Bộ phận CNTT',
    loc: 'Tầng 1 - Phòng CNTT',
    notes: 'Windows 10 Pro, Dịch vụ kỹ thuật nội bộ CNTT'
  },
  '192.168.1.8': {
    code: 'TS-SRV-006',
    name: 'B-SERVER (NIC 2 - WAN/DMZ Interface)',
    category: 'SERVER',
    vendor: 'HPE ProLiant DL80 Gen9',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Cổng mạng phụ kết nối dải DMZ 192.168.1.x'
  },
  '192.168.1.9': {
    code: 'TS-SRV-007',
    name: 'DSERVER (NIC 2 - WAN Interface)',
    category: 'SERVER',
    vendor: 'Dell PowerEdge Server',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Cổng mạng phụ Domain Controller dải 192.168.1.x'
  },
  '192.168.1.104': {
    code: 'TS-SRV-008',
    name: 'HPE iLO 4 (ILOSGH740VEV7 - B-SERVER)',
    category: 'SERVER',
    vendor: 'HPE Integrated Lights-Out 4 v2.54',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Quản trị phần cứng từ xa của B-SERVER HPE DL80 Gen9 (HTTPS/SSH). Đang báo lỗi module nguồn PWRM'
  },
  '192.168.1.118': {
    code: 'TS-SRV-009',
    name: 'Dell iDRAC (idrac-SVCTAG - DSERVER)',
    category: 'SERVER',
    vendor: 'Dell EMC iDRAC Controller',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Phòng Máy Chủ Trung Tâm',
    notes: 'Giao diện quản trị phần cứng từ xa của DSERVER Dell PowerEdge (HTTPS/SSH)'
  },

  // === THIẾT BỊ MẠNG (ROUTERS / SWITCHES / AP) ===
  '192.168.1.1': {
    code: 'TS-NET-001',
    name: 'Router / Firewall Gateway WAN',
    category: 'ROUTER',
    vendor: 'Router / Firewall Gateway',
    user: 'Quản trị hệ thống (Lê Hồng Quân)',
    dept: 'Bộ phận CNTT',
    loc: 'Tủ Rack Trung Tâm',
    notes: 'Router định tuyến WAN dải 192.168.1.0/24 (Mở SSH, Telnet, HTTP Admin)'
  },
  '198.162.101.1': {
    code: 'TS-NET-002',
    name: 'Core Switch / Gateway Phụ (fe80::1)',
    category: 'SWITCH',
    vendor: 'Cisco / TP-Link Core Switch',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Tủ Rack Trung Tâm',
    notes: 'Giao diện định tuyến phụ và IPv6 Default Gateway trên đường trục LAN'
  },
  '10.1.0.62': {
    code: 'TS-NET-003',
    name: 'Router Wi-Fi ASUS (router.asus.com)',
    category: 'ROUTER',
    vendor: 'ASUSTek Computer Inc.',
    user: 'Bộ phận CNTT',
    dept: 'Bộ phận CNTT',
    loc: 'Hành Lang Tầng 1',
    notes: 'Bộ phát Wi-Fi nội bộ, mở trang quản trị HTTPS cổng 8443'
  },
  '10.11.1.10': {
    code: 'TS-NET-004',
    name: 'Access Point TP-Link (Đội Môi Trường 1)',
    category: 'SWITCH',
    vendor: 'TP-Link Technologies Co., Ltd.',
    user: 'Đội Môi Trường 1',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Bộ phát Wi-Fi / AP khu vực dải mạng 10.11.1.x'
  },

  // === MÁY IN MẠNG & PHOTOCOPY (PRINTERS) ===
  '10.0.0.17': {
    code: 'TS-PRN-001',
    name: 'Máy Photocopy Ricoh MP 7503',
    category: 'PRINTER',
    vendor: 'Ricoh Company Ltd.',
    user: 'Dùng chung toàn công ty',
    dept: 'Văn Phòng Tổng Hợp',
    loc: 'Khu vực Trung Tâm Tầng 1',
    notes: 'Máy Photocopy / In đa năng công suất lớn (Port 9100, 515, 631, 80)'
  },
  '10.1.1.43': {
    code: 'TS-PRN-002',
    name: 'Máy In Canon i-SENSYS LBP242 / LBP243',
    category: 'PRINTER',
    vendor: 'Canon Inc.',
    user: 'Dùng chung P. CNTT & Ban Giám Đốc',
    dept: 'Bộ phận CNTT',
    loc: 'Tầng 1 - Phòng IT',
    notes: 'Máy in Laser hai mặt tốc độ cao (Canon Remote UI, Port 9100, 515, 631)'
  },
  '10.1.1.101': {
    code: 'TS-PRN-003',
    name: 'Máy In HP LaserJet Pro M404dn (HPC830B7)',
    category: 'PRINTER',
    vendor: 'HP Inc.',
    user: 'Dùng chung dải 10.1.1.x',
    dept: 'Văn Phòng Trung Tâm',
    loc: 'Tầng 1 - Phòng Hành Chính',
    notes: 'HP LaserJet Pro M404dn, JetDirect Port 9100'
  },
  '10.2.0.11': {
    code: 'TS-PRN-004',
    name: 'Máy In HP LaserJet Pro M404dn (HPA5A15F)',
    category: 'PRINTER',
    vendor: 'HP Inc.',
    user: 'Dùng chung dải 10.2.0.x',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'HP LaserJet Pro M404dn, JetDirect Port 9100'
  },
  '10.2.0.50': {
    code: 'TS-PRN-005',
    name: 'Máy In HP LaserJet Pro M402dn',
    category: 'PRINTER',
    vendor: 'HP Inc.',
    user: 'Dùng chung P. Kế Toán',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Bàn Thủ Quỹ',
    notes: 'HP LaserJet Pro M402dn, JetDirect Port 9100'
  },
  '10.2.1.54': {
    code: 'TS-PRN-006',
    name: 'Máy In Canon LBP458 (Khổ A3)',
    category: 'PRINTER',
    vendor: 'Canon Inc.',
    user: 'Dùng chung P. Kỹ Thuật / Kế Hoạch',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Máy in Laser khổ A3 bản vẽ kỹ thuật (Canon Remote UI, Port 9100, 8000)'
  },
  '10.2.1.55': {
    code: 'TS-PRN-007',
    name: 'Máy In Canon i-SENSYS LBP242 / LBP243',
    category: 'PRINTER',
    vendor: 'Canon Inc.',
    user: 'Dùng chung dải 10.2.1.x',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Bàn Kỹ Sư',
    notes: 'Máy in Laser Canon Remote UI, Port 9100, 515, 631'
  },
  '10.11.1.58': {
    code: 'TS-PRN-008',
    name: 'Máy In Canon i-SENSYS LBP242 / LBP243',
    category: 'PRINTER',
    vendor: 'Canon Inc.',
    user: 'Dùng chung Đội Môi Trường 1',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Máy in Laser Canon Remote UI, Port 9100, 515, 631'
  },
  '10.30.1.31': {
    code: 'TS-PRN-009',
    name: 'Máy In HP LaserJet Pro M706n (Khổ A3)',
    category: 'PRINTER',
    vendor: 'HP Inc.',
    user: 'Dùng chung Ban Quản Lý Bãi Rác',
    dept: 'Ban Quản Lý Bãi Rác',
    loc: 'Văn phòng Bãi Rác',
    notes: 'Máy in Laser A3 HP M706n, JetDirect Port 9100, Telnet 23'
  },
  '10.40.1.3': {
    code: 'TS-PRN-010',
    name: 'Máy In Đa Năng Brother MFC-B7810DW',
    category: 'PRINTER',
    vendor: 'Brother Industries, Ltd.',
    user: 'Tổ Trực Trạm Cân',
    dept: 'Trạm Cân Điện Tử',
    loc: 'Văn phòng Trạm Cân',
    notes: 'In / Scan / Copy đa chức năng, Port 9100, 515, 631, HTTP'
  },

  // === MÁY TRẠM ĐẶC BIỆT ===
  '10.1.1.45': {
    code: 'TS-PC-001',
    name: 'LHQUAN (Máy Quản Trị Viên IT - Máy Này)',
    category: 'WORKSTATION',
    vendor: 'Dell Inc.',
    user: 'Lê Hồng Quân (IT Admin)',
    dept: 'Bộ phận CNTT',
    loc: 'Tầng 1 - Phòng CNTT',
    notes: 'Windows 11 Pro, Intel Core i7, 32GB RAM, Máy điều hành hệ thống HICC'
  },
  '10.0.0.6': {
    code: 'TS-PC-002',
    name: 'GSPTCD (Giám Sát Xe Chuyên Dùng)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Tổ Giám Sát GPS & Phương Tiện',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Tầng 1 - Phòng Điều Hành',
    notes: 'Windows 10 Pro, Giám sát GPS phương tiện chuyên dùng'
  },
  '10.1.1.17': {
    code: 'TS-PC-003',
    name: 'THAN-PTGD (Trần Hữu An - PTGĐ)',
    category: 'WORKSTATION',
    vendor: 'Gigabyte PC',
    user: 'Trần Hữu An (Phó Tổng Giám Đốc)',
    dept: 'Ban Tổng Giám Đốc',
    loc: 'Tầng 2 - Phòng PTGĐ',
    notes: 'Windows 10 Pro, Chặn Ping ICMP, mở RDP 3389'
  },
  '10.1.1.36': {
    code: 'TS-PC-004',
    name: 'HTMCHAU (Hoàng Thị Minh Châu)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Hoàng Thị Minh Châu',
    dept: 'Phòng Hành Chính',
    loc: 'Tầng 1 - Phòng Hành Chính',
    notes: 'Windows 11 Pro'
  },
  '10.1.1.46': {
    code: 'TS-PC-005',
    name: 'DLTRA (Đặng Lâm Trà)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Đặng Lâm Trà',
    dept: 'Bộ phận CNTT',
    loc: 'Tầng 1 - Phòng CNTT',
    notes: 'Windows 10 Pro'
  },
  '10.1.1.48': {
    code: 'TS-PC-006',
    name: 'THNHAN (Trần Hữu Nhân)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Trần Hữu Nhân',
    dept: 'Bộ phận CNTT',
    loc: 'Tầng 1 - Phòng CNTT',
    notes: 'Windows 10 Pro'
  },
  '10.1.1.99': {
    code: 'TS-PC-007',
    name: 'SCAN (Máy Scan Văn Phòng Dùng Chung)',
    category: 'WORKSTATION',
    vendor: 'Gigabyte PC',
    user: 'Dùng chung văn phòng',
    dept: 'Văn Phòng Tổng Hợp',
    loc: 'Tầng 1 - Bàn Máy Scan',
    notes: 'Windows 10 Pro, kết nối máy quét chuyên dụng số hóa tài liệu'
  },
  '10.1.1.116': {
    code: 'TS-PC-008',
    name: 'TNHVU (Trần Ngọc Huy Vũ)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Trần Ngọc Huy Vũ',
    dept: 'Văn Phòng Tổng Hợp',
    loc: 'Tầng 1 - Bàn 04',
    notes: 'Windows 10 Pro'
  },
  '10.1.1.126': {
    code: 'TS-PC-009',
    name: 'NTHHA (Nguyễn Thị Hải Hà)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Nguyễn Thị Hải Hà',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 10 Pro'
  },
  '10.1.1.139': {
    code: 'TS-PC-010',
    name: 'HPHUONG (Huỳnh Phương)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Huỳnh Phương',
    dept: 'Phòng Kế Hoạch',
    loc: 'Tầng 2 - Phòng Kế Hoạch',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.8': {
    code: 'TS-PC-011',
    name: 'plhien (Phan Lê Hiền)',
    category: 'WORKSTATION',
    vendor: 'Gigabyte PC',
    user: 'Phan Lê Hiền',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.22': {
    code: 'TS-PC-012',
    name: 'TQKHANH (Trần Quốc Khánh)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Trần Quốc Khánh',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.27': {
    code: 'TS-PC-013',
    name: 'LNDNHAT (Lê Ngô Đức Nhật)',
    category: 'WORKSTATION',
    vendor: 'MSI PC',
    user: 'Lê Ngô Đức Nhật',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Windows 10 IoT Enterprise LTSC'
  },
  '10.2.1.35': {
    code: 'TS-PC-014',
    name: 'LTRUNG (Lê Trung)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Lê Trung',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.38': {
    code: 'TS-PC-015',
    name: 'HVQUYEN (Hồ Văn Quyền)',
    category: 'WORKSTATION',
    vendor: 'MSI PC',
    user: 'Hồ Văn Quyền',
    dept: 'Phòng Kế Hoạch',
    loc: 'Tầng 2 - Phòng Kế Hoạch',
    notes: 'Windows 10 Pro'
  },
  '10.2.1.40': {
    code: 'TS-PC-016',
    name: 'DTHUE (Dương Thị Huệ)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Dương Thị Huệ',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 10 Pro'
  },
  '10.2.1.46': {
    code: 'TS-PC-017',
    name: 'TTLHUONG (Trương Thị Lan Hương)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Trương Thị Lan Hương',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 10 Pro'
  },
  '10.2.1.50': {
    code: 'TS-PC-018',
    name: 'PTTRANG (Phan Thị Trang)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Phan Thị Trang',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Bàn 02',
    notes: 'Windows 11 Pro (1 NIC cấu hình 2 IP .50 và .53)'
  },
  '10.2.1.64': {
    code: 'TS-PC-019',
    name: 'LMHUNG (Lê Mạnh Hùng)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Lê Mạnh Hùng',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Windows 10 Pro'
  },
  '10.2.1.65': {
    code: 'TS-PC-020',
    name: 'DHDUNG (Đinh Hoàng Dũng)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Đinh Hoàng Dũng',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.77': {
    code: 'TS-PC-021',
    name: 'TLNHAN (Trịnh Lê Nhân)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Trịnh Lê Nhân',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 10 Pro'
  },
  '10.2.1.79': {
    code: 'TS-PC-022',
    name: 'NHPHUC (Nguyễn Hoàng Phúc)',
    category: 'WORKSTATION',
    vendor: 'Lenovo PC',
    user: 'Nguyễn Hoàng Phúc',
    dept: 'Phòng Kỹ Thuật',
    loc: 'Tầng 2 - Phòng Kỹ Thuật',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.81': {
    code: 'TS-PC-023',
    name: 'DNQUANGKH (Đào Nhật Quang)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Đào Nhật Quang',
    dept: 'Phòng Kế Hoạch',
    loc: 'Tầng 2 - Phòng Kế Hoạch',
    notes: 'Windows 11 Pro (NetBIOS xác thực)'
  },
  '10.2.1.89': {
    code: 'TS-PC-024',
    name: 'HTMHAO (Hoàng Thị Mỹ Hảo)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Hoàng Thị Mỹ Hảo',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 11 Pro'
  },
  '10.2.1.155': {
    code: 'TS-PC-025',
    name: 'HTXHOA (Hồ Thị Xuân Hòa)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Hồ Thị Xuân Hòa',
    dept: 'Phòng Kế Toán',
    loc: 'Tầng 2 - Phòng Kế Toán',
    notes: 'Windows 11 Pro'
  },
  '10.3.1.34': {
    code: 'TS-PC-026',
    name: 'CMHIEN (Cao Minh Hiền)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Cao Minh Hiền',
    dept: 'Phòng Kinh Doanh',
    loc: 'Tầng 1 - Phòng Kinh Doanh',
    notes: 'Windows 10 Pro'
  },
  '10.3.1.56': {
    code: 'TS-PC-027',
    name: 'LVTHANG (Lê Vĩnh Thắng)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Lê Vĩnh Thắng',
    dept: 'Phòng Kinh Doanh',
    loc: 'Tầng 1 - Phòng Kinh Doanh',
    notes: 'Windows 10 Pro'
  },
  '10.3.1.71': {
    code: 'TS-PC-028',
    name: 'HTTHANH (Huỳnh Tấn Thành)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Huỳnh Tấn Thành',
    dept: 'Phòng Kinh Doanh',
    loc: 'Tầng 1 - Phòng Kinh Doanh',
    notes: 'Windows 11 Pro'
  },
  '10.3.1.99': {
    code: 'TS-PC-029',
    name: 'TNTHANH (Trần Ngọc Thành)',
    category: 'WORKSTATION',
    vendor: 'Lenovo PC',
    user: 'Trần Ngọc Thành',
    dept: 'Phòng Kinh Doanh',
    loc: 'Tầng 1 - Phòng Kinh Doanh',
    notes: 'Windows 11 Pro'
  },
  '10.11.1.2': {
    code: 'TS-PC-030',
    name: 'THHOA (Trần Hữu Hòa)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Trần Hữu Hòa',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 10 Pro'
  },
  '10.11.1.5': {
    code: 'TS-PC-031',
    name: 'LQLONG (Lê Quang Long)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Lê Quang Long',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 11 Pro'
  },
  '10.11.1.6': {
    code: 'TS-PC-032',
    name: 'VDVIET (Vũ Duy Việt)',
    category: 'WORKSTATION',
    vendor: 'MSI PC',
    user: 'Vũ Duy Việt',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 10 Pro'
  },
  '10.11.1.7': {
    code: 'TS-PC-033',
    name: 'NTNAM / TTHAN (Nguyễn Trọng Nam)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Nguyễn Trọng Nam / Trần Thị Huệ An',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 10 Pro'
  },
  '10.11.1.13': {
    code: 'TS-PC-034',
    name: 'NVCHIEN (Nguyễn Văn Chiến)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Nguyễn Văn Chiến',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 10 Pro'
  },
  '10.11.1.19': {
    code: 'TS-PC-035',
    name: 'PVHUY (Phạm Việt Huy)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Phạm Việt Huy',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows 11 Pro'
  },
  '10.11.1.113': {
    code: 'TS-PC-036',
    name: 'dnquanga (Dương Nhật Quang)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Dương Nhật Quang',
    dept: 'Đội Môi Trường 1',
    loc: 'Văn phòng Đội 1',
    notes: 'Windows PC (Đăng ký DNS AD)'
  },
  '10.12.1.39': {
    code: 'TS-PC-037',
    name: 'NDDO (Nguyễn Đăng Độ)',
    category: 'WORKSTATION',
    vendor: 'Realtek PC',
    user: 'Nguyễn Đăng Độ',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 10 Pro'
  },
  '10.12.1.68': {
    code: 'TS-PC-038',
    name: 'DNTUAN (Đinh Ngọc Tuấn)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Đinh Ngọc Tuấn',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 10 Pro'
  },
  '10.12.1.88': {
    code: 'TS-PC-039',
    name: 'NLTUAN (Nguyễn Lê Tuấn)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Nguyễn Lê Tuấn',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 10 Pro'
  },
  '10.12.1.89': {
    code: 'TS-PC-040',
    name: 'NVCU (Ngô Văn Cừ)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Ngô Văn Cừ',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 11 Pro'
  },
  '10.12.1.91': {
    code: 'TS-PC-041',
    name: 'TDHAN (Trần Đức Hân)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Trần Đức Hân',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 11 Pro'
  },
  '10.12.1.121': {
    code: 'TS-PC-042',
    name: 'VTDPHUONG (Võ Thị Diệu Phương)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Võ Thị Diệu Phương',
    dept: 'Đội Môi Trường 2',
    loc: 'Văn phòng Đội 2',
    notes: 'Windows 10 Pro'
  },
  '10.20.1.12': {
    code: 'TS-PC-043',
    name: 'NHPHUONGA (Nguyễn Hữu Phương)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Nguyễn Hữu Phương',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 10 Pro'
  },
  '10.20.1.18': {
    code: 'TS-PC-044',
    name: 'HVTIEN (Hoàng Văn Tiến)',
    category: 'WORKSTATION',
    vendor: 'Asus PC',
    user: 'Hoàng Văn Tiến',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 11 Pro'
  },
  '10.20.1.19': {
    code: 'TS-PC-045',
    name: 'NHTHE (Nguyễn Hữu Thể)',
    category: 'WORKSTATION',
    vendor: 'Gigabyte PC',
    user: 'Nguyễn Hữu Thể',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 11 Pro'
  },
  '10.20.1.20': {
    code: 'TS-PC-046',
    name: 'NVTRUNGA (Nguyễn Văn Trung)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Nguyễn Văn Trung',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 11 Pro'
  },
  '10.20.1.25': {
    code: 'TS-PC-047',
    name: 'TNVI (Trần Ngọc Vĩ)',
    category: 'WORKSTATION',
    vendor: 'MSI PC',
    user: 'Trần Ngọc Vĩ',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 10 Pro'
  },
  '10.20.1.60': {
    code: 'TS-PC-048',
    name: 'HNTU (Hoàng Ngọc Tú)',
    category: 'WORKSTATION',
    vendor: 'Gigabyte PC',
    user: 'Hoàng Ngọc Tú',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 11 Pro'
  },
  '10.20.1.97': {
    code: 'TS-PC-049',
    name: 'TTDUC (Trần Trung Đức)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Trần Trung Đức',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 11 Pro'
  },
  '10.20.1.169': {
    code: 'TS-PC-050',
    name: 'NBNGUYEN (Nguyễn Bá Nguyên)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Nguyễn Bá Nguyên',
    dept: 'Xí Nghiệp Cơ Giới',
    loc: 'Văn phòng Xí nghiệp',
    notes: 'Windows 10 Pro'
  },
  '10.30.1.25': {
    code: 'TS-PC-051',
    name: 'NTTHOANG (Nguyễn Trần Thanh Hoàng)',
    category: 'WORKSTATION',
    vendor: 'Lenovo ThinkCentre',
    user: 'Nguyễn Trần Thanh Hoàng',
    dept: 'Ban Quản Lý Bãi Rác',
    loc: 'Văn phòng Bãi Rác',
    notes: 'Windows 10 Pro'
  },
  '10.30.1.32': {
    code: 'TS-PC-052',
    name: 'TQCUONG (Trương Quốc Cường)',
    category: 'WORKSTATION',
    vendor: 'HP ProDesk',
    user: 'Trương Quốc Cường',
    dept: 'Ban Quản Lý Bãi Rác',
    loc: 'Văn phòng Bãi Rác',
    notes: 'Windows 10 Pro'
  },
  '10.30.1.55': {
    code: 'TS-PC-053',
    name: 'HXHUNG / HQHUNG (Hoàng Quang Hưng)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Hoàng Quang Hưng',
    dept: 'Ban Quản Lý Bãi Rác',
    loc: 'Văn phòng Bãi Rác',
    notes: 'Windows 11 Pro'
  },
  '10.30.1.131': {
    code: 'TS-PC-054',
    name: 'HTHTHANH (Hồ Thị Hoàng Thành)',
    category: 'WORKSTATION',
    vendor: 'Dell OptiPlex',
    user: 'Hồ Thị Hoàng Thành',
    dept: 'Ban Quản Lý Bãi Rác',
    loc: 'Văn phòng Bãi Rác',
    notes: 'Windows 10 Pro'
  },
};

// Process all 111 raw devices
const processedList = [];
let autoAssetIndex = 100;

for (let i = 0; i < rawItems.length; i++) {
  const item = rawItems[i];
  const ip = item.IP;
  const mac = item.MAC ? item.MAC.toUpperCase().replace(/-/g, ':') : '';
  const isPing = item.Ping === 'True';
  const openPorts = item.OpenPorts ? item.OpenPorts.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p)) : [];

  // Check explicit record first
  if (EXPLICIT_MAP[ip]) {
    const exp = EXPLICIT_MAP[ip];
    processedList.push({
      id: `dev-hepco-${i + 1}`,
      device_code: exp.code,
      display_name: exp.name,
      category: exp.category,
      ip: ip,
      mac: mac,
      vendor: exp.vendor,
      assigned_user: exp.user,
      department: exp.dept,
      location: exp.loc,
      status: isPing ? 'ONLINE' : 'ONLINE', // In active audit ARP
      last_seen: isPing ? 'Vừa kiểm tra (Ping OK)' : 'Bảng ARP (Chặn Ping/Tường lửa)',
      openPorts: openPorts,
      notes: exp.notes
    });
    continue;
  }

  // === CCTV / CAMERAS (Dải 10.110.1.x) ===
  if (ip.startsWith('10.110.1.')) {
    const ipSuffix = ip.split('.').pop();
    let camVendor = 'Dahua / KBVision';
    let camName = `Camera An Ninh 10.110.1.${ipSuffix}`;
    let camNotes = 'Hệ thống Camera IP giám sát an ninh dải 10.110.1.x';

    if (['10.110.1.11', '10.110.1.13', '10.110.1.80'].includes(ip)) {
      camVendor = 'Hangzhou Hikvision Digital';
      camName = ip === '10.110.1.13' ? 'Đầu Ghi NVR Trung Tâm (camera.hepco.com.vn)' : `Camera Hikvision 10.110.1.${ipSuffix}`;
      camNotes = 'Giao thức Hikvision SDK (Port 8000), luồng RTSP (554)';
    } else {
      camNotes = 'Giao thức Dahua / KBVision (Port 37777), luồng RTSP (554)';
    }

    processedList.push({
      id: `dev-hepco-${i + 1}`,
      device_code: `TS-CAM-${String(ipSuffix).padStart(3, '0')}`,
      display_name: camName,
      category: 'CAMERA',
      ip: ip,
      mac: mac,
      vendor: camVendor,
      assigned_user: 'Tổ Trưởng Bảo Vệ (Giám Sát An Ninh)',
      department: 'Tổ Bảo Vệ & An Ninh',
      location: 'Khu Vực Hàng Rào & Giám Sát',
      status: isPing || openPorts.length > 0 ? 'ONLINE' : 'ONLINE',
      last_seen: isPing ? 'Vừa phản hồi' : 'Trực tuyến ARP',
      openPorts: openPorts,
      notes: camNotes
    });
    continue;
  }

  // === REMAINING WORKSTATIONS / TERMINALS ===
  const ipParts = ip.split('.');
  const ipSuffix = ipParts.pop();
  const subnetPrefix = ipParts.join('.');
  let dept = 'Văn Phòng Tổng Hợp';
  let loc = 'Khu Vực Làm Việc';

  if (subnetPrefix === '10.0.0' || subnetPrefix === '10.1.1') {
    dept = 'Ban Giám Đốc / Văn Phòng Trung Tâm';
    loc = 'Tầng 1 - Trụ Sở Chính';
  } else if (subnetPrefix === '10.2.0' || subnetPrefix === '10.2.1') {
    dept = 'Phòng Kế Toán / Phòng Kỹ Thuật';
    loc = 'Tầng 2 - Khối Nghiệp Vụ';
  } else if (subnetPrefix === '10.3.1') {
    dept = 'Phòng Kinh Doanh & Kế Hoạch';
    loc = 'Tầng 1 - Khối Kinh Doanh';
  } else if (subnetPrefix === '10.11.1') {
    dept = 'Đội Môi Trường 1';
    loc = 'Văn phòng Đội 1';
  } else if (subnetPrefix === '10.12.1') {
    dept = 'Đội Môi Trường 2';
    loc = 'Văn phòng Đội 2';
  } else if (subnetPrefix === '10.20.1') {
    dept = 'Xí Nghiệp Cơ Giới & Vận Tải';
    loc = 'Khu Điều Hành Cơ Giới';
  } else if (subnetPrefix === '10.30.1') {
    dept = 'Ban Quản Lý Bãi Rác';
    loc = 'Văn phòng Bãi Rác';
  }

  const hostname = item.ADHost || (item.DNSNames ? item.DNSNames.split(',')[0] : '') || `PC-${subnetPrefix.replace(/\./g, '-')}-${ipSuffix}`;
  const owner = item.Owner || 'Cán bộ nhân viên đơn vị';
  const os = item.OS || (openPorts.includes(135) || openPorts.includes(445) ? 'Windows 10 / 11 Pro' : 'Thiết bị đầu cuối nội bộ');

  autoAssetIndex++;
  processedList.push({
    id: `dev-hepco-${i + 1}`,
    device_code: `TS-WS-${autoAssetIndex}`,
    display_name: `${hostname} (${owner})`,
    category: 'WORKSTATION',
    ip: ip,
    mac: mac,
    vendor: 'Máy Trạm Doanh Nghiệp',
    assigned_user: owner,
    department: dept,
    location: loc,
    status: isPing ? 'ONLINE' : 'ONLINE',
    last_seen: isPing ? 'Vừa quét (Ping OK)' : 'Kết nối ARP nội bộ',
    openPorts: openPorts,
    notes: `${os} - Giao tiếp mạng nội bộ hepco.com.vn`
  });
}

// Write to data/devices_inventory.json with clean UTF-8
const targetPath = path.join(__dirname, '../data/devices_inventory.json');
fs.writeFileSync(targetPath, JSON.stringify(processedList, null, 2), 'utf8');

console.log(`Successfully generated ${processedList.length} devices in ${targetPath}`);

// Group by category to verify
const summary = {};
for (const d of processedList) {
  summary[d.category] = (summary[d.category] || 0) + 1;
}
console.log('Category breakdown:', summary);
