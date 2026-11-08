import React, { useEffect, useState } from 'react';
import {
  Share2,
  Network,
  Server,
  Shield,
  Layers,
  RefreshCw,
  Cpu,
  Monitor,
  Printer,
  Video,
  Wifi,
  Globe,
  ArrowDown,
  ChevronRight,
  Activity,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  ExternalLink,
  Laptop,
  Maximize2,
  X,
} from 'lucide-react';

import { getCachedInventorySync, loadInventoryFast } from '../../utils/inventoryCache';

interface DeviceItem {
  id: string;
  display_name: string;
  ip: string;
  mac: string;
  category: string;
  vendor?: string;
  location?: string;
  department?: string;
  status: string;
  openPorts?: number[];
  parent_nvr?: string;
  nvr_channel?: number;
  assigned_user?: string;
  device_code?: string;
}

export const NetworkMapPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>(() => getCachedInventorySync());
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'HIERARCHY' | 'SUBNETS' | 'BRANCHES'>('HIERARCHY');
  const [selectedNode, setSelectedNode] = useState<DeviceItem | null>(null);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    loadInventoryFast().then((realList) => {
      if (realList.length > 0) setDevices(realList);
      setLoading(false);
    });
  }, []);

  const handlePing = async (ip: string) => {
    if (window.hiccDesktop?.ping) {
      const res = await window.hiccDesktop.ping(ip);
      alert(res.isAlive ? `✅ ${ip} đang ONLINE! RTT: ${res.latency ? res.latency + 'ms' : '<2ms'}` : `❌ ${ip} không phản hồi!`);
    } else {
      alert(`Đang gửi lệnh Ping tới ${ip}...`);
    }
  };

  // Group devices by network layers
  const coreGateway = devices.find((d) => d.ip === '192.168.1.1') || {
    id: 'gw-1',
    display_name: 'Gateway Internet & Firewall Trung Tâm',
    ip: '192.168.1.1',
    mac: '00:1A:2B:3C:4D:5E',
    category: 'ROUTER',
    vendor: 'DrayTek / Viettel Enterprise',
    status: 'ONLINE',
    department: 'Mạng Lõi & Phòng Server',
  };

  const coreSwitch = devices.find((d) => d.ip === '10.0.0.1' && (d.category === 'SWITCH' || d.category === 'ROUTER')) || {
    id: 'core-sw-1',
    display_name: 'Core Switch Layer 3 Trung Tâm HEPCO',
    ip: '10.0.0.1',
    mac: '00:0F:E2:81:99:A0',
    category: 'SWITCH',
    vendor: 'Cisco Catalyst / H3C Multi-Gigabit',
    status: 'ONLINE',
    department: 'Mạng Lõi & Phòng Server',
  };

  const servers = devices.filter((d) => d.category === 'SERVER' || d.ip.startsWith('10.0.0.') || d.ip.startsWith('198.162.'));
  const networkNodes = devices.filter((d) => d.category === 'SWITCH' || d.category === 'ROUTER');
  const nvrHubs = devices.filter((d) => d.ip === '10.110.1.13' || d.ip === '10.110.1.80');
  const cameras = devices.filter((d) => d.category === 'CAMERA' && d.ip !== '10.110.1.13' && d.ip !== '10.110.1.80');
  const printers = devices.filter((d) => d.category === 'PRINTER');
  const workstations = devices.filter((d) => d.category === 'WORKSTATION');

  // Subnets breakdown
  const SUBNETS_MAP = [
    { cidr: '10.0.0.0/24', name: 'Phòng Máy Chủ Trung Tâm (Core Servers)', gw: '10.0.0.1', desc: 'Active Directory, DNS, B-SERVER, Giám sát' },
    { cidr: '10.1.0.0/24', name: 'Mạng Hạ Tầng Khối Văn Phòng Tầng 1', gw: '10.1.0.1', desc: 'Văn thư, Tiếp nhận, Router Wi-Fi ASUS' },
    { cidr: '10.1.1.0/24', name: 'Phòng Tổ Chức - Hành Chính & Họp', gw: '10.1.1.1', desc: 'Máy trạm TC-HC, Wi-Fi Tầng 1, Scan văn thư' },
    { cidr: '10.2.0.0/24', name: 'Hạ Tầng Tầng 2 & Wi-Fi Kế Toán', gw: '10.2.0.1', desc: 'TP-Link Wi-Fi Tầng 2, Switch tầng' },
    { cidr: '10.2.1.0/24', name: 'Phòng Kế Toán & Phòng Kỹ Thuật', gw: '10.2.1.1', desc: 'Máy trạm kế toán, kỹ thuật viên, máy in' },
    { cidr: '10.3.1.0/24', name: 'Ban Lãnh Đạo & Phòng Kế Hoạch', gw: '10.3.1.1', desc: 'Tầng 3, Wi-Fi ASUS Tầng 3, Máy in lãnh đạo' },
    { cidr: '10.11.1.0/24', name: 'XN Môi Trường Bắc Sông Hương', gw: '10.11.1.1', desc: 'Switch phân phối, Wi-Fi TP-Link, Điều hành rác' },
    { cidr: '10.12.1.0/24', name: 'XN Môi Trường Nam Sông Hương', gw: '10.12.1.1', desc: 'Switch phân phối, Wi-Fi TP-Link, Máy trạm XN' },
    { cidr: '10.20.1.0/24', name: 'XN Điện Chiếu Sáng & Thiết Bị Đô Thị', gw: '10.20.1.1', desc: 'Switch phân phối, Wi-Fi TP-Link, Trạm điều khiển' },
    { cidr: '10.30.1.0/24', name: 'XN Vận Chuyển - Cơ Khí & Đội Xe', gw: '10.30.1.1', desc: 'Switch phân phối, Wi-Fi TP-Link, Điều hành cơ khí' },
    { cidr: '10.40.1.0/24', name: 'XN Thoát Nước & Xử Lý Nước Thải', gw: '10.40.1.1', desc: 'Switch phân phối, Máy tính trạm xí nghiệp' },
    { cidr: '10.110.1.0/24', name: 'Mạng Camera An Ninh & NVR Tập Trung', gw: '10.110.1.1', desc: '02 Đầu ghi NVR 13 & 80, 20 mắt camera con' },
    { cidr: '192.168.1.0/24', name: 'Cửa Ngõ Internet & Router Biên (WAN)', gw: '192.168.1.1', desc: 'DrayTek Gateway / Cáp quang doanh nghiệp' },
    { cidr: '192.168.50.0/24', name: 'Mạng Không Dây ASUS Văn Phòng', gw: '192.168.50.1', desc: 'Wi-Fi ASUS RT High-Speed Khối Cơ Quan' },
    { cidr: '198.162.101.0/24', name: 'Đường Truyền Dự Phòng / Quản Trị Server', gw: '198.162.101.1', desc: 'Core Switch phụ & Mạng dự phòng sự cố' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs shrink-0">
            <Share2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Sơ Đồ Kiến Trúc Mạng & Phân Vùng Dải IP
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300">
                Mạng Nội Bộ LAN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu trúc kết nối từ Gateway trung tâm, hệ thống máy chủ đến các dải mạng phòng ban và xí nghiệp
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setViewMode('HIERARCHY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'HIERARCHY'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phân Tầng L2/L3</span>
          </button>
          <button
            onClick={() => setViewMode('SUBNETS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'SUBNETS'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>15 Dải Mạng (VLAN)</span>
          </button>
          <button
            onClick={() => setViewMode('BRANCHES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'BRANCHES'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Xí Nghiệp Chi Nhánh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-500 animate-ping" />
            <span>Tổng Node Mạng</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {devices.length || 142} <span className="text-xs font-normal text-slate-400">thiết bị</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Network className="w-3 h-3 text-blue-500" />
            <span>Switch & Wi-Fi</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            11 <span className="text-xs font-normal text-slate-400">thiết bị</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Server className="w-3 h-3 text-purple-500" />
            <span>Máy Chủ (Servers)</span>
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            8 <span className="text-xs font-normal text-slate-400">hệ thống</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Video className="w-3 h-3 text-teal-500" />
            <span>Đầu Ghi NVR</span>
          </div>
          <div className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            2 <span className="text-xs font-normal text-slate-400">trung tâm</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Laptop className="w-3 h-3 text-emerald-500" />
            <span>Máy Tính Trạm</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            91 <span className="text-xs font-normal text-slate-400">máy PC</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Printer className="w-3 h-3 text-amber-500" />
            <span>Máy In / Photo</span>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            10 <span className="text-xs font-normal text-slate-400">máy</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN TOPOLOGY VISUAL CANVAS */}
      {viewMode === 'HIERARCHY' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-8 text-white relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none"></div>

          {/* ================= TẦNG 1: WAN / FIREWALL EDGE ================= */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold mb-2 uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>TẦNG 1: INTERNET GATEWAY & ROUTER BIÊN (WAN EDGE)</span>
            </div>

            <div
              onClick={() => setSelectedNode(coreGateway as any)}
              className="p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 hover:border-emerald-400 transition-all cursor-pointer shadow-lg w-full max-w-md flex items-center justify-between group hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                    DrayTek / Viettel WAN Gateway
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mt-0.5">
                    192.168.1.1 <span className="text-slate-400 text-[10px] font-normal">(Gateway Chính)</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                1 Gbps WAN
              </span>
            </div>

            {/* Downward connecting line */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-emerald-500 to-blue-500 my-1"></div>
            <ArrowDown className="w-4 h-4 text-blue-400 -mt-2 animate-bounce" />
          </div>

          {/* ================= TẦNG 2: CORE SWITCH LAYER 3 & SERVER FARM ================= */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono tracking-widest text-blue-400 font-bold mb-3 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>TẦNG 2: CORE SWITCH LAYER 3 & PHÒNG MÁY CHỦ TRUNG TÂM</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-5xl">
              {/* Core Switch L3 */}
              <div
                onClick={() => setSelectedNode(coreSwitch as any)}
                className="p-3.5 rounded-xl bg-slate-900 border-2 border-blue-500/80 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      CORE SWITCH L3
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 group-hover:text-blue-300">
                    Cisco Catalyst / H3C
                  </div>
                  <div className="text-xs font-mono text-blue-400 font-bold mt-0.5">
                    10.0.0.1
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-1.5">
                  Định tuyến 15 dải mạng L3
                </div>
              </div>

              {/* DSERVER */}
              <div
                onClick={() => {
                  const d = devices.find((x) => x.ip === '10.0.0.5') || {
                    id: 'd-serv',
                    display_name: 'DSERVER (Active Directory / DNS / DHCP)',
                    ip: '10.0.0.5',
                    mac: '08:F1:EA:7D:27:A6',
                    category: 'SERVER',
                    vendor: 'Dell PowerEdge R440 OEM',
                    status: 'ONLINE',
                    department: 'Máy chủ',
                  };
                  setSelectedNode(d as any);
                }}
                className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/60 hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-purple-600/30 text-purple-400">
                      <Server className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      DOMAIN CONTROLLER
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 group-hover:text-purple-300">
                    DSERVER (AD / DNS / DHCP)
                  </div>
                  <div className="text-xs font-mono text-purple-400 font-bold mt-0.5">
                    10.0.0.5 <span className="text-slate-500 text-[10px]">Dell PowerEdge</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-1.5">
                  Xeon Silver · 16GB RAM · RAID 5
                </div>
              </div>

              {/* B-SERVER */}
              <div
                onClick={() => {
                  const d = devices.find((x) => x.ip === '10.0.0.8') || {
                    id: 'b-serv',
                    display_name: 'B-SERVER (QL Xe & Nghiệp Vụ)',
                    ip: '10.0.0.8',
                    mac: '3C:D9:2B:65:F1:68',
                    category: 'SERVER',
                    vendor: 'HP ProLiant DL80 Gen9',
                    status: 'ONLINE',
                    department: 'Máy chủ',
                  };
                  setSelectedNode(d as any);
                }}
                className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/60 hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-purple-600/30 text-purple-400">
                      <Server className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      APP / DATABASE
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 group-hover:text-purple-300">
                    B-SERVER (QL Xe & Dữ Liệu)
                  </div>
                  <div className="text-xs font-mono text-purple-400 font-bold mt-0.5">
                    10.0.0.8 <span className="text-slate-500 text-[10px]">HP DL80</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-1.5">
                  Xeon E5 · 16GB RAM · RAID 7.5TB
                </div>
              </div>

              {/* BACKUP SWITCH */}
              <div
                onClick={() => {
                  const d = devices.find((x) => x.ip === '198.162.101.1') || {
                    id: 'sw-backup',
                    display_name: 'Core Switch Dự Phòng / Quản Trị Server',
                    ip: '198.162.101.1',
                    mac: '00:1E:C9:88:51:24',
                    category: 'SWITCH',
                    vendor: 'Cisco Enterprise',
                    status: 'ONLINE',
                    department: 'Máy chủ',
                  };
                  setSelectedNode(d as any);
                }}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      DỰ PHÒNG REDUNDANT
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 group-hover:text-blue-300">
                    Switch Dự Phòng Phòng Server
                  </div>
                  <div className="text-xs font-mono text-slate-300 font-bold mt-0.5">
                    198.162.101.1
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-1.5">
                  Đường truyền dự phòng nóng
                </div>
              </div>
            </div>

            {/* Downward connecting line */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-blue-500 to-teal-500 my-1"></div>
            <ArrowDown className="w-4 h-4 text-teal-400 -mt-2 animate-bounce" />
          </div>

          {/* ================= TẦNG 3: DISTRIBUTION SWITCHES, ACCESS POINTS & NVR ================= */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-widest text-teal-400 font-bold uppercase flex items-center justify-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                <span>TẦNG 3: HẠ TẦNG PHÂN PHỐI CHI NHÁNH, WI-FI VĂN PHÒNG & 02 ĐẦU GHI NVR</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KHỐI 1: VĂN PHÒNG TRUNG TÂM */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    <span>Hạ Tầng Khối Cơ Quan Văn Phòng (Tầng 1, 2, 3)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Dải 10.1.x, 10.2.x, 10.3.x</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {/* TẦNG 1 */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.1.1.33');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 truncate">Wi-Fi Tầng 1</div>
                    <div className="text-[11px] font-mono text-slate-300">10.1.1.33</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ASUS (Phòng Họp & TCHC)</div>
                  </div>

                  {/* TẦNG 2 */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.2.0.191');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 truncate">Wi-Fi Tầng 2</div>
                    <div className="text-[11px] font-mono text-slate-300">10.2.0.191</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">TP-Link (Kế Toán - Tài Vụ)</div>
                  </div>

                  {/* TẦNG 3 */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.3.1.35');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 truncate">Wi-Fi Tầng 3</div>
                    <div className="text-[11px] font-mono text-slate-300">10.3.1.35</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ASUS (Lãnh Đạo & Kế Hoạch)</div>
                  </div>

                  {/* PHÒNG KỸ THUẬT */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.1.0.62');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 truncate">Wi-Fi Kỹ Thuật</div>
                    <div className="text-[11px] font-mono text-slate-300">10.1.0.62</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ASUS RT-AC59U</div>
                  </div>

                  {/* HÀNH LANG TẦNG 2 / MESH TRUNG TÂM */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '192.168.50.1');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 truncate">Wi-Fi RT-AC/AX</div>
                    <div className="text-[11px] font-mono text-slate-300">192.168.50.1</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ASUS Trung Tâm</div>
                  </div>

                  {/* NVR 01 VĂN PHÒNG */}
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.110.1.13');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 hover:border-emerald-400 transition cursor-pointer shadow-md"
                  >
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <Video className="w-3 h-3 text-emerald-400" />
                      <span>NVR 01 VP</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-200 font-bold">10.110.1.13</div>
                    <div className="text-[10px] text-emerald-400">10 Kênh Camera</div>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: XÍ NGHIỆP & CƠ KHÍ & HƯƠNG SƠ */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Hạ Tầng 07 Xí Nghiệp Chi Nhánh & Khu Vực Ngoại Cảnh</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Dải 10.11, 10.12, 10.20, 10.30, 10.40</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.11.1.1') || devices.find((x) => x.ip === '10.11.1.10');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-teal-300 truncate">XN MT Bắc Sông Hương</div>
                    <div className="text-[11px] font-mono text-slate-300">10.11.1.1 / .10</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Switch L2 + Wi-Fi</div>
                  </div>

                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.12.1.1') || devices.find((x) => x.ip === '10.12.1.66');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-teal-300 truncate">XN MT Nam Sông Hương</div>
                    <div className="text-[11px] font-mono text-slate-300">10.12.1.1 / .66</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Switch L2 + Wi-Fi</div>
                  </div>

                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.20.1.1') || devices.find((x) => x.ip === '10.20.1.33');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-teal-300 truncate">XN Điện Chiếu Sáng</div>
                    <div className="text-[11px] font-mono text-slate-300">10.20.1.1 / .33</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Switch L2 + Wi-Fi</div>
                  </div>

                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.30.1.1') || devices.find((x) => x.ip === '10.30.1.36');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-teal-300 truncate">XN Vận Chuyển Cơ Khí</div>
                    <div className="text-[11px] font-mono text-slate-300">10.30.1.1 / .36</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Switch L2 + Wi-Fi</div>
                  </div>

                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.40.1.1');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition cursor-pointer"
                  >
                    <div className="font-bold text-teal-300 truncate">XN Thoát Nước</div>
                    <div className="text-[11px] font-mono text-slate-300">10.40.1.1</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Switch Phân Phối</div>
                  </div>

                  <div
                    onClick={() => {
                      const d = devices.find((x) => x.ip === '10.110.1.80');
                      if (d) setSelectedNode(d);
                    }}
                    className="p-2.5 rounded-xl bg-teal-950/80 border-2 border-teal-500 hover:border-teal-400 transition cursor-pointer shadow-md"
                  >
                    <div className="font-bold text-teal-300 flex items-center gap-1">
                      <Video className="w-3 h-3 text-teal-400" />
                      <span>NVR 02 Hương Sơ</span>
                    </div>
                    <div className="text-[11px] font-mono text-teal-200 font-bold">10.110.1.80</div>
                    <div className="text-[10px] text-teal-400">10 Kênh Ngoại Cảnh</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Downward connecting line */}
            <div className="flex flex-col items-center">
              <div className="h-8 w-0.5 bg-gradient-to-b from-teal-500 to-slate-600 my-1"></div>
              <ArrowDown className="w-4 h-4 text-slate-400 -mt-2 animate-bounce" />
            </div>
          </div>

          {/* ================= TẦNG 4: ENDPOINT DEVICES ================= */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase flex items-center justify-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>TẦNG 4: THIẾT BỊ ĐẦU CUỐI NGƯỜI DÙNG (ACCESS ENDPOINTS - 142 THIẾT BỊ)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Workstations summary box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">91 Máy Tính Trạm PC</div>
                  <div className="text-[11px] text-slate-400">Dell, HP, Asus, Gigabyte (18 Phòng ban)</div>
                </div>
              </div>

              {/* Printers summary box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">10 Máy In & Photocopy Mạng</div>
                  <div className="text-[11px] text-slate-400">Ricoh Aficio, Canon LBP, HP LaserJet, Brother</div>
                </div>
              </div>

              {/* Cameras summary box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">20 Mắt Camera Con IP</div>
                  <div className="text-[11px] text-slate-400">Hikvision & Dahua quản lý qua 2 Đầu Ghi NVR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE: 15 SUBNETS (VLANs) MATRIX */}
      {viewMode === 'SUBNETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBNETS_MAP.map((sub) => {
            const prefix = sub.cidr.split('.')[0] + '.' + sub.cidr.split('.')[1] + '.' + sub.cidr.split('.')[2] + '.';
            const subDevices = devices.filter((d) => d.ip && d.ip.startsWith(prefix));
            const onCount = subDevices.filter((d) => d.status === 'ONLINE').length;

            return (
              <div
                key={sub.cidr}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {sub.cidr}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {subDevices.length} thiết bị ({onCount} Online)
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {sub.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sub.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Gateway:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sub.gw}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE: BRANCHES TOPOLOGY */}
      {viewMode === 'BRANCHES' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Kiến Trúc Mạng Kết Nối 07 Xí Nghiệp Chi Nhánh Về Trụ Sở Chính
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Được liên kết trực tiếp qua kênh truyền số liệu doanh nghiệp (WAN VPN / Cáp quang nội bộ HEPCO)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: '1. Xí Nghiệp Môi Trường Bắc Sông Hương',
                ipRange: '10.11.1.0/24',
                gw: '10.11.1.1',
                wifi: '10.11.1.10 / 10.11.1.55',
                desc: 'Bãi tập kết rác & Đội điều hành xe rác bờ Bắc sông Hương',
              },
              {
                name: '2. Xí Nghiệp Môi Trường Nam Sông Hương',
                ipRange: '10.12.1.0/24',
                gw: '10.12.1.1',
                wifi: '10.12.1.66',
                desc: 'Khu vực quản lý vệ sinh đô thị bờ Nam sông Hương',
              },
              {
                name: '3. Xí Nghiệp Điện Chiếu Sáng & Thiết Bị',
                ipRange: '10.20.1.0/24',
                gw: '10.20.1.1',
                wifi: '10.20.1.33',
                desc: 'Trung tâm điều khiển hệ thống chiếu sáng công cộng toàn thành phố',
              },
              {
                name: '4. Xí Nghiệp Vận Chuyển - Cơ Khí',
                ipRange: '10.30.1.0/24',
                gw: '10.30.1.1',
                wifi: '10.30.1.36',
                desc: 'Xưởng sửa chữa, bảo dưỡng phương tiện cơ giới & bãi xe ép rác',
              },
              {
                name: '5. Xí Nghiệp Thoát Nước & Xử Lý Nước Thải',
                ipRange: '10.40.1.0/24',
                gw: '10.40.1.1',
                wifi: 'Switch L2 Phân phối',
                desc: 'Quản lý trạm bơm, nạo vét cống rãnh đô thị',
              },
              {
                name: '6. Xí Nghiệp Xử Lý Chất Thải & Nhà Máy Hương Sơ',
                ipRange: '10.110.1.0/24',
                gw: '10.110.1.1',
                wifi: 'Đầu Ghi NVR 02 (10.110.1.80)',
                desc: 'Khu liên hợp xử lý chất thải, trạm cân & hệ thống 10 camera giám sát ngoại cảnh',
              },
            ].map((b) => (
              <div
                key={b.name}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{b.name}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {b.ipRange}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{b.desc}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span>Gateway: <strong className="text-emerald-600 dark:text-emerald-400">{b.gw}</strong></span>
                  <span>Thiết bị: <strong className="text-teal-600 dark:text-teal-400">{b.wifi}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. NODE INSPECTION POPUP MODAL (When clicking any node in the topology) */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedNode.display_name}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedNode.category} · {selectedNode.department || 'Mạng Nội Bộ HEPCO'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] block font-sans">Địa Chỉ IP:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {selectedNode.ip}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] block font-sans">Địa Chỉ MAC:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedNode.mac || '00:XX:XX:XX:XX:XX'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] block font-sans">Nhà Sản Xuất:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedNode.vendor || 'Thiết Bị Mạng HEPCO'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] block font-sans">Trạng Thái:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handlePing(selectedNode.ip)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Gửi Ping Kiểm Tra</span>
              </button>
              <button
                onClick={() => window.open(`http://${selectedNode.ip}`, '_blank')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Web Quản Trị</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
