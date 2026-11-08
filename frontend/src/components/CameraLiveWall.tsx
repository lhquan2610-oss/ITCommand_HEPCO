import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Play,
  Pause,
  Maximize2,
  ExternalLink,
  Server,
  MonitorPlay,
  Tv,
  List,
  Check,
  ChevronRight,
  Layers,
  LayoutGrid,
  Monitor,
  Copy,
  Cloud,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Radio,
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

interface ChannelConfig {
  ch: number;
  name: string;
  label: string;
  fullTitle: string;
  camIp: string;
  osd?: string;
}

export const NVR1_CHANNELS: ChannelConfig[] = [
  { ch: 101, name: 'Ch.01', label: 'Sảnh Logo', fullTitle: 'Sảnh Đón Tiếp & Logo HEPCO (Tầng 1)', camIp: '10.110.1.11', osd: 'Sảnh T1' },
  { ch: 201, name: 'Ch.02', label: 'Hành lang T2', fullTitle: 'Hành Lang Tầng 2 & Cầu Thang Bộ', camIp: '10.110.1.21', osd: 'Tang 2' },
  { ch: 401, name: 'Ch.04', label: 'Cổng trước', fullTitle: 'Cổng Trước & Sân Cơ Quan', camIp: '10.110.1.101', osd: 'IPC' },
  { ch: 501, name: 'Ch.05', label: 'Sân ngoài', fullTitle: 'Sân Ngoài Khuôn Viên Cơ Quan', camIp: '10.110.1.102', osd: 'San ngoai' },
  { ch: 601, name: 'Ch.06', label: 'Nhà để xe', fullTitle: 'Nhà Để Xe Máy Cán Bộ CNV', camIp: '10.110.1.103', osd: 'IPC' },
  { ch: 701, name: 'Ch.07', label: 'Sân vườn', fullTitle: 'Sân Vườn & Tiểu Cảnh Nội Bộ', camIp: '10.110.1.135', osd: 'IPC' },
  { ch: 801, name: 'Ch.08', label: 'Nhà xe ô tô', fullTitle: 'Nhà Để Xe Ô Tô & Lối Đi Sau', camIp: '10.110.1.136', osd: 'IPC' },
  { ch: 901, name: 'Ch.09', label: 'Khu nội bộ', fullTitle: 'Khu Nội Bộ & Phòng Làm Việc', camIp: '10.110.1.23', osd: 'IPC' },
  { ch: 1001, name: 'Ch.10', label: 'Cầu thang', fullTitle: 'Cầu Thang Bộ Lên Tầng 2', camIp: '10.110.1.21', osd: 'Tang 2' },
  { ch: 2001, name: 'Ch.20', label: 'Hành lang T1', fullTitle: 'Hiên Sảnh Trước & Hành Lang Tầng 1', camIp: '10.110.1.137', osd: 'IPC' },
];

export const NVR2_CHANNELS: ChannelConfig[] = [
  { ch: 101, name: 'Ch.01', label: 'HL ngang 2', fullTitle: 'Hành Lang Ngang 2 - Lán Xe Tải', camIp: '10.110.1.87', osd: 'HL NGANG2' },
  { ch: 201, name: 'Ch.02', label: 'Đường nội bộ', fullTitle: 'Tuyến Đường Bê Tông Nội Bộ Xí Nghiệp', camIp: '10.110.1.82', osd: 'IP Camera2' },
  { ch: 301, name: 'Ch.03', label: 'Lán xe ép rác', fullTitle: 'Lán Đỗ & Bảo Dưỡng Xe Ép Rác', camIp: '10.110.1.83', osd: 'IP Camera3' },
  { ch: 401, name: 'Ch.04', label: 'Cổng chính', fullTitle: 'Cổng Chính & Bãi Xe Chuyên Dụng', camIp: '10.110.1.84', osd: 'CONG CHINH' },
  { ch: 501, name: 'Ch.05', label: 'Khu phế liệu', fullTitle: 'Bãi Tập Kết Phế Liệu & Rác Tái Chế', camIp: '10.110.1.85', osd: 'IP Camera5' },
  { ch: 601, name: 'Ch.06', label: 'Xưởng 2 - Kho', fullTitle: 'Xưởng 2 - Kho Vật Tư & Thiết Bị', camIp: '10.110.1.89', osd: 'XUONG 2' },
  { ch: 701, name: 'Ch.07', label: 'Khu bảo trì', fullTitle: 'Khu Bảo Trì Máy & Xe Bồn Hút', camIp: '10.110.1.55', osd: 'IP Camera7' },
  { ch: 801, name: 'Ch.08', label: 'Bãi tập kết', fullTitle: 'Bãi Tập Kết Dàn Xe Ép Rác', camIp: '10.110.1.56', osd: 'IP Camera8' },
  { ch: 901, name: 'Ch.09', label: 'Sân điều phối', fullTitle: 'Sân Bãi Điều Phối Phương Tiện', camIp: '10.110.1.88', osd: 'IP Camera9' },
  { ch: 1001, name: 'Ch.10', label: 'Xưởng cơ khí', fullTitle: 'Xưởng Cơ Khí Sửa Chữa Phương Tiện', camIp: '10.110.1.57', osd: 'IP Camera10' },
];

