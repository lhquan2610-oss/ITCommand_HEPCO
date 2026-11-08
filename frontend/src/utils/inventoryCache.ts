// Shared High-Speed In-Memory Inventory Cache for Instant Tab Switching

const STORAGE_KEY = 'hicc_real_devices_inventory_v110';
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hicc_real_devices_inventory');
  }
} catch {}

const VERIFIED_CAMERA_MAP: Record<
  string,
  {
    display_name: string;
    parent_nvr: string;
    nvr_channel: number;
    nvr_rtsp_channel: string;
    location: string;
    osd_label: string;
  }
> = {
  '10.110.1.11': {
    display_name: 'Ch.01: Camera Sảnh Đón Tiếp Khách & Khung Logo HEPCO',
    parent_nvr: '10.110.1.13',
    nvr_channel: 1,
    nvr_rtsp_channel: '101',
    location: 'Sảnh Chính & Hành Lang Tầng 1',
    osd_label: 'IPC (Sảnh Logo T1)',
  },
  '10.110.1.21': {
    display_name: 'Ch.02 / Ch.10: Camera Hành Lang Tầng 2 & Cầu Thang Bộ',
    parent_nvr: '10.110.1.13',
    nvr_channel: 2,
    nvr_rtsp_channel: '201',
    location: 'Hành Lang & Cầu Thang Tầng 2',
    osd_label: 'Tang 2',
  },
  '10.110.1.22': {
    display_name: 'Ch.03: Camera Hành Lang & Phòng Nội Bộ Văn Phòng',
    parent_nvr: '10.110.1.13',
    nvr_channel: 3,
    nvr_rtsp_channel: '301',
    location: 'Phòng Nội Bộ Văn Phòng',
    osd_label: 'IPC',
  },
  '10.110.1.101': {
    display_name: 'Ch.04: Camera Cổng Trước & Nhà Bảo Vệ Cơ Quan',
    parent_nvr: '10.110.1.13',
    nvr_channel: 4,
    nvr_rtsp_channel: '401',
    location: 'Cổng Trước Cơ Quan',
    osd_label: 'IPC (Cổng Trước)',
  },
  '10.110.1.102': {
    display_name: 'Ch.05: Camera Sân Ngoài Khuôn Viên Cơ Quan',
    parent_nvr: '10.110.1.13',
    nvr_channel: 5,
    nvr_rtsp_channel: '501',
    location: 'Sân Ngoài Khuôn Viên',
    osd_label: 'San ngoai',
  },
  '10.110.1.103': {
    display_name: 'Ch.06: Camera Nhà Để Xe Máy Cán Bộ CNV',
    parent_nvr: '10.110.1.13',
    nvr_channel: 6,
    nvr_rtsp_channel: '601',
    location: 'Nhà Để Xe Văn Phòng',
    osd_label: 'IPC (Nhà Xe)',
  },
  '10.110.1.135': {
    display_name: 'Ch.07: Camera Sân Vườn & Tiểu Cảnh Giữa 2 Dãy Nhà',
    parent_nvr: '10.110.1.13',
    nvr_channel: 7,
    nvr_rtsp_channel: '701',
    location: 'Sân Vườn Nội Bộ',
    osd_label: 'IPC (Sân Vườn)',
  },
  '10.110.1.136': {
    display_name: 'Ch.08: Camera Nhà Để Xe Ô Tô & Lối Đi Phía Sau',
    parent_nvr: '10.110.1.13',
    nvr_channel: 8,
    nvr_rtsp_channel: '801',
    location: 'Nhà Để Xe Ô Tô',
    osd_label: 'IPC (Nhà Xe Ô Tô)',
  },
  '10.110.1.23': {
    display_name: 'Ch.09: Camera Khu Nội Bộ & Phòng Làm Việc Giao Dịch',
    parent_nvr: '10.110.1.13',
    nvr_channel: 9,
    nvr_rtsp_channel: '901',
    location: 'Phòng Làm Việc Nội Bộ',
    osd_label: 'IPC (Khu Nội Bộ)',
  },
  '10.110.1.137': {
    display_name: 'Ch.20: Camera Hiên Sảnh Trước & Hành Lang Tầng 1',
    parent_nvr: '10.110.1.13',
    nvr_channel: 20,
    nvr_rtsp_channel: '2001',
    location: 'Hiên Sảnh Trước Tầng 1',
    osd_label: 'IPC (Hành Lang T1)',
  },
  '10.110.1.87': {
    display_name: 'Ch.01: Camera Hành Lang Ngang 2 - Lán Xe Tải (HL NGANG2)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 1,
    nvr_rtsp_channel: '101',
    location: 'Hành Lang Ngang 2',
    osd_label: 'HL NGANG2',
  },
  '10.110.1.82': {
    display_name: 'Ch.02: Camera Tuyến Đường Bê Tông Nội Bộ Xí Nghiệp (IP Camera2)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 2,
    nvr_rtsp_channel: '201',
    location: 'Đường Nội Bộ Xí Nghiệp',
    osd_label: 'IP Camera2',
  },
  '10.110.1.83': {
    display_name: 'Ch.03: Camera Lán Đỗ & Bảo Dưỡng Xe Ép Rác (IP Camera3)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 3,
    nvr_rtsp_channel: '301',
    location: 'Lán Xe Ép Rác',
    osd_label: 'IP Camera3',
  },
  '10.110.1.84': {
    display_name: 'Ch.04: Camera Cổng Chính & Bãi Xe Chuyên Dùng (CONG CHINH)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 4,
    nvr_rtsp_channel: '401',
    location: 'Cổng Chính & Bãi Xe',
    osd_label: 'CONG CHINH',
  },
  '10.110.1.85': {
    display_name: 'Ch.05: Camera Khu Tập Kết Phế Liệu & Rác Tái Chế (IP Camera5)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 5,
    nvr_rtsp_channel: '501',
    location: 'Khu Phế Liệu & Rác Tái Chế',
    osd_label: 'IP Camera5',
  },
  '10.110.1.89': {
    display_name: 'Ch.06: Camera Xưởng 2 - Kho Vật Tư & Thiết Bị (XUONG 2)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 6,
    nvr_rtsp_channel: '601',
    location: 'Xưởng 2 - Kho Vật Tư',
    osd_label: 'XUONG 2',
  },
  '10.110.1.55': {
    display_name: 'Ch.07: Camera Khu Bảo Trì Máy & Xe Bồn Hút (IP Camera7)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 7,
    nvr_rtsp_channel: '701',
    location: 'Khu Bảo Trì Máy & Xe Bồn',
    osd_label: 'IP Camera7',
  },
  '10.110.1.56': {
    display_name: 'Ch.08: Camera Bãi Tập Kết Dàn Xe Ép Rác (IP Camera8)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 8,
    nvr_rtsp_channel: '801',
    location: 'Bãi Tập Kết Xe Ép Rác',
    osd_label: 'IP Camera8',
  },
  '10.110.1.88': {
    display_name: 'Ch.09: Camera Sân Bãi Điều Phối Phương Tiện (IP Camera9)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 9,
    nvr_rtsp_channel: '901',
    location: 'Sân Điều Phối Phương Tiện',
    osd_label: 'IP Camera9',
  },
  '10.110.1.57': {
    display_name: 'Ch.10: Camera Xưởng Cơ Khí Sửa Chữa Phương Tiện (IP Camera10)',
    parent_nvr: '10.110.1.80',
    nvr_channel: 10,
    nvr_rtsp_channel: '1001',
    location: 'Xưởng Cơ Khí Sửa Chữa',
    osd_label: 'IP Camera10',
  },
};

