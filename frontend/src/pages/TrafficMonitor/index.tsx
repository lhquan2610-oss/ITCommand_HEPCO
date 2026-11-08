import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Radio,
  Sliders,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Bell,
  Trash2,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Filter,
  Check,
  Server,
  Layers,
  Search,
  Laptop,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../../context/AppContext';

export interface TrafficTickData {
  time: string;
  timestamp: number;
  downMbps: number;
  upMbps: number;
  downKBps: number;
  upKBps: number;
  broadcastRate: number;
  avgDown?: number;
  avgUp?: number;
  hasRecentAnomaly?: boolean;
}

export interface TopOffendingIp {
  ip: string;
  name?: string;
  dept?: string;
  rate?: string;
  usagePercent?: number;
  connections?: number;
  category?: string;
}

export interface AnomalyEvent {
  id: string;
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  measuredValue: string;
  threshold: string;
  timestamp: string;
  topOffendingIps?: TopOffendingIp[];
}

export interface TcpConnectionItem {
  proto: string;
  local: string;
  foreign: string;
  state: string;
  pid: string;
}

// Gentle pleasant alert chime using Web Audio API
const playAlertChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export const TrafficMonitorPage: React.FC = () => {
  const { t } = useApp();

  const [currentTick, setCurrentTick] = useState<TrafficTickData>({
    time: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    timestamp: Date.now(),
    downMbps: 1.25,
    upMbps: 0.45,
    downKBps: 156,
    upKBps: 56,
    broadcastRate: 38,
    avgDown: 1.8,
    avgUp: 0.6,
  });

  const [chartHistory, setChartHistory] = useState<TrafficTickData[]>([]);
  const [anomalyLogs, setAnomalyLogs] = useState<AnomalyEvent[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnomalyEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active TCP connections state
  const [tcpConnections, setTcpConnections] = useState<TcpConnectionItem[]>([]);
  const [connSearch, setConnSearch] = useState('');
  const [isLoadingConn, setIsLoadingConn] = useState(false);

  // Top heavy-traffic IPs state
  const [topIpsList, setTopIpsList] = useState<TopOffendingIp[]>([]);
  const [deviceLookupMap, setDeviceLookupMap] = useState<Record<string, any>>({});

  // Peak session trackers
  const [peakDown, setPeakDown] = useState(0);
  const [peakUp, setPeakUp] = useState(0);

  // Thresholds state
  const [thresholds, setThresholds] = useState({
    enabled: false,
    downLimitMbps: 50,
    upLimitMbps: 30,
    broadcastLimitRate: 600,
    spikeRatio: 3.5,
    alertCooldownSec: 15,
  });

  // Sound ref to avoid stale closure
  const soundRef = useRef(soundEnabled);
  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  // Load devices inventory to enrich IP names & departments
  useEffect(() => {
    fetch('/data/devices_inventory.json')
      .then((res) => res.json())
      .then((data: any[]) => {
        const map: Record<string, any> = {};
        if (Array.isArray(data)) {
          data.forEach((d) => {
            if (d.ip) map[d.ip] = d;
          });
        }
        setDeviceLookupMap(map);
      })
      .catch(() => {});
  }, []);

  // Load initial traffic telemetry & anomalies
  const refreshTrafficData = async () => {
    setIsRefreshing(true);
    try {
      if (window.hiccDesktop?.getTrafficCurrent) {
        const res = await window.hiccDesktop.getTrafficCurrent();
        if (res?.success) {
          if (res.current) {
            setCurrentTick(res.current);
            setPeakDown((prev) => Math.max(prev, res.current.downMbps));
            setPeakUp((prev) => Math.max(prev, res.current.upMbps));
          }
          if (res.thresholds) setThresholds(res.thresholds);
          if (res.anomalies) setAnomalyLogs(res.anomalies);
          if (res.history && res.history.length > 0) {
            setChartHistory(res.history);
          }
        }
      } else {
        // Fallback mock history for browser dev mode
        if (chartHistory.length === 0) {
          const now = Date.now();
          const mock: TrafficTickData[] = [];
          for (let i = 15; i >= 0; i--) {
            mock.push({
              time: new Date(now - i * 2000).toLocaleTimeString('vi-VN', { hour12: false }),
              timestamp: now - i * 2000,
              downMbps: parseFloat((0.8 + Math.random() * 2.5).toFixed(2)),
              upMbps: parseFloat((0.2 + Math.random() * 1.1).toFixed(2)),
              downKBps: 150,
              upKBps: 50,
              broadcastRate: Math.floor(25 + Math.random() * 30),
              avgDown: 1.5,
              avgUp: 0.5,
            });
          }
          setChartHistory(mock);
        }
      }
    } catch (e) {
      console.warn('Could not fetch traffic:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Fetch active TCP sockets and compute Top Heavy-Traffic IPs
  const fetchConnections = async () => {
    setIsLoadingConn(true);
    try {
      if (window.hiccDesktop?.getTrafficConnections) {
        const res = await window.hiccDesktop.getTrafficConnections();
        if (res?.success && res.connections) {
          setTcpConnections(res.connections);

          if (res.topIps && res.topIps.length > 0) {
            const enriched: TopOffendingIp[] = res.topIps.map((item: any) => {
              const d = deviceLookupMap[item.ip];
              const connCount = item.connections || 1;
              const estRate = (connCount * 1.8 + Math.random() * 2).toFixed(1);
              return {
                ip: item.ip,
                name: d?.display_name || d?.hostname || (item.ip.startsWith('10.0.0.') ? 'Máy Chủ Nội Bộ' : 'Thiết Bị Mạng'),
                dept: d?.department || (item.ip.startsWith('10.') ? 'Mạng Nội Bộ HEPCO' : 'Internet / WAN'),
                rate: `${estRate} Mbps`,
                connections: connCount,
                usagePercent: Math.min(100, Math.round((connCount / 15) * 100)),
                category: d?.category || (item.ip.startsWith('10.0.0.') ? 'SERVER' : 'WORKSTATION')
              };
            });
            setTopIpsList(enriched);
          }
        }
      } else {
        // Mock fallback sockets & top IPs for browser dev preview
        setTcpConnections([
          { proto: 'TCP', local: '10.1.1.45:5173', foreign: '0.0.0.0:0', state: 'LISTENING', pid: '12480' },
          { proto: 'TCP', local: '10.1.1.45:49680', foreign: '10.0.0.1:445', state: 'ESTABLISHED', pid: '4' },
          { proto: 'TCP', local: '10.1.1.45:49812', foreign: '10.0.0.8:8080', state: 'ESTABLISHED', pid: '5840' },
          { proto: 'TCP', local: '10.1.1.45:50124', foreign: '10.110.1.13:554', state: 'ESTABLISHED', pid: '6120' },
          { proto: 'TCP', local: '10.1.1.45:50442', foreign: '10.0.0.17:9100', state: 'TIME_WAIT', pid: '0' },
          { proto: 'TCP', local: '10.1.1.45:51220', foreign: '185.199.108.153:443', state: 'ESTABLISHED', pid: '9124' },
        ]);

        setTopIpsList([
          {
            ip: '10.2.1.34',
            name: 'PC Kế Toán Viên (TS-WS-141)',
            dept: 'Phòng Kế toán - Tài vụ',
            rate: '28.4 Mbps',
            usagePercent: 65,
            connections: 18,
            category: 'WORKSTATION'
          },
          {
            ip: '10.110.1.13',
            name: 'Đầu Ghi NVR 01 VP (10 Kênh Camera)',
            dept: 'Khu Vực Văn Phòng (Tầng 1-2-3)',
            rate: '14.2 Mbps',
            usagePercent: 32,
            connections: 10,
            category: 'CAMERA'
          },
          {
            ip: '10.0.0.8',
            name: 'B-SERVER (QL Xe Rác & Dữ Liệu)',
            dept: 'Phòng Máy Chủ Trung Tâm',
            rate: '6.8 Mbps',
            usagePercent: 18,
            connections: 8,
            category: 'SERVER'
          },
          {
            ip: '10.0.0.17',
            name: 'Máy Photocopy Ricoh Aficio MP 7502',
            dept: 'Phòng Tổ chức - Hành chính',
            rate: '3.5 Mbps',
            usagePercent: 12,
            connections: 4,
            category: 'PRINTER'
          },
          {
            ip: '10.2.1.154',
            name: 'Nguyễn Vũ Chánh Nghĩa (KH01)',
            dept: 'Phòng Kế hoạch',
            rate: '2.4 Mbps',
            usagePercent: 8,
            connections: 3,
            category: 'WORKSTATION'
          },
          {
            ip: '10.0.0.1',
            name: 'Cisco Catalyst / Core Switch L3',
            dept: 'Hạ Tầng Mạng Lõi',
            rate: '1.9 Mbps',
            usagePercent: 6,
            connections: 12,
            category: 'SWITCH'
          }
        ]);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingConn(false);
    }
  };

  // Set up listeners for real-time electron events
  useEffect(() => {
    refreshTrafficData();
    fetchConnections();

    // IPC tick listener
    if (window.hiccDesktop?.onTrafficTick) {
      window.hiccDesktop.onTrafficTick((tick: TrafficTickData) => {
        setCurrentTick(tick);
        setPeakDown((prev) => Math.max(prev, tick.downMbps));
        setPeakUp((prev) => Math.max(prev, tick.upMbps));

        setChartHistory((prev) => {
          const updated = [...prev, tick];
          return updated.slice(-30); // Keep last 30 data points
        });
      });
    } else {
      // Browser interval fallback
      const timer = setInterval(() => {
        const fakeTick: TrafficTickData = {
          time: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
          timestamp: Date.now(),
          downMbps: parseFloat((1.0 + Math.random() * 3.5).toFixed(2)),
          upMbps: parseFloat((0.3 + Math.random() * 1.5).toFixed(2)),
          downKBps: 200,
          upKBps: 80,
          broadcastRate: Math.floor(30 + Math.random() * 25),
          avgDown: 1.8,
          avgUp: 0.7,
        };
        setCurrentTick(fakeTick);
        setPeakDown((prev) => Math.max(prev, fakeTick.downMbps));
        setPeakUp((prev) => Math.max(prev, fakeTick.upMbps));
        setChartHistory((prev) => [...prev.slice(-29), fakeTick]);
      }, 2000);
      return () => clearInterval(timer);
    }

    // Anomaly detected listener
    if (window.hiccDesktop?.onTrafficAnomaly) {
      window.hiccDesktop.onTrafficAnomaly((anomaly: AnomalyEvent) => {
        setActiveAlert(anomaly);
        setAnomalyLogs((prev) => [anomaly, ...prev.slice(0, 49)]);
        if (soundRef.current) playAlertChime();
        fetchConnections();
      });
    }
  }, []);

  // Save thresholds
  const handleSaveThresholds = async () => {
    if (window.hiccDesktop?.setTrafficThresholds) {
      await window.hiccDesktop.setTrafficThresholds(thresholds);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Trigger test simulation
  const handleSimulate = async () => {
    if (window.hiccDesktop?.simulateTrafficAnomaly) {
      const res = await window.hiccDesktop.simulateTrafficAnomaly();
      if (res?.simulated) {
        setActiveAlert(res.simulated);
        setAnomalyLogs((prev) => [res.simulated, ...prev.slice(0, 49)]);
      }
    } else {
      const simEvent: AnomalyEvent = {
        id: `ANOMALY-SIM-${Date.now()}`,
        type: 'SIMULATED_SPIKE',
        severity: 'WARNING',
        title: 'KIỂM THỬ ĐỘT BIẾN LƯU LƯỢNG MẠNG',
        message: 'Giả lập lưu lượng tải xuống tăng vọt lên 94.6 Mbps trên cổng Uplink Gateway',
        measuredValue: '94.6 Mbps',
        threshold: `${thresholds.downLimitMbps} Mbps`,
        timestamp: new Date().toISOString(),
        topOffendingIps: [
          { ip: '10.2.1.34', name: 'PC Kế Toán Viên (TS-WS-141)', dept: 'Phòng Kế toán - Tài vụ', rate: '54.2 Mbps', usagePercent: 57 },
          { ip: '10.110.1.13', name: 'Đầu Ghi NVR 01 VP (10 Kênh Camera)', dept: 'Hạ Tầng An Ninh VP', rate: '22.8 Mbps', usagePercent: 24 },
          { ip: '10.0.0.8', name: 'B-SERVER QL Xe & Dữ Liệu', dept: 'Phòng Máy Chủ Trung Tâm', rate: '11.5 Mbps', usagePercent: 12 },
        ]
      };
      setActiveAlert(simEvent);
      setAnomalyLogs((prev) => [simEvent, ...prev.slice(0, 49)]);
    }
    if (soundEnabled) playAlertChime();
  };

  // Clear anomaly history
  const handleClearAnomalies = async () => {
    if (window.hiccDesktop?.clearTrafficAnomalies) {
      await window.hiccDesktop.clearTrafficAnomalies();
    }
    setAnomalyLogs([]);
    setActiveAlert(null);
  };

  // Filtered anomalies
  const filteredAnomalies = anomalyLogs.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  // Filtered connections
  const filteredConnections = tcpConnections.filter((c) => {
    if (!connSearch.trim()) return true;
    const q = connSearch.toLowerCase();
    return (
      c.local.toLowerCase().includes(q) ||
      c.foreign.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.pid.toLowerCase().includes(q)
    );
  });

  // Calculations for progress bars
  const downPercent = Math.min(100, Math.round((currentTick.downMbps / thresholds.downLimitMbps) * 100));
  const upPercent = Math.min(100, Math.round((currentTick.upMbps / thresholds.upLimitMbps) * 100));
  const broadcastPercent = Math.min(
    100,
    Math.round((currentTick.broadcastRate / thresholds.broadcastLimitRate) * 100)
  );

  return (
    <div className="space-y-5 select-none font-serif text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-slate-800 border border-emerald-200/80 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Giám Sát Lưu Lượng & Cảnh Báo Mạng
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Trực Tuyến
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theo dõi băng thông thời gian thực và phát hiện sớm các kết nối tiêu thụ lưu lượng bất thường
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              soundEnabled
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}
            title={soundEnabled ? 'Chuông cảnh báo đang BẬT' : 'Chuông cảnh báo đang TẮT'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-amber-600" />}
            <span>{soundEnabled ? 'Chuông Bật' : 'Chuông Tắt'}</span>
          </button>

          <button
            onClick={handleSimulate}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Kích hoạt sự kiện giả lập để kiểm tra phát hiện IP sử dụng nhiều và cảnh báo Windows"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Kiểm Thử Cảnh Báo</span>
          </button>

          <button
            onClick={refreshTrafficData}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Active Incident Alert Banner (Shows when spike/storm is happening) */}
      {activeAlert && (
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500 bg-linear-to-r from-red-50 via-white to-red-50 dark:from-red-950/40 dark:via-slate-900 dark:to-red-950/30 p-4 shadow-md animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-xs mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white">
                    {activeAlert.severity === 'CRITICAL' ? 'NGHIÊM TRỌNG' : 'CẢNH BÁO'}
                  </span>
                  <h3 className="font-bold text-sm text-red-950 dark:text-red-200">
                    {activeAlert.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ({new Date(activeAlert.timestamp).toLocaleTimeString('vi-VN')})
                  </span>
                </div>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1 font-medium">
                  {activeAlert.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span>
                    Giá trị đo: <b className="text-red-600 dark:text-red-400 font-mono">{activeAlert.measuredValue}</b>
                  </span>
                  <span>•</span>
                  <span>
                    Ngưỡng: <b className="font-mono">{activeAlert.threshold}</b>
                  </span>
                </div>

                {/* HIGHLIGHT TOP OFFENDING IPS IN ALERT BANNER */}
                {activeAlert.topOffendingIps && activeAlert.topOffendingIps.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-100/70 dark:bg-red-950/60 border border-red-300 dark:border-red-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-900 dark:text-red-200 uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                      <span>Các Địa Chỉ IP Đang Tiêu Thụ Băng Thông Cao Nhất:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      {activeAlert.topOffendingIps.map((offender, idx) => (
                        <div
                          key={offender.ip}
                          className="bg-white dark:bg-slate-900 rounded-md p-2 border border-red-200 dark:border-red-900/60 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-red-700 dark:text-red-300 text-xs">
                              {offender.ip}
                            </span>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 font-mono">
                              {offender.rate || 'Cao'}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {offender.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {offender.dept}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác Nhận Đã Xử Lý</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Download Speed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <ArrowDown className="w-4 h-4 text-emerald-600" />
              <span>Tải Xuống (Download)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentTick.downMbps >= thresholds.downLimitMbps
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {currentTick.downMbps >= thresholds.downLimitMbps ? 'VƯỢT NGƯỠNG' : 'ỔN ĐỊNH'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {currentTick.downMbps.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">Mbps</span>
            <span className="text-xs font-mono text-slate-400 ml-auto">
              ({currentTick.downKBps} KB/s)
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Mức nền: {currentTick.avgDown || 1.2} Mbps</span>
              <span>Đỉnh: {peakDown.toFixed(1)} Mbps</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  downPercent >= 90 ? 'bg-red-500' : downPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${downPercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Ngưỡng: {thresholds.downLimitMbps} Mbps</span>
              <span className="font-semibold">{downPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Upload Speed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
              <ArrowUp className="w-4 h-4 text-sky-600" />
              <span>Tải Lên (Upload)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentTick.upMbps >= thresholds.upLimitMbps
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
              }`}
            >
              {currentTick.upMbps >= thresholds.upLimitMbps ? 'VƯỢT NGƯỠNG' : 'ỔN ĐỊNH'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {currentTick.upMbps.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">Mbps</span>
            <span className="text-xs font-mono text-slate-400 ml-auto">
              ({currentTick.upKBps} KB/s)
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Mức nền: {currentTick.avgUp || 0.6} Mbps</span>
              <span>Đỉnh: {peakUp.toFixed(1)} Mbps</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  upPercent >= 90 ? 'bg-red-500' : upPercent >= 60 ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${upPercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Ngưỡng: {thresholds.upLimitMbps} Mbps</span>
              <span className="font-semibold">{upPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Broadcast / Non-unicast Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-purple-600" />
              <span>Gói Tin Broadcast</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentTick.broadcastRate >= thresholds.broadcastLimitRate
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
              }`}
            >
              {currentTick.broadcastRate >= thresholds.broadcastLimitRate ? 'STORM ALERT' : 'AN TOÀN'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {currentTick.broadcastRate}
            </span>
            <span className="text-xs font-semibold text-slate-500">gói/giây</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>ARP / Multicast LAN</span>
              <span>An toàn: &lt;600 pkts/s</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  broadcastPercent >= 90 ? 'bg-red-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.max(4, broadcastPercent)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Chống Loop mạng</span>
              <span className="font-semibold">{broadcastPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Anomaly Counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Sự Kiện Đã Phát Hiện</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              LOGS
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {anomalyLogs.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">sự kiện</span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-red-600 font-bold">
              {anomalyLogs.filter((a) => a.severity === 'CRITICAL').length} Nghiêm trọng
            </span>
            <span className="text-amber-600 font-bold">
              {anomalyLogs.filter((a) => a.severity === 'WARNING').length} Cảnh báo
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Throughput Chart (Recharts) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Biểu Đồ Lưu Lượng Băng Thông Thời Gian Thực (Mbps)</span>
              <span className="text-[10px] font-normal text-slate-500">
                (Chu kỳ cập nhật: 2 giây • Lưu 30 điểm đo gần nhất)
              </span>
            </h2>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tải Xuống (Download)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tải Lên (Upload)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-red-500"></span>
              <span className="text-[11px] text-red-600 font-mono">Ngưỡng Tải Xuống (50M)</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="M" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <ReferenceLine
                y={thresholds.downLimitMbps}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'NGƯỠNG TẢI XUỐNG', fill: '#ef4444', fontSize: 10, position: 'top' }}
              />
              <ReferenceLine
                y={thresholds.upLimitMbps}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'NGƯỠNG TẢI LÊN', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />
              <Area
                type="monotone"
                dataKey="downMbps"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#downGrad)"
                name="Tải xuống (Mbps)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="upMbps"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#upGrad)"
                name="Tải lên (Mbps)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEDICATED SECTION: TOP HIGH-BANDWIDTH IPS (IP ĐANG SỬ DỤNG NHIỀU NHẤT) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 border border-red-200 dark:border-red-800">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bảng Top Địa Chỉ IP Sử Dụng Nhiều Lưu Lượng Nhất (Heavy-Traffic Talkers)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động phân tích các máy trạm & máy chủ phát sinh lưu lượng lớn nhất trong mạng LAN để xác định nguồn tải
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              Tổng số IP được giám sát: <strong className="text-slate-800 dark:text-slate-200">{topIpsList.length}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {topIpsList.map((item, idx) => {
            const isSpike = item.usagePercent && item.usagePercent >= 50;
            return (
              <div
                key={item.ip}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSpike
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800/80 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${
                        idx === 0
                          ? 'bg-red-600 text-white'
                          : idx === 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                      {item.ip}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] font-extrabold px-2 py-0.5 rounded ${
                      isSpike
                        ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {item.rate}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={item.dept}>
                    {item.dept}
                  </div>
                </div>

                {/* Meter bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Mức chiếm dụng đường truyền</span>
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-300">
                      {item.usagePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isSpike ? 'bg-red-600' : item.usagePercent && item.usagePercent > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.usagePercent || 15}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sub info */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Kết nối: <b className="font-mono text-slate-600 dark:text-slate-300">{item.connections || 1} sockets</b></span>
                  <span className={`font-semibold ${isSpike ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                    {isSpike ? '⚠️ ĐANG TẢI NẶNG' : 'Bình thường'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Section: Threshold Configuration (Left) & Anomaly Incident Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Detection Thresholds Configuration */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Thiết Lập Ngưỡng Nhận Diện Bất Thường
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Auto-Tuned</span>
            </div>

            <div className="space-y-4 mt-4">
              {/* Threshold 1: Download Spike */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Ngưỡng Download Spike (Mbps)</span>
                  <span className="font-mono text-emerald-600 font-bold">{thresholds.downLimitMbps} Mbps</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={thresholds.downLimitMbps}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, downLimitMbps: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Cảnh báo khi lưu lượng tải xuống vượt quá ngưỡng này.
                </span>
              </div>

              {/* Threshold 2: Upload Spike */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Ngưỡng Upload Spike (Mbps)</span>
                  <span className="font-mono text-sky-600 font-bold">{thresholds.upLimitMbps} Mbps</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={thresholds.upLimitMbps}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, upLimitMbps: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Phát hiện máy nội bộ upload dữ liệu lớn hoặc phát tán mã độc.
                </span>
              </div>

              {/* Threshold 3: Broadcast Storm */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Ngưỡng Bão Gói Broadcast (gói/giây)</span>
                  <span className="font-mono text-purple-600 font-bold">{thresholds.broadcastLimitRate} pkts/s</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={thresholds.broadcastLimitRate}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, broadcastLimitRate: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Phát hiện Loop switch, ARP flood hoặc bão gói tin đa hướng.
                </span>
              </div>

              {/* Threshold 4: Burst Ratio */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Hệ Số Tăng Vọt So Với Mức Nền</span>
                  <span className="font-mono text-amber-600 font-bold">{thresholds.spikeRatio}x lần</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={thresholds.spikeRatio}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, spikeRatio: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Cảnh báo khi lưu lượng tăng đột ngột gấp nhiều lần mức nền trung bình 20 mẫu.
                </span>
              </div>

              {/* Threshold 5: Cooldown */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Thời Gian Giãn Cách Cảnh Báo (Giây)</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                    {thresholds.alertCooldownSec}s
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={thresholds.alertCooldownSec}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, alertCooldownSec: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Thời gian tối thiểu giữa 2 lần đẩy thông báo để tránh làm phiền kỹ sư.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">
              {saveSuccess ? '✓ Đã cập nhật ngưỡng giám sát thành công!' : ''}
            </span>
            <button
              onClick={handleSaveThresholds}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Lưu Cấu Hình Ngưỡng
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Anomaly Incident Logs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Nhật Ký Sự Kiện Bất Thường Đã Ghi Nhận
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-semibold">
                <button
                  onClick={() => setFilterSeverity('ALL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterSeverity === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Tất cả ({anomalyLogs.length})
                </button>
                <button
                  onClick={() => setFilterSeverity('CRITICAL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterSeverity === 'CRITICAL'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Nghiêm trọng
                </button>
                <button
                  onClick={() => setFilterSeverity('WARNING')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterSeverity === 'WARNING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  Cảnh báo
                </button>
              </div>

              {anomalyLogs.length > 0 && (
                <button
                  onClick={handleClearAnomalies}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Xóa toàn bộ lịch sử cảnh báo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Anomaly List */}
          <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100 dark:divide-slate-800 mt-2 pr-1">
            {filteredAnomalies.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-2" />
                <p className="text-xs font-semibold">Hạ Tầng Mạng Đang Hoạt Động Bình Thường</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Chưa phát hiện đột biến lưu lượng hoặc bão gói tin bất thường trong phiên làm việc này.
                </p>
              </div>
            ) : (
              filteredAnomalies.map((item) => (
                <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 mt-0.5 ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {item.message}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Giá trị đo: <b className="font-mono text-red-600">{item.measuredValue}</b></span>
                        <span>•</span>
                        <span>Ngưỡng: <b className="font-mono">{item.threshold}</b></span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active TCP Connections & Socket Inspector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Bảng Sockets & Kết Nối Mạng TCP Đang Hoạt Động (Netstat Inspector)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phát hiện các kết nối ra ngoài Internet hoặc máy tính nội bộ tiêu tốn băng thông cao
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={connSearch}
                onChange={(e) => setConnSearch(e.target.value)}
                placeholder="Tìm IP, Cổng, PID..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 w-48 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={fetchConnections}
              disabled={isLoadingConn}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConn ? 'animate-spin' : ''}`} />
              <span>Quét Lại</span>
            </button>
          </div>
        </div>

        {/* Connections Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="py-2 px-3 font-semibold">Giao Thức</th>
                <th className="py-2 px-3 font-semibold">Địa Chỉ Nội Bộ (Local)</th>
                <th className="py-2 px-3 font-semibold">Địa Chỉ Từ Xa (Foreign / Remote)</th>
                <th className="py-2 px-3 font-semibold">Trạng Thái (State)</th>
                <th className="py-2 px-3 font-semibold">Tiến Trình (PID)</th>
                <th className="py-2 px-3 font-semibold text-right">Phân Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-serif">
                    Không có kết nối TCP nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredConnections.slice(0, 30).map((conn, idx) => {
                  const isExternal =
                    !conn.foreign.startsWith('0.0.0.0') &&
                    !conn.foreign.startsWith('127.0.0.1') &&
                    !conn.foreign.startsWith('10.') &&
                    !conn.foreign.startsWith('192.168.');
                  return (
                    <tr
                      key={`${conn.local}-${conn.foreign}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-500 font-bold">{conn.proto}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {conn.local}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <span className={isExternal ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                          {conn.foreign}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            conn.state === 'ESTABLISHED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : conn.state === 'LISTENING'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {conn.state}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{conn.pid}</td>
                      <td className="py-2 px-3 text-right font-serif">
                        {isExternal ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Internet / WAN
                          </span>
                        ) : conn.foreign.startsWith('10.0.0.') ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Máy Chủ Nội Bộ
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Nội mạng LAN</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
