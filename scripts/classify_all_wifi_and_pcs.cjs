const fs = require('fs');

function updateInventory(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  let devices = JSON.parse(raw);

  const updates = {
    // 1. Wi-Fi Tầng 3 (User highlighted)
    '10.3.1.35': {
      category: 'SWITCH',
      device_code: 'TS-WF-003',
      display_name: 'Modem / Router Wi-Fi ASUS Tầng 3 (Ban Lãnh Đạo & KH)',
      vendor: 'ASUSTek COMPUTER INC.',
      assigned_user: 'Bộ phận CNTT (Quản Trị Wi-Fi Tầng 3)',
      department: 'Phòng Kế hoạch',
      location: 'Tầng 3 - Tòa Nhà Văn Phòng HEPCO',
      status: 'ONLINE',
      notes: 'Thiết bị phát sóng Wi-Fi ASUS Tầng 3 (MAC: CC:28:AA:B6:3A:10), phục vụ Ban Lãnh Đạo và Phòng Kế Hoạch',
      subnet_group: 'Dải 10.3.1.x (Phòng Kế Hoạch & Ban Lãnh Đạo)'
    },

    // 2. Wi-Fi Tầng 1 / Phòng Họp
    '10.1.1.33': {
      category: 'SWITCH',
      device_code: 'TS-WF-001',
      display_name: 'Modem / Router Wi-Fi ASUS Tầng 1 (Phòng Họp & TCHC)',
      vendor: 'ASUSTek COMPUTER INC.',
      assigned_user: 'Bộ phận CNTT (Quản Trị Wi-Fi Tầng 1)',
      department: 'Phòng Tổ chức - Hành chính',
      location: 'Tầng 1 - Phòng Họp Lớn & Sảnh Trung Tâm',
      status: 'ONLINE',
      notes: 'Thiết bị phát sóng Wi-Fi ASUS Tầng 1 (MAC: 04:42:1A:3F:BA:28), phục vụ Phòng Họp và Khối Văn Phòng',
      subnet_group: 'Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)'
    },

    // 3. Wi-Fi Tầng 2 / Kế Toán & Kỹ Thuật
    '10.2.0.191': {
      category: 'SWITCH',
      device_code: 'TS-WF-002',
      display_name: 'Router Wi-Fi TP-Link Tầng 2 (Kế Toán - Tài Vụ & Kỹ Thuật)',
      vendor: 'TP-LINK TECHNOLOGIES CO.,LTD.',
      assigned_user: 'Bộ phận CNTT (Quản Trị Wi-Fi Tầng 2)',
      department: 'Phòng Kế toán - Tài vụ',
      location: 'Tầng 2 - Tòa Nhà Văn Phòng HEPCO',
      status: 'ONLINE',
      notes: 'Thiết bị phát sóng Wi-Fi TP-Link Tầng 2 (MAC: E4:C3:2A:82:AE:A0), phục vụ Phòng Kế toán và Kỹ thuật',
      subnet_group: 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)'
    },

    // 4. Wi-Fi XN Bắc Sông Hương
    '10.11.1.55': {
      category: 'SWITCH',
      device_code: 'TS-WF-011',
      display_name: 'Access Point Wi-Fi TP-Link (XN MT Bắc Sông Hương)',
      vendor: 'TP-Link Systems Inc',
      assigned_user: 'Bộ phận CNTT (Quản Trị Mạng Chi Nhánh)',
      department: 'Xí nghiệp Môi trường Bắc sông Hương',
      location: 'Văn Phòng Điều Hành XN Bắc Sông Hương',
      status: 'ONLINE',
      notes: 'Bộ phát Wi-Fi TP-Link chi nhánh Bắc Sông Hương (MAC: 40:AE:30:C7:5D:FF)',
      subnet_group: 'Dải 10.11.1.x (XN Môi trường Bắc Sông Hương)'
    },

    // 5. Wi-Fi XN Nam Sông Hương
    '10.12.1.66': {
      category: 'SWITCH',
      device_code: 'TS-WF-012',
      display_name: 'Access Point Wi-Fi TP-Link (XN MT Nam Sông Hương)',
      vendor: 'TP-Link Systems Inc',
      assigned_user: 'Bộ phận CNTT (Quản Trị Mạng Chi Nhánh)',
      department: 'Xí nghiệp Môi trường Nam sông Hương',
      location: 'Văn Phòng Điều Hành XN Nam Sông Hương',
      status: 'ONLINE',
      notes: 'Bộ phát Wi-Fi TP-Link chi nhánh Nam Sông Hương (MAC: 50:91:E3:FF:81:60)',
      subnet_group: 'Dải 10.12.1.x (XN Môi trường Nam Sông Hương)'
    },

    // 6. Wi-Fi XN Điện Chiếu Sáng
    '10.20.1.33': {
      category: 'SWITCH',
      device_code: 'TS-WF-020',
      display_name: 'Access Point Wi-Fi TP-Link (XN Điện Chiếu Sáng)',
      vendor: 'TP-Link Systems Inc.',
      assigned_user: 'Bộ phận CNTT (Quản Trị Mạng Chi Nhánh)',
      department: 'Xí nghiệp Điện chiếu sáng',
      location: 'Văn Phòng Điều Hành XN Điện Chiếu Sáng',
      status: 'ONLINE',
      notes: 'Bộ phát Wi-Fi TP-Link chi nhánh Điện Chiếu Sáng (MAC: A8:29:48:98:95:7A)',
      subnet_group: 'Dải 10.20.1.x (XN Điện Chiếu Sáng)'
    },

    // 7. Wi-Fi XN Cơ Khí & Vận Chuyển
    '10.30.1.36': {
      category: 'SWITCH',
      device_code: 'TS-WF-030',
      display_name: 'Access Point Wi-Fi TP-Link (XN Vận Chuyển - Cơ Khí)',
      vendor: 'TP-Link Systems Inc',
      assigned_user: 'Bộ phận CNTT (Quản Trị Mạng Chi Nhánh)',
      department: 'Xí nghiệp Vận chuyển - Cơ khi',
      location: 'Văn Phòng Đội Xe & Xưởng Cơ Khí',
      status: 'ONLINE',
      notes: 'Bộ phát Wi-Fi TP-Link Xí nghiệp Vận chuyển - Cơ khí (MAC: 5C:E9:31:6A:58:2A)',
      subnet_group: 'Dải 10.30.1.x (XN Vận Chuyển - Cơ Khí)'
    },

    // 8. PC MSI XN Cơ Khí
    '10.30.1.69': {
      category: 'WORKSTATION',
      device_code: 'TS-WS-140',
      display_name: 'PC MSI Đội Xe Vận Chuyển (10.30.1.69)',
      vendor: 'Micro-Star INTL CO., LTD. (MSI)',
      assigned_user: 'Cán Bộ Kỹ Thuật Đội Xe',
      department: 'Xí nghiệp Vận chuyển - Cơ khi',
      location: 'Xí Nghiệp Vận Chuyển - Cơ Khí',
      status: 'ONLINE',
      notes: 'Máy tính để bàn Mainboard MSI, đội xe cơ khí vận chuyển (MAC: D8:BB:C1:11:D1:90)',
      subnet_group: 'Dải 10.30.1.x (XN Vận Chuyển - Cơ Khí)'
    },

    // 9. PC Gigabyte Phòng Kế Toán
    '10.2.1.34': {
      category: 'WORKSTATION',
      device_code: 'TS-WS-141',
      display_name: 'PC Gigabyte Kế Toán Viên (10.2.1.34)',
      vendor: 'GIGA-BYTE TECHNOLOGY CO.,LTD.',
      assigned_user: 'Cán Bộ Kế Toán Viên',
      department: 'Phòng Kế toán - Tài vụ',
      location: 'Tầng 2 - Phòng Kế Toán - Tài Vụ',
      status: 'ONLINE',
      notes: 'Máy tính để bàn Mainboard Gigabyte, nghiệp vụ tài vụ (MAC: 74:56:3C:58:10:C2)',
      subnet_group: 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)'
    },

    // 10. PC ASUS Phòng Kỹ Thuật
    '10.2.1.43': {
      category: 'WORKSTATION',
      device_code: 'TS-WS-142',
      display_name: 'PC ASUS Cán Bộ Kỹ Thuật (10.2.1.43)',
      vendor: 'ASUSTek COMPUTER INC.',
      assigned_user: 'Cán Bộ Phòng Kỹ Thuật',
      department: 'Phòng Kỹ thuật',
      location: 'Tầng 2 - Phòng Kỹ Thuật',
      status: 'ONLINE',
      notes: 'Máy tính để bàn Mainboard ASUS, phòng kỹ thuật đồ họa & dự toán (MAC: 10:7C:61:E2:D5:40)',
      subnet_group: 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)'
    },

    // 11. PC Gigabyte Phòng Kế Toán
    '10.2.1.52': {
      category: 'WORKSTATION',
      device_code: 'TS-WS-143',
      display_name: 'PC Gigabyte Kế Toán Thanh Toán (10.2.1.52)',
      vendor: 'GIGA-BYTE TECHNOLOGY CO.,LTD.',
      assigned_user: 'Cán Bộ Kế Toán Thanh Toán',
      department: 'Phòng Kế toán - Tài vụ',
      location: 'Tầng 2 - Phòng Kế Toán - Tài Vụ',
      status: 'ONLINE',
      notes: 'Máy tính để bàn Mainboard Gigabyte, thanh toán chứng từ (MAC: 74:56:3C:2D:BC:DD)',
      subnet_group: 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)'
    }
  };

  devices = devices.map(d => {
    if (updates[d.ip]) {
      return { ...d, ...updates[d.ip] };
    }
    return d;
  });

  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf8');
  console.log('Successfully classified all 11 devices in:', filePath);
}

updateInventory('data/devices_inventory.json');
updateInventory('frontend/public/data/devices_inventory.json');
updateInventory('frontend/dist/data/devices_inventory.json');