// Guaranteed Core Wi-Fi Routers (Tầng 1, Tầng 2, Tầng 3 & Xí Nghiệp)
const VERIFIED_WIFI_ROUTERS: Record<string, any> = {
  '10.1.1.33': {
    id: 'dev-hepco-10',
    device_code: 'TS-WF-001',
    display_name: 'Modem / Router Wi-Fi ASUS Tầng 1 (Phòng Họp & TCHC)',
    category: 'ROUTER',
    ip: '10.1.1.33',
    mac: '04:42:1A:3F:BA:28',
    vendor: 'ASUSTek COMPUTER INC.',
    assigned_user: 'Wi-Fi Tầng 1 (Phòng Họp & TCHC)',
    department: 'Wi-Fi',
    location: 'Tầng 1 - Phòng Họp Lớn & Sảnh Trung Tâm',
    status: 'ONLINE',
    model: 'ASUS RT-AC1200',
    notes: 'Router Wi-Fi ASUSTek RT-AC1200 Dual-Band Gigabit | Băng tần: Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps) | Cổng: 1 WAN Gigabit + 4 LAN Gigabit | Vị trí: Tầng 1 - Phòng họp lớn, Sảnh trung tâm & Phòng TCHC',
    specs: {
      asset_code: 'TS-WF-001',
      year: '2023',
      router_brand: 'ASUSTek',
      router_model: 'RT-AC1200 Dual-Band Gigabit',
      router_type: 'Router Wi-Fi & Access Point (Tầng 1)',
      router_band: 'Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps) Wi-Fi 5',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit (1000Mbps)',
      router_ssid: 'HEPCO_TANG1_TCHC',
      router_coverage: 'Tầng 1 - Phòng họp lớn, Sảnh trung tâm & Phòng TCHC',
    },
  },
  '10.2.0.191': {
    id: 'dev-hepco-23',
    device_code: 'TS-WF-002',
    display_name: 'Router Wi-Fi TP-Link Tầng 2 (Kế Toán - Tài Vụ & Kỹ Thuật)',
    category: 'ROUTER',
    ip: '10.2.0.191',
    mac: 'E4:C3:2A:82:AE:A0',
    vendor: 'TP-LINK TECHNOLOGIES CO.,LTD.',
    assigned_user: 'Wi-Fi Tầng 2 (Kế Toán & Kỹ Thuật)',
    department: 'Wi-Fi',
    location: 'Tầng 2 - Tòa Nhà Văn Phòng HEPCO',
    status: 'ONLINE',
    model: 'TP-Link Archer C64',
    notes: 'Router Wi-Fi TP-Link Archer C64 AC1200 MU-MIMO | Băng tần: Dual-Band 2.4GHz (400Mbps) + 5GHz (867Mbps) | Cổng: 1 WAN Gigabit + 4 LAN Gigabit | Vị trí: Tầng 2 - Phòng Kế toán - Tài vụ & Phòng Kỹ thuật',
    specs: {
      asset_code: 'TS-WF-002',
      year: '2023',
      router_brand: 'TP-Link',
      router_model: 'Archer C64 AC1200 MU-MIMO',
      router_type: 'Router Wi-Fi & Access Point (Tầng 2)',
      router_band: 'Dual-Band 2.4GHz (400Mbps) + 5GHz (867Mbps)',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit (1000Mbps)',
      router_ssid: 'HEPCO_TANG2_KETOAN',
      router_coverage: 'Tầng 2 - Phòng Kế toán - Tài vụ & Phòng Kỹ thuật',
    },
  },
  '10.2.1.43': {
    id: 'dev-hepco-31',
    device_code: 'TS-WF-002A',
    display_name: 'Router Wi-Fi ASUS Tầng 2 - Phòng Kỹ Thuật (Wifi tầng 2)',
    category: 'ROUTER',
    ip: '10.2.1.43',
    mac: '10:7C:61:E2:D5:40',
    vendor: 'ASUSTek COMPUTER INC.',
    assigned_user: 'Wifi tầng 2 (Phòng Kỹ Thuật)',
    department: 'Wi-Fi',
    location: 'Tầng 2 - Phòng Kỹ Thuật',
    status: 'ONLINE',
    model: 'ASUS RT-AC1300UHP',
    notes: 'Router Wi-Fi ASUS Tầng 2 - Phòng Kỹ Thuật | Băng tần: Dual-Band 2.4GHz (400Mbps) + 5GHz (867Mbps) | Cổng: 1 WAN Gigabit + 4 LAN Gigabit | Vị trí: Tầng 2 - Phòng Kỹ Thuật',
    specs: {
      asset_code: 'TS-WF-002A',
      year: '2023',
      router_brand: 'ASUSTek',
      router_model: 'RT-AC1300UHP High-Power Dual-Band',
      router_type: 'Router Wi-Fi & AP (Tầng 2 - Kỹ Thuật)',
      router_band: 'Dual-Band 2.4GHz (400Mbps) + 5GHz (867Mbps)',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit + USB 3.0',
      router_ssid: 'HEPCO_TANG2_KYTHUAT',
      router_coverage: 'Tầng 2 - Phòng Kỹ Thuật & Hành Lang',
    },
  },
  '10.2.1.52': {
    id: 'dev-hepco-34',
    device_code: 'TS-WF-002B',
    display_name: 'Router Wi-Fi Tầng 2 - Phòng Kế Toán - Tài Vụ (Router wifi KT-TV)',
    category: 'ROUTER',
    ip: '10.2.1.52',
    mac: '74:56:3C:2D:BC:DD',
    vendor: 'TP-Link / Gigabyte Wireless',
    assigned_user: 'Router wifi KT-TV (Tầng 2)',
    department: 'Wi-Fi',
    location: 'Tầng 2 - Phòng Kế Toán - Tài Vụ',
    status: 'ONLINE',
    model: 'Archer C6 / AP Gigabit KT-TV',
    notes: 'Router Wi-Fi Tầng 2 Phòng Kế Toán - Tài Vụ | Băng tần: Dual-Band 2.4GHz + 5GHz | Cổng: 1 WAN + 4 LAN Gigabit | Vị trí: Tầng 2 - Phòng Kế Toán - Tài Vụ',
    specs: {
      asset_code: 'TS-WF-002B',
      year: '2023',
      router_brand: 'TP-Link / Gigabyte',
      router_model: 'Archer C6 AC1200 Dual-Band (KT-TV)',
      router_type: 'Router Wi-Fi & AP (Tầng 2 - KT-TV)',
      router_band: 'Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps)',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit',
      router_ssid: 'HEPCO_TANG2_KTTV',
      router_coverage: 'Tầng 2 - Phòng Kế Toán - Tài Vụ',
    },
  },
  '10.1.0.62': {
    id: 'dev-10-1-0-62',
    device_code: 'TS-RO-062',
    display_name: 'Router Wi-Fi ASUS Tầng 2 - Văn Phòng Kỹ Thuật (router.asus.com)',
    category: 'ROUTER',
    ip: '10.1.0.62',
    mac: '3C-7C-3F-A4-8E-48',
    vendor: 'ASUSTek Computer Inc.',
    assigned_user: 'Wi-Fi Tầng 2 - Phòng Kỹ Thuật',
    department: 'Wi-Fi',
    location: 'Tầng 2 - Phòng Kỹ Thuật',
    status: 'ONLINE',
    model: 'ASUS RT-AC59U V2',
    notes: 'Router Wi-Fi ASUS RT-AC59U V2 AC1500 | Băng tần: Dual-Band 2.4GHz (600Mbps) + 5GHz (867Mbps) | Cổng: 1 WAN Gigabit + 4 LAN Gigabit | Vị trí: Tầng 2 - Phòng Kỹ Thuật',
    specs: {
      asset_code: 'TS-RO-062',
      year: '2023',
      router_brand: 'ASUSTek',
      router_model: 'RT-AC59U V2 AC1500',
      router_type: 'Router / Access Point (Tầng 2)',
      router_band: 'Dual-Band 2.4GHz (600Mbps) + 5GHz (867Mbps) 4 Anten',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit + 1 USB 2.0',
      router_ssid: 'HEPCO-KYTHUAT_5G',
      router_coverage: 'Tầng 2 - Phòng Kỹ Thuật & Hành Lang',
    },
  },
  '192.168.50.1': {
    id: 'dev-192-168-50-1',
    device_code: 'TS-RO-050',
    display_name: 'Modem / Router Wi-Fi ASUS Tầng 2 (Hành Lang Khối Văn Phòng)',
    category: 'ROUTER',
    ip: '192.168.50.1',
    mac: '04-42-1A-3F-BA-28',
    vendor: 'ASUSTek Computer Inc.',
    assigned_user: 'Ban Quản Trị Mạng (Wi-Fi Tầng 2)',
    department: 'Wi-Fi',
    location: 'Tầng 2 - Hành Lang Trung Tâm Khối Văn Phòng',
    status: 'ONLINE',
    model: 'ASUS RT-AX55 Wi-Fi 6',
    notes: 'Phát sóng Wi-Fi 6 băng tần kép cho Hành Lang Tầng 2 & Khối Phòng Ban Trung Tâm',
    specs: {
      asset_code: 'TS-RO-050',
      year: '2023',
      router_brand: 'ASUSTek',
      router_model: 'RT-AX55 Dual Band Wi-Fi 6 AX1800',
      router_type: 'Router / Mesh Node (Tầng 2)',
      router_band: 'Wi-Fi 6 AX1800 (574Mbps 2.4G + 1201Mbps 5G) AiMesh',
      router_ports: '1 WAN Gigabit + 4 LAN Gigabit',
      router_ssid: 'HEPCO-LANHDAO_5G',
      router_coverage: 'Tầng 2 - Hành Lang & Khối Phòng Ban Trung Tâm',
    },
  },
  '10.3.1.35': {
    id: 'dev-hepco-46',
    device_code: 'TS-WF-003',
    display_name: 'Modem / Router Wi-Fi ASUS Tầng 3 (Ban Lãnh Đạo & Phòng KH)',
    category: 'ROUTER',
    ip: '10.3.1.35',
    mac: 'CC:28:AA:B6:3A:10',
    vendor: 'ASUSTek COMPUTER INC.',
    assigned_user: 'Wi-Fi Tầng 3 (Ban Lãnh Đạo & KH)',
    department: 'Wi-Fi',
    location: 'Tầng 3 - Tòa Nhà Văn Phòng HEPCO',
    status: 'ONLINE',
    model: 'ASUS RT-AX53U (Wi-Fi 6)',
    notes: 'Router Wi-Fi ASUSTek RT-AX53U Dual-Band Wi-Fi 6 AX1800 | Băng tần: Wi-Fi 6 AX1800 (574Mbps 2.4G + 1201Mbps 5G) | Cổng: 1 WAN Gigabit + 3 LAN Gigabit + 1 USB | Vị trí: Tầng 3 - Ban Lãnh Đạo & Phòng Kế Hoạch',
    specs: {
      asset_code: 'TS-WF-003',
      year: '2023',
      router_brand: 'ASUSTek',
      router_model: 'RT-AX53U Dual-Band Wi-Fi 6 AX1800',
      router_type: 'Router Wi-Fi 6 High-Performance (Tầng 3)',
      router_band: 'Wi-Fi 6 AX1800 (574Mbps 2.4G + 1201Mbps 5G)',
      router_ports: '1 WAN Gigabit + 3 LAN Gigabit + 1 Cổng USB',
      router_ssid: 'HEPCO_TANG3_LANHDAO',
      router_coverage: 'Tầng 3 - Khu vực Ban Lãnh Đạo, Phòng Kế Hoạch & Hội trường',
    },
  },
};