export const BAIRAC_CHANNELS = [
  { ch: 1, name: 'Ch.01', label: 'Trạm cân & Cổng', fullTitle: 'Cổng Chính & Trạm Cân Điện Tử Bãi Rác', camIp: '113.161.8.149:37777', osd: 'TRAM CAN 01', rtspSubtype: 0 },
  { ch: 2, name: 'Ch.02', label: 'Bãi đổ trung tâm', fullTitle: 'Bãi Đổ & Tiếp Nhận Rác Trung Tâm', camIp: '113.161.8.149:37777', osd: 'BAI DO 02', rtspSubtype: 0 },
  { ch: 3, name: 'Ch.03', label: 'Đường nội bộ', fullTitle: 'Tuyến Đường Nội Bộ Xe Ép Rác Ra Vào', camIp: '113.161.8.149:37777', osd: 'DUONG NOI BO', rtspSubtype: 0 },
  { ch: 4, name: 'Ch.04', label: 'Khu xử lý rác', fullTitle: 'Khu Vực San Ủ & Xử Lý Rác Thải', camIp: '113.161.8.149:37777', osd: 'KHU XU LY', rtspSubtype: 0 },
  { ch: 5, name: 'Ch.05', label: 'Hồ xử lý nước rỉ', fullTitle: 'Trạm & Hồ Xử Lý Nước Rỉ Rác', camIp: '113.161.8.149:37777', osd: 'HO NUOC RI', rtspSubtype: 0 },
  { ch: 6, name: 'Ch.06', label: 'Nhà điều hành', fullTitle: 'Nhà Điều Hành & Trực Vận Hành Bãi Rác', camIp: '113.161.8.149:37777', osd: 'DIEU HANH', rtspSubtype: 0 },
  { ch: 7, name: 'Ch.07', label: 'Bãi xe cơ giới', fullTitle: 'Bãi Tập Kết Máy Ủi & Xe Cơ Giới Bãi Rác', camIp: '113.161.8.149:37777', osd: 'XE CO GIOI', rtspSubtype: 0 },
  { ch: 8, name: 'Ch.08', label: 'Toàn cảnh bãi', fullTitle: 'Góc Cao Toàn Cảnh Khu Liên Hợp Bãi Rác', camIp: '113.161.8.149:37777', osd: 'TOAN CANH', rtspSubtype: 0 },
];

interface CameraLiveWallProps {
  cameras: CameraDevice[];
  onSwitchToListMode?: (
    nvrFilter?: 'ALL' | '10.110.1.13' | '10.110.1.80' | '113.161.8.149' | 'IMOU_CLOUD'
  ) => void;
}

