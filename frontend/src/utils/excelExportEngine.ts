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

    if (typeof window !== 'undefined' && window.hiccDesktop?.saveExportedFile) {
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

    // Node / Server / Test environment fallback
    if (typeof window === 'undefined') {
      return {
        success: true,
        filePath: fileName,
        fileName,
        fileSize: buffer.byteLength
      };
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

// Date formatting helpers aligned with ISO YYYY-MM-DD file standard
const formatDateISO = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateTimeVi = (date: Date = new Date()) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}`;
};

// ===========================================================================
// 1. EXPORT POS DEVICES (Strictly Standardized Enterprise Excel)
// ===========================================================================
export const exportPosDevicesToExcel = async (
  devices: PosDevice[],
  filterEnterprise?: string
): Promise<ExportResult> => {
  if (!devices || devices.length === 0) {
    return { success: false, error: 'Không có thiết bị máy POS nào trong danh sách hiện hành để xuất Excel.' };
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO COMMAND';
  workbook.lastModifiedBy = 'Bộ Phận CNTT - HEPCO';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Danh Sách Máy POS', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 5,
        showGridLines: true
      }
    ]
  });

  const TOTAL_COLS = 16;

  // Setup Column Widths & Keys
  sheet.columns = [
    { key: 'stt', width: 8 },             // 1
    { key: 'asset_code', width: 16 },      // 2
    { key: 'serial', width: 22 },          // 3
    { key: 'imei', width: 22 },            // 4
    { key: 'device_type', width: 24 },     // 5
    { key: 'sim_number', width: 18 },      // 6
    { key: 'sim_imei', width: 22 },        // 7
    { key: 'telecom_plan', width: 16 },    // 8
    { key: 'connection_status', width: 20 },// 9
    { key: 'enterprise', width: 34 },      // 10
    { key: 'assigned_user', width: 28 },   // 11
    { key: 'region', width: 30 },          // 12
    { key: 'model', width: 26 },           // 13
    { key: 'status', width: 22 },          // 14
    { key: 'assigned_date', width: 18 },   // 15
    { key: 'notes', width: 28 }            // 16
  ];

  // 1. Company Header (Row 1)
  const row1 = sheet.addRow(['CÔNG TY CỔ PHẦN MÔI TRƯỜNG VÀ CÔNG TRÌNH ĐÔ THỊ HUẾ (HEPCO)']);
  row1.height = 22;
  sheet.mergeCells(`A1:P1`);
  row1.getCell(1).font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FF0F4022' } };
  row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Report Main Title (Row 2)
  const row2 = sheet.addRow(['BÁO CÁO DANH SÁCH VÀ QUẢN LÝ MÁY POS THU PHÍ']);
  row2.height = 36;
  sheet.mergeCells(`A2:P2`);
  row2.getCell(1).font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF13522C' } };
  row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 3. Meta & Inventory Summary Subtitle (Row 3)
  const inUseCount = devices.filter((d) => d.status === 'in_use').length;
  const inStockCount = devices.filter((d) => d.status === 'in_stock').length;
  const borrowedCount = devices.filter((d) => d.status === 'borrowed').length;
  const brokenCount = devices.filter((d) => d.status === 'broken').length;

  const row3 = sheet.addRow([
    `Thời điểm xuất: ${formatDateTimeVi(new Date())} | Tổng số: ${devices.length} máy POS (Đang cấp phát: ${inUseCount} | Dự phòng kho: ${inStockCount} | Cho mượn: ${borrowedCount}${brokenCount > 0 ? ` | Báo hỏng: ${brokenCount}` : ''})`
  ]);
  row3.height = 20;
  sheet.mergeCells(`A3:P3`);
  row3.getCell(1).font = { name: FONT_FAMILY, size: 9.5, italic: true, color: { argb: 'FF475569' } };
  row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 4. Spacer Row (Row 4)
  const row4 = sheet.addRow([]);
  row4.height = 10;

  // 5. Table Header Row (Row 5)
  const headers = [
    'STT',
    'Mã Máy / Mã TS',
    'Mã Serial POS',
    'Số IMEI POS',
    'Loại Thiết Bị',
    'Số Thuê Bao SIM 4G',
    'Số Serial SIM',
    'Gói Cước 4G',
    'Trạng Thái Mạng',
    'Đơn Vị Quản Lý',
    'Nhân Viên Phụ Trách',
    'Địa Bàn / Vị Trí Lắp Đặt',
    'Hãng & Model',
    'Tình Trạng Quản Lý',
    'Ngày Bàn Giao',
    'Ghi Chú'
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 32;

  headerRow.eachCell((c) => {
    c.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF13522C' } // HEPCO Forest Green
    };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF0F4022' } },
      left: { style: 'thin', color: { argb: 'FF0F4022' } },
      bottom: { style: 'thin', color: { argb: 'FF0F4022' } },
      right: { style: 'thin', color: { argb: 'FF0F4022' } }
    };
  });

  // Enable AutoFilter on row 5
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: TOTAL_COLS }
  };

  // Sort devices logically: BSH -> NSH -> Others -> by Serial
  const sortedDevices = [...devices].sort((a, b) => {
    const entOrder = (ent?: string) => (ent === 'BSH' ? 1 : ent === 'NSH' ? 2 : 3);
    const orderDiff = entOrder(a.enterprise) - entOrder(b.enterprise);
    if (orderDiff !== 0) return orderDiff;
    return (a.serial_number || '').localeCompare(b.serial_number || '');
  });

  // 6. Data Rows (Row 6 onwards - No merged cells, no blank break lines!)
  sortedDevices.forEach((d, idx) => {
    const currentAssign = d.assignments && d.assignments.length > 0 ? d.assignments[0] : null;
    const borrower = d.borrowings && d.borrowings.length > 0 ? d.borrowings[0] : null;

    const employeeName =
      currentAssign?.employee_name ||
      currentAssign?.employee?.full_name ||
      (borrower ? `${borrower.borrower_name} (Mượn)` : '') ||
      'Chưa bàn giao';

    const enterpriseName =
      d.enterprise === 'BSH'
        ? 'Xí nghiệp Môi trường Bắc Sông Hương'
        : d.enterprise === 'NSH'
        ? 'Xí nghiệp Môi trường Nam Sông Hương'
        : d.enterprise || 'Văn phòng Công ty';

    const region = d.region || currentAssign?.region || 'Kho trung tâm';

    const statusMap: Record<string, string> = {
      in_use: 'Đang cấp phát sử dụng',
      in_stock: 'Trong kho dự phòng',
      borrowed: 'Đang cho mượn',
      broken: 'Báo hỏng / Cần xử lý',
      disposed: 'Đã thanh lý'
    };
    const statusText = statusMap[d.status] || d.status || 'Chưa cập nhật';

    const connectionStatus = d.status === 'in_use' ? 'KẾT NỐI (4G ONLINE)' : 'TRONG KHO';

    let assignedDate = 'Chưa cập nhật';
    if (currentAssign?.assigned_date) {
      try {
        const dt = new Date(currentAssign.assigned_date);
        assignedDate = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
      } catch {}
    } else if (borrower?.borrowed_date) {
      try {
        const dt = new Date(borrower.borrowed_date);
        assignedDate = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} (Mượn)`;
      } catch {}
    }

    const row = sheet.addRow([
      idx + 1,
      d.asset_code || `POS-${d.id}`,
      d.serial_number || 'Chưa cập nhật',
      d.imei || 'Chưa cập nhật',
      'Máy POS Thu Phí Cầm Tay',
      d.sim_number || 'Chưa cập nhật',
      d.sim_imei || 'Chưa cập nhật',
      d.telecom_plan || 'Gói ezCom90',
      connectionStatus,
      enterpriseName,
      employeeName,
      region,
      'Sunmi V2 PRO / Cầm tay',
      statusText,
      assignedDate,
      d.notes || (borrower?.purpose ? `Mục đích mượn: ${borrower.purpose}` : '')
    ]);

    row.height = 24;
    const isEven = idx % 2 === 0;

    row.eachCell((c, colNumber) => {
      c.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF1E293B' } };
      c.border = THIN_BORDER;

      if (!isEven) {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // Subtle alternate row tint
        };
      }

      // Column Specific Alignments & Formats
      if (colNumber === 1 || colNumber === 2 || colNumber === 8 || colNumber === 9 || colNumber === 15) {
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 3 || colNumber === 4 || colNumber === 6 || colNumber === 7) {
        // Monospace tech codes
        c.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF0F172A' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 14) {
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        if (d.status === 'in_use') {
          c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF166534' } };
        } else if (d.status === 'broken') {
          c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF991B1B' } };
        }
      } else {
        c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const fileName = `Danh_sach_may_POS_${formatDateISO(new Date())}.xlsx`;
  return await saveAndDeliverExcel(workbook, fileName);
};

// ===========================================================================
// 2. EXPORT COMPUTERS & SERVERS (Strictly Standardized Enterprise Excel)
// ===========================================================================
export const exportComputersToExcel = async (
  computers: ComputerDevice[]
): Promise<ExportResult> => {
  if (!computers || computers.length === 0) {
    return { success: false, error: 'Không có thiết bị máy tính nào trong danh sách hiện hành để xuất Excel.' };
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEPCO COMMAND';
  workbook.lastModifiedBy = 'Bộ Phận CNTT - HEPCO';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Danh Sách Máy Tính', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 5,
        showGridLines: true
      }
    ]
  });

  const TOTAL_COLS = 18;

  // Setup Column Widths
  sheet.columns = [
    { key: 'stt', width: 7 },              // 1
    { key: 'hostname', width: 28 },         // 2
    { key: 'asset_code', width: 16 },       // 3
    { key: 'category', width: 18 },         // 4
    { key: 'ip', width: 16 },               // 5
    { key: 'mac', width: 19 },              // 6
    { key: 'network_status', width: 16 },   // 7
    { key: 'department', width: 32 },       // 8
    { key: 'user', width: 26 },             // 9
    { key: 'location', width: 26 },         // 10
    { key: 'vendor_model', width: 24 },     // 11
    { key: 'cpu', width: 26 },              // 12
    { key: 'ram', width: 16 },              // 13
    { key: 'storage', width: 20 },          // 14
    { key: 'monitor', width: 22 },          // 15
    { key: 'year', width: 14 },             // 16
    { key: 'operating_status', width: 22 }, // 17
    { key: 'notes', width: 28 }             // 18
  ];

  // 1. Company Header (Row 1)
  const row1 = sheet.addRow(['CÔNG TY CỔ PHẦN MÔI TRƯỜNG VÀ CÔNG TRÌNH ĐÔ THỊ HUẾ (HEPCO)']);
  row1.height = 22;
  sheet.mergeCells(`A1:R1`);
  row1.getCell(1).font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FF0F4022' } };
  row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Report Main Title (Row 2)
  const row2 = sheet.addRow(['BÁO CÁO CHI TIẾT DANH SÁCH MÁY TÍNH & MÁY CHỦ']);
  row2.height = 36;
  sheet.mergeCells(`A2:R2`);
  row2.getCell(1).font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF13522C' } };
  row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 3. Meta & Inventory Summary Subtitle (Row 3)
  const onlineCount = computers.filter((c) => c.status === 'ONLINE').length;
  const offlineCount = computers.length - onlineCount;
  const serverCount = computers.filter((c) => c.category === 'SERVER' || c.department === 'Máy chủ').length;
  const pcCount = computers.length - serverCount;

  const row3 = sheet.addRow([
    `Thời điểm xuất: ${formatDateTimeVi(new Date())} | Tổng số: ${computers.length} thiết bị (Máy tính: ${pcCount} | Máy chủ: ${serverCount} | Đang Online: ${onlineCount} | Offline: ${offlineCount})`
  ]);
  row3.height = 20;
  sheet.mergeCells(`A3:R3`);
  row3.getCell(1).font = { name: FONT_FAMILY, size: 9.5, italic: true, color: { argb: 'FF475569' } };
  row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 4. Spacer Row (Row 4)
  const row4 = sheet.addRow([]);
  row4.height = 10;

  // 5. Table Header Row (Row 5)
  const headers = [
    'STT',
    'Tên Máy / Hostname',
    'Mã Máy / Mã TS',
    'Loại Thiết Bị',
    'Địa Chỉ IP',
    'Địa Chỉ MAC',
    'Trạng Thái Mạng',
    'Phòng Ban / Đơn Vị',
    'Cán Bộ / Người Sử Dụng',
    'Vị Trí Lắp Đặt',
    'Hãng & Bo Mạch',
    'CPU / Vi Xử Lý',
    'Bộ Nhớ RAM',
    'Ổ Cứng Lưu Trữ',
    'Màn Hình',
    'Năm Cấp / Sử Dụng',
    'Tình Trạng Hoạt Động',
    'Ghi Chú'
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 32;

  headerRow.eachCell((c) => {
    c.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF13522C' } // HEPCO Forest Green
    };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF0F4022' } },
      left: { style: 'thin', color: { argb: 'FF0F4022' } },
      bottom: { style: 'thin', color: { argb: 'FF0F4022' } },
      right: { style: 'thin', color: { argb: 'FF0F4022' } }
    };
  });

  // Enable AutoFilter on row 5
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: TOTAL_COLS }
  };

  // Sort computers strictly by Official HEPCO Department Priority Order then User Name
  const getDeptOrder = (dept: string) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('lãnh đạo')) return 1;
    if (d.includes('tổ chức') || d.includes('hành chính')) return 2;
    if (d.includes('kế toán') || d.includes('tài vụ')) return 3;
    if (d.includes('kế hoạch')) return 4;
    if (d.includes('kỹ thuật')) return 5;
    if (d.includes('bắc sông hương')) return 6;
    if (d.includes('nam sông hương')) return 7;
    if (d.includes('chiếu sáng')) return 8;
    if (d.includes('thoát nước')) return 9;
    if (d.includes('máy chủ') || d.includes('server')) return 10;
    if (d.includes('wi-fi') || d.includes('wifi')) return 11;
    return 12;
  };

  const sortedComputers = [...computers].sort((a, b) => {
    const oA = getDeptOrder(a.department);
    const oB = getDeptOrder(b.department);
    if (oA !== oB) return oA - oB;
    return (a.assigned_user || a.display_name || '').localeCompare(b.assigned_user || b.display_name || '', 'vi');
  });

  // 6. Data Rows (Row 6 onwards - No merged cells, no blank break lines!)
  sortedComputers.forEach((item, idx) => {
    const specs = item.specs || {};
    const isServer = item.category === 'SERVER' || item.department === 'Máy chủ';
    const isWifi = item.category === 'WIFI' || item.category === 'ROUTER' || item.department === 'Wi-Fi';

    const hostname = item.assigned_user || item.display_name || item.hostname || 'Chưa định danh';
    const assetCode = specs.asset_code || item.device_code || 'Chưa cập nhật';
    const category = isServer ? 'Máy Chủ Hệ Thống' : isWifi ? 'Thiết Bị Wi-Fi' : (item.category || 'Máy Tính Trạm');
    const ip = item.ip || (item as any).ip_address || 'Chưa cập nhật';
    const mac = item.mac || (item as any).mac_address || 'Chưa cập nhật';
    const networkStatus = item.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
    const department = item.department || 'Chưa định danh đơn vị';
    const assignedUser = item.assigned_user || item.display_name || 'Chưa gán nhân sự';
    const location = item.location || (isServer ? 'Phòng Máy Chủ Trung Tâm' : department);
    const vendorModel = specs.mainboard || item.vendor || item.model || 'Chưa cập nhật';
    const cpu = specs.cpu || (isServer ? 'Intel Xeon Enterprise' : 'Intel Core');
    const ram = specs.ram || '8GB RAM';
    const storage = specs.storage || 'SSD / HDD';
    const monitor = specs.monitor || (isServer ? 'Không dùng màn hình' : 'Màn hình LCD');
    const year = specs.year ? `Năm ${specs.year}` : 'Chưa cập nhật';
    const operatingStatus = item.status === 'ONLINE' ? 'Hoạt động tốt' : 'Mất kết nối / Tắt nguồn';
    const notes = item.notes || '';

    const row = sheet.addRow([
      idx + 1,
      hostname,
      assetCode,
      category,
      ip,
      mac,
      networkStatus,
      department,
      assignedUser,
      location,
      vendorModel,
      cpu,
      ram,
      storage,
      monitor,
      year,
      operatingStatus,
      notes
    ]);

    row.height = 24;
    const isEven = idx % 2 === 0;

    row.eachCell((c, colNumber) => {
      c.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF1E293B' } };
      c.border = THIN_BORDER;

      if (!isEven) {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // Subtle alternate row tint
        };
      }

      // Column Specific Alignments & Formats
      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 13 || colNumber === 16) {
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 5 || colNumber === 6) {
        // IP & MAC Monospace
        c.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF0F172A' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 7) {
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        if (item.status === 'ONLINE') {
          c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF166534' } };
        } else {
          c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF991B1B' } };
        }
      } else if (colNumber === 17) {
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const fileName = `Danh_sach_may_tinh_${formatDateISO(new Date())}.xlsx`;
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
