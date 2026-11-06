import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Layers,
  Sparkles,
  Server,
  Monitor,
  Printer,
  Video,
  Wifi,
  Table,
  Check,
  Calendar,
  Building,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [exporting, setExporting] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const getRealDevices = async () => {
    let list: any[] = [];
    if (window.hiccDesktop?.loadInventory) {
      try {
        const res = await window.hiccDesktop.loadInventory();
        if (res.success && Array.isArray(res.devices)) list = res.devices;
      } catch {}
    }
    if (list.length === 0) {
      const saved = localStorage.getItem('hicc_real_devices_inventory');
      if (saved) {
        try { list = JSON.parse(saved); } catch {}
      }
    }
    if (list.length === 0) {
      try {
        const res = await fetch('/data/devices_inventory.json');
        if (res.ok) list = await res.json();
      } catch {}
    }
    return list;
  };

  // -------------------------------------------------------------
  // MASTER EXCEL WORKBOOK GENERATOR (6 SHEETS, STYLED, BEAUTIFUL)
  // -------------------------------------------------------------
  const exportMasterExcelWorkbook = async () => {
    setExporting('MASTER');
    try {
      const devices = await getRealDevices();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'HEPCO IT Command Center';
      workbook.lastModifiedBy = 'HEPCO IT Admin';
      workbook.created = new Date();

      const COLOR_HEADER_GREEN = '059669';
      const COLOR_HEADER_NAVY = '1E3A8A';
      const COLOR_HEADER_TEAL = '0F766E';
      const COLOR_HEADER_PURPLE = '581C87';
      const COLOR_HEADER_AMBER = 'B45309';
      const COLOR_ZEBRA = 'F9FAFB';

      const BORDER_THIN: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } }
      };

      // =========================================================
      // SHEET 1: TỔNG QUAN & THỐNG KÊ (DASHBOARD)
      // =========================================================
      const ws1 = workbook.addWorksheet('📊 Tổng Quan & Thống Kê', {
        views: [{ showGridLines: true }]
      });

      ws1.columns = [
        { width: 6 },
        { width: 36 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 18 },
        { width: 18 }
      ];

      // Enterprise Banner Header
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
      title3.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
      title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_GREEN } };
      title3.alignment = { horizontal: 'center', vertical: 'middle' };
      ws1.getRow(3).height = 36;

      ws1.mergeCells('A4:H4');
      const title4 = ws1.getCell('A4');
      const todayStr = new Date().toLocaleDateString('vi-VN');
      title4.value = `Thời điểm xuất báo cáo: Ngày ${todayStr} | Trạng thái hạ tầng: 100% Hoạt động On-Premise LAN`;
      title4.font = { name: 'Arial', size: 9, italic: true, color: { argb: '374151' } };
      title4.alignment = { horizontal: 'center', vertical: 'middle' };
      ws1.getRow(4).height = 22;

      ws1.getRow(5).height = 12;

      // Executive KPI Cards (Row 6 & 7)
      const pcCount = devices.filter((d: any) => d.category === 'WORKSTATION').length;
      const swCount = devices.filter((d: any) => d.category === 'SWITCH' || d.category === 'ROUTER').length;
      const camCount = devices.filter((d: any) => d.category === 'CAMERA').length;
      const srvCount = devices.filter((d: any) => d.category === 'SERVER').length;
      const prnCount = devices.filter((d: any) => d.category === 'PRINTER').length;

      ws1.mergeCells('A6:B6');
      ws1.getCell('A6').value = 'TỔNG THIẾT BỊ';
      ws1.getCell('A6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      ws1.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
      ws1.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('A7:B7');
      ws1.getCell('A7').value = `${devices.length} Thiết Bị`;
      ws1.getCell('A7').font = { name: 'Arial', size: 13, bold: true, color: { argb: '065F46' } };
      ws1.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('C6:D6');
      ws1.getCell('C6').value = 'MÁY TÍNH TRẠM (PC)';
      ws1.getCell('C6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      ws1.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_NAVY } };
      ws1.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('C7:D7');
      ws1.getCell('C7').value = `${pcCount} Máy trạm`;
      ws1.getCell('C7').font = { name: 'Arial', size: 13, bold: true, color: { argb: COLOR_HEADER_NAVY } };
      ws1.getCell('C7').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('E6:F6');
      ws1.getCell('E6').value = 'HẠ TẦNG SWITCH & WI-FI';
      ws1.getCell('E6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      ws1.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_TEAL } };
      ws1.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('E7:F7');
      ws1.getCell('E7').value = `${swCount} Thiết bị mạng`;
      ws1.getCell('E7').font = { name: 'Arial', size: 13, bold: true, color: { argb: COLOR_HEADER_TEAL } };
      ws1.getCell('E7').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('G6:H6');
      ws1.getCell('G6').value = 'CAMERA & MÁY CHỦ';
      ws1.getCell('G6').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      ws1.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_PURPLE } };
      ws1.getCell('G6').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.mergeCells('G7:H7');
      ws1.getCell('G7').value = `${camCount} Cam + ${srvCount} Srv`;
      ws1.getCell('G7').font = { name: 'Arial', size: 13, bold: true, color: { argb: COLOR_HEADER_PURPLE } };
      ws1.getCell('G7').alignment = { horizontal: 'center', vertical: 'middle' };

      ws1.getRow(6).height = 22;
      ws1.getRow(7).height = 28;

      ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'].forEach(c => {
        ws1.getCell(c).border = BORDER_THIN;
      });

      ws1.getRow(8).height = 14;

      // Department Statistics Table
      const deptHeaders = ['STT', 'Đơn Vị / Phòng Ban', 'Máy Trạm (PC)', 'Máy In / Photo', 'Switch & Wi-Fi', 'Camera An Ninh', 'Tổng Thiết Bị', 'Tỷ Lệ Hoạt Động'];
      const r9 = ws1.addRow(deptHeaders);
      r9.height = 26;
      r9.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065F46' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = BORDER_THIN;
      });

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
        const list = devices.filter((d: any) => d.department === dept);
        if (list.length === 0) return;

        const pcs = list.filter((d: any) => d.category === 'WORKSTATION').length;
        const prns = list.filter((d: any) => d.category === 'PRINTER').length;
        const nets = list.filter((d: any) => d.category === 'SWITCH' || d.category === 'ROUTER').length;
        const cams = list.filter((d: any) => d.category === 'CAMERA').length;
        const total = list.length;
        const online = list.filter((d: any) => d.status === 'ONLINE').length;
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

      // Summary Total Row
      const sumRow = ws1.addRow(['', 'TỔNG CỘNG TOÀN CÔNG TY', pcCount, prnCount, swCount, camCount, devices.length, '100%']);
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

      // Signature Block
      ws1.addRow([]);
      ws1.addRow([]);
      const signRow = ws1.addRow(['', 'NGƯỜI LẬP BÁO CÁO', '', 'CÁN BỘ QUẢN TRỊ CNTT', '', '', 'TỔNG GIÁM ĐỐC PHÊ DUYỆT', '']);
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

      // =========================================================
      // HELPER: BUILD DATA TAB SHEETS
      // =========================================================
      const addDataSheet = (title: string, color: string, cols: any[], dataRows: any[]) => {
        const ws = workbook.addWorksheet(title, { views: [{ showGridLines: true }] });
        ws.columns = cols;

        const r1 = ws.addRow([title.toUpperCase()]);
        ws.mergeCells(1, 1, 1, cols.length);
        r1.height = 32;
        const c1 = ws.getCell(1, 1);
        c1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        c1.alignment = { horizontal: 'center', vertical: 'middle' };

        const colHeaders = cols.map(c => c.header);
        const r2 = ws.addRow(colHeaders);
        r2.height = 24;
        r2.eachCell(c => {
          c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
          c.border = BORDER_THIN;
        });

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
      };

      // SHEET 2: MÁY TÍNH TRẠM (WORKSTATIONS)
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
      const wsRows = devices.filter((d: any) => d.category === 'WORKSTATION').map((d: any, idx: number) => {
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

      // SHEET 3: HẠ TẦNG SWITCH & WI-FI
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
      const netRows = devices.filter((d: any) => d.category === 'SWITCH' || d.category === 'ROUTER').map((d: any, idx: number) => [
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

      // SHEET 4: MÁY CHỦ (SERVERS)
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
      const srvRows = devices.filter((d: any) => d.category === 'SERVER').map((d: any, idx: number) => [
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

      // SHEET 5: MÁY IN & PHOTOCOPY (PRINTERS)
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
      const prnRows = devices.filter((d: any) => d.category === 'PRINTER').map((d: any, idx: number) => [
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

      // SHEET 6: CAMERA AN NINH & NVR (CCTV)
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
      const camRows = devices.filter((d: any) => d.category === 'CAMERA').map((d: any, idx: number) => {
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

      // Write binary Excel buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `HEPCO_SO_KIEM_KE_TAI_SAN_VA_HA_TANG_CNTT_${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Đã xuất thành công Sổ Kiểm Kê Excel đa bảng chuẩn Doanh Nghiệp!');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      alert('Lỗi xuất Excel: ' + err.message);
    } finally {
      setExporting('');
    }
  };

  const handleBackupDatabaseJson = async () => {
    try {
      const devices = await getRealDevices();
      const dataStr = JSON.stringify(devices, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HEPCO_HICC_DATABASE_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Đã sao lưu thành công file cơ sở dữ liệu JSON an toàn!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Lỗi sao lưu: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Trung Tâm Xuất Báo Cáo & Sổ Kiểm Kê Tài Sản CNTT Chuẩn Excel
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300">
                CHUYÊN NGHIỆP 6 SHEET
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo file Microsoft Excel (.XLSX) chuẩn biểu mẫu doanh nghiệp: chia bảng phân loại, phối màu nhận diện HEPCO, định dạng viền, canh lề và khối chữ ký phê duyệt.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Primary Highlight: Executive Excel Workbook (.XLSX) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white border border-emerald-700/60 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Table className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-bold text-base text-emerald-300 tracking-wide">
                SỔ TỔNG KIỂM KÊ TÀI SẢN & HẠ TẦNG CNTT DOANH NGHIỆP (.XLSX)
              </h3>
              <span className="text-xs text-slate-300 font-mono">
                Bao gồm 06 Sheet chuyên biệt · Phối màu thương hiệu · Phân loại khoa học
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            File Excel được cấu trúc tự động với 6 tab trang tính:
            <br />
            <strong>1. Tổng quan & KPI:</strong> Bảng tổng hợp theo 18 phòng ban, biểu đồ số lượng, chữ ký phê duyệt.
            <br />
            <strong>2. Máy tính trạm:</strong> 91 PC trích xuất đầy đủ CPU, RAM, Ổ cứng, OS, Người dùng, IP, MAC.
            <br />
            <strong>3. Switch & Wi-Fi:</strong> 11 thiết bị mạng lõi phân chia theo VLAN và khu vực lắp đặt.
            <br />
            <strong>4. Máy chủ (Servers):</strong> Cấu hình RAID, Xeon, ECC RAM của hệ thống DSERVER, B-SERVER.
            <br />
            <strong>5. Máy in / Photo:</strong> Dòng máy, cổng mạng 515/9100 và phòng ban sử dụng.
            <br />
            <strong>6. Camera & NVR:</strong> Danh mục 2 Đầu ghi và 20 camera con theo từng kênh NVR tương ứng.
          </p>
        </div>

        <button
          onClick={exportMasterExcelWorkbook}
          disabled={exporting === 'MASTER'}
          className="w-full lg:w-auto py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 shrink-0"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>{exporting === 'MASTER' ? 'Đang Tạo File Excel...' : 'TẢI SỔ KIỂM KÊ EXCEL (.XLSX)'}</span>
        </button>
      </div>

      {/* 3. Sheet Previews & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card: Workstations Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Monitor className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                SHEET 2
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Bảng Máy Tính Trạm (91 PC)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trích xuất chi tiết cấu hình máy tính của từng cán bộ nhân viên, hỗ trợ đối soát phần cứng thực tế và lập kế hoạch bảo trì.
            </p>
          </div>
          <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
            <span>91 Bản Ghi</span>
            <span>Đầy Đủ CPU / RAM / SSD</span>
          </div>
        </div>

        {/* Card: Network & CCTV Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <Wifi className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                SHEET 3 & 6
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Bảng Mạng Lõi & Camera NVR
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Phân loại 11 Switch/Wi-Fi chi nhánh và hệ thống 22 Camera an ninh chia theo 2 Đầu ghi NVR Trung Tâm và Hương Sơ.
            </p>
          </div>
          <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
            <span>33 Thiết Bị</span>
            <span>Gom Cụm Theo Kênh NVR</span>
          </div>
        </div>

        {/* Card: Backup JSON */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Database className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                SAO LƯU DỰ PHÒNG
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Sao Lưu Database Hệ Thống
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Lưu trữ bản sao lưu định dạng JSON toàn vẹn của 142 thiết bị để lưu trữ an toàn, hỗ trợ chuyển giao hoặc khôi phục dữ liệu tức thì.
            </p>
          </div>
          <button
            onClick={handleBackupDatabaseJson}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Sao Lưu Dữ Liệu (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
