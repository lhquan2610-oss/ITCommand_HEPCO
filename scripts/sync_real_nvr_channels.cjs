const fs = require('fs');

function syncChannels(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  let devices = JSON.parse(raw);

  // Exact channels from user live photos:
  // NVR 1: 10.110.1.13 (9 Online, 1 Disconnected)
  const nvr1Map = {
    '10.110.1.55': { ch: 1, osd: 'IPC', name: 'Camera Nhà Để Xe Cán Bộ & Ô Tô', loc: 'Nhà Xe Văn Phòng', status: 'ONLINE' },
    '10.110.1.23': { ch: 2, osd: 'Sảnh Chính', name: 'Camera Sảnh Đón Tiếp Khách & Khung Logo HEPCO', loc: 'Sảnh Chính Tòa Nhà Văn Phòng', status: 'ONLINE' },
    '10.110.1.22': { ch: 3, osd: 'IPC', name: 'Camera Phòng Làm Việc & Nội Bộ', loc: 'Phòng Làm Việc Nội Bộ', status: 'ONLINE' },
    '10.110.1.21': { ch: 4, osd: 'San ngoai', name: 'Camera Sân Ngoài & Đường Nội Bộ', loc: 'Sân Ngoài Khuôn Viên', status: 'ONLINE' },
    '10.110.1.57': { ch: 5, osd: 'Tang 2', name: 'Camera Hành Lang Tầng 2 & Cầu Thang', loc: 'Hành Lang Tầng 2 Văn Phòng', status: 'ONLINE' },
    '10.110.1.11': { ch: 6, osd: 'IPC', name: 'Camera Cổng Trước & Lối Vào Tòa Nhà', loc: 'Cổng Trước Cơ Quan', status: 'ONLINE' },
    '10.110.1.56': { ch: 7, osd: 'Sân Vườn', name: 'Camera Sân Vườn & Tiểu Cảnh Giữa 2 Dãy Nhà', loc: 'Sân Vườn Nội Bộ', status: 'ONLINE' },
    '10.110.1.24': { ch: 8, osd: 'IPC', name: 'Camera Sân Đỗ Xe Ô Tô Bên Hông VP', loc: 'Sân Đỗ Xe Bên Hông', status: 'ONLINE' },
    '10.110.1.25': { ch: 9, osd: 'IPC', name: 'Camera Hiên Sảnh Trước & Bậc Tam Cấp', loc: 'Hiên Sảnh Trước', status: 'ONLINE' },
    '10.110.1.26': { ch: 10, osd: 'Disconnect', name: 'Camera Kênh Dự Phòng NVR 01', loc: 'Khu Vực Phụ', status: 'OFFLINE' },
  };

  // NVR 2: 10.110.1.80 (10 Online, 0 Offline)
  const nvr2Map = {
    '10.110.1.103': { ch: 1, osd: 'IP Camera2', name: 'Camera Tuyến Đường Nội Bộ XN (IP Camera2)', loc: 'Đường Nội Bộ Xí Nghiệp', status: 'ONLINE' },
    '10.110.1.135': { ch: 2, osd: 'IP Camera5', name: 'Camera Khu Tập Kết Phế Liệu & Rác Tái Chế (IP Camera5)', loc: 'Bãi Rác Tái Chế & Hàng Rào', status: 'ONLINE' },
    '10.110.1.84': { ch: 3, osd: 'IP Camera12', name: 'Camera Nhà Lán Đỗ Xe Ép Rác (IP Camera12)', loc: 'Lán Xe Chuyên Dùng', status: 'ONLINE' },
    '10.110.1.82': { ch: 4, osd: 'IP Camera11', name: 'Camera Bãi Tập Kết Xe Rác Ngoài Trời (IP Camera11)', loc: 'Bãi Xe Ngoài Trời', status: 'ONLINE' },
    '10.110.1.101': { ch: 5, osd: 'IP Camera9', name: 'Camera Sân Bãi Điều Phối Xe Vận Chuyển (IP Camera9)', loc: 'Sân Bãi Trung Tâm', status: 'ONLINE' },
    '10.110.1.83': { ch: 6, osd: 'XUONG 2', name: 'Camera Xưởng 2 - Phân Loại & Kho Vật Tư (XUONG 2)', loc: 'Xưởng 2 Phân Loại Rác', status: 'ONLINE' },
    '10.110.1.85': { ch: 7, osd: 'HL NGANG2', name: 'Camera Hành Lang Ngang 2 - Lán Xe (HL NGANG2)', loc: 'Hành Lang Ngang 2', status: 'ONLINE' },
    '10.110.1.87': { ch: 8, osd: 'IP Camera7', name: 'Camera Khu Bảo Trì Máy & Xe Bồn Hút (IP Camera7)', loc: 'Trạm Bảo Trì Máy & Xe Bồn', status: 'ONLINE' },
    '10.110.1.88': { ch: 9, osd: 'IP Camera8', name: 'Camera Bãi Đỗ Xe Rác Thùng Xanh (IP Camera8)', loc: 'Bãi Xe Rác Sau Hàng Rào', status: 'ONLINE' },
    '10.110.1.89': { ch: 10, osd: 'IP Camera10', name: 'Camera Xưởng Cơ Khí Sửa Chữa Phương Tiện (IP Camera10)', loc: 'Xưởng Sửa Chữa Cơ Khí', status: 'ONLINE' },
  };

  devices = devices.map(d => {
    if (d.ip === '10.110.1.13') {
      return {
        ...d,
        display_name: 'Đầu Ghi NVR 01 - Trung Tâm (camera.hepco.com.vn)',
        online_channels: 9,
        total_channels: 10,
        status: 'ONLINE',
        notes: 'Đầu Ghi NVR Văn Phòng Trung Tâm: 9 Kênh Đang Phát Trực Tiếp (1 Kênh Ngắt Kết Nối)',
      };
    }
    if (d.ip === '10.110.1.80') {
      return {
        ...d,
        display_name: 'Đầu Ghi NVR 02 - Khu Vực & Xí Nghiệp Ngoại Cảnh',
        online_channels: 10,
        total_channels: 10,
        status: 'ONLINE',
        notes: 'Đầu Ghi NVR Xí Nghiệp Cơ Khí: 10/10 Kênh Đang Phát Trực Tiếp 100%',
      };
    }

    if (nvr1Map[d.ip]) {
      const info = nvr1Map[d.ip];
      return {
        ...d,
        display_name: `Ch.${String(info.ch).padStart(2, '0')}: ${info.name}`,
        osd_label: info.osd,
        location: info.loc,
        parent_nvr: '10.110.1.13',
        parent_nvr_name: 'Đầu Ghi NVR 01 (Văn Phòng)',
        nvr_channel: info.ch,
        nvr_rtsp_channel: `${info.ch}01`,
        status: info.status,
      };
    }

    if (nvr2Map[d.ip]) {
      const info = nvr2Map[d.ip];
      return {
        ...d,
        display_name: `Ch.${String(info.ch).padStart(2, '0')}: ${info.name}`,
        osd_label: info.osd,
        location: info.loc,
        parent_nvr: '10.110.1.80',
        parent_nvr_name: 'Đầu Ghi NVR 02 (Xí Nghiệp)',
        nvr_channel: info.ch,
        nvr_rtsp_channel: `${info.ch}01`,
        status: info.status,
      };
    }

    return d;
  });

  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf8');
  console.log('Synchronized exact NVR channels to:', filePath);
}

syncChannels('data/devices_inventory.json');
syncChannels('frontend/public/data/devices_inventory.json');
syncChannels('frontend/dist/data/devices_inventory.json');
