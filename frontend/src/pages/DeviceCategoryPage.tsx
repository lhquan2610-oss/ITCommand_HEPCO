import React, { useEffect, useState } from 'react';
import {
  LucideIcon,
  Zap,
  Power,
  Monitor,
  Terminal,
  Globe,
  Plus,
  Search,
  Video,
  List,
  ExternalLink,
  Wifi,
  Network,
  Server,
  Tv,
  MonitorPlay,
  Copy,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { CameraLiveWall } from '../components/CameraLiveWall';

interface DeviceCategoryPageProps {
  categoryCode: 'WORKSTATION' | 'PRINTER' | 'SWITCH' | 'CAMERA';
  title: string;
  description: string;
  icon: LucideIcon;
}

export const DeviceCategoryPage: React.FC<DeviceCategoryPageProps> = ({
  categoryCode,
  title,
  description,
  icon: Icon,
}) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cameraViewMode, setCameraViewMode] = useState<'LIST' | 'LIVE'>('LIVE');
  const [cameraNvrFilter, setCameraNvrFilter] = useState<'ALL' | '10.110.1.13' | '10.110.1.80'>('ALL');

  useEffect(() => {
    const load = async () => {
      let realList: any[] = [];
      if (window.hiccDesktop?.loadInventory) {
        try {
          const res = await window.hiccDesktop.loadInventory();
          if (res.success && Array.isArray(res.devices)) {
            realList = res.devices;
          }
        } catch {}
      }

      if (realList.length === 0) {
        const saved = localStorage.getItem('hicc_real_devices_inventory');
        if (saved) {
          try {
            realList = JSON.parse(saved);
          } catch {}
        }
      }

      if (realList.length === 0) {
        try {
          const res = await fetch('/data/devices_inventory.json');
          if (res.ok) {
            realList = await res.json();
            localStorage.setItem('hicc_real_devices_inventory', JSON.stringify(realList));
          }
        } catch {}
      }

      realList = realList.filter((d) => d.ip !== '10.2.1.154');
      realList.forEach((d) => {
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
      });
      realList = realList.filter((d) => !(
        (d.ip === '10.1.1.17' || d.ip === '10.1.1.18') &&
        (d.category === 'PRINTER' || (d.display_name && d.display_name.toLowerCase().includes('ricoh')))
      ));

      // If SWITCH, also include ROUTER so all infrastructure switches, routers & modems show up!
      let filtered = realList.filter((d) => {
        if (categoryCode === 'SWITCH') {
          return d.category === 'SWITCH' || d.category === 'ROUTER';
        }
        return d.category === categoryCode;
      });

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            (d.display_name && d.display_name.toLowerCase().includes(q)) ||
            (d.ip && d.ip.toLowerCase().includes(q)) ||
            (d.mac && d.mac.toLowerCase().includes(q)) ||
            (d.assigned_user && d.assigned_user.toLowerCase().includes(q)) ||
            (d.department && d.department.toLowerCase().includes(q)) ||
            (d.osd_label && d.osd_label.toLowerCase().includes(q))
        );
      }

      setDevices(filtered);
    };
    load();
  }, [categoryCode, search]);

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d) => d.status === 'OFFLINE').length;

  const handlePing = async (ip: string) => {
    if (window.hiccDesktop?.ping) {
      const res = await window.hiccDesktop.ping(ip);
      alert(res.isAlive ? `✅ ${ip} đang ONLINE! RTT: ${res.latency ? res.latency + 'ms' : '<2ms'}` : `❌ ${ip} không phản hồi!`);
    } else {
      alert(`Đang gửi lệnh Ping tới ${ip}... (Môi trường Web trình duyệt)`);
    }
  };

  const handleWeb = (ip: string) => {
    window.open(`http://${ip}`, '_blank');
  };

  const handleOpenNvrViewer = (nvrIp: string, name: string) => {
    if (window.hiccDesktop?.cameraOpenViewerWindow) {
      window.hiccDesktop.cameraOpenViewerWindow({ ip: nvrIp, name });
    } else {
      window.open(`http://${nvrIp}`, '_blank');
    }
  };

  const handleCopyCameraRtsp = (device: any) => {
    const parent = device.parent_nvr || (device.ip === '10.110.1.13' || device.ip === '10.110.1.80' ? device.ip : '10.110.1.13');
    const isNvr1 = parent === '10.110.1.13';
    const user = 'admin';
    const pass = isNvr1 ? 'hepco@12@12' : '@dmin123';
    const ch = device.nvr_channel || 1;
    const rtspUrl = `rtsp://${user}:${pass}@${parent}:554/Streaming/Channels/${ch}01`;
    navigator.clipboard.writeText(rtspUrl);
    alert('Đã sao chép liên kết RTSP Camera qua Đầu Ghi NVR vào bộ nhớ tạm (đã nhúng thông tin xác thực an toàn).');
    if (window.hiccDesktop?.cameraLaunchStream) {
      window.hiccDesktop.cameraLaunchStream(rtspUrl);
    }
  };

  const isCameraPage = categoryCode === 'CAMERA';
  const isSwitchPage = categoryCode === 'SWITCH';

  const displayTitle = isSwitchPage ? 'Switch, Router & Modem Wi-Fi Mạng Lõi' : title;
  const displayDesc = isSwitchPage
    ? 'Giám sát 11 thiết bị hạ tầng mạng: Core Switch L3, Switch phân phối chi nhánh và Modem Wi-Fi ASUS, TP-Link, DrayTek'
    : isCameraPage
    ? 'Giám sát tập trung 02 Đầu ghi NVR Hikvision Enterprise & Quản lý 20 Camera con dải mạng nội bộ 10.110.1.x'
    : description;

  // Filter camera table devices by NVR tab if on camera page
  const tableDevices = isCameraPage && cameraNvrFilter !== 'ALL'
    ? devices.filter((d) => d.parent_nvr === cameraNvrFilter || d.ip === cameraNvrFilter)
    : devices;

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{displayDesc}</p>
          </div>
        </div>

        {/* View Switcher for Camera or Online Badges */}
        <div className="flex items-center gap-2.5">
          {isCameraPage && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold mr-2">
              <button
                onClick={() => setCameraViewMode('LIVE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  cameraViewMode === 'LIVE'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Giám Sát 2 Đầu Ghi</span>
              </button>
              <button
                onClick={() => setCameraViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  cameraViewMode === 'LIST'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh Sách Chi Tiết ({devices.length})</span>
              </button>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            Hoạt động: {onlineCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-bold">
            Ngoại tuyến: {offlineCount}
          </div>
        </div>
      </div>

      {/* If Camera Page and LIVE view is chosen -> Show Camera Live Wall (2 Master NVRs) */}
      {isCameraPage && cameraViewMode === 'LIVE' ? (
        <CameraLiveWall
          cameras={devices}
          onSwitchToListMode={(filter) => {
            if (filter) setCameraNvrFilter(filter);
            setCameraViewMode('LIST');
          }}
        />
      ) : (
        /* Detailed Table View */
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors space-y-4">
          {/* Top Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl w-full sm:w-80 shadow-inner">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thiết bị, IP, MAC, phòng ban, OSD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs w-full focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* If Camera page: Show NVR filter tabs */}
            {isCameraPage && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setCameraNvrFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                    cameraNvrFilter === 'ALL'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tất Cả Camera ({devices.length})
                </button>
                <button
                  onClick={() => setCameraNvrFilter('10.110.1.13')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    cameraNvrFilter === '10.110.1.13'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>NVR 01: Văn Phòng (10.110.1.13)</span>
                </button>
                <button
                  onClick={() => setCameraNvrFilter('10.110.1.80')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    cameraNvrFilter === '10.110.1.80'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>NVR 02: Hương Sơ (10.110.1.80)</span>
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Mã & Tên Thiết Bị</th>
                  {isCameraPage && <th className="py-3 px-3">Kênh / OSD</th>}
                  {isCameraPage && <th className="py-3 px-3">Đầu Ghi Quản Lý (NVR)</th>}
                  <th className="py-3 px-3">Địa Chỉ IP</th>
                  <th className="py-3 px-3">Địa Chỉ MAC</th>
                  <th className="py-3 px-3">Nhà Sản Xuất (Vendor)</th>
                  {!isCameraPage && <th className="py-3 px-3">Đơn Vị / Phòng Ban</th>}
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tableDevices.length === 0 ? (
                  <tr>
                    <td colSpan={isCameraPage ? 8 : 7} className="py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy thiết bị nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  tableDevices.map((device) => {
                    const isNvr = device.ip === '10.110.1.13' || device.ip === '10.110.1.80';
                    const parentNvr = device.parent_nvr || (isNvr ? device.ip : '10.110.1.13');
                    const isNvr1 = parentNvr === '10.110.1.13';

                    return (
                      <tr
                        key={device.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isNvr ? 'bg-emerald-50/30 dark:bg-emerald-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {isNvr && (
                              <span className="p-1 rounded bg-emerald-600 text-white shrink-0">
                                <Server className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {device.display_name}
                              </div>
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-0.5">
                                {device.device_code || device.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Camera Specific Columns */}
                        {isCameraPage && (
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              {device.nvr_channel ? (
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  Kênh {String(device.nvr_channel).padStart(2, '0')}
                                </span>
                              ) : isNvr ? (
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  ĐẦU GHI CHÍNH
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                              {device.osd_label && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  OSD: {device.osd_label}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {isCameraPage && (
                          <td className="py-3 px-3">
                            {isNvr ? (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                ⭐ Máy Chủ Đầu Ghi NVR
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isNvr1 ? 'bg-emerald-500' : 'bg-teal-500'
                                  }`}
                                ></span>
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                  {isNvr1 ? 'NVR 01: Văn Phòng' : 'NVR 02: Hương Sơ'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({parentNvr})
                                </span>
                              </div>
                            )}
                          </td>
                        )}

                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                            {device.ip}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {device.mac || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                          {device.vendor || '-'}
                        </td>

                        {!isCameraPage && (
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {device.department || '-'}
                            </span>
                          </td>
                        )}

                        <td className="py-3 px-3">
                          <StatusBadge status={device.status} />
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isCameraPage ? (
                              <>
                                <button
                                  onClick={() => handleOpenNvrViewer(parentNvr, isNvr1 ? 'Đầu Ghi NVR 01' : 'Đầu Ghi NVR 02')}
                                  className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer"
                                  title="Mở xem qua Web NVR (Tự động xác thực mật khẩu)"
                                >
                                  <MonitorPlay className="w-3 h-3" />
                                  <span>Web NVR</span>
                                </button>
                                <button
                                  onClick={() => handleCopyCameraRtsp(device)}
                                  className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                  title="Sao chép link RTSP camera qua đầu ghi (có sẵn mật khẩu)"
                                >
                                  <Tv className="w-3 h-3 text-emerald-400" />
                                  <span>RTSP</span>
                                </button>
                                <button
                                  onClick={() => handlePing(device.ip)}
                                  className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                  title="Kiểm tra tín hiệu Ping"
                                >
                                  Ping
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handlePing(device.ip)}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                  title="Kiểm tra tín hiệu Ping"
                                >
                                  Ping
                                </button>
                                <button
                                  onClick={() => handleWeb(device.ip)}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
                                  title="Mở giao diện Web quản trị thiết bị"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span>Web</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
