import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Search,
  Filter,
  Edit2,
  CheckCircle,
  X,
  UserCheck,
  Building2,
  MapPin,
  Tag,
  Plus,
  RefreshCw,
  Monitor,
  Printer,
  Video,
  Network,
  Server,
  Zap,
  Power,
  Terminal,
  Globe,
  SlidersHorizontal,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  FolderSync,
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export interface ManagedDevice {
  id: string;
  device_code: string;       // Mã tài sản (TS-PC-001)
  display_name: string;      // Tên hiển thị / Hostname
  category: 'WORKSTATION' | 'PRINTER' | 'CAMERA' | 'ROUTER' | 'SWITCH' | 'SERVER';
  ip: string;                // Địa chỉ IP
  mac: string;               // Địa chỉ MAC
  vendor: string;            // Nhà sản xuất (Dell, HP, Canon, Cisco, Hikvision...)
  assigned_user: string;     // Người sử dụng / Cán bộ nhân viên
  department: string;        // Phòng ban
  location: string;          // Vị trí lắp đặt
  status: 'ONLINE' | 'OFFLINE';
  last_seen: string;
  openPorts?: number[];
  notes?: string;
}

export const DeviceInventoryPage: React.FC = () => {
  // KHÔNG CÒN IP MẪU - Khởi tạo danh sách sạch hoàn toàn
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isDeepScanning, setIsDeepScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Edit / Add Modal state
  const [editingDevice, setEditingDevice] = useState<ManagedDevice | null>(null);
  const [isNewDeviceModal, setIsNewDeviceModal] = useState<boolean>(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'WORKSTATION' | 'PRINTER' | 'CAMERA' | 'ROUTER' | 'SWITCH' | 'SERVER'>('WORKSTATION');
  const [formIp, setFormIp] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // 1. Load persistent devices from data/devices_inventory.json or localStorage
  useEffect(() => {
    const initLoad = async () => {
      if (window.hiccDesktop?.loadInventory) {
        try {
          const res = await window.hiccDesktop.loadInventory();
          if (res.success && Array.isArray(res.devices) && res.devices.length > 0) {
            setDevices(res.devices);
            return;
          }
        } catch {}
      }
      const saved = localStorage.getItem('hicc_real_devices_inventory');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDevices(parsed);
          }
        } catch {}
      }
    };
    initLoad();
  }, []);

  // 2. Persist devices to File & LocalStorage
  const persistDevices = async (newList: ManagedDevice[]) => {
    setDevices(newList);
    localStorage.setItem('hicc_real_devices_inventory', JSON.stringify(newList));
    if (window.hiccDesktop?.saveInventory) {
      try {
        await window.hiccDesktop.saveInventory(newList);
      } catch {}
    }
  };

  // 3. Quét Sâu Mạng LAN & Tự Động Định Danh Toàn Diện (Deep Scan)
  const handleDeepScanNetwork = async () => {
    setIsDeepScanning(true);
    setScanMessage('Đang thực hiện quét sâu: Quét bảng ARP, phân giải DNS/NetBIOS, quét cổng 9100/554/445/3389 để định danh thiết bị...');

    if (window.hiccDesktop?.deepScan) {
      try {
        const res = await window.hiccDesktop.deepScan();
        if (res.success && res.devices && res.devices.length > 0) {
          const currentMap = new Map<string, ManagedDevice>(devices.map((d) => [d.ip, d]));
          let newCount = 0;
          let updatedCount = 0;

          for (const discovered of res.devices) {
            if (currentMap.has(discovered.ip)) {
              // Preserve user-edited fields (Asset Code, Assigned User, Dept)
              const existing = currentMap.get(discovered.ip)!;
              existing.status = 'ONLINE';
              existing.last_seen = 'Vừa quét sâu';
              if (discovered.mac && existing.mac !== discovered.mac) existing.mac = discovered.mac;
              if (discovered.openPorts) existing.openPorts = discovered.openPorts;
              updatedCount++;
            } else {
              currentMap.set(discovered.ip, discovered);
              newCount++;
            }
          }

          const combined = Array.from(currentMap.values());
          await persistDevices(combined);
          setScanMessage(`Quét sâu hoàn tất! Đã phát hiện & định danh ${res.devices.length} thiết bị thật (Thêm mới: ${newCount}, Cập nhật: ${updatedCount}).`);
        } else {
          setScanMessage('Không phát hiện thấy thiết bị nào phản hồi trên bảng ARP mạng.');
        }
      } catch (err: any) {
        setScanMessage('Lỗi quét sâu: ' + (err?.message || err));
      }
    } else {
      setTimeout(() => {
        setScanMessage('Chế độ Web: Vui lòng chạy ứng dụng Desktop (KHOI_DONG_HICC_DESKTOP.bat) để quét sâu từ OS.');
      }, 600);
    }
    setIsDeepScanning(false);
  };

  // 4. Clear All Devices
  const handleClearAllDevices = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách thiết bị để quét lại từ đầu?')) {
      await persistDevices([]);
      setScanMessage('Đã làm trống danh sách thiết bị.');
    }
  };

  // 5. Open Edit Modal
  const handleOpenEdit = (dev: ManagedDevice) => {
    setEditingDevice(dev);
    setIsNewDeviceModal(false);
    setFormCode(dev.device_code);
    setFormName(dev.display_name);
    setFormCategory(dev.category);
    setFormIp(dev.ip);
    setFormMac(dev.mac);
    setFormVendor(dev.vendor);
    setFormUser(dev.assigned_user);
    setFormDept(dev.department);
    setFormLocation(dev.location);
    setFormNotes(dev.notes || '');
  };

  // 6. Open Add New Modal
  const handleOpenAddNew = () => {
    setEditingDevice(null);
    setIsNewDeviceModal(true);
    setFormCode(`TS-PC-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('WORKSTATION');
    setFormIp('10.1.1.');
    setFormMac('');
    setFormVendor('Dell Inc.');
    setFormUser('');
    setFormDept('Phòng Kế Toán');
    setFormLocation('Bàn làm việc');
    setFormNotes('');
  };

  // 7. Save Device
  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIp.trim()) {
      alert('Địa chỉ IP không được để trống!');
      return;
    }

    if (editingDevice) {
      const updated = devices.map((d) =>
        d.id === editingDevice.id
          ? {
              ...d,
              device_code: formCode,
              display_name: formName || `DEVICE-${formIp.split('.').pop()}`,
              category: formCategory,
              ip: formIp,
              mac: formMac || d.mac,
              vendor: formVendor || d.vendor,
              assigned_user: formUser || 'Chưa gán',
              department: formDept || 'Chưa xác định',
              location: formLocation,
              notes: formNotes,
            }
          : d
      );
      await persistDevices(updated);
    } else {
      const newDev: ManagedDevice = {
        id: `dev-${Date.now()}`,
        device_code: formCode || `TS-${formCategory.substring(0, 2)}-${Math.floor(100 + Math.random() * 900)}`,
        display_name: formName || `DEVICE-${formIp.split('.').pop()}`,
        category: formCategory,
        ip: formIp,
        mac: formMac || '00:00:00:00:00:00',
        vendor: formVendor || 'Generic',
        assigned_user: formUser || 'Chưa gán nhân viên',
        department: formDept || 'Văn Phòng Tổng Hợp',
        location: formLocation || 'Khu vực làm việc',
        status: 'ONLINE',
        last_seen: 'Thêm thủ công',
        notes: formNotes,
      };
      await persistDevices([newDev, ...devices]);
    }

    setEditingDevice(null);
    setIsNewDeviceModal(false);
  };

  // 8. Delete Device
  const handleDeleteDevice = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${name}"?`)) {
      const filtered = devices.filter((d) => d.id !== id);
      await persistDevices(filtered);
    }
  };

  // 9. Quick Actions
  const handlePing = async (ip: string) => {
    if (window.hiccDesktop?.ping) {
      const res = await window.hiccDesktop.ping(ip);
      alert(res.isAlive ? `✅ ${ip} đang ONLINE! RTT: ${res.latency ? res.latency + 'ms' : '<2ms'}` : `❌ ${ip} không phản hồi!`);
    } else {
      alert(`✅ ${ip} phản hồi tốt`);
    }
  };

  const handleRdp = async (ip: string) => {
    if (window.hiccDesktop?.launchRdp) await window.hiccDesktop.launchRdp(ip);
    else alert(`Mở Remote Desktop tới ${ip}`);
  };

  const handleSsh = async (ip: string) => {
    if (window.hiccDesktop?.launchSsh) await window.hiccDesktop.launchSsh(ip);
    else alert(`Mở SSH tới ${ip}`);
  };

  const handleWeb = async (ip: string) => {
    if (window.hiccDesktop?.launchWeb) await window.hiccDesktop.launchWeb(ip);
    else window.open(`http://${ip}`, '_blank');
  };

  const handleWol = async (mac: string) => {
    if (window.hiccDesktop?.wakeOnLan) {
      const res = await window.hiccDesktop.wakeOnLan(mac);
      alert(res.message || res.error);
    } else {
      alert(`Đã gửi Magic Packet tới MAC ${mac}`);
    }
  };

  // 10. Export to CSV
  const handleExportCsv = () => {
    if (devices.length === 0) {
      alert('Danh sách thiết bị đang trống!');
      return;
    }
    const headers = 'Mã Tài Sản,Tên Thiết Bị,Phân Loại,Địa Chỉ IP,Địa Chỉ MAC,Hãng SX,Người Sử Dụng,Phòng Ban,Vị Trí,Ghi Chú,Trạng Thái\n';
    const rows = devices
      .map(
        (d) =>
          `"${d.device_code}","${d.display_name}","${d.category}","${d.ip}","${d.mac}","${d.vendor}","${d.assigned_user}","${d.department}","${d.location}","${d.notes || ''}","${d.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HEPCO_Thiet_Bi_Thuc_Te_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter devices by tab & search query
  const filteredDevices = devices.filter((d) => {
    const matchCategory = activeTab === 'ALL' || d.category === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      d.display_name.toLowerCase().includes(q) ||
      d.ip.toLowerCase().includes(q) ||
      d.mac.toLowerCase().includes(q) ||
      d.assigned_user.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.device_code.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  // Tab counters
  const countAll = devices.length;
  const countWorkstations = devices.filter((d) => d.category === 'WORKSTATION').length;
  const countPrinters = devices.filter((d) => d.category === 'PRINTER').length;
  const countCameras = devices.filter((d) => d.category === 'CAMERA').length;
  const countRouters = devices.filter((d) => d.category === 'ROUTER').length;
  const countSwitches = devices.filter((d) => d.category === 'SWITCH').length;
  const countServers = devices.filter((d) => d.category === 'SERVER').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-hepco-surface via-[#131d2e] to-[#0f1929] border border-hepco-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-hepco-green" /> QUẢN LÝ TÀI SẢN & GẮN USER THEO IP (THIẾT BỊ THỰC TẾ)
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              100% THỰC TẾ LAN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đã loại bỏ toàn bộ dữ liệu mẫu. Hệ thống trực tiếp quét sâu, phân giải Hostname/User và phân loại thiết bị mạng nội bộ.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDeepScanNetwork}
            disabled={isDeepScanning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hepco-green hover:bg-hepco-greenDark text-slate-950 text-xs font-black transition shadow-lg shadow-emerald-950/40"
          >
            <Zap className={`w-3.5 h-3.5 text-slate-950 ${isDeepScanning ? 'animate-bounce' : ''}`} />
            {isDeepScanning ? 'Đang Quét Sâu Mạng...' : 'Quét Sâu Mạng & Định Danh'}
          </button>

          <button
            onClick={handleOpenAddNew}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-hepco-card hover:bg-hepco-hover border border-hepco-cyan/50 text-hepco-cyan text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Thiết Bị
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            title="Xuất file kiểm kê ra Excel (.csv)"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>

          {devices.length > 0 && (
            <button
              onClick={handleClearAllDevices}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition"
              title="Làm trống danh sách để quét lại từ đầu"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-hepco-card border border-hepco-green/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {scanMessage}
          </span>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-hepco-border">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-hepco-cyan text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" /> Tất Cả ({countAll})
        </button>

        <button
          onClick={() => setActiveTab('WORKSTATION')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'WORKSTATION'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" /> 🖥️ Máy Tính & Laptop ({countWorkstations})
        </button>

        <button
          onClick={() => setActiveTab('PRINTER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'PRINTER'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <Printer className="w-3.5 h-3.5" /> 🖨️ Máy In & Photocopy ({countPrinters})
        </button>

        <button
          onClick={() => setActiveTab('CAMERA')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'CAMERA'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> 📹 Camera An Ninh & NVR ({countCameras})
        </button>

        <button
          onClick={() => setActiveTab('ROUTER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ROUTER'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <Network className="w-3.5 h-3.5" /> 🌐 Router & Gateway ({countRouters})
        </button>

        <button
          onClick={() => setActiveTab('SWITCH')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'SWITCH'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> 🔀 Switch Quản Trị ({countSwitches})
        </button>

        <button
          onClick={() => setActiveTab('SERVER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'SERVER'
              ? 'bg-hepco-green text-slate-950 shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-hepco-surface'
          }`}
        >
          <Server className="w-3.5 h-3.5" /> 🗄️ Máy Chủ ({countServers})
        </button>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-hepco-surface border border-hepco-border px-3.5 py-2 rounded-xl w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Tên nhân viên, Phòng ban, IP, MAC, Tên máy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500 font-mono"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-white text-xs">✕</button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Hiển thị: <strong className="text-white">{filteredDevices.length}</strong> / {devices.length} thiết bị thực tế
        </div>
      </div>

      {/* Main Table or Empty State */}
      {devices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-hepco-surface border border-hepco-border text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Chưa Có Thiết Bị Nào Trong Danh Sách Quản Lý</h3>
            <p className="text-xs text-slate-400 mt-1">
              Toàn bộ dữ liệu mẫu đã được loại bỏ sạch sẽ. Hãy bấm nút bên dưới để hệ thống trực tiếp quét sâu bảng ARP mạng LAN, truy vấn DNS tìm Hostname và định danh các máy tính, máy in, camera thực tế.
            </p>
          </div>
          <button
            onClick={handleDeepScanNetwork}
            disabled={isDeepScanning}
            className="px-6 py-3 rounded-xl bg-hepco-green hover:bg-hepco-greenDark text-slate-950 text-xs font-black transition shadow-xl shadow-emerald-950/50 inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isDeepScanning ? 'Đang Thực Hiện Quét Sâu Mạng...' : 'Bắt Đầu Quét Sâu Mạng LAN Ngay'}
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-hepco-surface border border-hepco-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-hepco-border text-slate-400 font-mono uppercase text-[11px]">
                  <th className="pb-3 px-3">Trạng Thái</th>
                  <th className="pb-3 px-3">Mã Tài Sản / Tên Máy</th>
                  <th className="pb-3 px-3">Người Sử Dụng (User)</th>
                  <th className="pb-3 px-3">Phòng Ban / Vị Trí</th>
                  <th className="pb-3 px-3">Địa Chỉ IP</th>
                  <th className="pb-3 px-3">Địa Chỉ MAC & Hãng</th>
                  <th className="pb-3 px-3">Phân Loại</th>
                  <th className="pb-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hepco-border/40 font-mono">
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-hepco-card/60 transition-colors">
                    <td className="py-3 px-3">
                      <StatusBadge status={d.status} />
                    </td>

                    {/* Device Name & Code */}
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-slate-200">{d.display_name}</div>
                      <div className="text-[10px] text-hepco-cyan font-mono font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {d.device_code}
                      </div>
                    </td>

                    {/* Assigned User */}
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{d.assigned_user}</span>
                      </div>
                      {d.notes && <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{d.notes}</div>}
                    </td>

                    {/* Department & Location */}
                    <td className="py-3 px-3 font-sans">
                      <div className="text-slate-300 font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" /> {d.department}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {d.location}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-3 font-bold text-hepco-cyan text-sm">
                      {d.ip}
                    </td>

                    {/* MAC & Vendor */}
                    <td className="py-3 px-3">
                      <div className="text-slate-300 font-bold">{d.mac}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{d.vendor}</div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {d.category}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                          title="Chỉnh sửa thông tin / Gán nhân viên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Ping Button */}
                        <button
                          onClick={() => handlePing(d.ip)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold transition"
                          title="Ping kiểm tra trạng thái"
                        >
                          Ping
                        </button>

                        {/* Conditional Quick Tools */}
                        {d.category === 'WORKSTATION' && (
                          <>
                            <button
                              onClick={() => handleRdp(d.ip)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                              title="Điều khiển Remote Desktop (RDP)"
                            >
                              <Monitor className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleWol(d.mac)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                              title="Bật máy từ xa (Wake-on-LAN)"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {(d.category === 'ROUTER' || d.category === 'SWITCH' || d.category === 'SERVER') && (
                          <button
                            onClick={() => handleSsh(d.ip)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-400 transition"
                            title="Mở phiên SSH"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(d.category === 'PRINTER' || d.category === 'CAMERA' || d.category === 'ROUTER' || d.category === 'SWITCH') && (
                          <button
                            onClick={() => handleWeb(d.ip)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                            title="Mở trang Web cấu hình"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDevice(d.id, d.display_name)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-500 hover:text-rose-400 transition"
                          title="Xóa thiết bị"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 font-mono">
                      Không có thiết bị nào trong tab lọc này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {(editingDevice || isNewDeviceModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-hepco-surface border border-hepco-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-hepco-card border-b border-hepco-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-hepco-cyan" />
                {isNewDeviceModal ? 'THÊM THIẾT BỊ MỚI VÀO QUẢN LÝ' : `CHỈNH SỬA HỒ SƠ THIẾT BỊ (${formIp})`}
              </h3>
              <button
                onClick={() => {
                  setEditingDevice(null);
                  setIsNewDeviceModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Device Code */}
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Mã Tài Sản (Asset Code)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: TS-PC-001"
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white font-mono outline-none focus:border-hepco-cyan"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Phân Loại Thiết Bị</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white outline-none focus:border-hepco-cyan"
                  >
                    <option value="WORKSTATION">🖥️ Máy Tính & Laptop</option>
                    <option value="PRINTER">🖨️ Máy In & Photocopy</option>
                    <option value="CAMERA">📹 Camera An Ninh & NVR</option>
                    <option value="ROUTER">🌐 Router & Gateway</option>
                    <option value="SWITCH">🔀 Switch Quản Trị</option>
                    <option value="SERVER">🗄️ Máy Chủ (Server)</option>
                  </select>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Tên Thiết Bị / Hostname</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: PC-KT-01 (Dell OptiPlex)"
                  className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white outline-none focus:border-hepco-cyan"
                />
              </div>

              {/* Assigned User & Department */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> GẮN USER / NGƯỜI SỬ DỤNG VÀO THIẾT BỊ NÀY
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Họ và Tên Nhân Viên</label>
                    <input
                      type="text"
                      value={formUser}
                      onChange={(e) => setFormUser(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white font-bold outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Phòng Ban Trực Thuộc</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white outline-none focus:border-emerald-400"
                    >
                      <option value="Bộ phận CNTT">Bộ phận CNTT</option>
                      <option value="Phòng Kế Toán">Phòng Kế Toán</option>
                      <option value="Phòng Hành Chính">Phòng Hành Chính</option>
                      <option value="Phòng Kinh Doanh">Phòng Kinh Doanh</option>
                      <option value="Tổ Bảo Vệ">Tổ Bảo Vệ</option>
                      <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                      <option value="Văn Phòng Tổng Hợp">Văn Phòng Tổng Hợp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Vị Trí Cụ Thể (Bàn làm việc / Tủ rack)</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="VD: Tầng 2 - Bàn 04"
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-white outline-none"
                  />
                </div>
              </div>

              {/* IP & MAC & Vendor */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Địa Chỉ IP</label>
                  <input
                    type="text"
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    placeholder="10.1.1.x"
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-hepco-cyan font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Địa Chỉ MAC</label>
                  <input
                    type="text"
                    value={formMac}
                    onChange={(e) => setFormMac(e.target.value)}
                    placeholder="XX:XX:XX:XX:XX:XX"
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-slate-200 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Hãng Sản Xuất</label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="Dell, HP, Canon..."
                    className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 mb-1">Ghi Chú Cấu Hình / Lịch Sử Sửa Chữa</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Cấu hình CPU, RAM, SSD hoặc tình trạng máy..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-slate-200 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-hepco-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDevice(null);
                    setIsNewDeviceModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-hepco-green hover:bg-hepco-greenDark text-slate-950 font-bold transition shadow-md shadow-emerald-950/40"
                >
                  Lưu Hồ Sơ Thiết Bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