// Guaranteed External / Cloud Cameras (Camera Bãi Rác & Camera Imou)
const EXTRA_CAMERAS = [
  {
    id: 'dev-cam-bairac',
    device_code: 'CAM-BAIRAC-01',
    display_name: 'Camera Bãi Rác (BaiRac - IP Tĩnh 113.161.8.149)',
    category: 'CAMERA',
    ip: '113.161.8.149',
    mac: '3C:EF:8C:BA:14:90',
    vendor: 'Dahua / SmartPSS Security (Port 37777 / 3777)',
    assigned_user: 'Ban Quản Lý Bãi Rác & Xử Lý Chất Thải',
    department: 'Camera',
    location: 'Khu Vực Bãi Rác (IP WAN: 113.161.8.149)',
    status: 'ONLINE',
    last_seen: 'Trực tuyến (Port 37777 / 554 / 83)',
    openPorts: [83, 554, 8000, 3777, 37777],
    parent_nvr: '113.161.8.149',
    parent_nvr_name: 'Camera Bãi Rác (BaiRac - 113.161.8.149:37777)',
    nvr_channel: 1,
    nvr_rtsp_channel: '1',
    is_nvr: true,
    nvr_role: 'BAIRAC_WAN',
    osd_label: 'BaiRac (Port 37777 / 3777)',
    notes: 'Device Name: BaiRac | Method: IP/Domain | IP: 113.161.8.149 | Port: 37777 (3777) | User: admin | Pass: philonghue123 | RTSP Port: 554 | Web Port: 83',
  },
  {
    id: 'dev-cam-imou',
    device_code: 'CAM-IMOU-CLOUD',
    display_name: 'Hệ Thống Camera Wi-Fi Imou Cloud (hepco.camera@gmail.com)',
    category: 'CAMERA',
    ip: 'imou.hepco.cloud',
    mac: 'IMOU-CLOUD-HEPCO',
    vendor: 'Imou Life / Dahua Cloud (hepco.camera@gmail.com)',
    assigned_user: 'Tài khoản Cloud: hepco.camera@gmail.com',
    department: 'Camera',
    location: 'Hệ Thống Camera Wi-Fi Imou Toàn Công Ty',
    status: 'ONLINE',
    last_seen: 'Kết nối Cloud Imou Life',
    openPorts: [443, 554, 37777],
    parent_nvr: 'IMOU_CLOUD',
    parent_nvr_name: 'Imou Cloud (hepco.camera@gmail.com)',
    nvr_channel: 1,
    nvr_rtsp_channel: '1',
    is_nvr: true,
    nvr_role: 'IMOU_CLOUD',
    osd_label: 'Imou (hepco.camera@gmail.com)',
    notes: 'Tài khoản Imou: hepco.camera@gmail.com | Mật khẩu: Hepco@123 | Quản lý trực tuyến qua Imou Life Cloud',
  },
];

