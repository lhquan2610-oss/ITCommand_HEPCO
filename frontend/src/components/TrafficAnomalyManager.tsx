import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Radio,
  Sliders,
  CheckCircle,
  X,
  Sparkles,
  RefreshCw,
  Bell,
  Trash2,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';

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

export interface AnomalyEvent {
  id: string;
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  measuredValue: string;
  threshold: string;
  timestamp: string;
}

// Synthesize pleasant gentle alert chime using Web Audio API
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

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export const TrafficAnomalyManager: React.FC = () => {
  const navigate = useNavigate();
  const [trafficTick, setTrafficTick] = useState<TrafficTickData>({
    time: '',
    timestamp: Date.now(),
    downMbps: 0,
    upMbps: 0,
    downKBps: 0,
    upKBps: 0,
    broadcastRate: 0,
  });

  const [activeAnomalyToast, setActiveAnomalyToast] = useState<AnomalyEvent | null>(null);
  const [anomalyLogs, setAnomalyLogs] = useState<AnomalyEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Thresholds state
  const [thresholds, setThresholds] = useState({
    enabled: false,
    downLimitMbps: 50,
    upLimitMbps: 30,
    broadcastLimitRate: 600,
    alertCooldownSec: 15,
  });

  useEffect(() => {
    // Load initial status & anomalies if desktop electron
    if (window.hiccDesktop?.getTrafficCurrent) {
      window.hiccDesktop.getTrafficCurrent().then((res: any) => {
        if (res.success) {
          if (res.current) setTrafficTick(res.current);
          if (res.thresholds) setThresholds(res.thresholds);
          if (res.anomalies) setAnomalyLogs(res.anomalies);
        }
      }).catch(() => {});
    }

    // Listen to real-time traffic ticks
    if (window.hiccDesktop?.onTrafficTick) {
      window.hiccDesktop.onTrafficTick((data: TrafficTickData) => {
        setTrafficTick(data);
      });
    }

    // Listen to anomaly alert event
    if (window.hiccDesktop?.onTrafficAnomaly) {
      window.hiccDesktop.onTrafficAnomaly((event: AnomalyEvent) => {
        setActiveAnomalyToast(event);
        setAnomalyLogs((prev) => [event, ...prev.slice(0, 49)]);
        if (soundEnabled) playAlertChime();
        // Auto-dismiss floating toast after 10s
        setTimeout(() => {
          setActiveAnomalyToast((current) => (current?.id === event.id ? null : current));
        }, 10000);
      });
    }
  }, [soundEnabled]);

  const handleSimulateAlert = async () => {
    if (window.hiccDesktop?.simulateTrafficAnomaly) {
      const res = await window.hiccDesktop.simulateTrafficAnomaly();
      if (res.success && res.simulated) {
        setActiveAnomalyToast(res.simulated);
        setAnomalyLogs((prev) => [res.simulated, ...prev]);
        if (soundEnabled) playAlertChime();
      }
    } else {
      // Browser fallback
      const simulated: AnomalyEvent = {
        id: `ANOMALY-SIM-${Date.now()}`,
        type: 'SIMULATED_SPIKE',
        severity: 'WARNING',
        title: 'CẢNH BÁO ĐỘT BIẾN LƯU LƯỢNG (GIẢ LẬP)',
        message: 'Lưu lượng tải xuống tăng vọt lên 86.4 Mbps (Vượt ngưỡng 50 Mbps)',
        measuredValue: '86.4 Mbps',
        threshold: '50 Mbps',
        timestamp: new Date().toISOString(),
      };
      setActiveAnomalyToast(simulated);
      setAnomalyLogs((prev) => [simulated, ...prev]);
      if (soundEnabled) playAlertChime();
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.hiccDesktop?.setTrafficThresholds) {
      await window.hiccDesktop.setTrafficThresholds(thresholds);
      alert('Đã cập nhật ngưỡng giám sát lưu lượng bất thường thành công!');
    }
  };

  const handleClearLogs = async () => {
    if (window.hiccDesktop?.clearTrafficAnomalies) {
      await window.hiccDesktop.clearTrafficAnomalies();
    }
    setAnomalyLogs([]);
  };

  return (
    <>
      {/* 1. REALTIME TRAFFIC STATUS PILL IN TOP NAVBAR */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate('/traffic')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer select-none ${
            activeAnomalyToast || trafficTick.hasRecentAnomaly
              ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse font-bold'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
          }`}
          title="Bấm để mở Tab Giám Sát Lưu Lượng Mạng & Cấu Hình Ngưỡng Bất Thường"
        >
          {activeAnomalyToast || trafficTick.hasRecentAnomaly ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}

          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center text-emerald-700 dark:text-emerald-400 font-bold">
              <ArrowDown className="w-3 h-3" />
              {trafficTick.downMbps >= 1 ? `${trafficTick.downMbps}M` : `${trafficTick.downKBps}K`}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="flex items-center text-blue-700 dark:text-blue-400 font-bold">
              <ArrowUp className="w-3 h-3" />
              {trafficTick.upMbps >= 1 ? `${trafficTick.upMbps}M` : `${trafficTick.upKBps}K`}
            </span>
          </div>

          {anomalyLogs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600 text-white">
              {anomalyLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* 2. FLOATING PROMINENT ANOMALY ALERT TOAST BANNER */}
      {activeAnomalyToast && (
        <div className="fixed bottom-12 right-6 z-50 max-w-md w-full bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl p-4 shadow-2xl shadow-rose-600/30 animate-in slide-in-from-bottom duration-300 select-none">
          <div className="flex items-start justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-700 text-xs tracking-tight">
                  {activeAnomalyToast.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(activeAnomalyToast.timestamp).toLocaleTimeString('vi-VN')}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-200 font-medium mt-1 leading-snug">
                {activeAnomalyToast.message}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  Đo được: {activeAnomalyToast.measuredValue}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Ngưỡng: {activeAnomalyToast.threshold}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    navigate('/traffic');
                    setActiveAnomalyToast(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition cursor-pointer"
                >
                  Mở Tab Giám Sát Chi Tiết
                </button>
                <button
                  onClick={() => setActiveAnomalyToast(null)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition cursor-pointer"
                >
                  Đã Tiếp Nhận
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveAnomalyToast(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. FULL TRAFFIC ANOMALY INSPECTOR & CONFIG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Giám Sát Lưu Lượng Mạng & Cảnh Báo Bất Thường
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Phát hiện đột biến băng thông (Bandwidth Spike) & Bão gói tin Broadcast
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Real-time Current Gauges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-emerald-600" /> Tốc Độ Tải Xuống (Download)
                  </div>
                  <div className="text-xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                    {trafficTick.downMbps} <span className="text-xs font-normal">Mbps</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {trafficTick.downKBps} KB/s
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-blue-600" /> Tốc Độ Tải Lên (Upload)
                  </div>
                  <div className="text-xl font-mono font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                    {trafficTick.upMbps} <span className="text-xs font-normal">Mbps</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {trafficTick.upKBps} KB/s
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1">
                    <Radio className="w-3 h-3 text-purple-600" /> Gói Broadcast / Multicast
                  </div>
                  <div className="text-xl font-mono font-extrabold text-purple-700 dark:text-purple-400 mt-1">
                    {trafficTick.broadcastRate} <span className="text-xs font-normal">pkts/s</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ARP & Discovery rate
                  </div>
                </div>
              </div>

              {/* Thresholds Config Form */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cấu Hình Ngưỡng Kích Hoạt Cảnh Báo Lưu Lượng Bất Thường</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...thresholds, enabled: !thresholds.enabled };
                        setThresholds(updated);
                        if (window.hiccDesktop?.setTrafficThresholds) {
                          window.hiccDesktop.setTrafficThresholds(updated);
                        }
                      }}
                      className={`p-1.5 rounded-md border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        thresholds.enabled
                          ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                      title="Bật/Tắt hoàn toàn cảnh báo lưu lượng vượt ngưỡng"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{thresholds.enabled ? 'Cảnh Báo: ĐANG BẬT' : 'Cảnh Báo: ĐÃ TẮT'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1 rounded-md border text-[10px] flex items-center gap-1 transition cursor-pointer ${
                        soundEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-500'
                      }`}
                      title="Bật/Tắt âm thanh chuông cảnh báo"
                    >
                      {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      <span>{soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulateAlert}
                      className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                      title="Kiểm thử ngay thông báo lưu lượng bất thường"
                    >
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>Test Cảnh Báo</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveThresholds} className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                      Ngưỡng Tải Xuống (Mbps)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1000}
                      value={thresholds.downLimitMbps}
                      onChange={(e) => setThresholds({ ...thresholds, downLimitMbps: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                      Ngưỡng Tải Lên (Mbps)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1000}
                      value={thresholds.upLimitMbps}
                      onChange={(e) => setThresholds({ ...thresholds, upLimitMbps: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                      Ngưỡng Broadcast (pkts/s)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={5000}
                      value={thresholds.broadcastLimitRate}
                      onChange={(e) => setThresholds({ ...thresholds, broadcastLimitRate: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                    >
                      Lưu Ngưỡng
                    </button>
                  </div>
                </form>
              </div>

              {/* Anomaly Event Log Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Nhật Ký Cảnh Báo Lưu Lượng Bất Thường ({anomalyLogs.length})</span>
                  </h4>
                  {anomalyLogs.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa Lịch Sử</span>
                    </button>
                  )}
                </div>

                {anomalyLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                      Lưu lượng mạng hoạt động ổn định
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chưa ghi nhận đợt bão gói tin hay đột biến băng thông nào vượt ngưỡng.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Thời Gian</th>
                          <th className="py-2 px-3">Sự Kiện Đột Biến</th>
                          <th className="py-2 px-3 text-right">Giá Trị Đo</th>
                          <th className="py-2 px-3">Ngưỡng</th>
                          <th className="py-2 px-3 text-center">Mức Độ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {anomalyLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                {log.title}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.message}</div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 text-[11px]">
                              {log.measuredValue}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">{log.threshold}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  log.severity === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {log.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
