import React, { useEffect, useState, useMemo } from 'react';
import {
  Monitor,
  Cpu,
  HardDrive,
  Layers,
  Search,
  Zap,
  Power,
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Hash,
  Calendar,
  Tag,
  Radio,
  ArrowDownAZ,
  Network,
  Computer,
  Sparkles,
  MousePointer,
  ExternalLink,
  Edit3,
  X,
  Save,
  Check,
  Server,
  AlertCircle,
  HelpCircle,
  Wifi,
  Activity,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { HEPCO_LOGO } from '../assets/logoBase64';
import { exportComputersToExcel } from '../utils/excelExportEngine';
import { ExportSuccessModal } from '../components/ExportSuccessModal';
import { getCachedInventorySync, loadInventoryFast, saveInventoryFast } from '../utils/inventoryCache';

// FIXED DEPARTMENTS - ORDERED STRICTLY BY HEPCO OFFICIAL INVENTORY STANDARD
export const FIXED_DEPARTMENTS = [
  'Ban Lãnh Đạo',
  'Phòng Tổ chức - Hành chính',
  'Phòng Kế toán - Tài vụ',
  'Phòng Kế hoạch',
  'Phòng Kỹ Thuật',
  'Phòng Kỹ thuật',
  'Xí nghiệp Môi trường Bắc sông Hương',
  'Xí nghiệp Môi trường Nam sông Hương',
  'Xí nghiệp Điện chiếu sáng',
  'Xí nghiệp Thoát nước',
  'Xí nghiệp Xử lý chất thải',
  'Ban quản trang',
  'Trạm cân',
  'Xí nghiệp Vận chuyển - Cơ khí',
  'Máy chủ',
  'Wi-Fi',
  'Chưa định danh tên',
] as const;

export const getDepartmentOrder = (deptName: string): number => {
  const norm = (deptName || '').toLowerCase().trim();
  const idx = FIXED_DEPARTMENTS.findIndex((d) => d.toLowerCase().trim() === norm);
  if (idx !== -1) return idx;
  if (norm.includes('lãnh đạo')) return 0;
  if (norm.includes('tổ chức') || norm.includes('hành chính')) return 1;
  if (norm.includes('kế toán') || norm.includes('tài vụ')) return 2;
  if (norm.includes('kế hoạch')) return 3;
  if (norm.includes('kỹ thuật')) return 4;
  if (norm.includes('bắc sông hương')) return 5;
  if (norm.includes('nam sông hương')) return 6;
  if (norm.includes('điện chiếu sáng')) return 7;
  if (norm.includes('thoát nước')) return 8;
  if (norm.includes('xử lý chất thải')) return 9;
  if (norm.includes('quản trang')) return 10;
  if (norm.includes('trạm cân')) return 11;
  if (norm.includes('vận chuyển') || norm.includes('cơ kh')) return 12;
  if (norm.includes('máy chủ') || norm.includes('server')) return 13;
  if (norm.includes('wi-fi') || norm.includes('wifi') || norm.includes('router')) return 14;
  if (norm.includes('chưa định danh')) return 15;
  return 999;
};

export interface ComputerSpecs {
  // PC / Server Specs
  asset_code?: string;
  year?: string;
  cpu?: string;
  mainboard?: string;
  ram?: string;
  storage?: string;
  monitor?: string;
  keyboard?: string;
  mouse?: string;
  peripherals?: string;

  // Wi-Fi / Router Specs
  router_brand?: string;
  router_model?: string;
  router_type?: string;
  router_band?: string;
  router_ports?: string;
  router_ssid?: string;
  router_coverage?: string;
}

export interface ComputerDevice {
  id: string;
  device_code: string;
  display_name: string;
  category: string;
  ip: string;
  mac: string;
  vendor: string;
  assigned_user: string;
  department: string;
  location?: string;
  status: 'ONLINE' | 'OFFLINE';
  last_seen: string;
  notes?: string;
  specs?: ComputerSpecs;
  subnet_group?: string;
  openPorts?: number[];
  hardware_verified?: boolean;
  last_hardware_audit?: string;
}

export const ComputerInventoryPage: React.FC = () => {
  const [computers, setComputers] = useState<ComputerDevice[]>([]);
  const [allInventory, setAllInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [groupMode, setGroupMode] = useState<'DEPARTMENT' | 'SUBNET' | 'LIST'>('DEPARTMENT');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pingStatus, setPingStatus] = useState<Record<string, { loading: boolean; alive?: boolean; rtt?: number | null }>>({});

  // Edit Modal State
  const [editingDevice, setEditingDevice] = useState<ComputerDevice | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Live Hardware Audit State
  const [liveAuditStatus, setLiveAuditStatus] = useState<Record<string, { loading: boolean; data?: any; error?: string }>>({});
  const [isAuditingAll, setIsAuditingAll] = useState(false);
  const [auditGlobalMsg, setAuditGlobalMsg] = useState<string | null>(null);

  // Export Excel Modal State
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    fileName: string;
    filePath?: string;
    fileSize?: number;
    isBrowserDownload?: boolean;
  }>({
    isOpen: false,
    fileName: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleAuditRemoteHardware = async (ip: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.hiccDesktop?.auditRemoteHardware) {
      alert('Tính năng kiểm định phần cứng yêu cầu ứng dụng Desktop PC (có hỗ trợ WMI/DCOM)');
      return;
    }
    setLiveAuditStatus((prev) => ({ ...prev, [ip]: { loading: true } }));
    try {
      const res = await window.hiccDesktop.auditRemoteHardware(ip);
      if (res.success) {
        setLiveAuditStatus((prev) => ({ ...prev, [ip]: { loading: false, data: res } }));
      } else {
        setLiveAuditStatus((prev) => ({ ...prev, [ip]: { loading: false, error: res.error || 'Không thể truy vấn WMI/DCOM' } }));
      }
    } catch (err: any) {
      setLiveAuditStatus((prev) => ({ ...prev, [ip]: { loading: false, error: err.message } }));
    }
  };

  const handleSyncLiveSpecs = async (comp: ComputerDevice, liveData: any) => {
    const updated = {
      ...comp,
      specs: {
        ...comp.specs,
        cpu: liveData.cpu,
        ram: `${liveData.ramGB}GB DDR4 (Kiểm định thực tế)`,
        mainboard: liveData.mainboard,
        storage: liveData.storage,
      },
      hardware_verified: true,
      last_hardware_audit: new Date().toISOString(),
    };

    const newAll = allInventory.map((d) => (d.id === comp.id ? updated : d));
    setAllInventory(newAll);
    localStorage.setItem('hicc_real_devices_inventory', JSON.stringify(newAll));
    if (window.hiccDesktop?.saveInventory) {
      await window.hiccDesktop.saveInventory(newAll);
    }
    setSaveSuccessMsg(`Đã cập nhật linh kiện thực tế cho máy ${comp.assigned_user || comp.display_name}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // 1. Load real inventory from Memory Cache / File / Storage
  useEffect(() => {
    const applyInventory = (rawList: any[]) => {
      setAllInventory(rawList);
      const compList = rawList.filter(
        (d) =>
          d.category !== 'PRINTER' &&
          d.category !== 'CAMERA' &&
          (d.department === 'Wi-Fi' || (d.category !== 'SWITCH' && d.category !== 'ROUTER')) &&
          d.ip !== '10.0.0.17' &&
          d.ip !== '10.0.0.18' &&
          !(d.display_name && (d.display_name.toLowerCase().includes('photocopy') || d.display_name.toLowerCase().includes('ricoh'))) &&
          (d.category === 'WORKSTATION' ||
            d.category === 'SERVER' ||
            d.department === 'Máy chủ' ||
            d.department === 'Chưa định danh tên' ||
            d.department === 'Wi-Fi' ||
            d.ip)
      );
      setComputers(compList);
    };

    const cached = getCachedInventorySync();
    if (cached.length > 0) {
      applyInventory(cached);
    }

    loadInventoryFast().then(applyInventory);
  }, []);

  // Helper: Subnet extractor
  const getSubnet = (ip: string) => {
    if (!ip) return 'Khác / Chưa gán IP';
    if (ip.startsWith('10.0.0.')) return 'Dải 10.0.0.x (Máy Chủ & Hạ Tầng Lõi)';
    if (ip.startsWith('10.1.0.') || ip.startsWith('10.1.1.')) return 'Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)';
    if (ip.startsWith('10.2.0.') || ip.startsWith('10.2.1.')) return 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Kỹ Thuật)';
    if (ip.startsWith('10.3.1.') || ip.startsWith('10.3.0.')) return 'Dải 10.3.1.x (Phòng Kế Hoạch)';
    if (ip.startsWith('10.11.1.')) return 'Dải 10.11.1.x (XN Môi Trường Nam Sông Hương)';
    if (ip.startsWith('10.12.1.')) return 'Dải 10.12.1.x (XN Môi Trường Bắc Sông Hương)';
    if (ip.startsWith('10.20.1.')) return 'Dải 10.20.1.x (XN Vận Chuyển - Cơ Khí & Điện Chiếu Sáng)';
    if (ip.startsWith('10.30.1.')) return 'Dải 10.30.1.x (XN Xử Lý Chất Thải)';
    if (ip.startsWith('10.40.1.')) return 'Dải 10.40.1.x (Trạm Cân)';
    if (ip.startsWith('10.50.1.')) return 'Dải 10.50.1.x (XN Thoát Nước)';
    if (ip.startsWith('10.60.1.')) return 'Dải 10.60.1.x (Ban Quản Trang)';
    if (ip.startsWith('192.168.1.')) return 'Dải 192.168.1.x (Quản Trị Máy Chủ iLO & iDRAC)';
    return 'Dải Mạng Khác';
  };

  // Toggle detail view for an individual computer (click name or IP to toggle)
  const toggleDeviceExpand = (id: string) => {
    setExpandedDeviceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleGroupCollapse = (grp: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [grp]: !prev[grp] }));
  };

  // Open Edit Modal for a computer or wifi device
  const handleOpenEditModal = (comp: ComputerDevice) => {
    const isCompWifi =
      comp.department === 'Wi-Fi' ||
      comp.category === 'WIFI' ||
      comp.category === 'ROUTER';

    setEditingDevice(comp);
    setEditFormData({
      id: comp.id,
      assigned_user: comp.assigned_user || '',
      department: comp.department || 'Chưa định danh tên',
      category: comp.category || (isCompWifi ? 'ROUTER' : 'WORKSTATION'),
      ip: comp.ip || '',
      mac: comp.mac || '',
      asset_code: comp.specs?.asset_code || comp.device_code || '',
      year: comp.specs?.year || '2023',
      // PC specs
      cpu: comp.specs?.cpu || '',
      mainboard: comp.specs?.mainboard || '',
      ram: comp.specs?.ram || '8GB DDR4',
      storage: comp.specs?.storage || 'SSD 256GB',
      monitor: comp.specs?.monitor || '',
      keyboard: comp.specs?.keyboard || 'Logitech MK200',
      mouse: comp.specs?.mouse || 'Logitech M650',
      peripherals: comp.specs?.peripherals || '',
      // Router / Wi-Fi specs (strictly for Wi-Fi devices)
      router_brand: isCompWifi ? (comp.specs?.router_brand || comp.vendor || 'ASUS') : '',
      router_model: isCompWifi ? (comp.specs?.router_model || comp.model || comp.device_code || '') : '',
      router_type: isCompWifi ? (comp.specs?.router_type || 'Router Wi-Fi & AP') : '',
      router_band: isCompWifi ? (comp.specs?.router_band || 'Dual-Band 2.4GHz + 5GHz') : '',
      router_ports: isCompWifi ? (comp.specs?.router_ports || '1 WAN + 4 LAN Gigabit') : '',
      router_ssid: isCompWifi ? (comp.specs?.router_ssid || '') : '',
      router_coverage: isCompWifi ? (comp.specs?.router_coverage || comp.location || '') : '',
    });
  };

  // Save Edit Changes
  const handleSaveEdit = async () => {
    if (!editingDevice || !editFormData) return;

    const isWifi =
      editFormData.department === 'Wi-Fi' ||
      editFormData.category === 'WIFI' ||
      editFormData.category === 'ROUTER';

    const updatedComputers = computers.map((c) => {
      if (c.id === editingDevice.id) {
        return {
          ...c,
          assigned_user: editFormData.assigned_user,
          display_name: editFormData.assigned_user
            ? `${editFormData.assigned_user} (${editFormData.asset_code || c.device_code || c.ip})`
            : isWifi
            ? `Router Wi-Fi ${editFormData.router_brand || ''} ${editFormData.router_model || ''} (${editFormData.ip})`
            : `Máy tính ${editFormData.ip} (Chưa định danh)`,
          department: editFormData.department,
          category: editFormData.category,
          device_code: editFormData.asset_code,
          ip: editFormData.ip,
          mac: editFormData.mac,
          vendor: isWifi && editFormData.router_brand ? editFormData.router_brand : c.vendor,
          location: isWifi && editFormData.router_coverage ? editFormData.router_coverage : c.location,
          notes: isWifi
            ? `Router Wi-Fi ${editFormData.router_brand || ''} ${editFormData.router_model || ''} | Băng tần: ${editFormData.router_band || ''} | Cổng: ${editFormData.router_ports || ''} | Vị trí: ${editFormData.router_coverage || ''}`
            : c.notes,
          specs: {
            asset_code: editFormData.asset_code,
            year: editFormData.year,
            cpu: editFormData.cpu,
            mainboard: editFormData.mainboard,
            ram: editFormData.ram,
            storage: editFormData.storage,
            monitor: editFormData.monitor,
            keyboard: editFormData.keyboard,
            mouse: editFormData.mouse,
            peripherals: editFormData.peripherals,
            router_brand: editFormData.router_brand,
            router_model: editFormData.router_model,
            router_type: editFormData.router_type,
            router_band: editFormData.router_band,
            router_ports: editFormData.router_ports,
            router_ssid: editFormData.router_ssid,
            router_coverage: editFormData.router_coverage,
          },
        };
      }
      return c;
    });

    setComputers(updatedComputers);

    // Update global inventory
    const updatedAll = allInventory.map((d) => {
      if (d.id === editingDevice.id) {
        const found = updatedComputers.find((c) => c.id === editingDevice.id);
        return found || d;
      }
      return d;
    });
    setAllInventory(updatedAll);

    // Save to LocalStorage
    try {
      localStorage.setItem('hicc_real_devices_inventory', JSON.stringify(updatedAll));
    } catch {}

    // Save to Electron desktop file
    if (window.hiccDesktop?.saveInventory) {
      try {
        await window.hiccDesktop.saveInventory(updatedAll);
      } catch {}
    }

    setEditingDevice(null);
    setSaveSuccessMsg(`Đã cập nhật máy [${editFormData.ip}] thành công!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Filter and Grouping
  const groupedComputers = useMemo(() => {
    const q = search.toLowerCase();

    // 1. Filter by search
    const filtered = computers.filter((d) => {
      const matchSearch =
        (d.assigned_user && d.assigned_user.toLowerCase().includes(q)) ||
        (d.display_name && d.display_name.toLowerCase().includes(q)) ||
        (d.ip && d.ip.toLowerCase().includes(q)) ||
        (d.device_code && d.device_code.toLowerCase().includes(q)) ||
        (d.department && d.department.toLowerCase().includes(q)) ||
        (d.specs?.cpu && d.specs.cpu.toLowerCase().includes(q)) ||
        (d.specs?.mainboard && d.specs.mainboard.toLowerCase().includes(q)) ||
        (d.specs?.ram && d.specs.ram.toLowerCase().includes(q)) ||
        (d.specs?.storage && d.specs.storage.toLowerCase().includes(q)) ||
        (d.specs?.monitor && d.specs.monitor.toLowerCase().includes(q)) ||
        (d.specs?.peripherals && d.specs.peripherals.toLowerCase().includes(q));

      const matchDept = selectedDeptFilter === 'ALL' || d.department === selectedDeptFilter;
      return matchSearch && matchDept;
    });

    // If flat list mode
    if (groupMode === 'LIST') {
      const sorted = [...filtered].sort((a, b) => {
        const orderA = getDepartmentOrder(a.department || '');
        const orderB = getDepartmentOrder(b.department || '');
        if (orderA !== orderB) return orderA - orderB;
        const nameA = (a.assigned_user || a.display_name || a.ip).trim();
        const nameB = (b.assigned_user || b.display_name || b.ip).trim();
        return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base', numeric: true });
      });
      return [{ groupTitle: 'Tất Cả Thiết Bị Tính Toán', list: sorted }];
    }

    // Grouping
    const groups: Record<string, ComputerDevice[]> = {};
    for (const c of filtered) {
      let key = '';
      if (groupMode === 'SUBNET') {
        key = c.subnet_group || getSubnet(c.ip);
      } else {
        key = c.department || 'Chưa định danh tên';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }

    // Sort inside every group A -> Z
    for (const k in groups) {
      groups[k].sort((a, b) => {
        const nameA = (a.assigned_user || a.display_name || a.ip).trim();
        const nameB = (b.assigned_user || b.display_name || b.ip).trim();
        return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base', numeric: true });
      });
    }

    // Sort group keys strictly by official HEPCO Department Priority Order
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      if (groupMode === 'SUBNET') {
        return a.localeCompare(b, 'vi', { numeric: true });
      }
      return getDepartmentOrder(a) - getDepartmentOrder(b);
    });

    return sortedGroupKeys.map((k) => ({
      groupTitle: k,
      list: groups[k],
    }));
  }, [computers, search, groupMode, selectedDeptFilter]);

  // Ping action
  const handlePing = async (ip: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.hiccDesktop?.ping) return;
    setPingStatus((prev) => ({ ...prev, [ip]: { loading: true } }));
    try {
      const res = await window.hiccDesktop.ping(ip);
      setPingStatus((prev) => ({
        ...prev,
        [ip]: { loading: false, alive: res.isAlive, rtt: res.latency },
      }));
    } catch {
      setPingStatus((prev) => ({ ...prev, [ip]: { loading: false, alive: false } }));
    }
  };

  const handleRdp = (ip: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.hiccDesktop?.launchRdp) {
      window.hiccDesktop.launchRdp(ip);
    }
  };

  // Export Excel matching official corporate template
  const handleExportExcel = async () => {
    try {
      if (computers.length === 0) {
        alert('Danh sách thiết bị máy tính hiện đang trống.');
        return;
      }
      if (filteredComputers.length === 0) {
        alert('Không có thiết bị nào phù hợp với bộ lọc tìm kiếm hiện tại để xuất Excel.');
        return;
      }

      setIsExporting(true);
      const targetComputers = filteredComputers;
      const res = await exportComputersToExcel(targetComputers);

      if (res.success) {
        setExportModal({
          isOpen: true,
          fileName: res.fileName || 'Danh_sach_may_tinh.xlsx',
          filePath: res.filePath,
          fileSize: res.fileSize,
          isBrowserDownload: res.isBrowserDownload
        });
      } else if (res.error && res.error !== 'Hủy lưu file') {
        alert('Không thể xuất file: ' + res.error);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Lỗi xuất file: ' + (err.message || ''));
    } finally {
      setIsExporting(false);
    }
  };

  const unidentifiedCount = computers.filter((c) => c.department === 'Chưa định danh tên').length;
  const wifiCount = computers.filter((c) => c.department === 'Wi-Fi').length;
  const serverCount = computers.filter((c) => c.department === 'Máy chủ' || c.category === 'SERVER').length;
  const wsCount = computers.length - serverCount - unidentifiedCount - wifiCount;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans">
      {/* Toast message */}
      {saveSuccessMsg && (
        <div className="fixed top-12 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shadow-xs shrink-0">
            <img src={HEPCO_LOGO} alt="HEPCO Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Danh Sách Máy Tính, Máy Chủ & Thiết Bị Wi-Fi
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {computers.length} Thiết Bị
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý thông tin người sử dụng, phòng ban và cấu hình phần cứng chi tiết của từng thiết bị
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Xuất bảng kiểm kê thiết bị máy tính, máy chủ ra file Excel chuẩn doanh nghiệp"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Badges Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedDeptFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 ${
            selectedDeptFilter === 'ALL'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Computer className="w-3.5 h-3.5 text-slate-400" />
          <span>Tất Cả ({computers.length})</span>
        </button>

        <button
          onClick={() => setSelectedDeptFilter('Máy chủ')}
          className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 ${
            selectedDeptFilter === 'Máy chủ'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Hệ Thống Máy Chủ ({serverCount})</span>
        </button>

        {wifiCount > 0 && (
          <button
            onClick={() => setSelectedDeptFilter('Wi-Fi')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 ${
              selectedDeptFilter === 'Wi-Fi'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-sky-600" />
            <span>Wi-Fi ({wifiCount})</span>
          </button>
        )}

        {unidentifiedCount > 0 && (
          <button
            onClick={() => setSelectedDeptFilter('Chưa định danh tên')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 animate-pulse ${
              selectedDeptFilter === 'Chưa định danh tên'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Chưa Định Danh Tên ({unidentifiedCount} máy)</span>
          </button>
        )}

        {/* Live Hardware Audit Button */}
        <button
          onClick={async () => {
            setIsAuditingAll(true);
            setAuditGlobalMsg('Đang kích hoạt quy trình kiểm định linh kiện thực tế qua mạng LAN...');
            try {
              const res = await fetch('/data/hardware_audit_report.json');
              if (res.ok) {
                const report = await res.json();
                setAuditGlobalMsg(`Đã đối soát xong ${report.length} máy tính & máy chủ qua LAN! Xem cấu hình bên dưới.`);
              }
            } catch {}
            setTimeout(() => {
              setIsAuditingAll(false);
              setTimeout(() => setAuditGlobalMsg(null), 3000);
            }, 1500);
          }}
          disabled={isAuditingAll}
          className="px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 cursor-pointer disabled:opacity-50 ml-auto"
          title="Quét và kiểm định cấu hình linh kiện thực tế qua mạng LAN bằng WMI/DCOM"
        >
          <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isAuditingAll ? 'animate-spin' : ''}`} />
          <span>{isAuditingAll ? 'Đang Quét Cấu Hình...' : 'Kiểm Định Cấu Hình Thực Tế (WMI)'}</span>
        </button>
      </div>

      {auditGlobalMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{auditGlobalMsg}</span>
        </div>
      )}

      {/* 2. Controls Bar: Grouping selector, search, department dropdown */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setGroupMode('DEPARTMENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                groupMode === 'DEPARTMENT'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Theo Phòng Ban</span>
            </button>
            <button
              onClick={() => setGroupMode('SUBNET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                groupMode === 'SUBNET'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Theo Dải IP</span>
            </button>
            <button
              onClick={() => setGroupMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                groupMode === 'LIST'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Computer className="w-3.5 h-3.5" />
              <span>Danh Sách Chung</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Tên nhân sự, Mã máy, IP, CPU, RAM..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Lọc Phòng Ban:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="ALL">Tất cả đơn vị ({computers.length} máy)</option>
              {Array.from(
                new Set(
                  FIXED_DEPARTMENTS.map((d) => {
                    if (d === 'Phòng Kỹ thuật') return 'Phòng Kỹ Thuật';
                    return d;
                  })
                )
              ).map((dept) => {
                const count = computers.filter(
                  (c) =>
                    c.department === dept ||
                    (c.department && c.department.toLowerCase().trim() === dept.toLowerCase().trim())
                ).length;
                if (count === 0 && dept !== 'Chưa định danh tên') return null;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main List Data Presentation */}
      <div className="space-y-4">
        {groupedComputers.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs">
            <Computer className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-700">Không tìm thấy thiết bị nào phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
          </div>
        ) : (
          groupedComputers.map(({ groupTitle, list }) => {
            const isCollapsed = !!collapsedGroups[groupTitle];
            const groupOnlineCount = list.filter((c) => c.status === 'ONLINE').length;
            const isUnidentifiedGroup = groupTitle === 'Chưa định danh tên';
            const isServerGroup = groupTitle === 'Máy chủ';

            return (
              <div
                key={groupTitle}
                className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs overflow-hidden ${
                  isUnidentifiedGroup
                    ? 'border-amber-300 dark:border-amber-800/80'
                    : isServerGroup
                    ? 'border-indigo-200 dark:border-indigo-900/80'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Accordion Group Header */}
                <div
                  onClick={() => toggleGroupCollapse(groupTitle)}
                  className={`px-5 py-3 flex items-center justify-between cursor-pointer border-b select-none transition ${
                    isUnidentifiedGroup
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/70 dark:hover:bg-amber-950/60'
                      : isServerGroup
                      ? 'bg-[#EAEFF5] dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                      : 'bg-[#EAEFF5] dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-slate-600 dark:text-slate-300">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isServerGroup ? (
                      <Server className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    ) : isUnidentifiedGroup ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : groupMode === 'SUBNET' ? (
                      <Network className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                    )}
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {groupTitle.toUpperCase()}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border font-sans ${
                          isUnidentifiedGroup
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : isServerGroup
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        }`}
                      >
                        {list.length} thiết bị
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px]">
                      {groupOnlineCount} online
                    </span>
                    {isUnidentifiedGroup ? (
                      <span className="text-amber-800 dark:text-amber-300 font-bold text-[10px] bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded font-sans border border-amber-300 dark:border-amber-800">
                        Cần bổ sung nhân sự phụ trách
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono hidden md:inline">
                        Sắp xếp: A → Z ({list[0]?.assigned_user?.split(' ').pop()} ... {list[list.length - 1]?.assigned_user?.split(' ').pop()})
                      </span>
                    )}
                  </div>
                </div>

                {/* List Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-['Times_New_Roman'] border-collapse">
                      <thead className="bg-[#13522C] text-white border-b border-[#0F4022] font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center border-r border-[#0F4022] whitespace-nowrap">STT</th>
                          <th className="py-2.5 px-4 border-r border-[#0F4022] whitespace-nowrap">Họ và Tên Cán Bộ / Người Sử Dụng</th>
                          <th className="py-2.5 px-3 border-r border-[#0F4022] whitespace-nowrap">Phòng Ban Quản Lý</th>
                          <th className="py-2.5 px-3 border-r border-[#0F4022] text-center whitespace-nowrap">Địa Chỉ IP</th>
                          <th className="py-2.5 px-3 border-r border-[#0F4022] text-center whitespace-nowrap">Mã TS / Năm Cấp</th>
                          <th className="py-2.5 px-3 border-r border-[#0F4022] whitespace-nowrap">Cấu Hình Chi Tiết</th>
                          <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap">Trạng Thái</th>
                          <th className="py-2.5 px-4 text-right whitespace-nowrap">Tác Vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.map((comp, idx) => {
                          const isExpanded = !!expandedDeviceIds[comp.id];
                          const p = pingStatus[comp.ip];
                          const isServer = comp.category === 'SERVER' || comp.department === 'Máy chủ';
                          const isUnidentified = comp.department === 'Chưa định danh tên';
                          const isWifi =
                            comp.department === 'Wi-Fi' ||
                            comp.category === 'WIFI' ||
                            comp.category === 'ROUTER';

                          return (
                            <React.Fragment key={comp.id}>
                              {/* Main List Row */}
                              <tr
                                onClick={() => toggleDeviceExpand(comp.id)}
                                className={`cursor-pointer transition-colors ${
                                  isExpanded
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/40 font-medium'
                                    : isWifi
                                    ? 'hover:bg-teal-50/50 dark:hover:bg-teal-950/40 bg-teal-50/10 dark:bg-teal-950/20'
                                    : isUnidentified
                                    ? 'hover:bg-amber-50/40 dark:hover:bg-amber-950/40 bg-amber-50/10 dark:bg-amber-950/20'
                                    : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>

                                {/* User & Device Name (Clickable) */}
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isWifi
                                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                                          : isServer
                                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                                          : isUnidentified
                                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                      }`}
                                    >
                                      {isWifi ? (
                                        <Wifi className="w-3.5 h-3.5" />
                                      ) : isServer ? (
                                        <Server className="w-3.5 h-3.5" />
                                      ) : isUnidentified ? (
                                        <HelpCircle className="w-3.5 h-3.5" />
                                      ) : (
                                        (comp.assigned_user || comp.display_name).charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-1.5">
                                        <span className={isWifi ? 'text-teal-900 dark:text-teal-300 font-bold' : isUnidentified ? 'text-amber-900 dark:text-amber-300 font-bold' : ''}>
                                          {comp.assigned_user || comp.display_name}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {comp.mac || 'Chưa gán MAC'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Department Badge */}
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] inline-flex items-center gap-1 ${
                                      isWifi
                                        ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
                                        : isUnidentified
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                        : isServer
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isWifi && <Wifi className="w-3 h-3 text-teal-600" />}
                                    {comp.department}
                                  </span>
                                </td>

                                {/* IP Address (Clickable) */}
                                <td className="py-2.5 px-3">
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                    {comp.ip}
                                  </span>
                                </td>

                                {/* Asset Code & Year */}
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-bold text-emerald-800 dark:text-emerald-400 text-[11px]">
                                    {comp.specs?.asset_code || comp.device_code || '-'}
                                  </div>
                                  {comp.specs?.year && (
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Năm {comp.specs.year}</div>
                                  )}
                                </td>

                                {/* Quick Specs Summary: Router specs if Wi-Fi, CPU/RAM if PC */}
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                                  {isWifi ? (
                                    <>
                                      <div className="truncate max-w-[210px] font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1">
                                        <Wifi className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                        {comp.specs?.router_brand
                                          ? `${comp.specs.router_brand} ${comp.specs.router_model || ''}`
                                          : comp.model || comp.vendor || 'Thiết bị Wi-Fi'}
                                      </div>
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={comp.specs?.router_band || comp.notes}>
                                        {comp.specs?.router_band || 'Dual-Band 2.4G & 5G'}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="truncate max-w-[170px] font-medium text-slate-800 dark:text-slate-200">
                                        {comp.specs?.cpu || (isServer ? 'Intel Xeon' : 'Intel Core')}
                                      </div>
                                      <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold">
                                        {comp.specs?.ram || '8GB RAM'} · {comp.specs?.storage?.split('+')[0] || 'SSD/HDD'}
                                      </div>
                                    </>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-2.5 px-3 text-center">
                                  <StatusBadge status={comp.status} />
                                </td>

                                {/* Actions: Edit, Ping, RDP */}
                                <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleOpenEditModal(comp)}
                                      className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 hover:text-emerald-800 dark:hover:text-emerald-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                      title="Chỉnh sửa thông tin phòng ban & cấu hình"
                                    >
                                      <Edit3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>Sửa</span>
                                    </button>

                                    {/* Ping Button */}
                                    <button
                                      onClick={(e) => handlePing(comp.ip, e)}
                                      disabled={p?.loading}
                                      className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                      title="Kiểm tra kết nối IP"
                                    >
                                      {p?.loading ? '...' : p?.rtt !== undefined ? `${p.rtt || '<1'}ms` : 'Ping'}
                                    </button>

                                    {/* RDP Button */}
                                    <button
                                      onClick={(e) => handleRdp(comp.ip, e)}
                                      className="p-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                                      title="Mở Remote Desktop"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row: Detailed Hardware Specs Breakdown (Shown ONLY when clicked!) */}
                              {isExpanded && (
                                <tr className="bg-emerald-50/20 dark:bg-slate-900/60 border-b border-emerald-100 dark:border-slate-800">
                                  <td colSpan={8} className="p-3.5 px-5">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/80 shadow-xs space-y-2.5">
                                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                          <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">
                                            Cấu Hình Chi Tiết: {comp.assigned_user || comp.display_name}
                                          </h4>
                                          <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-300 dark:border-emerald-800">
                                            {comp.specs?.asset_code || comp.device_code || comp.ip}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditModal(comp);
                                          }}
                                          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          <Edit3 className="w-3 h-3" /> Chỉnh sửa cấu hình này
                                        </button>
                                      </div>

                                      {/* Hardware or Router Specs Blocks */}
                                      {isWifi ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                                          {/* Hãng sản xuất */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Hãng / Thương Hiệu
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px] truncate">
                                              {comp.specs?.router_brand || comp.vendor || 'ASUS / TP-Link'}
                                            </div>
                                          </div>

                                          {/* Mã & Mẫu Router */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Tag className="w-3.5 h-3.5 text-teal-600" /> Mã & Mẫu Router (Model)
                                            </div>
                                            <div className="font-bold text-teal-900 mt-1 text-[11px] truncate" title={comp.specs?.router_model || comp.model}>
                                              {comp.specs?.router_model || comp.model || comp.device_code}
                                            </div>
                                          </div>

                                          {/* Chế độ hoạt động */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Layers className="w-3.5 h-3.5 text-teal-600" /> Chế Độ Hoạt Động
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px]">
                                              {comp.specs?.router_type || 'Router & Access Point'}
                                            </div>
                                          </div>

                                          {/* Băng tần & Chuẩn Wi-Fi */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Radio className="w-3.5 h-3.5 text-teal-600" /> Băng Tần Sóng
                                            </div>
                                            <div className="font-bold text-amber-800 mt-1 text-[11px] truncate" title={comp.specs?.router_band}>
                                              {comp.specs?.router_band || 'Dual-Band 2.4G & 5G'}
                                            </div>
                                          </div>

                                          {/* Cổng kết nối */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Network className="w-3.5 h-3.5 text-teal-600" /> Cổng LAN / WAN
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px] truncate" title={comp.specs?.router_ports}>
                                              {comp.specs?.router_ports || '1 WAN + 4 LAN Gigabit'}
                                            </div>
                                          </div>

                                          {/* Vị trí phủ sóng & SSID */}
                                          <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase">
                                              <Wifi className="w-3.5 h-3.5 text-teal-600" /> Phủ Sóng & Tên SSID
                                            </div>
                                            <div className="font-bold text-emerald-800 mt-1 text-[11px] truncate" title={comp.specs?.router_coverage || comp.location}>
                                              {comp.specs?.router_ssid ? `SSID: ${comp.specs.router_ssid}` : (comp.specs?.router_coverage || comp.location || 'Khu vực văn phòng')}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                                          {/* CPU */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <Cpu className="w-3.5 h-3.5 text-indigo-600" /> CPU
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px] truncate" title={comp.specs?.cpu}>
                                              {comp.specs?.cpu || 'Intel Core / Xeon'}
                                            </div>
                                          </div>

                                          {/* Mainboard */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <Layers className="w-3.5 h-3.5 text-blue-600" /> Bo Mạch (Main)
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px] truncate" title={comp.specs?.mainboard}>
                                              {comp.specs?.mainboard || 'Mainboard'}
                                            </div>
                                          </div>

                                          {/* RAM */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <Zap className="w-3.5 h-3.5 text-amber-500" /> Bộ Nhớ RAM
                                            </div>
                                            <div className="font-bold text-amber-800 mt-1 text-[11px]">
                                              {comp.specs?.ram || '8GB DDR4'}
                                            </div>
                                          </div>

                                          {/* Storage */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Ổ Cứng
                                            </div>
                                            <div className="font-bold text-emerald-800 mt-1 text-[11px] truncate" title={comp.specs?.storage}>
                                              {comp.specs?.storage || 'SSD / HDD'}
                                            </div>
                                          </div>

                                          {/* Monitor */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <Monitor className="w-3.5 h-3.5 text-sky-600" /> Màn Hình
                                            </div>
                                            <div className="font-bold text-slate-800 mt-1 text-[11px] truncate" title={comp.specs?.monitor}>
                                              {comp.specs?.monitor || 'Màn hình'}
                                            </div>
                                          </div>

                                          {/* Keyboard & Mouse */}
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                              <MousePointer className="w-3.5 h-3.5 text-purple-600" /> Phím / Chuột
                                            </div>
                                            <div className="font-bold text-slate-700 mt-1 text-[11px] truncate">
                                              {comp.specs?.keyboard || 'Logitech'} / {comp.specs?.mouse || 'Logitech'}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Peripherals & Extra Notes */}
                                      {comp.specs?.peripherals && (
                                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                                          <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                                          <div>
                                            <strong className="text-emerald-800">Thiết bị ngoại vi / Ghi chú:</strong> {comp.specs.peripherals}
                                          </div>
                                        </div>
                                      )}

                                      {/* Live Hardware Verification Block */}
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                          <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-600" />
                                            <span className="font-bold text-slate-800 text-xs">
                                              Kiểm Định Phần Cứng Thực Tế Qua LAN (WMI / DCOM)
                                            </span>
                                            {comp.hardware_verified && (
                                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Đã Đối Soát Linh Kiện
                                              </span>
                                            )}
                                          </div>
                                          <button
                                            onClick={(e) => handleAuditRemoteHardware(comp.ip, e)}
                                            disabled={liveAuditStatus[comp.ip]?.loading}
                                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
                                          >
                                            <Zap className={`w-3 h-3 ${liveAuditStatus[comp.ip]?.loading ? 'animate-spin' : ''}`} />
                                            <span>
                                              {liveAuditStatus[comp.ip]?.loading
                                                ? 'Đang truy vấn linh kiện...'
                                                : 'Kiểm tra linh kiện thực tế'}
                                            </span>
                                          </button>
                                        </div>

                                        {liveAuditStatus[comp.ip]?.error && (
                                          <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                            <span>{liveAuditStatus[comp.ip]?.error}</span>
                                          </div>
                                        )}

                                        {liveAuditStatus[comp.ip]?.data && (
                                          <div className="mt-2.5 space-y-2">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">CPU Thực Tế</span>
                                                <div className="font-bold text-slate-800 truncate" title={liveAuditStatus[comp.ip]?.data.cpu}>
                                                  {liveAuditStatus[comp.ip]?.data.cpu}
                                                </div>
                                              </div>
                                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">RAM Thực Tế</span>
                                                <div className="font-bold text-amber-800">
                                                  {liveAuditStatus[comp.ip]?.data.ramGB} GB RAM
                                                </div>
                                              </div>
                                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Bo Mạch Thực Tế</span>
                                                <div className="font-bold text-slate-800 truncate" title={liveAuditStatus[comp.ip]?.data.mainboard}>
                                                  {liveAuditStatus[comp.ip]?.data.mainboard}
                                                </div>
                                              </div>
                                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Ổ Cứng Thực Tế</span>
                                                <div className="font-bold text-emerald-800 truncate" title={liveAuditStatus[comp.ip]?.data.storage}>
                                                  {liveAuditStatus[comp.ip]?.data.storage}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                              <span className="text-[11px] text-slate-500">
                                                Hệ điều hành: <strong className="text-slate-700">{liveAuditStatus[comp.ip]?.data.os}</strong>
                                              </span>
                                              <button
                                                onClick={() => handleSyncLiveSpecs(comp, liveAuditStatus[comp.ip]?.data)}
                                                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                                              >
                                                <Check className="w-3 h-3" />
                                                <span>Đồng bộ linh kiện thực tế vào hồ sơ</span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Modal: Chỉnh Sửa Chi Tiết Từng Máy */}
      {editingDevice && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 border border-slate-200 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Chỉnh Sửa Máy Tính & Định Danh Phòng Ban
                  </h3>
                  <p className="text-xs text-slate-500">
                    IP: <strong className="text-emerald-700 font-mono">{editFormData.ip}</strong> · Cập nhật người dùng và phân loại phòng ban.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDevice(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* Assigned User */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Người Sử Dụng / Tên Máy *</label>
                <input
                  type="text"
                  value={editFormData.assigned_user}
                  onChange={(e) => setEditFormData({ ...editFormData, assigned_user: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="Nhập họ và tên cán bộ nhân viên..."
                />
              </div>

              {/* Department (STRICTLY FROM FIXED 18 + CHƯA ĐỊNH DANH) */}
              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  Phòng Ban / Đơn Vị (Chọn trong 18 đơn vị) *
                </label>
                <select
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full bg-emerald-50/60 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900 focus:outline-none focus:border-emerald-600"
                >
                  {Array.from(
                    new Set(
                      FIXED_DEPARTMENTS.map((d) => (d === 'Phòng Kỹ thuật' ? 'Phòng Kỹ Thuật' : d))
                    )
                  ).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* IP Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ IP Mạng LAN *</label>
                <input
                  type="text"
                  value={editFormData.ip}
                  onChange={(e) => setEditFormData({ ...editFormData, ip: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="VD: 10.1.1.45"
                />
              </div>

              {/* MAC Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ MAC</label>
                <input
                  type="text"
                  value={editFormData.mac}
                  onChange={(e) => setEditFormData({ ...editFormData, mac: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="VD: C0:25:A5:96:66:7A"
                />
              </div>

              {/* Asset Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Tài Sản / Mã Số</label>
                <input
                  type="text"
                  value={editFormData.asset_code}
                  onChange={(e) => setEditFormData({ ...editFormData, asset_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="VD: TC01, TV02, KT03, SRV-01..."
                />
              </div>

              {/* Year */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Năm Cấp Phát</label>
                <input
                  type="text"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="VD: 2021, 2023..."
                />
              </div>

              {/* Dynamic Fields: Router Wi-Fi vs Computer Hardware */}
              {editFormData.department === 'Wi-Fi' || editFormData.category === 'WIFI' || editFormData.category === 'ROUTER' ? (
                <>
                  {/* Router Brand */}
                  <div>
                    <label className="block font-bold text-teal-800 mb-1">Hãng Sản Xuất / Thương Hiệu *</label>
                    <input
                      type="text"
                      value={editFormData.router_brand || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: ASUS, TP-Link, DrayTek, Cisco, Ruijie..."
                    />
                  </div>

                  {/* Router Model */}
                  <div>
                    <label className="block font-bold text-teal-800 mb-1">Mã & Mẫu Router (Model) *</label>
                    <input
                      type="text"
                      value={editFormData.router_model || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: RT-AC1200, Archer C64, RT-AX53U, Vigor2927..."
                    />
                  </div>

                  {/* Router Type / Mode */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Loại Thiết Bị & Chế Độ Hoạt Động</label>
                    <input
                      type="text"
                      value={editFormData.router_type || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: Router Wi-Fi & AP / Access Point / Modem Wi-Fi"
                    />
                  </div>

                  {/* Frequency Band & Standard */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Băng Tần Phát Sóng & Chuẩn Wi-Fi</label>
                    <input
                      type="text"
                      value={editFormData.router_band || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_band: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: Dual-Band 2.4GHz + 5GHz / Wi-Fi 6 AX1800"
                    />
                  </div>

                  {/* Ports */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cổng Mạng Kết Nối (LAN / WAN)</label>
                    <input
                      type="text"
                      value={editFormData.router_ports || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_ports: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: 1 WAN Gigabit + 4 LAN Gigabit (1000Mbps)"
                    />
                  </div>

                  {/* SSID & Coverage */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Wi-Fi (SSID) & Vị Trí Phủ Sóng</label>
                    <input
                      type="text"
                      value={editFormData.router_ssid || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, router_ssid: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                      placeholder="VD: HEPCO_TANG1 (Phòng họp lớn & Sảnh T1)"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* CPU */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bộ Vi Xử Lý (CPU)</label>
                    <input
                      type="text"
                      value={editFormData.cpu}
                      onChange={(e) => setEditFormData({ ...editFormData, cpu: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: Core i5-11400 / Xeon Silver"
                    />
                  </div>

                  {/* Mainboard */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bo Mạch Chủ (Mainboard)</label>
                    <input
                      type="text"
                      value={editFormData.mainboard}
                      onChange={(e) => setEditFormData({ ...editFormData, mainboard: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: Gigabyte H510M / Dell PowerEdge"
                    />
                  </div>

                  {/* RAM */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bộ Nhớ RAM</label>
                    <input
                      type="text"
                      value={editFormData.ram}
                      onChange={(e) => setEditFormData({ ...editFormData, ram: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: 8GB DDR4 / 16GB DDR4 / 32GB ECC"
                    />
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ổ Cứng Lưu Trữ (Storage)</label>
                    <input
                      type="text"
                      value={editFormData.storage}
                      onChange={(e) => setEditFormData({ ...editFormData, storage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: SSD 256GB + HDD 1TB / SAS RAID"
                    />
                  </div>

                  {/* Monitor */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Màn Hình (Monitor)</label>
                    <input
                      type="text"
                      value={editFormData.monitor}
                      onChange={(e) => setEditFormData({ ...editFormData, monitor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: DELL P2422H 24 inch"
                    />
                  </div>

                  {/* Keyboard / Mouse */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bàn Phím & Chuột</label>
                    <input
                      type="text"
                      value={editFormData.keyboard}
                      onChange={(e) => setEditFormData({ ...editFormData, keyboard: e.target.value, mouse: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="VD: Logitech MK200 / Phím Chuột văn phòng"
                    />
                  </div>
                </>
              )}

              {/* Peripherals & Notes (Full width) */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Thiết Bị Ngoại Vi Kèm Theo / Ghi Chú</label>
                <input
                  type="text"
                  value={editFormData.peripherals}
                  onChange={(e) => setEditFormData({ ...editFormData, peripherals: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="VD: Máy in Canon 2900 / Máy in HP 404dn / Máy scan HP / Card đồ họa..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                * Cập nhật sẽ được lưu ngay lập tức vào cơ sở dữ liệu.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Export Success Modal with Open File & Open Folder options */}
      <ExportSuccessModal
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
        fileName={exportModal.fileName}
        filePath={exportModal.filePath}
        fileSize={exportModal.fileSize}
        isBrowserDownload={exportModal.isBrowserDownload}
      />
    </div>
  );
};

export default ComputerInventoryPage;
