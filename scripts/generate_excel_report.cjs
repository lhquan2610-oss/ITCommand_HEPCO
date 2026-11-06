const ExcelJS = require('../frontend/node_modules/exceljs');
const fs = require('fs');
const path = require('path');

async function generateReport() {
  const invPath = path.resolve('data/devices_inventory.json');
  const devices = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO IT Command Center';
  workbook.lastModifiedBy = 'HEPCO IT Department';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Colors
  const COLOR_HEADER_GREEN = '059669';
  const COLOR_HEADER_NAVY = '1E3A8A';
  const COLOR_HEADER_TEAL = '0F766E';
  const COLOR_HEADER_PURPLE = '581C87';
  const COLOR_HEADER_AMBER = 'B45309';
  const COLOR_ZEBRA = 'F9FAFB';

  const BORDER_THIN = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } }
  };

  // -------------------------------------------------------------
  // SHEET 1: TỔNG QUAN & THỐNG KÊ (DASHBOARD)
  // -------------------------------------------------------------
  const ws1 = workbook.addWorksheet('📊 Tổng Quan & Thống Kê', {
    views: [{ showGridLines: true }]
  });

  ws1.columns = [
    { width: 6 },
    { width: 35 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 18 }
  ];

  // Header Title
  ws1.mergeCells('A1:H1');
  const title1 = ws1.getCell('A1');
  title1.value = 'CÔNG TY CỔ PHẦN MÔI TRƯỜNG VÀ CÔNG TRÌNH ĐÔ THỊ HUẾ (HEPCO)';
  title1.font = { name: 'Arial', size: 12, bold: true, color: { argb: '065F46' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 24;

  ws1.mergeCells('A2:H2');
  const title2 = ws1.getCell('A2');
  title2.value = 'BỘ PHẬN CÔNG NGHỆ THÔNG TIN - HỆ THỐNG COMMAND CENTER (HICC V1.0)';
  title2.font = { name: 'Arial', size: 10, italic: true, color: { argb: '4B5563' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(2).height = 20;

  ws1.mergeCells('A3:H3');
  const title3 = ws1.getCell('A3');
  title3.value = 'BÁO CÁO TỔNG KIỂM KÊ TÀI SẢN & HẠ TẦNG CÔNG NGHỆ THÔNG TIN';
  title3.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_GREEN } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(3).height = 36;

  ws1.mergeCells('A4:H4');
  const title4 = ws1.getCell('A4');
  const todayStr = new Date().toLocaleDateString('vi-VN');
  title4.value = `Thời điểm xuất báo cáo: ${todayStr} | Trạng thái hạ tầng: 100% Hoạt động On-Premise LAN`;
  title4.font = { name: 'Arial', size: 9, italic: true, color: { argb: '374151' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(4).height = 22;

  // Empty row 5
  ws1.getRow(5).height = 12;

  // KPI Summary Row 6 & 7
  ws1.mergeCells('A6:B6');
  ws1.getCell('A6').value = 'TỔNG THIẾT BỊ';
  ws1.getCell('A6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  ws1.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  ws1.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('A7:B7');
  ws1.getCell('A7').value = `${devices.length} Thiết bị`;
  ws1.getCell('A7').font = { name: 'Arial', size: 14, bold: true, color: { argb: '065F46' } };
  ws1.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('C6:D6');
  ws1.getCell('C6').value = 'MÁY TÍNH TRẠM (PC)';
  ws1.getCell('C6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  ws1.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_NAVY } };
  ws1.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

  const pcCount = devices.filter(d => d.category === 'WORKSTATION').length;
  ws1.mergeCells('C7:D7');
  ws1.getCell('C7').value = `${pcCount} Máy trạm`;
  ws1.getCell('C7').font = { name: 'Arial', size: 14, bold: true, color: { argb: COLOR_HEADER_NAVY } };
  ws1.getCell('C7').alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('E6:F6');
  ws1.getCell('E6').value = 'SWITCH & WI-FI LÕI';
  ws1.getCell('E6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  ws1.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_TEAL } };
  ws1.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' };

  const swCount = devices.filter(d => d.category === 'SWITCH' || d.category === 'ROUTER').length;
  ws1.mergeCells('E7:F7');
  ws1.getCell('E7').value = `${swCount} Thiết bị`;
  ws1.getCell('E7').font = { name: 'Arial', size: 14, bold: true, color: { argb: COLOR_HEADER_TEAL } };
  ws1.getCell('E7').alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('G6:H6');
  ws1.getCell('G6').value = 'CAMERA & MÁY CHỦ';
  ws1.getCell('G6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  ws1.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_PURPLE } };
  ws1.getCell('G6').alignment = { horizontal: 'center', vertical: 'middle' };

  const camCount = devices.filter(d => d.category === 'CAMERA').length;
  const srvCount = devices.filter(d => d.category === 'SERVER').length;
  ws1.mergeCells('G7:H7');
  ws1.getCell('G7').value = `${camCount} Cam + ${srvCount} Server`;
  ws1.getCell('G7').font = { name: 'Arial', size: 14, bold: true, color: { argb: COLOR_HEADER_PURPLE } };
  ws1.getCell('G7').alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.getRow(6).height = 22;
  ws1.getRow(7).height = 28;

  // Add borders to cards
  ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'].forEach(c => {
    ws1.getCell(c).border = BORDER_THIN;
  });

  // Empty row 8
  ws1.getRow(8).height = 14;

  // Department Table Header
  const deptHeaders = ['STT', 'Đơn Vị / Phòng Ban', 'Máy Trạm (PC)', 'Máy In / Photo', 'Switch & Wi-Fi', 'Camera An Ninh', 'Tổng Thiết Bị', 'Tỷ Lệ Hoạt Động'];
  const r9 = ws1.addRow(deptHeaders);
  r9.height = 26;
  r9.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065F46' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_THIN;
  });

  // Department List
  const departments = [
    'Wi-Fi',
    'Ban Lãnh Đạo',
    'Phòng Tổ chức - Hành chính',
    'Phòng Kỹ thuật',
    'Phòng Kế toán - Tài vụ',
    'Phòng Kế hoạch',
    'Xí nghiệp Môi trường Bắc sông Hương',
    'Xí nghiệp Môi trường Nam sông Hương',
    'Xí nghiệp Điện chiếu sáng',
    'Xí nghiệp Vận chuyển - Cơ khi',
    'Xí nghiệp Thoát nước',
    'Xí nghiệp Xử lý chất thải',
    'Ban quản trang',
    'Trạm cân',
    'Máy chủ',
    'Camera',
    'Máy in, Scan, Photocopy'
  ];

  let stt = 1;
  departments.forEach(dept => {
    const list = devices.filter(d => d.department === dept);
    if (list.length === 0) return;

    const pcs = list.filter(d => d.category === 'WORKSTATION').length;
    const prns = list.filter(d => d.category === 'PRINTER').length;
    const nets = list.filter(d => d.category === 'SWITCH' || d.category === 'ROUTER').length;
    const cams = list.filter(d => d.category === 'CAMERA').length;
    const total = list.length;
    const online = list.filter(d => d.status === 'ONLINE').length;
    const rate = total > 0 ? `${Math.round((online / total) * 100)}%` : '100%';

    const row = ws1.addRow([
      stt++,
      dept,
      pcs || '-',
      prns || '-',
      nets || '-',
      cams || '-',
      total,
      rate
    ]);
    row.height = 22;

    const isEven = stt % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = BORDER_THIN;
      if (colNum === 1 || colNum >= 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (colNum === 7) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '065F46' } };
      }
      if (colNum === 8) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '059669' } };
      }
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
      }
    });
  });

  // Summary Row
  const sumRow = ws1.addRow(['', 'TỔNG CỘNG TOÀN CÔNG TY', pcCount, devices.filter(d => d.category === 'PRINTER').length, swCount, camCount, devices.length, '100%']);
  sumRow.height = 26;
  sumRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '065F46' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '059669' } },
      bottom: { style: 'double', color: { argb: '059669' } },
      left: { style: 'thin', color: { argb: 'D1D5DB' } },
      right: { style: 'thin', color: { argb: 'D1D5DB' } }
    };
    if (colNum === 1 || colNum >= 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  // Footer Signatures
  ws1.addRow([]);
  ws1.addRow([]);
  const signRow = ws1.addRow(['', 'NGƯỜI LẬP BIỂU', '', 'CÁN BỘ QUẢN TRỊ CNTT', '', '', 'GIÁM ĐỐC PHÊ DUYỆT', '']);
  signRow.height = 22;
  signRow.eachCell(c => {
    c.font = { name: 'Arial', size: 10, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const signNote = ws1.addRow(['', '(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký, đóng dấu)', '']);
  signNote.eachCell(c => {
    c.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // -------------------------------------------------------------
  // HELPER FOR DATA SHEETS
  // -------------------------------------------------------------
  function addDataSheet(title, color, cols, dataRows) {
    const ws = workbook.addWorksheet(title, { views: [{ showGridLines: true }] });
    ws.columns = cols;

    // Header banner
    const r1 = ws.addRow([title.toUpperCase()]);
    ws.mergeCells(1, 1, 1, cols.length);
    r1.height = 32;
    const c1 = ws.getCell(1, 1);
    c1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Column Headers
    const colHeaders = cols.map(c => c.header);
    const r2 = ws.addRow(colHeaders);
    r2.height = 24;
    r2.eachCell(c => {
      c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = BORDER_THIN;
    });

    // Data rows
    dataRows.forEach((rowVals, idx) => {
      const r = ws.addRow(rowVals);
      r.height = 20;
      const isEven = idx % 2 === 1;
      r.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = BORDER_THIN;
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
        }
        // Center alignment for index, IP, MAC, status
        const header = colHeaders[colNum - 1];
        if (['STT', 'Địa Chỉ IP', 'Địa Chỉ MAC', 'Trạng Thái', 'Kênh NVR', 'Cổng Dịch Vụ'].includes(header)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (header === 'Trạng Thái') {
          if (cell.value === 'ONLINE') {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '059669' } };
          } else {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'DC2626' } };
          }
        }
        if (header === 'Địa Chỉ IP') {
          cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: '1E3A8A' } };
        }
        if (header === 'Địa Chỉ MAC') {
          cell.font = { name: 'Consolas', size: 9, color: { argb: '4B5563' } };
        }
      });
    });
  }

  // -------------------------------------------------------------
  // SHEET 2: MÁY TÍNH TRẠM (WORKSTATIONS)
  // -------------------------------------------------------------
  const wsCols = [
    { header: 'STT', width: 6 },
    { header: 'Mã Thiết Bị', width: 14 },
    { header: 'Tên Máy Tính', width: 22 },
    { header: 'Cán Bộ Sử Dụng', width: 22 },
    { header: 'Đơn Vị / Phòng Ban', width: 26 },
    { header: 'Nhà Sản Xuất', width: 16 },
    { header: 'Cấu Hình Linh Kiện (CPU / RAM / Ổ Cứng)', width: 38 },
    { header: 'Hệ Điều Hành', width: 16 },
    { header: 'Địa Chỉ IP', width: 16 },
    { header: 'Địa Chỉ MAC', width: 18 },
    { header: 'Trạng Thái', width: 14 },
  ];

  const wsRows = devices.filter(d => d.category === 'WORKSTATION').map((d, idx) => {
    const hw = [
      d.cpu ? `CPU: ${d.cpu}` : '',
      d.ram ? `RAM: ${d.ram}` : '',
      d.storage ? `Disk: ${d.storage}` : '',
    ].filter(Boolean).join(' | ') || d.notes || 'Chuẩn Văn Phòng';

    return [
      idx + 1,
      d.device_code || d.id,
      d.display_name,
      d.assigned_user || '-',
      d.department || '-',
      d.vendor || '-',
      hw,
      d.os || 'Windows Pro',
      d.ip,
      d.mac,
      d.status || 'ONLINE'
    ];
  });

  addDataSheet('💻 Máy Tính Trạm (91 PC)', COLOR_HEADER_NAVY, wsCols, wsRows);

  // -------------------------------------------------------------
  // SHEET 3: HẠ TẦNG SWITCH & WI-FI
  // -------------------------------------------------------------
  const netCols = [
    { header: 'STT', width: 6 },
    { header: 'Tên Thiết Bị Mạng', width: 30 },
    { header: 'Phân Loại', width: 18 },
    { header: 'Địa Chỉ IP', width: 16 },
    { header: 'Địa Chỉ MAC', width: 18 },
    { header: 'Nhà Sản Xuất', width: 18 },
    { header: 'Khu Vực Lắp Đặt', width: 28 },
    { header: 'Dải Mạng (VLAN)', width: 18 },
    { header: 'Trạng Thái', width: 14 }
  ];

  const netRows = devices.filter(d => d.category === 'SWITCH' || d.category === 'ROUTER').map((d, idx) => [
    idx + 1,
    d.display_name,
    d.category === 'SWITCH' ? 'Switch L2/L3' : 'Router / Wi-Fi',
    d.ip,
    d.mac,
    d.vendor || 'Cisco / ASUS / TP-Link',
    d.location || d.department || 'Trung Tâm',
    d.ip.substring(0, d.ip.lastIndexOf('.')) + '.0/24',
    d.status || 'ONLINE'
  ]);

  addDataSheet('🖧 Hạ Tầng Switch & Wi-Fi', COLOR_HEADER_TEAL, netCols, netRows);

  // -------------------------------------------------------------
  // SHEET 4: MÁY CHỦ (SERVERS)
  // -------------------------------------------------------------
  const srvCols = [
    { header: 'STT', width: 6 },
    { header: 'Tên Máy Chủ', width: 28 },
    { header: 'Vai Trò Hệ Thống', width: 24 },
    { header: 'Model Phần Cứng', width: 22 },
    { header: 'Cấu Hình Kỹ Thuật (CPU / RAM / RAID)', width: 36 },
    { header: 'Địa Chỉ IP', width: 16 },
    { header: 'Địa Chỉ MAC', width: 18 },
    { header: 'Hệ Điều Hành', width: 20 },
    { header: 'Trạng Thái', width: 14 }
  ];

  const srvRows = devices.filter(d => d.category === 'SERVER').map((d, idx) => [
    idx + 1,
    d.display_name,
    d.ip === '10.0.0.1' ? 'Domain Controller / DNS / DHCP' : d.ip === '10.0.0.8' ? 'QL Xe & Cơ Sở Dữ Liệu' : 'Máy Chủ Ứng Dụng',
    d.vendor || 'HPE / Dell Enterprise',
    [d.cpu ? `CPU: ${d.cpu}` : '', d.ram ? `RAM: ${d.ram}` : '', d.storage ? `Storage: ${d.storage}` : ''].filter(Boolean).join(' | ') || 'Xeon Multi-Core Server',
    d.ip,
    d.mac,
    d.os || 'Windows Server',
    d.status || 'ONLINE'
  ]);

  addDataSheet('🖥️ Máy Chủ (Servers)', COLOR_HEADER_PURPLE, srvCols, srvRows);

  // -------------------------------------------------------------
  // SHEET 5: MÁY IN & PHOTOCOPY (PRINTERS)
  // -------------------------------------------------------------
  const prnCols = [
    { header: 'STT', width: 6 },
    { header: 'Dòng Máy In / Photocopy', width: 30 },
    { header: 'Nhà Sản Xuất', width: 18 },
    { header: 'Phòng Ban Quản Lý', width: 28 },
    { header: 'Địa Chỉ IP', width: 16 },
    { header: 'Địa Chỉ MAC', width: 18 },
    { header: 'Cổng Dịch Vụ', width: 16 },
    { header: 'Trạng Thái', width: 14 }
  ];

  const prnRows = devices.filter(d => d.category === 'PRINTER').map((d, idx) => [
    idx + 1,
    d.display_name,
    d.vendor || 'Ricoh / Canon / HP',
    d.department || 'Văn Phòng',
    d.ip,
    d.mac,
    '515 (LPD) / 9100 (RAW)',
    d.status || 'ONLINE'
  ]);

  addDataSheet('🖨️ Máy In & Photocopy', COLOR_HEADER_AMBER, prnCols, prnRows);

  // -------------------------------------------------------------
  // SHEET 6: CAMERA AN NINH & NVR (CCTV)
  // -------------------------------------------------------------
  const camCols = [
    { header: 'STT', width: 6 },
    { header: 'Tên Camera / Vị Trí Lắp Đặt', width: 36 },
    { header: 'Thuộc Đầu Ghi Quản Lý', width: 24 },
    { header: 'Kênh NVR', width: 12 },
    { header: 'Nhãn OSD', width: 16 },
    { header: 'Địa Chỉ IP', width: 16 },
    { header: 'Địa Chỉ MAC', width: 18 },
    { header: 'Nhà Sản Xuất', width: 18 },
    { header: 'Trạng Thái', width: 14 }
  ];

  const camRows = devices.filter(d => d.category === 'CAMERA').map((d, idx) => {
    const isNvr = d.ip === '10.110.1.13' || d.ip === '10.110.1.80';
    return [
      idx + 1,
      d.display_name,
      isNvr ? '⭐ ĐẦU GHI CHÍNH' : d.parent_nvr === '10.110.1.13' ? 'NVR 01: Văn Phòng (10.110.1.13)' : 'NVR 02: Hương Sơ (10.110.1.80)',
      isNvr ? 'MASTER' : d.nvr_channel ? `Kênh ${String(d.nvr_channel).padStart(2, '0')}` : '-',
      d.osd_label || '-',
      d.ip,
      d.mac,
      d.vendor || 'Hikvision / Dahua',
      d.status || 'ONLINE'
    ];
  });

  addDataSheet('📹 Camera & Đầu Ghi NVR', COLOR_HEADER_GREEN, camCols, camRows);

  const outPath = path.resolve('HEPCO_SO_KIEM_KE_TAI_SAN_VA_HA_TANG_CNTT_2026.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log(`Successfully generated: ${outPath} (${fs.statSync(outPath).size} bytes)`);
}

generateReport().catch(console.error);
