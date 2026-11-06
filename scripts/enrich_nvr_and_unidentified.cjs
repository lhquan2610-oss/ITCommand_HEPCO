const fs = require('fs');
const path = require('path');

function processInventory(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let devices = JSON.parse(raw);

  // 1. Enrich Identified Devices from Deep Audit
  devices = devices.map(d => {
    if (d.ip === '10.0.0.6') {
      return {
        ...d,
        display_name: 'PC Giám Sát Tổ Chức Đảng (GSPTCD)',
        assigned_user: 'Ban Giám Sát / Văn Phòng Đảng Ủy',
        department: 'Phòng Tổ chức - Hành chính',
        hostname: 'GSPTCD.hepco.com.vn',
        mac: 'B4-2E-99-0D-E1-61',
        category: 'WORKSTATION',
        notes: 'Đã định danh qua Reverse DNS & NetBIOS: GSPTCD.hepco.com.vn',
      };
    }
    if (d.ip === '10.1.1.99') {
      return {
        ...d,
        display_name: 'Trạm Máy Scan Tài Liệu Chuyên Dụng (SCAN)',
        assigned_user: 'Bộ phận Văn Thư - Lưu Trữ',
        department: 'Máy in, Scan, Photocopy',
        hostname: 'Scan.hepco.com.vn',
        mac: '74-56-3C-74-58-64',
        category: 'PRINTER',
        notes: 'Đã định danh qua Reverse DNS & NetBIOS: Scan.hepco.com.vn',
      };
    }
    if (d.ip === '10.30.1.26') {
      return {
        ...d,
        display_name: 'VTHCHUONG (PC Điều Hành Đội Xe)',
        assigned_user: 'Võ Thị Hồng Chương',
        department: 'Xí nghiệp Vận chuyển - Cơ khí',
        hostname: 'VTHCHUONG',
        mac: '34-5A-60-3B-11-38',
        category: 'WORKSTATION',
        notes: 'Đã định danh qua NetBIOS: VTHCHUONG thuộc Subnet Cơ khí 10.30.x.x',
      };
    }
    return d;
  });

  // 2. Camera & NVR Grouping
  const nvr1_ips = {
    '10.110.1.11': { ch: 1, name: 'Camera Hikvision Cổng Chính & Hàng Rào VP' },
    '10.110.1.21': { ch: 2, name: 'Camera Sân Trước Tòa Nhà VP' },
    '10.110.1.22': { ch: 3, name: 'Camera Hành Lang Tầng 1' },
    '10.110.1.23': { ch: 4, name: 'Camera Sảnh Tiếp Khách & Cửa Chính' },
    '10.110.1.55': { ch: 5, name: 'Camera Nhà Để Xe Cán Bộ CNV' },
    '10.110.1.56': { ch: 6, name: 'Camera Cổng Phụ & Lối Đi Sau' },
    '10.110.1.57': { ch: 7, name: 'Camera Cầu Thang & Lối Lên Tầng 2' },
  };

  const nvr2_ips = {
    '10.110.1.82': { ch: 1, name: 'Camera Xưởng Cơ Khí Vận Chuyển 1' },
    '10.110.1.83': { ch: 2, name: 'Camera Xưởng Cơ Khí Vận Chuyển 2' },
    '10.110.1.84': { ch: 3, name: 'Camera Bãi Xe Chuyên Dụng' },
    '10.110.1.85': { ch: 4, name: 'Camera Trạm Sửa Chữa & Bảo Dưỡng' },
    '10.110.1.87': { ch: 5, name: 'Camera Cổng Kiểm Soát Cơ Khí' },
    '10.110.1.88': { ch: 6, name: 'Camera Kho Vật Tư & Phụ Tùng' },
    '10.110.1.89': { ch: 7, name: 'Camera Trạm Cân Xe Rác' },
    '10.110.1.101': { ch: 8, name: 'Camera Bãi Xe Thủy Xuân 1' },
    '10.110.1.102': { ch: 9, name: 'Camera Bãi Xe Thủy Xuân 2' },
    '10.110.1.103': { ch: 10, name: 'Camera Đường Nội Bộ Xí Nghiệp' },
    '10.110.1.135': { ch: 11, name: 'Camera Khu Xử Lý Nước Rác' },
    '10.110.1.136': { ch: 12, name: 'Camera Nhà Máy Xử Lý Chất Thải' },
    '10.110.1.137': { ch: 13, name: 'Camera Hàng Rào Bảo Vệ Xí Nghiệp XL' },
  };

  devices = devices.map(d => {
    if (d.ip === '10.110.1.13') {
      return {
        ...d,
        display_name: 'Đầu Ghi NVR 01 - Trung Tâm (camera.hepco.com.vn)',
        is_nvr: true,
        nvr_role: 'NVR_MASTER',
        managed_channels: Object.keys(nvr1_ips).length,
        notes: 'Đầu Ghi NVR Hikvision Quản lý 7 camera con khu vực Văn phòng trung tâm',
        web_url: 'http://10.110.1.13',
        rtsp_base: 'rtsp://10.110.1.13:554/Streaming/Channels/',
      };
    }
    if (d.ip === '10.110.1.80') {
      return {
        ...d,
        display_name: 'Đầu Ghi NVR 02 - Khu Vực & Xí Nghiệp Ngoại Cảnh',
        is_nvr: true,
        nvr_role: 'NVR_SECONDARY',
        managed_channels: Object.keys(nvr2_ips).length,
        notes: 'Đầu Ghi NVR Hikvision Quản lý 13 camera con khu vực Xí nghiệp, Cơ khí & Trạm cân',
        web_url: 'http://10.110.1.80',
        rtsp_base: 'rtsp://10.110.1.80:554/Streaming/Channels/',
      };
    }

    if (nvr1_ips[d.ip]) {
      const info = nvr1_ips[d.ip];
      return {
        ...d,
        display_name: info.name,
        parent_nvr: '10.110.1.13',
        parent_nvr_name: 'Đầu Ghi NVR 01 (Văn Phòng)',
        nvr_channel: info.ch,
        nvr_rtsp_channel: `${info.ch}01`,
        notes: `Camera con Kênh ${info.ch} thuộc Đầu Ghi NVR 10.110.1.13`,
      };
    }

    if (nvr2_ips[d.ip]) {
      const info = nvr2_ips[d.ip];
      return {
        ...d,
        display_name: info.name,
        parent_nvr: '10.110.1.80',
        parent_nvr_name: 'Đầu Ghi NVR 02 (Xí Nghiệp)',
        nvr_channel: info.ch,
        nvr_rtsp_channel: `${info.ch}01`,
        notes: `Camera con Kênh ${info.ch} thuộc Đầu Ghi NVR 10.110.1.80`,
      };
    }

    return d;
  });

  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf8');
  console.log('Successfully enriched inventory:', filePath, 'Total items:', devices.length);
}

processInventory('data/devices_inventory.json');
processInventory('frontend/public/data/devices_inventory.json');
