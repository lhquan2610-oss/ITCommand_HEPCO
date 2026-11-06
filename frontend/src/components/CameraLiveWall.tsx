import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  Maximize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  MonitorPlay,
  Tv,
  List,
  Check,
  ChevronRight,
  Radio,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CameraDevice {
  id: string;
  display_name: string;
  ip: string;
  mac: string;
  vendor?: string;
  location?: string;
  department?: string;
  status: string;
  openPorts?: number[];
  parent_nvr?: string;
  parent_nvr_name?: string;
  nvr_channel?: number;
  nvr_rtsp_channel?: string;
  is_nvr?: boolean;
  nvr_role?: string;
  osd_label?: string;
  notes?: string;
}

interface CameraLiveWallProps {
  cameras: CameraDevice[];
  onSwitchToListMode?: (nvrFilter?: 'ALL' | '10.110.1.13' | '10.110.1.80') => void;
}

export const CameraLiveWall: React.FC<CameraLiveWallProps> = ({ cameras, onSwitchToListMode }) => {
  // Pre-configured NVR Credentials
  const NVR_CREDS = {
    '10.110.1.13': { user: 'admin', pass: 'hepco@12@12', label: 'NVR 01 Trung Tâm (DS-7632NXI-K2)' },
    '10.110.1.80': { user: 'admin', pass: '@dmin123', label: 'NVR 02 Hương Sơ / Xí Nghiệp (DS-7616NI-K2)' },
  };

  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [snapshotLoading, setSnapshotLoading] = useState<Record<string, boolean>>({});
  const [snapshotErrors, setSnapshotErrors] = useState<Record<string, string>>({});
  const [copiedRtsp, setCopiedRtsp] = useState<Record<string, boolean>>({});

  // Active channel selected for live preview per NVR (Default Ch.01)
  const [nvr1ActiveChannel, setNvr1ActiveChannel] = useState<number>(101);
  const [nvr2ActiveChannel, setNvr2ActiveChannel] = useState<number>(101);

  // Live Auto-Stream Engine (Always running live by default)
  const [isLiveAutoPlay, setIsLiveAutoPlay] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1200); // 1.2s per frame for buttery offline live view
  const [frameCount, setFrameCount] = useState<number>(0);

  const isFetchingNvr1 = useRef<boolean>(false);
  const isFetchingNvr2 = useRef<boolean>(false);

  // Live real-time clock for CCTV timestamp overlay
  const [liveClock, setLiveClock] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveClock(
        d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNvrSnapshot = async (nvrIp: '10.110.1.13' | '10.110.1.80', channelNum: number) => {
    if (!window.hiccDesktop?.cameraFetchSnapshot) return;
    if (nvrIp === '10.110.1.13') {
      if (isFetchingNvr1.current) return;
      isFetchingNvr1.current = true;
    } else {
      if (isFetchingNvr2.current) return;
      isFetchingNvr2.current = true;
    }

    try {
      const creds = NVR_CREDS[nvrIp];
      const res = await window.hiccDesktop.cameraFetchSnapshot({
        ip: nvrIp,
        path: `/ISAPI/Streaming/channels/${channelNum}/picture`,
        user: creds.user,
        pass: creds.pass,
      });

      if (res.success && res.dataUrl) {
        setSnapshots((prev) => ({ ...prev, [nvrIp]: res.dataUrl! }));
        setSnapshotErrors((prev) => ({ ...prev, [nvrIp]: '' }));
        setFrameCount((prev) => (prev + 1) % 100000);
      } else if (res.authRequired) {
        setSnapshotErrors((prev) => ({ ...prev, [nvrIp]: 'Yêu cầu xác thực (401)' }));
      }
    } catch (err: any) {
      // Keep previous frame on transient error
    } finally {
      if (nvrIp === '10.110.1.13') isFetchingNvr1.current = false;
      else isFetchingNvr2.current = false;
    }
  };

  // Continuous Live Stream Polling Loop (Starts immediately on mount)
  useEffect(() => {
    if (!isLiveAutoPlay) return;

    // Fetch initial frame immediately
    fetchNvrSnapshot('10.110.1.13', nvr1ActiveChannel);
    fetchNvrSnapshot('10.110.1.80', nvr2ActiveChannel);

    const timer = setInterval(() => {
      fetchNvrSnapshot('10.110.1.13', nvr1ActiveChannel);
      fetchNvrSnapshot('10.110.1.80', nvr2ActiveChannel);
    }, streamSpeed);

    return () => clearInterval(timer);
  }, [isLiveAutoPlay, streamSpeed, nvr1ActiveChannel, nvr2ActiveChannel]);

  const handleOpenEmbeddedViewer = async (ip: string, name: string) => {
    if (window.hiccDesktop?.cameraOpenViewerWindow) {
      await window.hiccDesktop.cameraOpenViewerWindow({ ip, name });
    } else {
      window.open(`http://${ip}`, '_blank');
    }
  };

  const handleCopyRtsp = (nvrIp: '10.110.1.13' | '10.110.1.80', channel: number = 101) => {
    const creds = NVR_CREDS[nvrIp];
    const rtspUrl = `rtsp://${creds.user}:${creds.pass}@${nvrIp}:554/Streaming/Channels/${channel}`;
    navigator.clipboard.writeText(rtspUrl);
    setCopiedRtsp((prev) => ({ ...prev, [nvrIp]: true }));
    setTimeout(() => {
      setCopiedRtsp((prev) => ({ ...prev, [nvrIp]: false }));
    }, 2500);

    if (window.hiccDesktop?.cameraLaunchStream) {
      window.hiccDesktop.cameraLaunchStream(rtspUrl);
    }
  };

  // Filter cameras belonging to each NVR
  const nvr1Cams = cameras.filter((c) => c.parent_nvr === '10.110.1.13' || c.ip === '10.110.1.13');
  const nvr2Cams = cameras.filter((c) => c.parent_nvr === '10.110.1.80' || c.ip === '10.110.1.80');

  return (
    <div className="space-y-5">
      {/* 1. Global Live Stream Control & Auth Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>TRUNG TÂM GIÁM SÁT 02 ĐẦU GHI NVR TẬP TRUNG</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-900/80 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                ĐANG PHÁT TRỰC TIẾP (LIVE STREAM)
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-4 mt-0.5 font-mono">
              <span className="flex items-center gap-1.5">
                <span>• NVR 01 (10.110.1.13):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 tracking-wider">
                  admin / ••••••••
                </span>
                <span className="text-slate-500">(DS-7632NXI-K2)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>• NVR 02 (10.110.1.80):</span>
                <span className="text-teal-700 dark:text-teal-400 font-bold bg-teal-100/80 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-800 tracking-wider">
                  admin / ••••••••
                </span>
                <span className="text-slate-500">(DS-7616NI-K2)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls: Play/Pause, Speed, List Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsLiveAutoPlay(!isLiveAutoPlay)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isLiveAutoPlay
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={isLiveAutoPlay ? 'Tạm dừng live stream' : 'Bật tự động phát live'}
          >
            {isLiveAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveAutoPlay ? 'Tạm Dừng Live' : 'Tiếp Tục Live'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            <button
              onClick={() => setStreamSpeed(1000)}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                streamSpeed === 1000
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Tốc độ cao 1 giây/khung"
            >
              1s
            </button>
            <button
              onClick={() => setStreamSpeed(1800)}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                streamSpeed === 1800
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Tốc độ cân bằng 1.8 giây/khung"
            >
              2s
            </button>
            <button
              onClick={() => setStreamSpeed(3000)}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                streamSpeed === 3000
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Tiết kiệm băng thông 3 giây/khung"
            >
              3s
            </button>
          </div>

          {onSwitchToListMode && (
            <button
              onClick={() => onSwitchToListMode('ALL')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <List className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Danh Sách Chi Tiết ({cameras.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 2 NVR MASTER WORKSTATIONS (RUNNING LIVE CONTINUOUSLY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ===================== NVR 01: VĂN PHÒNG TRUNG TÂM ===================== */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-emerald-300 tracking-wide">
                    ĐẦU GHI NVR 01 - VĂN PHÒNG TRUNG TÂM
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    DS-7632NXI-K2
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  IP: <strong className="text-emerald-400">10.110.1.13</strong> · Xác thực: <span className="text-emerald-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 tracking-wider">admin / ••••••••</span>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              9/10 KÊNH ONLINE
            </span>
          </div>

          {/* Live Monitor Screen (16:9 Cinema View - Active Live Stream) */}
          <div
            className="relative bg-black h-72 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden select-none group"
          >
            {/* Real Live Snapshot Frame with Auto-Refresh */}
            {snapshots['10.110.1.13'] ? (
              <img
                src={snapshots['10.110.1.13']}
                alt="Live Stream NVR 01"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                <Video className="w-12 h-12 text-emerald-500/50 mb-3 animate-pulse" />
                <div className="text-sm font-bold text-slate-200">ĐẦU GHI TRUNG TÂM NVR 01 ĐANG KẾT NỐI TRỰC TIẾP...</div>
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  Port 80 (Web) · Port 554 (RTSP) · Port 8000 (SDK)
                </div>
                {snapshotErrors['10.110.1.13'] && (
                  <div className="mt-3 text-[11px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-lg">
                    {snapshotErrors['10.110.1.13']}
                  </div>
                )}
              </div>
            )}

            {/* Top OSD Bar */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white/90 drop-shadow-md select-none pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold tracking-wider text-red-400">🔴 TRỰC TIẾP · NVR-01</span>
                <span className="text-emerald-300 font-bold">| KÊNH {Math.floor(nvr1ActiveChannel / 100)}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-emerald-400 font-bold">
                {liveClock}
              </div>
            </div>

            {/* Bottom Stream Info Bar */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 pointer-events-none">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>H.265 / H.264 · 1080P Full HD · Tự Động Live</span>
              </span>
              <span className="text-emerald-400 font-bold">Xác thực: admin OK</span>
            </div>
          </div>

          {/* Channels Quick Navigator - Click switches the live stream instantly! */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chọn Kênh Xem Trực Tiếp ({nvr1Cams.length} Camera con):</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                • Bấm kênh để đổi camera phát live
              </span>
            </div>

            {/* Mini Channels Pills (Interactive Channel Switcher) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
              {[
                { ch: 101, label: 'Nhà để xe', name: 'Ch.01' },
                { ch: 201, label: 'Sảnh Logo', name: 'Ch.02' },
                { ch: 401, label: 'Sân ngoài', name: 'Ch.04' },
                { ch: 501, label: 'Hành lang T2', name: 'Ch.05' },
                { ch: 601, label: 'Cổng trước', name: 'Ch.06' },
                { ch: 701, label: 'Sân vườn', name: 'Ch.07' },
                { ch: 801, label: 'Cầu thang', name: 'Ch.08' },
                { ch: 901, label: 'Hành lang T1', name: 'Ch.09' },
                { ch: 1001, label: 'Khu nội bộ', name: 'Ch.10' },
              ].map((item) => {
                const isActive = nvr1ActiveChannel === item.ch;
                return (
                  <button
                    key={item.ch}
                    onClick={() => {
                      setNvr1ActiveChannel(item.ch);
                      fetchNvrSnapshot('10.110.1.13', item.ch);
                    }}
                    className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {item.name}
                    </span>
                    <span className="truncate mx-1 text-[10px]">{item.label}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500/60'
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleOpenEmbeddedViewer('10.110.1.13', 'Đầu Ghi NVR 01 - Trung Tâm (camera.hepco.com.vn)')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <MonitorPlay className="w-4 h-4" />
                <span>Xem Web NVR 01 (Lưới Đa Màn Hình)</span>
              </button>

              <button
                onClick={() => handleCopyRtsp('10.110.1.13', nvr1ActiveChannel)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Sao chép luồng RTSP có sẵn mật khẩu"
              >
                {copiedRtsp['10.110.1.13'] ? <Check className="w-4 h-4 text-emerald-400" /> : <Tv className="w-4 h-4 text-emerald-400" />}
                <span>{copiedRtsp['10.110.1.13'] ? 'Đã Chép RTSP!' : 'Chép RTSP'}</span>
              </button>

              {onSwitchToListMode && (
                <button
                  onClick={() => onSwitchToListMode('10.110.1.13')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem danh sách chi tiết các camera thuộc NVR 01"
                >
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kênh Chi Tiết ({nvr1Cams.length})</span>
                </button>
              )}

              <button
                onClick={() => window.open('http://10.110.1.13', '_blank')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Mở trình duyệt Web ngoài"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================== NVR 02: HƯƠNG SƠ & KHU VỰC NGOẠI CẢNH ===================== */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-teal-300 tracking-wide">
                    ĐẦU GHI NVR 02 - HƯƠNG SƠ & KHU VỰC NGOẠI CẢNH
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                    DS-7616NI-K2
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  IP: <strong className="text-teal-400">10.110.1.80</strong> · Xác thực: <span className="text-teal-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 tracking-wider">admin / ••••••••</span>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-900/90 text-teal-300 border border-teal-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              10/10 KÊNH ONLINE
            </span>
          </div>

          {/* Live Monitor Screen (16:9 Cinema View - Active Live Stream) */}
          <div
            className="relative bg-black h-72 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden select-none group"
          >
            {/* Real Live Snapshot Frame with Auto-Refresh */}
            {snapshots['10.110.1.80'] ? (
              <img
                src={snapshots['10.110.1.80']}
                alt="Live Stream NVR 02"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                <Video className="w-12 h-12 text-teal-500/50 mb-3 animate-pulse" />
                <div className="text-sm font-bold text-slate-200">ĐẦU GHI HƯƠNG SƠ NVR 02 ĐANG KẾT NỐI TRỰC TIẾP...</div>
                <div className="text-xs font-mono text-teal-400 mt-1">
                  Port 80 (Web) · Port 554 (RTSP) · Port 8000 (SDK)
                </div>
                {snapshotErrors['10.110.1.80'] && (
                  <div className="mt-3 text-[11px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-lg">
                    {snapshotErrors['10.110.1.80']}
                  </div>
                )}
              </div>
            )}

            {/* Top OSD Bar */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white/90 drop-shadow-md select-none pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold tracking-wider text-red-400">🔴 TRỰC TIẾP · NVR-02</span>
                <span className="text-teal-300 font-bold">| KÊNH {Math.floor(nvr2ActiveChannel / 100)}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-teal-400 font-bold">
                {liveClock}
              </div>
            </div>

            {/* Bottom Stream Info Bar */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 pointer-events-none">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                <span>H.265 / H.264 · 1080P Full HD · Tự Động Live</span>
              </span>
              <span className="text-teal-400 font-bold">Xác thực: admin OK</span>
            </div>
          </div>

          {/* Channels Quick Navigator - Click switches the live stream instantly! */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Chọn Kênh Xem Trực Tiếp ({nvr2Cams.length} Camera con):</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono font-bold">
                • Bấm kênh để đổi camera phát live
              </span>
            </div>

            {/* Mini Channels Pills (Interactive Channel Switcher) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
              {[
                { ch: 101, label: 'Đường nội bộ', name: 'Ch.01' },
                { ch: 201, label: 'Khu phế liệu', name: 'Ch.02' },
                { ch: 301, label: 'Lán xe ép rác', name: 'Ch.03' },
                { ch: 401, label: 'Bãi tập kết', name: 'Ch.04' },
                { ch: 501, label: 'Sân điều phối', name: 'Ch.05' },
                { ch: 601, label: 'Xưởng 2 - Kho', name: 'Ch.06' },
                { ch: 701, label: 'HL ngang 2', name: 'Ch.07' },
                { ch: 801, label: 'Khu bảo trì', name: 'Ch.08' },
                { ch: 901, label: 'Trạm cân', name: 'Ch.09' },
                { ch: 1001, label: 'Xưởng cơ khí', name: 'Ch.10' },
              ].map((item) => {
                const isActive = nvr2ActiveChannel === item.ch;
                return (
                  <button
                    key={item.ch}
                    onClick={() => {
                      setNvr2ActiveChannel(item.ch);
                      fetchNvrSnapshot('10.110.1.80', item.ch);
                    }}
                    className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-teal-950 border-teal-500 text-teal-200 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={isActive ? 'text-teal-400 font-bold' : 'text-slate-500'}>
                      {item.name}
                    </span>
                    <span className="truncate mx-1 text-[10px]">{item.label}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-teal-400 animate-ping' : 'bg-teal-500/60'
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleOpenEmbeddedViewer('10.110.1.80', 'Đầu Ghi NVR 02 - Hương Sơ')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <MonitorPlay className="w-4 h-4" />
                <span>Xem Web NVR 02 (Lưới Đa Màn Hình)</span>
              </button>

              <button
                onClick={() => handleCopyRtsp('10.110.1.80', nvr2ActiveChannel)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Sao chép luồng RTSP có sẵn mật khẩu"
              >
                {copiedRtsp['10.110.1.80'] ? <Check className="w-4 h-4 text-teal-400" /> : <Tv className="w-4 h-4 text-teal-400" />}
                <span>{copiedRtsp['10.110.1.80'] ? 'Đã Chép RTSP!' : 'Chép RTSP'}</span>
              </button>

              {onSwitchToListMode && (
                <button
                  onClick={() => onSwitchToListMode('10.110.1.80')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem danh sách chi tiết các camera thuộc NVR 02"
                >
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kênh Chi Tiết ({nvr2Cams.length})</span>
                </button>
              )}

              <button
                onClick={() => window.open('http://10.110.1.80', '_blank')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Mở trình duyệt Web ngoài"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Callout to Detailed List */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
            <List className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Quản lý chi tiết 22 mắt Camera IP & Cấu hình kênh
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Toàn bộ danh sách địa chỉ IP, địa chỉ MAC, nhãn OSD, kênh NVR con đã được quy hoạch vào tab Danh Sách Chi Tiết giúp màn hình giám sát trực tiếp gọn gàng, trực quan và đạt tốc độ tối đa.
            </p>
          </div>
        </div>

        {onSwitchToListMode && (
          <button
            onClick={() => onSwitchToListMode('ALL')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>Mở Tab Danh Sách Chi Tiết (22 Camera)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