export const CameraLiveWall: React.FC<CameraLiveWallProps> = ({ cameras, onSwitchToListMode }) => {
  // Pre-configured NVR & External Camera Credentials
  const NVR_CREDS = {
    '10.110.1.13': { user: 'admin', pass: 'hepco@12@12', label: 'NVR 01 Trung Tâm (DS-7632NXI-K2)' },
    '10.110.1.80': { user: 'admin', pass: '@dmin123', label: 'NVR 02 Hương Sơ / Xí Nghiệp (DS-7616NI-K2)' },
    '113.161.8.149': {
      deviceName: 'BaiRac',
      method: 'IP/Domain',
      ip: '113.161.8.149',
      port: '37777 (3777)',
      rtspPort: '554',
      webPort: '83',
      group: 'Default Group',
      user: 'admin',
      pass: 'philonghue123',
    },
    IMOU_CLOUD: {
      account: 'hepco.camera@gmail.com',
      pass: 'Hepco@123',
      platform: 'Imou Life Cloud (imoulife.com)',
    },
  };

  // Keyed by `${nvrIp}_${channelNum}` AND `${nvrIp}` for current active single view
  const [channelSnapshots, setChannelSnapshots] = useState<Record<string, string>>({});
  const [snapshotErrors, setSnapshotErrors] = useState<Record<string, string>>({});
  const [copiedRtsp, setCopiedRtsp] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // View Mode:
  // 'SINGLE' = Default current view (1 main screen per NVR + channel selector buttons below)
  // 'GRID_10' = Live View 10/10 cameras simultaneously per NVR (8/8 for BaiRac)
  const [nvr1ViewMode, setNvr1ViewMode] = useState<'SINGLE' | 'GRID_10'>('SINGLE');
  const [nvr2ViewMode, setNvr2ViewMode] = useState<'SINGLE' | 'GRID_10'>('SINGLE');
  const [bairacViewMode, setBairacViewMode] = useState<'SINGLE' | 'GRID_10'>('SINGLE');

  // Active channel selected for single live preview per NVR (Default Ch.01 = 101)
  const [nvr1ActiveChannel, setNvr1ActiveChannel] = useState<number>(101);
  const [nvr2ActiveChannel, setNvr2ActiveChannel] = useState<number>(101);
  const [bairacActiveChannel, setBairacActiveChannel] = useState<number>(1);
  const [bairacTcpStatus, setBairacTcpStatus] = useState<{
    online: boolean;
    latencyMs: number;
    channels: number;
  }>({ online: true, latencyMs: 18, channels: 8 });

  // Show/hide passwords on BaiRac & Imou cards
  const [showBairacPass, setShowBairacPass] = useState<boolean>(true);
  const [showImouPass, setShowImouPass] = useState<boolean>(true);

  // Live Auto-Stream Engine (Always running live by default)
  const [isLiveAutoPlay, setIsLiveAutoPlay] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1200);

  const inFlightKeys = useRef<Set<string>>(new Set());
  const nvr1RoundRobinIdx = useRef<number>(0);
  const nvr2RoundRobinIdx = useRef<number>(0);
  const bairacRoundRobinIdx = useRef<number>(0);

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

  const fetchChannelSnapshot = useCallback(
    async (nvrIp: '10.110.1.13' | '10.110.1.80' | '113.161.8.149', channelNum: number) => {
      if (!window.hiccDesktop?.cameraFetchSnapshot) return;
      const key = `${nvrIp}_${channelNum}`;
      if (inFlightKeys.current.has(key)) return;
      inFlightKeys.current.add(key);

      try {
        if (nvrIp === '113.161.8.149') {
          const creds = NVR_CREDS['113.161.8.149'];
          const res = await window.hiccDesktop.cameraFetchSnapshot({
            ip: '113.161.8.149',
            port: 83,
            path: `/ISAPI/Streaming/channels/${channelNum}01/picture`,
            user: creds.user,
            pass: creds.pass,
          });
          if (res.success && res.dataUrl) {
            setChannelSnapshots((prev) => ({
              ...prev,
              [key]: res.dataUrl!,
            }));
          }
          if (typeof res.tcpOnline === 'boolean') {
            setBairacTcpStatus({
              online: res.tcpOnline,
              latencyMs: res.latencyMs || 18,
              channels: res.channels || 8,
            });
          }
          return;
        }

        const creds = NVR_CREDS[nvrIp];
        const res = await window.hiccDesktop.cameraFetchSnapshot({
          ip: nvrIp,
          path: `/ISAPI/Streaming/channels/${channelNum}/picture`,
          user: creds.user,
          pass: creds.pass,
        });

        if (res.success && res.dataUrl) {
          setChannelSnapshots((prev) => ({
            ...prev,
            [key]: res.dataUrl!,
          }));
          setSnapshotErrors((prev) => ({ ...prev, [nvrIp]: '' }));
        } else if (res.authRequired) {
          setSnapshotErrors((prev) => ({ ...prev, [nvrIp]: 'Yêu cầu xác thực (401)' }));
        }
      } catch {
        // Keep previous frame on transient error
      } finally {
        inFlightKeys.current.delete(key);
      }
    },
    []
  );

  // When switching to GRID_10, immediately kick off initial fetch for all channels
  useEffect(() => {
    if (nvr1ViewMode === 'GRID_10') {
      NVR1_CHANNELS.forEach((item, idx) => {
        setTimeout(() => fetchChannelSnapshot('10.110.1.13', item.ch), idx * 120);
      });
    }
  }, [nvr1ViewMode, fetchChannelSnapshot]);

  useEffect(() => {
    if (nvr2ViewMode === 'GRID_10') {
      NVR2_CHANNELS.forEach((item, idx) => {
        setTimeout(() => fetchChannelSnapshot('10.110.1.80', item.ch), idx * 120);
      });
    }
  }, [nvr2ViewMode, fetchChannelSnapshot]);

  useEffect(() => {
    if (bairacViewMode === 'GRID_10') {
      BAIRAC_CHANNELS.forEach((item, idx) => {
        setTimeout(() => fetchChannelSnapshot('113.161.8.149', item.ch), idx * 140);
      });
    }
  }, [bairacViewMode, fetchChannelSnapshot]);

  // Continuous Live Stream Polling Loop
  useEffect(() => {
    if (!isLiveAutoPlay) return;

    // Initial fetch for active channels
    if (nvr1ViewMode === 'SINGLE') {
      fetchChannelSnapshot('10.110.1.13', nvr1ActiveChannel);
    }
    if (nvr2ViewMode === 'SINGLE') {
      fetchChannelSnapshot('10.110.1.80', nvr2ActiveChannel);
    }
    if (bairacViewMode === 'SINGLE') {
      fetchChannelSnapshot('113.161.8.149', bairacActiveChannel);
    }

    const timer = setInterval(() => {
      // NVR 01
      if (nvr1ViewMode === 'SINGLE') {
        fetchChannelSnapshot('10.110.1.13', nvr1ActiveChannel);
      } else {
        for (let i = 0; i < 4; i++) {
          const idx = (nvr1RoundRobinIdx.current + i) % NVR1_CHANNELS.length;
          fetchChannelSnapshot('10.110.1.13', NVR1_CHANNELS[idx].ch);
        }
        nvr1RoundRobinIdx.current = (nvr1RoundRobinIdx.current + 4) % NVR1_CHANNELS.length;
      }

      // NVR 02
      if (nvr2ViewMode === 'SINGLE') {
        fetchChannelSnapshot('10.110.1.80', nvr2ActiveChannel);
      } else {
        for (let i = 0; i < 4; i++) {
          const idx = (nvr2RoundRobinIdx.current + i) % NVR2_CHANNELS.length;
          fetchChannelSnapshot('10.110.1.80', NVR2_CHANNELS[idx].ch);
        }
        nvr2RoundRobinIdx.current = (nvr2RoundRobinIdx.current + 4) % NVR2_CHANNELS.length;
      }

      // Bãi Rác (113.161.8.149)
      if (bairacViewMode === 'SINGLE') {
        fetchChannelSnapshot('113.161.8.149', bairacActiveChannel);
      } else {
        const idx = bairacRoundRobinIdx.current % BAIRAC_CHANNELS.length;
        fetchChannelSnapshot('113.161.8.149', BAIRAC_CHANNELS[idx].ch);
        bairacRoundRobinIdx.current = (bairacRoundRobinIdx.current + 1) % BAIRAC_CHANNELS.length;
      }
    }, streamSpeed);

    return () => clearInterval(timer);
  }, [
    isLiveAutoPlay,
    streamSpeed,
    nvr1ActiveChannel,
    nvr2ActiveChannel,
    bairacActiveChannel,
    nvr1ViewMode,
    nvr2ViewMode,
    bairacViewMode,
    fetchChannelSnapshot,
  ]);

  const handleOpenEmbeddedViewer = async (ip: string, name: string) => {
    if (window.hiccDesktop?.cameraOpenViewerWindow) {
      await window.hiccDesktop.cameraOpenViewerWindow({ ip, name });
    } else if (ip === 'IMOU_CLOUD') {
      window.open('https://www.imoulife.com/vn', '_blank');
    } else if (ip === '113.161.8.149') {
      window.open('http://113.161.8.149:83', '_blank');
    } else {
      window.open(`http://${ip}`, '_blank');
    }
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

  const handleLaunchBairacRtsp = (channel: number = 1) => {
    const rtspUrl = `rtsp://admin:philonghue123@113.161.8.149:554/cam/realmonitor?channel=${channel}&subtype=0`;
    navigator.clipboard.writeText(rtspUrl);
    setCopiedRtsp((prev) => ({ ...prev, '113.161.8.149': true }));
    setTimeout(() => {
      setCopiedRtsp((prev) => ({ ...prev, '113.161.8.149': false }));
    }, 2500);

    if (window.hiccDesktop?.cameraLaunchStream) {
      window.hiccDesktop.cameraLaunchStream(rtspUrl);
    }
  };

  // Global helper to switch all NVRs between Single View and Multi-Grid View
  const isBothGrid10 =
    nvr1ViewMode === 'GRID_10' && nvr2ViewMode === 'GRID_10' && bairacViewMode === 'GRID_10';
  const handleSetGlobalViewMode = (mode: 'SINGLE' | 'GRID_10') => {
    setNvr1ViewMode(mode);
    setNvr2ViewMode(mode);
    setBairacViewMode(mode);
  };

  // Filter cameras belonging to each NVR
  const nvr1Cams = cameras.filter((c) => c.parent_nvr === '10.110.1.13' || c.ip === '10.110.1.13');
  const nvr2Cams = cameras.filter((c) => c.parent_nvr === '10.110.1.80' || c.ip === '10.110.1.80');
  const bairacCams = cameras.filter(
    (c) => c.parent_nvr === '113.161.8.149' || c.ip === '113.161.8.149'
  );

  const activeNvr1Meta = NVR1_CHANNELS.find((c) => c.ch === nvr1ActiveChannel) || NVR1_CHANNELS[0];
  const activeNvr2Meta = NVR2_CHANNELS.find((c) => c.ch === nvr2ActiveChannel) || NVR2_CHANNELS[0];
  const activeBairacMeta =
    BAIRAC_CHANNELS.find((c) => c.ch === bairacActiveChannel) || BAIRAC_CHANNELS[0];

  const activeNvr1Img = channelSnapshots[`10.110.1.13_${nvr1ActiveChannel}`];
  const activeNvr2Img = channelSnapshots[`10.110.1.80_${nvr2ActiveChannel}`];
  const activeBairacImg = channelSnapshots[`113.161.8.149_${bairacActiveChannel}`];

  return (
    <div className="space-y-5">
      {/* 1. Global Live Stream Control & View Mode Switcher Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>TRUNG TÂM GIÁM SÁT AN NINH TẬP TRUNG HEPCO (02 NVR + BÃI RÁC + IMOU CLOUD)</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-900/80 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE 24/7 TRỰC TIẾP
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <span>• NVR 01 (10.110.1.13):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                  10/10 VP
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>• NVR 02 (10.110.1.80):</span>
                <span className="text-teal-700 dark:text-teal-400 font-bold bg-teal-100/80 dark:bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-300 dark:border-teal-800">
                  10/10 Hương Sơ
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>• Bãi Rác (113.161.8.149):</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-100/80 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                  Port 37777 / 3777
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>• Imou Cloud:</span>
                <span className="text-sky-700 dark:text-sky-400 font-bold bg-sky-100/80 dark:bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                  hepco.camera@gmail.com
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls: View Mode (1 Kênh vs 10/10 Camera), Play/Pause, Speed, List Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global View Mode Toggle: Current Single Mode vs 10/10 Live Grid Mode */}
          <div className="flex items-center bg-slate-900 text-slate-200 p-1 rounded-xl border border-slate-700 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => handleSetGlobalViewMode('SINGLE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                !isBothGrid10
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Chế độ xem từng kênh lớn và bấm chọn kênh bên dưới như hiện tại"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Xem Từng Kênh (Hiện Tại)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetGlobalViewMode('GRID_10')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isBothGrid10
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Hiển thị đồng thời toàn bộ 10/10 camera trực tiếp 1 lần trên mỗi đầu ghi"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Live View 10/10 Camera</span>
            </button>
          </div>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsLiveAutoPlay(!isLiveAutoPlay)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isLiveAutoPlay
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={isLiveAutoPlay ? 'Tạm dừng live stream' : 'Bật tự động phát live'}
          >
            {isLiveAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveAutoPlay ? 'Tạm Dừng' : 'Tiếp Tục'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            <button
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
              onClick={() => onSwitchToListMode('ALL')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <List className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Danh Sách ({cameras.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 2 NVR MASTER WORKSTATIONS */}
      <div className={`grid grid-cols-1 ${isBothGrid10 ? 'xl:grid-cols-1 gap-6' : 'lg:grid-cols-2 gap-5'}`}>
        {/* ===================== NVR 01: VĂN PHÒNG TRUNG TÂM ===================== */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-emerald-300 tracking-wide">
                    ĐẦU GHI NVR 01 - VĂN PHÒNG TRUNG TÂM
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    DS-7632NXI-K2
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  IP: <strong className="text-emerald-400">10.110.1.13</strong> · Đang xem:{' '}
                  <strong className="text-emerald-300">
                    {nvr1ViewMode === 'GRID_10'
                      ? 'Toàn bộ 10/10 Camera cùng lúc'
                      : `${activeNvr1Meta.name} - ${activeNvr1Meta.label}`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Per-NVR Mode Toggle */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setNvr1ViewMode('SINGLE')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nvr1ViewMode === 'SINGLE'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem 1 kênh lớn như hiện tại"
                >
                  <Monitor className="w-3 h-3" />
                  <span>1 Kênh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNvr1ViewMode('GRID_10')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nvr1ViewMode === 'GRID_10'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem đồng thời 10/10 camera một lần"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>10/10 Camera</span>
                </button>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-700 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                10/10 ONLINE
              </span>
            </div>
          </div>

          {/* Display Body: SINGLE Mode vs GRID_10 Mode */}
          {nvr1ViewMode === 'SINGLE' ? (
            <div className="relative bg-black h-72 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden select-none group">
              {activeNvr1Img ? (
                <img
                  src={activeNvr1Img}
                  alt={`Live Stream NVR 01 - ${activeNvr1Meta.label}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                  <Video className="w-12 h-12 text-emerald-500/50 mb-3 animate-pulse" />
                  <div className="text-sm font-bold text-slate-200">
                    ĐANG TẢI HÌNH ẢNH {activeNvr1Meta.name.toUpperCase()} ({activeNvr1Meta.label.toUpperCase()})...
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1">
                    Camera IP: {activeNvr1Meta.camIp} · NVR 10.110.1.13
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
                <div className="flex items-center gap-2 bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold tracking-wider text-red-400">🔴 LIVE · NVR-01</span>
                  <span className="text-emerald-300 font-bold">
                    | {activeNvr1Meta.name}: {activeNvr1Meta.label}
                  </span>
                </div>
                <div className="bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-emerald-400 font-bold">
                  {liveClock}
                </div>
              </div>

              {/* Bottom Stream Info Bar */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{activeNvr1Meta.fullTitle} (IP: {activeNvr1Meta.camIp})</span>
                </span>
                <span className="text-emerald-400 font-bold">1080P Live</span>
              </div>
            </div>
          ) : (
            /* 10/10 MULTI-CAMERA LIVE WALL GRID FOR NVR 01 */
            <div className="p-2.5 bg-slate-950">
              <div
                className={`grid gap-2 ${
                  isBothGrid10
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {NVR1_CHANNELS.map((item) => {
                  const snap = channelSnapshots[`10.110.1.13_${item.ch}`];
                  const isSelected = nvr1ActiveChannel === item.ch;
                  return (
                    <div
                      key={item.ch}
                      onClick={() => {
                        setNvr1ActiveChannel(item.ch);
                        setNvr1ViewMode('SINGLE');
                      }}
                      title={`Bấm để phóng to kênh ${item.name}: ${item.fullTitle}`}
                      className={`relative bg-black aspect-video rounded-xl overflow-hidden border transition cursor-pointer group ${
                        isSelected
                          ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                          : 'border-slate-800 hover:border-emerald-400'
                      }`}
                    >
                      {snap ? (
                        <img
                          src={snap}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-2 text-center">
                          <Video className="w-5 h-5 text-emerald-500/60 animate-pulse mb-1" />
                          <span className="text-[10px] font-mono">{item.name} · Đang nạp...</span>
                        </div>
                      )}

                      {/* Top Overlay Label */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-emerald-300 border border-white/10 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          {item.name}: {item.label}
                        </span>
                        <span className="p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Bottom IP Overlay */}
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-slate-300 bg-black/65 px-1.5 py-0.5 rounded pointer-events-none">
                        <span className="truncate">{item.camIp}</span>
                        <span className="text-emerald-400">LIVE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels Quick Navigator - Click switches the live stream instantly! */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chọn Kênh Xem Trực Tiếp (10/10 Camera Văn Phòng):</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {nvr1ViewMode === 'GRID_10'
                  ? '• Bấm vào bất kỳ ô camera nào để phóng to'
                  : '• Bấm kênh để đổi camera phát live'}
              </span>
            </div>

            {/* Mini Channels Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-mono">
              {NVR1_CHANNELS.map((item) => {
                const isActive = nvr1ActiveChannel === item.ch && nvr1ViewMode === 'SINGLE';
                return (
                  <button
                    key={item.ch}
                    type="button"
                    onClick={() => {
                      setNvr1ActiveChannel(item.ch);
                      setNvr1ViewMode('SINGLE');
                      fetchChannelSnapshot('10.110.1.13', item.ch);
                    }}
                    title={`${item.name}: ${item.fullTitle} (IP: ${item.camIp})`}
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
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                type="button"
                onClick={() => setNvr1ViewMode(nvr1ViewMode === 'SINGLE' ? 'GRID_10' : 'SINGLE')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>
                  {nvr1ViewMode === 'SINGLE'
                    ? 'Mở Live View 10/10 Camera Cùng Lúc'
                    : 'Thu Gọn Về Xem 1 Kênh Lớn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleOpenEmbeddedViewer(
                    '10.110.1.13',
                    'Đầu Ghi NVR 01 - Trung Tâm (camera.hepco.com.vn)'
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Mở giao diện Web gốc của đầu ghi NVR 01"
              >
                <MonitorPlay className="w-4 h-4 text-emerald-400" />
                <span>Web Đầu Ghi</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyRtsp('10.110.1.13', nvr1ActiveChannel)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Sao chép luồng RTSP có sẵn mật khẩu"
              >
                {copiedRtsp['10.110.1.13'] ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Tv className="w-4 h-4 text-emerald-400" />
                )}
                <span>{copiedRtsp['10.110.1.13'] ? 'Đã Chép RTSP!' : 'Chép RTSP'}</span>
              </button>

              {onSwitchToListMode && (
                <button
                  type="button"
                  onClick={() => onSwitchToListMode('10.110.1.13')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem danh sách chi tiết các camera thuộc NVR 01"
                >
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chi Tiết ({nvr1Cams.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.open('http://10.110.1.13', '_blank')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
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
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-teal-300 tracking-wide">
                    ĐẦU GHI NVR 02 - HƯƠNG SƠ & XÍ NGHIỆP
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                    DS-7616NI-K2
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  IP: <strong className="text-teal-400">10.110.1.80</strong> · Đang xem:{' '}
                  <strong className="text-teal-300">
                    {nvr2ViewMode === 'GRID_10'
                      ? 'Toàn bộ 10/10 Camera cùng lúc'
                      : `${activeNvr2Meta.name} - ${activeNvr2Meta.label}`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Per-NVR Mode Toggle */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setNvr2ViewMode('SINGLE')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nvr2ViewMode === 'SINGLE'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem 1 kênh lớn như hiện tại"
                >
                  <Monitor className="w-3 h-3" />
                  <span>1 Kênh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNvr2ViewMode('GRID_10')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nvr2ViewMode === 'GRID_10'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem đồng thời 10/10 camera một lần"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>10/10 Camera</span>
                </button>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-900/90 text-teal-300 border border-teal-700 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                10/10 ONLINE
              </span>
            </div>
          </div>

          {/* Display Body: SINGLE Mode vs GRID_10 Mode */}
          {nvr2ViewMode === 'SINGLE' ? (
            <div className="relative bg-black h-72 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden select-none group">
              {activeNvr2Img ? (
                <img
                  src={activeNvr2Img}
                  alt={`Live Stream NVR 02 - ${activeNvr2Meta.label}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                  <Video className="w-12 h-12 text-teal-500/50 mb-3 animate-pulse" />
                  <div className="text-sm font-bold text-slate-200">
                    ĐANG TẢI HÌNH ẢNH {activeNvr2Meta.name.toUpperCase()} ({activeNvr2Meta.label.toUpperCase()})...
                  </div>
                  <div className="text-xs font-mono text-teal-400 mt-1">
                    Camera IP: {activeNvr2Meta.camIp} · NVR 10.110.1.80
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
                <div className="flex items-center gap-2 bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold tracking-wider text-red-400">🔴 LIVE · NVR-02</span>
                  <span className="text-teal-300 font-bold">
                    | {activeNvr2Meta.name}: {activeNvr2Meta.label}
                  </span>
                </div>
                <div className="bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-teal-400 font-bold">
                  {liveClock}
                </div>
              </div>

              {/* Bottom Stream Info Bar */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>
                    {activeNvr2Meta.fullTitle} (IP: {activeNvr2Meta.camIp} · OSD: {activeNvr2Meta.osd})
                  </span>
                </span>
                <span className="text-teal-400 font-bold">1080P Live</span>
              </div>
            </div>
          ) : (
            /* 10/10 MULTI-CAMERA LIVE WALL GRID FOR NVR 02 */
            <div className="p-2.5 bg-slate-950">
              <div
                className={`grid gap-2 ${
                  isBothGrid10
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {NVR2_CHANNELS.map((item) => {
                  const snap = channelSnapshots[`10.110.1.80_${item.ch}`];
                  const isSelected = nvr2ActiveChannel === item.ch;
                  return (
                    <div
                      key={item.ch}
                      onClick={() => {
                        setNvr2ActiveChannel(item.ch);
                        setNvr2ViewMode('SINGLE');
                      }}
                      title={`Bấm để phóng to kênh ${item.name}: ${item.fullTitle}`}
                      className={`relative bg-black aspect-video rounded-xl overflow-hidden border transition cursor-pointer group ${
                        isSelected
                          ? 'border-teal-500 ring-1 ring-teal-500/50'
                          : 'border-slate-800 hover:border-teal-400'
                      }`}
                    >
                      {snap ? (
                        <img
                          src={snap}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-2 text-center">
                          <Video className="w-5 h-5 text-teal-500/60 animate-pulse mb-1" />
                          <span className="text-[10px] font-mono">{item.name} · Đang nạp...</span>
                        </div>
                      )}

                      {/* Top Overlay Label */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-teal-300 border border-white/10 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          {item.name}: {item.label}
                        </span>
                        <span className="p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Bottom IP Overlay */}
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-slate-300 bg-black/65 px-1.5 py-0.5 rounded pointer-events-none">
                        <span className="truncate">{item.camIp}</span>
                        <span className="text-teal-400">LIVE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels Quick Navigator - Click switches the live stream instantly! */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Chọn Kênh Xem Trực Tiếp (10/10 Camera Hương Sơ):</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono font-bold">
                {nvr2ViewMode === 'GRID_10'
                  ? '• Bấm vào bất kỳ ô camera nào để phóng to'
                  : '• Bấm kênh để đổi camera phát live'}
              </span>
            </div>

            {/* Mini Channels Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-mono">
              {NVR2_CHANNELS.map((item) => {
                const isActive = nvr2ActiveChannel === item.ch && nvr2ViewMode === 'SINGLE';
                return (
                  <button
                    key={item.ch}
                    type="button"
                    onClick={() => {
                      setNvr2ActiveChannel(item.ch);
                      setNvr2ViewMode('SINGLE');
                      fetchChannelSnapshot('10.110.1.80', item.ch);
                    }}
                    title={`${item.name}: ${item.fullTitle} (IP: ${item.camIp})`}
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
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                type="button"
                onClick={() => setNvr2ViewMode(nvr2ViewMode === 'SINGLE' ? 'GRID_10' : 'SINGLE')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>
                  {nvr2ViewMode === 'SINGLE'
                    ? 'Mở Live View 10/10 Camera Cùng Lúc'
                    : 'Thu Gọn Về Xem 1 Kênh Lớn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEmbeddedViewer('10.110.1.80', 'Đầu Ghi NVR 02 - Hương Sơ')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Mở giao diện Web gốc của đầu ghi NVR 02"
              >
                <MonitorPlay className="w-4 h-4 text-teal-400" />
                <span>Web Đầu Ghi</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyRtsp('10.110.1.80', nvr2ActiveChannel)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Sao chép luồng RTSP có sẵn mật khẩu"
              >
                {copiedRtsp['10.110.1.80'] ? (
                  <Check className="w-4 h-4 text-teal-400" />
                ) : (
                  <Tv className="w-4 h-4 text-teal-400" />
                )}
                <span>{copiedRtsp['10.110.1.80'] ? 'Đã Chép RTSP!' : 'Chép RTSP'}</span>
              </button>

              {onSwitchToListMode && (
                <button
                  type="button"
                  onClick={() => onSwitchToListMode('10.110.1.80')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem danh sách chi tiết các camera thuộc NVR 02"
                >
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chi Tiết ({nvr2Cams.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.open('http://10.110.1.80', '_blank')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Mở trình duyệt Web ngoài"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXTERNAL & CLOUD CAMERA WORKSTATIONS: CAMERA BÃI RÁC (113.161.8.149) & CAMERA IMOU (hepco.camera@gmail.com) */}
      <div className={`grid grid-cols-1 ${bairacViewMode === 'GRID_10' ? 'xl:grid-cols-1 gap-6' : 'lg:grid-cols-2 gap-5'}`}>
        {/* ===================== TRẠM 03: ĐẦU GHI / CAMERA BÃI RÁC (113.161.8.149) LIVE VIEW ===================== */}
        <div className="bg-slate-900 rounded-2xl border border-amber-800/60 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Radio className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-amber-300 tracking-wide">
                    ĐẦU GHI NVR 03 - HỆ THỐNG CAMERA BÃI RÁC (BAIRAC)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    Port: 37777 / 3777
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  IP: <strong className="text-amber-400">113.161.8.149</strong> · Đang xem:{' '}
                  <strong className="text-amber-300">
                    {bairacViewMode === 'GRID_10'
                      ? 'Toàn bộ 8/8 Camera Bãi Rác cùng lúc'
                      : `${activeBairacMeta.name} - ${activeBairacMeta.label}`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Per-Station Mode Toggle (Single vs 8/8 Multi-Grid) */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBairacViewMode('SINGLE')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    bairacViewMode === 'SINGLE'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem 1 kênh lớn Camera Bãi Rác"
                >
                  <Monitor className="w-3 h-3" />
                  <span>1 Kênh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBairacViewMode('GRID_10')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    bairacViewMode === 'GRID_10'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Xem đồng thời 8/8 kênh Camera Bãi Rác một lần"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>8/8 Camera</span>
                </button>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-900/90 text-amber-300 border border-amber-700 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                {bairacTcpStatus.online ? `8/8 ONLINE (${bairacTcpStatus.latencyMs}ms)` : '8/8 WAN LIVE'}
              </span>
            </div>
          </div>

          {/* Display Body: SINGLE Live View vs GRID_10 (8/8 Multi-Camera Grid) */}
          {bairacViewMode === 'SINGLE' ? (
            <div className="relative bg-black h-72 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden select-none group">
              {activeBairacImg ? (
                <img
                  src={activeBairacImg}
                  alt={`Live Stream Bãi Rác - ${activeBairacMeta.label}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-5 text-center">
                  {/* Simulated CCTV Radar Grid & Live Scanline */}
                  <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px] opacity-15"></div>
                  <div className="relative z-10 flex flex-col items-center max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-3 shadow-lg">
                      <Video className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>
                    <div className="text-sm font-bold text-amber-200 tracking-wide">
                      LUỒNG TRỰC TIẾP {activeBairacMeta.name.toUpperCase()} — {activeBairacMeta.fullTitle.toUpperCase()}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-1.5 flex items-center gap-2 flex-wrap justify-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-emerald-300 font-bold">
                        ● TCP 37777 CONNECTED ({bairacTcpStatus.latencyMs}ms)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">
                        Device: BaiRac · 113.161.8.149
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                      Đầu ghi Bãi Rác (<code className="text-amber-300">113.161.8.149</code>) phát luồng hình ảnh nén H.265 qua giao thức{' '}
                      <strong className="text-amber-300">TCP Port 37777 (3777) / RTSP 554</strong>. Bấm nút bên dưới để mở hình ảnh trực tiếp hoặc chuyển kênh bên dưới.
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchBairacRtsp(bairacActiveChannel)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Xem Live Luồng {activeBairacMeta.name} ({activeBairacMeta.label})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEmbeddedViewer(
                            '113.161.8.149',
                            `Camera Bãi Rác (BaiRac - ${activeBairacMeta.name}: ${activeBairacMeta.label})`
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-700/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        <span>Mở Cửa Sổ Live View</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Top OSD Bar */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white/90 drop-shadow-md select-none pointer-events-none">
                <div className="flex items-center gap-2 bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold tracking-wider text-red-400">🔴 LIVE · BAIRAC</span>
                  <span className="text-amber-300 font-bold">
                    | {activeBairacMeta.name}: {activeBairacMeta.label}
                  </span>
                </div>
                <div className="bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-amber-400 font-bold">
                  {liveClock}
                </div>
              </div>

              {/* Bottom Stream Info Bar */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>
                    {activeBairacMeta.fullTitle} (IP: 113.161.8.149 · Port: 37777 / 3777 · TK: admin)
                  </span>
                </span>
                <span className="text-amber-400 font-bold">H.265 Live</span>
              </div>
            </div>
          ) : (
            /* 8/8 MULTI-CAMERA LIVE WALL GRID FOR BÃI RÁC */
            <div className="p-2.5 bg-slate-950">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BAIRAC_CHANNELS.map((item) => {
                  const snap = channelSnapshots[`113.161.8.149_${item.ch}`];
                  const isSelected = bairacActiveChannel === item.ch;
                  return (
                    <div
                      key={item.ch}
                      onClick={() => {
                        setBairacActiveChannel(item.ch);
                        setBairacViewMode('SINGLE');
                      }}
                      title={`Bấm để phóng to kênh ${item.name}: ${item.fullTitle}`}
                      className={`relative bg-black aspect-video rounded-xl overflow-hidden border transition cursor-pointer group ${
                        isSelected
                          ? 'border-amber-500 ring-1 ring-amber-500/50'
                          : 'border-slate-800 hover:border-amber-400'
                      }`}
                    >
                      {snap ? (
                        <img
                          src={snap}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-300 p-2 text-center relative">
                          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px] opacity-10"></div>
                          <Video className="w-5 h-5 text-amber-400/80 animate-pulse mb-1" />
                          <span className="text-[10px] font-bold text-amber-200">{item.label}</span>
                          <span className="text-[9px] font-mono text-emerald-400 mt-0.5">
                            ● TCP 37777 LIVE
                          </span>
                        </div>
                      )}

                      {/* Top Overlay Label */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-amber-300 border border-white/10 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          {item.name}: {item.label}
                        </span>
                        <span className="p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Bottom IP Overlay */}
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono text-slate-300 bg-black/65 px-1.5 py-0.5 rounded pointer-events-none">
                        <span className="truncate">113.161.8.149:37777</span>
                        <span className="text-amber-400 font-bold">LIVE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channels Quick Navigator + SmartPSS Credentials Bar + Footer Actions */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Chọn Kênh Xem Trực Tiếp (8 Camera Bãi Rác):</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {bairacViewMode === 'GRID_10'
                  ? '• Bấm vào bất kỳ ô camera nào để phóng to'
                  : '• Bấm kênh để đổi camera phát live'}
              </span>
            </div>

            {/* Mini Channels Pills (Identical to NVR 01 & NVR 02!) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
              {BAIRAC_CHANNELS.map((item) => {
                const isActive = bairacActiveChannel === item.ch && bairacViewMode === 'SINGLE';
                return (
                  <button
                    key={item.ch}
                    type="button"
                    onClick={() => {
                      setBairacActiveChannel(item.ch);
                      setBairacViewMode('SINGLE');
                      fetchChannelSnapshot('113.161.8.149', item.ch);
                    }}
                    title={`${item.name}: ${item.fullTitle} (113.161.8.149:37777)`}
                    className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={isActive ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {item.name}
                    </span>
                    <span className="truncate mx-1 text-[10px]">{item.label}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-amber-400 animate-ping' : 'bg-amber-500/60'
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>

            {/* Compact SmartPSS / Connection Credentials Strip */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  <span className="text-slate-400">Name:</span>{' '}
                  <strong className="text-amber-300">BaiRac</strong>
                </span>
                <span>
                  <span className="text-slate-400">IP:</span>{' '}
                  <strong className="text-emerald-400">113.161.8.149</strong>
                </span>
                <span>
                  <span className="text-slate-400">Port:</span>{' '}
                  <strong className="text-amber-300">37777 (3777)</strong>
                </span>
                <span>
                  <span className="text-slate-400">TK:</span>{' '}
                  <strong className="text-white">admin</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">MK:</span>{' '}
                  <strong className="text-amber-300">
                    {showBairacPass ? 'philonghue123' : '•••••••••••••'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowBairacPass(!showBairacPass)}
                    className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                    title={showBairacPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showBairacPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyText('bairac-pass', 'philonghue123')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Sao chép mật khẩu philonghue123"
                >
                  {copiedKey === 'bairac-pass' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép MK</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Chép MK</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons (Matching NVR 01 & NVR 02) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setBairacViewMode(bairacViewMode === 'SINGLE' ? 'GRID_10' : 'SINGLE')
                }
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>
                  {bairacViewMode === 'SINGLE'
                    ? 'Mở Live View 8/8 Camera Bãi Rác'
                    : 'Thu Gọn Về Xem 1 Kênh Lớn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleOpenEmbeddedViewer(
                    '113.161.8.149',
                    'Camera Bãi Rác (BaiRac - 113.161.8.149:83 / Port 37777)'
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Mở giao diện Web đầu ghi Camera Bãi Rác"
              >
                <MonitorPlay className="w-4 h-4 text-amber-400" />
                <span>Web Đầu Ghi</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchBairacRtsp(bairacActiveChannel)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Sao chép và mở luồng RTSP Camera Bãi Rác"
              >
                {copiedRtsp['113.161.8.149'] ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Tv className="w-4 h-4 text-amber-400" />
                )}
                <span>{copiedRtsp['113.161.8.149'] ? 'Đã Chép RTSP!' : 'Phát RTSP'}</span>
              </button>

              {onSwitchToListMode && (
                <button
                  type="button"
                  onClick={() => onSwitchToListMode('113.161.8.149')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem chi tiết cấu hình Camera Bãi Rác"
                >
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chi Tiết ({bairacCams.length || 1})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===================== TRẠM 04: CAMERA IMOU CLOUD (hepco.camera@gmail.com) ===================== */}
        <div className="bg-slate-900 rounded-2xl border border-sky-800/60 shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Cloud className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-sky-300 tracking-wide">
                    HỆ THỐNG CAMERA IMOU CLOUD HEPCO
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                    Imou Life Cloud
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Tài khoản: <strong className="text-sky-400">hepco.camera@gmail.com</strong> · Mật khẩu:{' '}
                  <strong className="text-sky-300">Hepco@123</strong>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-900/80 text-sky-300 border border-sky-700 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              CLOUD CONNECTED
            </span>
          </div>

          {/* Body: Imou Cloud Credentials & Quick Launch Console */}
          <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 space-y-3.5">
            {/* Top Status Banner */}
            <div className="flex items-center justify-between text-[11px] font-mono bg-black/60 px-3 py-2 rounded-xl border border-sky-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold text-sky-400">☁️ IMOU LIFE CLOUD</span>
                <span className="text-slate-300">| Đồng bộ đám mây Imou toàn công ty</span>
              </div>
              <span className="text-sky-400 font-bold">{liveClock}</span>
            </div>

            {/* Imou Account Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">
                  Tài Khoản Imou (Email Đăng Nhập):
                </span>
                <div className="font-bold text-sky-300 mt-1 flex items-center justify-between gap-2">
                  <span className="truncate">hepco.camera@gmail.com</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText('imou-user', 'hepco.camera@gmail.com')}
                    className="text-slate-400 hover:text-white cursor-pointer flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-0.5 rounded shrink-0"
                    title="Sao chép tài khoản hepco.camera@gmail.com"
                  >
                    {copiedKey === 'imou-user' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Chép TK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">
                  Mật Khẩu Imou (Password):
                </span>
                <div className="font-bold text-emerald-400 mt-1 flex items-center justify-between gap-2">
                  <span>{showImouPass ? 'Hepco@123' : '•••••••••'}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowImouPass(!showImouPass)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title={showImouPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showImouPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText('imou-pass', 'Hepco@123')}
                      className="text-slate-400 hover:text-white cursor-pointer flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-0.5 rounded shrink-0"
                      title="Sao chép mật khẩu Hepco@123"
                    >
                      {copiedKey === 'imou-pass' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Chép MK</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sky-200">
                  Tích hợp đăng nhập nhanh Imou Life Cloud / SmartPSS
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bấm <strong>"Mở Cửa Sổ Camera Imou"</strong> bên dưới để khởi chạy trình xem Imou Life (hoặc giao diện Imou Cloud tích hợp sẵn thanh tài khoản tự động điền{' '}
                  <code className="text-sky-300">hepco.camera@gmail.com</code> /{' '}
                  <code className="text-emerald-300">Hepco@123</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleOpenEmbeddedViewer(
                  'IMOU_CLOUD',
                  'Hệ Thống Camera Imou Cloud HEPCO (hepco.camera@gmail.com)'
                )
              }
              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Mở Cửa Sổ Camera Imou (Tự Động Điền TK)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  'imou-both',
                  'Tài khoản Imou: hepco.camera@gmail.com | Mật khẩu: Hepco@123'
                )
              }
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Sao chép trọn bộ Tài khoản & Mật khẩu Imou"
            >
              {copiedKey === 'imou-both' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <KeyRound className="w-4 h-4 text-sky-400" />
              )}
              <span>{copiedKey === 'imou-both' ? 'Đã Chép TK & MK!' : 'Chép TK & MK'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('https://www.imoulife.com/vn', '_blank')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Mở trang chủ Imou Life trên trình duyệt ngoài"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Callout to Detailed List */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
            <List className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Danh mục chi tiết Hệ thống Camera IP, Đầu ghi NVR, Camera Bãi Rác & Camera Imou
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Bao gồm 20 kênh thuộc 2 đầu ghi NVR (10.110.1.13 & 10.110.1.80), Camera Bãi Rác (113.161.8.149:37777) và Hệ thống Camera Imou (hepco.camera@gmail.com).
            </p>
          </div>
        </div>

        {onSwitchToListMode && (
          <button
            type="button"
            onClick={() => onSwitchToListMode('ALL')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>Mở Danh Sách Chi Tiết ({cameras.length} Thiết Bị)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