export function normalizeInventoryList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  let cleaned = list.filter((d) => d && d.ip !== '10.2.1.154');

  cleaned.forEach((d) => {
    const name = (d.display_name || d.name || '').toLowerCase();
    if (
      name.includes('ricoh') ||
      name.includes('photocopy') ||
      name.includes('7502') ||
      name.includes('7503') ||
      name.includes('im 5000') ||
      name.includes('im5000') ||
      d.id === 'PRN-RICOH-7502' ||
      d.id === 'PRN-RICOH-IM5000' ||
      d.ip === '10.0.0.17' ||
      d.ip === '10.0.0.18'
    ) {
      d.category = 'PRINTER';
      d.department = 'Phòng Tổ chức - Hành chính';
      if (d.ip === '10.0.0.17' || name.includes('7502') || name.includes('7503') || d.id === 'PRN-RICOH-7502') {
        d.ip = '10.0.0.17';
        d.display_name = 'Máy Photocopy Ricoh Aficio MP 7502 (Tổ Chức - Hành Chính)';
        d.assigned_user = 'Phòng Tổ chức - Hành chính';
        d.device_code = 'PRN-RICOH-7502';
      }
      if (d.ip === '10.0.0.18' || name.includes('im 5000') || name.includes('im5000') || d.id === 'PRN-RICOH-IM5000') {
        d.ip = '10.0.0.18';
        d.display_name = 'Máy Photocopy Ricoh IM 5000 (Tổ Chức - Hành Chính)';
        d.assigned_user = 'Phòng Tổ chức - Hành chính';
        d.device_code = 'PRN-RICOH-IM5000';
      }
    }

    if (VERIFIED_CAMERA_MAP[d.ip]) {
      Object.assign(d, VERIFIED_CAMERA_MAP[d.ip]);
    }

    // Ensure all core Wi-Fi routers (especially Tầng 1, Tầng 2, Tầng 3) are properly normalized
    if (VERIFIED_WIFI_ROUTERS[d.ip]) {
      const wf = VERIFIED_WIFI_ROUTERS[d.ip];
      d.department = 'Wi-Fi';
      d.category = 'ROUTER';
      d.display_name = wf.display_name;
      d.device_code = wf.device_code;
      d.assigned_user = wf.assigned_user;
      d.location = wf.location;
      d.vendor = wf.vendor;
      d.model = wf.model;
      d.notes = wf.notes;
      d.specs = { ...(d.specs || {}), ...wf.specs };
    }
  });

  // Inject any missing core Wi-Fi routers (Tầng 1, Tầng 2, Tầng 3)
  Object.keys(VERIFIED_WIFI_ROUTERS).forEach((ip) => {
    if (!cleaned.some((d) => d.ip === ip)) {
      cleaned.push({ ...VERIFIED_WIFI_ROUTERS[ip] });
    }
  });

  // Inject or update Camera Bãi Rác (113.161.8.149) and Camera Imou (hepco.camera@gmail.com)
  EXTRA_CAMERAS.forEach((cam) => {
    const existing = cleaned.find((d) => d.ip === cam.ip || d.id === cam.id);
    if (existing) {
      Object.assign(existing, cam);
    } else {
      cleaned.push({ ...cam });
    }
  });

  cleaned = cleaned.filter(
    (d) =>
      !(
        (d.ip === '10.1.1.17' || d.ip === '10.1.1.18') &&
        (d.category === 'PRINTER' || (d.display_name && d.display_name.toLowerCase().includes('ricoh')))
      )
  );

  return cleaned;
}

