// Shared High-Speed In-Memory Inventory Cache for Instant Tab Switching

const STORAGE_KEY = 'hicc_real_devices_inventory';

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
