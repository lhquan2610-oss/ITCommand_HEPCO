import ExcelJS from 'exceljs';
import { PosDevice, DispatchItem } from '../services/hepcoApi';
import { ComputerDevice } from '../pages/ComputerInventoryPage';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  isBrowserDownload?: boolean;
  error?: string;
}

// Convert ArrayBuffer to Base64 string reliably across all environments
const bufferToBase64 = (buffer: ArrayBuffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
};

// Dispatch save to Electron or Browser Download
export const saveAndDeliverExcel = async (
  workbook: ExcelJS.Workbook,
  fileName: string
): Promise<ExportResult> => {
  try {
    const buffer = await workbook.xlsx.writeBuffer();

    if (window.hiccDesktop?.saveExportedFile) {
      const base64 = await bufferToBase64(buffer as ArrayBuffer);
      const res = await window.hiccDesktop.saveExportedFile({
        fileName,
        bufferBase64: base64
      });

      if (res && res.success) {
        return {
          success: true,
          filePath: res.filePath,
          fileName: res.fileName || fileName,
          fileSize: res.fileSize || buffer.byteLength
        };
      }
      if (res?.canceled) {
        return { success: false, error: 'Hủy lưu file' };
      }
      return { success: false, error: res?.error || 'Lỗi lưu file' };
    }

    // Web browser fallback
    const blob = new Blob([buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    return {
      success: true,
      filePath: fileName,
      fileName,
      fileSize: buffer.byteLength,
      isBrowserDownload: true
    };
  } catch (err: any) {
    console.error('saveAndDeliverExcel error:', err);
    return { success: false, error: err.message || 'Lỗi xuất file' };
  }
};

// Common Borders & Fonts strictly following HEPCO official template
const FONT_FAMILY = 'Times New Roman';
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

// ===========================================================================
// 1. EXPORT POS DEVICES (Exact Match to User's Uploaded Sample Image)
// ===========================================================================
export const exportPosDevicesToExcel = async (
  devices: PosDevice[],
  filterEnterprise?: string
): Promise<ExportResult> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO COMMAND';
  workbook.lastModifiedBy = 'Lê Hồng Quân - CNTT HEPCO';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('DANH SÁCH MÁY POS', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [{ showGridLines: true }]
  });

  // Setup Column Widths
  sheet.columns = [
    { key: 'stt', width: 8 },
    { key: 'employee_name', width: 28 },
    { key: 'region', width: 34 },
    { key: 'serial', width: 20 },
    { key: 'imei', width: 22 },
    { key: 'sim', width: 20 },
    { key: 'sim_imei', width: 24 },
    { key: 'plan', width: 16 },
    { key: 'status', width: 18 },
    { key: 'notes', width: 22 }
  ];

  // Helper to append a Section Banner Row (e.g. XÍ NGHIỆP BẮC SÔNG HƯƠNG (KHỐI CHÍNH))
  const appendSectionBanner = (title: string) => {
    const bannerRow = sheet.addRow([title, '', '', '', '', '', '', '', '', '']);
    bannerRow.height = 27;
    sheet.mergeCells(`A${bannerRow.number}:J${bannerRow.number}`);

    for (let c = 1; c <= 10; c++) {
      const cell = bannerRow.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEFF5' } // Soft gray-blue as in sample image
      };
      cell.border = THIN_BORDER;
    }

    const firstCell = bannerRow.getCell(1);
    firstCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    firstCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  };

  // Helper to append the Forest Green Table Header Row
  const appendTableHeader = () => {
    const headers = [
      'STT',
      'Họ và Tên Nhân Viên/Người Mượn',
      'Địa Bàn Phụ Trách',
      'Serial POS',
      'IMEI POS',
      'Số Điện Thoại SIM',
      'IMEI SIM',
      'Gói Cước',
      'Trạng Thái',
      'Ghi Chú'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 30;

    headerRow.eachCell((c) => {
      c.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF13522C' } // Exact Forest Green in user sample image
      };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = {
        top: { style: 'thin', color: { argb: 'FF0F4022' } },
        left: { style: 'thin', color: { argb: 'FF0F4022' } },
        bottom: { style: 'thin', color: { argb: 'FF0F4022' } },
        right: { style: 'thin', color: { argb: 'FF0F4022' } }
      };
    });
  };

  // Split devices by Enterprise
  const bshDevices = devices.filter((d) => d.enterprise === 'BSH' || (!d.enterprise && d.serial_number?.startsWith('V3022')));
  const nshDevices = devices.filter((d) => d.enterprise === 'NSH' || (!d.enterprise && !d.serial_number?.startsWith('V3022')));
  const otherDevices = devices.filter((d) => d.enterprise !== 'BSH' && d.enterprise !== 'NSH' && !bshDevices.includes(d) && !nshDevices.includes(d));

  const sections: Array<{ title: string; list: PosDevice[] }> = [];

  if (filterEnterprise === 'BSH') {
    sections.push({ title: 'XÍ NGHIỆP BẮC SÔNG HƯƠNG (KHỐI CHÍNH)', list: bshDevices });
  } else if (filterEnterprise === 'NSH') {
    sections.push({ title: 'XÍ NGHIỆP NAM SÔNG HƯƠNG (KHỐI CHÍNH)', list: nshDevices });
  } else {
    if (bshDevices.length > 0) {
      sections.push({ title: 'XÍ NGHIỆP BẮC SÔNG HƯƠNG (KHỐI CHÍNH)', list: bshDevices });
    }
    if (nshDevices.length > 0) {
      sections.push({ title: 'XÍ NGHIỆP NAM SÔNG HƯƠNG (KHỐI CHÍNH)', list: nshDevices });
    }
    if (otherDevices.length > 0) {
      sections.push({ title: 'MÁY POS DỰ PHÒNG & KHO TRUNG TÂM', list: otherDevices });
    }
  }

  // Render each section
  sections.forEach((sec, sIdx) => {
    if (sIdx > 0) {
      sheet.addRow([]); // Blank spacer row between sections
    }
    appendSectionBanner(sec.title);
    appendTableHeader();

    sec.list.forEach((d, idx) => {
      const currentAssign = d.assignments && d.assignments.length > 0 ? d.assignments[0] : null;
      const borrower = d.borrowings && d.borrowings.length > 0 ? d.borrowings[0] : null;

      const employeeName =
        currentAssign?.employee_name ||
        currentAssign?.employee?.full_name ||
        (borrower ? `${borrower.borrower_name} (Mượn)` : '') ||
        '-';

      const region = d.region || currentAssign?.region || '-';

      const statusMap: Record<string, string> = {
        in_use: 'Đang cấp phát',
        in_stock: 'Trong kho',
        borrowed: 'Đang cho mượn',
        broken: 'Báo hỏng / Sự cố',
        disposed: 'Thanh lý'
      };
      const statusText = statusMap[d.status] || 'Đang cấp phát';

      const row = sheet.addRow([
        idx + 1,
        employeeName,
        region,
        d.serial_number || '-',
        d.imei || '-',
        d.sim_number || '-',
        d.sim_imei || '-',
        d.telecom_plan || 'Gói ezCom90',
        statusText,
        d.notes || '-'
      ]);

      row.height = 23;
      row.eachCell((c, colNumber) => {
        c.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF1E293B' } };
        c.border = THIN_BORDER;

        // Alignment per column matching sample image
        if (colNumber === 1) {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 2 || colNumber === 3) {
          c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else if (colNumber === 10) {
          c.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });
  });

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `DANH_SACH_MAY_POS_HEPCO_${dateStr}.xlsx`;

  return await saveAndDeliverExcel(workbook, fileName);
};

// ===========================================================================
// 2. EXPORT COMPUTERS & SERVERS (Exact Matching Enterprise Style)
// ===========================================================================
export const exportComputersToExcel = async (
  computers: ComputerDevice[]
): Promise<ExportResult> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO COMMAND';
  workbook.lastModifiedBy = 'Lê Hồng Quân - CNTT HEPCO';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('KIỂM KÊ MÁY TÍNH & MÁY CHỦ', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [{ showGridLines: true }]
  });

  // Setup Column Widths
  sheet.columns = [
    { key: 'stt', width: 7 },
    { key: 'user', width: 26 },
    { key: 'asset_code', width: 16 },
    { key: 'dept', width: 26 },
    { key: 'category', width: 16 },
    { key: 'ip', width: 16 },
    { key: 'mac', width: 19 },
    { key: 'year', width: 12 },
    { key: 'cpu', width: 24 },
    { key: 'mainboard', width: 18 },
    { key: 'ram', width: 14 },
    { key: 'storage', width: 18 },
    { key: 'monitor', width: 20 },
    { key: 'peripherals', width: 24 },
    { key: 'status', width: 14 },
    { key: 'notes', width: 22 }
  ];

  const appendSectionBanner = (title: string) => {
    const bannerRow = sheet.addRow([title, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    bannerRow.height = 27;
    sheet.mergeCells(`A${bannerRow.number}:P${bannerRow.number}`);

    for (let c = 1; c <= 16; c++) {
      const cell = bannerRow.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEFF5' }
      };
      cell.border = THIN_BORDER;
    }

    const firstCell = bannerRow.getCell(1);
    firstCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    firstCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  };

  const appendTableHeader = () => {
    const headers = [
      'STT',
      'Họ và Tên Cán Bộ / Người Sử Dụng',
      'Mã Tài Sản',
      'Đơn Vị / Phòng Ban',
      'Phân Loại',
      'Địa Chỉ IP',
      'Địa Chỉ MAC',
      'Năm Cấp',
      'CPU / Vi Xử Lý',
      'Mainboard',
      'RAM',
      'Ổ Cứng',
      'Màn Hình',
      'Bàn Phím Chuột & Đi Kèm',
      'Trạng Thái',
      'Ghi Chú'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 30;

    headerRow.eachCell((c) => {
      c.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF13522C' } // Forest Green
      };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = {
        top: { style: 'thin', color: { argb: 'FF0F4022' } },
        left: { style: 'thin', color: { argb: 'FF0F4022' } },
        bottom: { style: 'thin', color: { argb: 'FF0F4022' } },
        right: { style: 'thin', color: { argb: 'FF0F4022' } }
      };
    });
  };

  // Group computers by department
  const deptGroups: Record<string, ComputerDevice[]> = {};
  computers.forEach((comp) => {
    const d = comp.department || 'Chưa định danh đơn vị';
    if (!deptGroups[d]) deptGroups[d] = [];
    deptGroups[d].push(comp);
  });

  const deptNames = Object.keys(deptGroups).sort((a, b) => {
    const pA = a.toLowerCase().includes('lãnh đạo') ? 1 : a.toLowerCase().includes('tổ chức') ? 2 : a.toLowerCase().includes('kế toán') ? 3 : a.toLowerCase().includes('kỹ thuật') ? 4 : 5;
    const pB = b.toLowerCase().includes('lãnh đạo') ? 1 : b.toLowerCase().includes('tổ chức') ? 2 : b.toLowerCase().includes('kế toán') ? 3 : b.toLowerCase().includes('kỹ thuật') ? 4 : 5;
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, 'vi');
  });

  deptNames.forEach((deptName, idx) => {
    if (idx > 0) {
      sheet.addRow([]);
    }
    appendSectionBanner(deptName.toUpperCase());
    appendTableHeader();

    const list = deptGroups[deptName];
    list.forEach((item, itemIdx) => {
      const specs = item.specs || {};
      const statusText =
        item.status ||
        ((item as any).is_active === false
          ? 'Ngưng hoạt động'
          : (item as any).online_status
          ? 'ONLINE'
          : 'OFFLINE');

      const user = item.assigned_user || item.display_name || '-';
      const ip = item.ip || (item as any).ip_address || '-';
      const mac = item.mac || (item as any).mac_address || '-';
      const peripherals =
        specs.peripherals ||
        [specs.keyboard ? `Phím: ${specs.keyboard}` : '', specs.mouse ? `Chuột: ${specs.mouse}` : '']
          .filter(Boolean)
          .join(', ') ||
        '-';

      const row = sheet.addRow([
        itemIdx + 1,
        user,
        specs.asset_code || item.device_code || '-',
        item.department || deptName,
        item.category || 'MÁY TRẠM',
        ip,
        mac,
        specs.year || '-',
        specs.cpu || '-',
        specs.mainboard || '-',
        specs.ram || '-',
        specs.storage || '-',
        specs.monitor || '-',
        peripherals,
        statusText,
        item.notes || '-'
      ]);

      row.height = 23;
      row.eachCell((c, colNumber) => {
        c.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF1E293B' } };
        c.border = THIN_BORDER;

        if (colNumber === 1 || colNumber === 3 || colNumber === 5 || colNumber === 6 || colNumber === 7 || colNumber === 8 || colNumber === 11 || colNumber === 12 || colNumber === 15) {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });
  });

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `KIEM_KE_MAY_TINH_HEPCO_${dateStr}.xlsx`;

  return await saveAndDeliverExcel(workbook, fileName);
};

// ===========================================================================
// 3. EXPORT DISPATCHES / BASE OFFICE (Sổ Quản Lý Công Văn Chuẩn Doanh Nghiệp)
// ===========================================================================
export const exportDispatchesToExcel = async (
  dispatches: DispatchItem[],
  filterType?: string
): Promise<ExportResult> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO COMMAND - BASE OFFICE';
  workbook.lastModifiedBy = 'Lê Hồng Quân - CNTT HEPCO';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('SỔ QUẢN LÝ CÔNG VĂN', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [{ showGridLines: true }]
  });

  sheet.columns = [
    { key: 'stt', width: 7 },
    { key: 'code', width: 26 },
    { key: 'date', width: 16 },
    { key: 'title', width: 44 },
    { key: 'sender', width: 28 },
    { key: 'receiver', width: 28 },
    { key: 'type', width: 16 },
    { key: 'urgency', width: 14 },
    { key: 'status', width: 16 },
    { key: 'file', width: 26 }
  ];

  const appendSectionBanner = (title: string) => {
    const bannerRow = sheet.addRow([title, '', '', '', '', '', '', '', '', '']);
    bannerRow.height = 27;
    sheet.mergeCells(`A${bannerRow.number}:J${bannerRow.number}`);

    for (let c = 1; c <= 10; c++) {
      const cell = bannerRow.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEFF5' }
      };
      cell.border = THIN_BORDER;
    }

    const firstCell = bannerRow.getCell(1);
    firstCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    firstCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  };

  const appendTableHeader = () => {
    const headers = [
      'STT',
      'Số / Ký Hiệu Văn Bản',
      'Ngày Ban Hành / Đến',
      'Tên Loại & Trích Yếu Nội Dung',
      'Đơn Vị Ban Hành (Người Gửi)',
      'Nơi Nhận (Người Nhận)',
      'Phân Loại',
      'Độ Khẩn',
      'Trạng Thái',
      'Tệp Đính Kèm'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 30;

    headerRow.eachCell((c) => {
      c.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF13522C' } // Forest Green
      };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = {
        top: { style: 'thin', color: { argb: 'FF0F4022' } },
        left: { style: 'thin', color: { argb: 'FF0F4022' } },
        bottom: { style: 'thin', color: { argb: 'FF0F4022' } },
        right: { style: 'thin', color: { argb: 'FF0F4022' } }
      };
    });
  };

  // Group by Type (Incoming, Outgoing, Internal)
  const incoming = dispatches.filter((d) => d.type === 'incoming');
  const outgoing = dispatches.filter((d) => d.type === 'outgoing');
  const internal = dispatches.filter((d) => d.type === 'internal' || (d.type !== 'incoming' && d.type !== 'outgoing'));

  const sections: Array<{ title: string; list: DispatchItem[] }> = [];

  if (filterType === 'incoming') {
    sections.push({ title: 'SỔ CÔNG VĂN ĐẾN (INCOMING DISPATCHES)', list: incoming });
  } else if (filterType === 'outgoing') {
    sections.push({ title: 'SỔ CÔNG VĂN ĐI (OUTGOING DISPATCHES)', list: outgoing });
  } else if (filterType === 'internal') {
    sections.push({ title: 'VĂN BẢN & CHỈ ĐẠO NỘI BỘ (INTERNAL DISPATCHES)', list: internal });
  } else {
    if (incoming.length > 0) sections.push({ title: 'SỔ CÔNG VĂN ĐẾN (INCOMING DISPATCHES)', list: incoming });
    if (outgoing.length > 0) sections.push({ title: 'SỔ CÔNG VĂN ĐI (OUTGOING DISPATCHES)', list: outgoing });
    if (internal.length > 0) sections.push({ title: 'VĂN BẢN & CHỈ ĐẠO NỘI BỘ (INTERNAL DISPATCHES)', list: internal });
  }

  sections.forEach((sec, sIdx) => {
    if (sIdx > 0) {
      sheet.addRow([]);
    }
    appendSectionBanner(`${sec.title} - TỔNG CỘNG: ${sec.list.length} VĂN BẢN`);
    appendTableHeader();

    sec.list.forEach((d, idx) => {
      const typeText =
        d.type === 'incoming' ? 'Công văn đến' : d.type === 'outgoing' ? 'Công văn đi' : 'Nội bộ';
      const urgencyText =
        d.urgency === 'urgent' ? 'Hỏa tốc' : d.urgency === 'high' ? 'Khẩn' : 'Bình thường';
      const statusText =
        d.status === '1' || d.status === 'completed'
          ? 'Đã ban hành / Hoàn thành'
          : d.status === '0' || d.status === 'pending'
          ? 'Chờ duyệt / Tiếp nhận'
          : 'Đang xử lý';

      const dateStr = d.created_at
        ? new Date(d.created_at).toLocaleDateString('vi-VN')
        : '-';

      const row = sheet.addRow([
        idx + 1,
        d.code || `ID-${d.id}`,
        dateStr,
        d.title || '-',
        d.sender || '-',
        d.receiver || '-',
        typeText,
        urgencyText,
        statusText,
        d.file_name || (d.file_url ? 'Có file đính kèm' : 'Không có')
      ]);

      row.height = 25;
      row.eachCell((c, colNumber) => {
        c.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF1E293B' } };
        c.border = THIN_BORDER;

        if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 7 || colNumber === 8 || colNumber === 9) {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });
  });

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `SO_THEO_DOI_CONG_VAN_HEPCO_${dateStr}.xlsx`;

  return await saveAndDeliverExcel(workbook, fileName);
};