let memoryInventory: any[] | null = null;
let pendingPromise: Promise<any[]> | null = null;

export function getCachedInventorySync(): any[] {
  if (memoryInventory && memoryInventory.length > 0) {
    return memoryInventory;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryInventory = normalizeInventoryList(parsed);
        return memoryInventory;
      }
    }
  } catch {}
  return [];
}

export async function loadInventoryFast(forceRefresh = false): Promise<any[]> {
  if (!forceRefresh && memoryInventory && memoryInventory.length > 0) {
    return memoryInventory;
  }
  if (!forceRefresh && pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    let rawList: any[] = [];

    if (typeof window !== 'undefined' && window.hiccDesktop?.loadInventory) {
      try {
        const res = await window.hiccDesktop.loadInventory();
        if (res.success && Array.isArray(res.devices) && res.devices.length > 0) {
          rawList = res.devices;
        }
      } catch {}
    }

    if (rawList.length === 0) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          rawList = JSON.parse(saved);
        }
      } catch {}
    }

    if (rawList.length === 0) {
      try {
        const res = await fetch('/data/devices_inventory.json');
        if (res.ok) {
          rawList = await res.json();
        }
      } catch {}
    }

    const normalized = normalizeInventoryList(rawList);
    if (normalized.length > 0) {
      memoryInventory = normalized;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {}
    }
    pendingPromise = null;
    return memoryInventory || [];
  })();

  return pendingPromise;
}

export async function saveInventoryFast(newList: any[]): Promise<void> {
  const normalized = normalizeInventoryList(newList);
  memoryInventory = normalized;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  if (typeof window !== 'undefined' && window.hiccDesktop?.saveInventory) {
    try {
      await window.hiccDesktop.saveInventory(normalized);
    } catch {}
  }
}
