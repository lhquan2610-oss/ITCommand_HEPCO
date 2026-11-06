import React, { useEffect, useState } from 'react';
import { History, CheckCircle, XCircle, Clock, Server, Play } from 'lucide-react';
import { getScans } from '../../services/api';
import { ScanJobItem } from '../../types';

export const ScanHistoryPage: React.FC = () => {
  const [scans, setScans] = useState<ScanJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScans(1, 50).then((res) => {
      setScans(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-hepco-surface border border-hepco-border">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-hepco-cyan" /> Lịch Sử Các Phiên Quét Mạng (Scan Jobs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nhật ký kiểm toán toàn bộ các phiên quét tự động định kỳ và phiên quét thủ công từ CLI.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-hepco-surface border border-hepco-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hepco-border text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Thời Điểm</th>
                <th className="pb-3 px-3">Loại Phiên Quét</th>
                <th className="pb-3 px-3">Dải Mạng (CIDR)</th>
                <th className="pb-3 px-3">Nguồn Kích Hoạt</th>
                <th className="pb-3 px-3">Trạng Thái</th>
                <th className="pb-3 px-3">Tổng Quét / Online</th>
                <th className="pb-3 px-3">Mới / Cảnh Báo</th>
                <th className="pb-3 px-3">Thời Gian Chạy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hepco-border/50">
              {scans.map((s) => (
                <tr key={s.id} className="hover:bg-hepco-card/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {new Date(s.started_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-hepco-cyan border border-slate-700 font-mono text-[10px]">
                      {s.job_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-200">{s.target_cidr}</td>
                  <td className="py-3 px-3 text-slate-400">{s.trigger_source}</td>
                  <td className="py-3 px-3">
                    {s.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                        HOÀN TẤT
                      </span>
                    ) : s.status === 'RUNNING' ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold text-[10px] animate-pulse">
                        ĐANG CHẠY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                        THẤT BẠI
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {s.total_hosts_scanned} / <span className="text-hepco-green font-bold">{s.hosts_up}</span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="text-cyan-400">+{s.new_devices_found}</span> /{' '}
                    <span className="text-amber-400">{s.alerts_generated}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {s.duration_ms ? `${(s.duration_ms / 1000).toFixed(2)}s` : '-'}
                  </td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-mono">
                    Chưa có phiên quét nào được thực hiện.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
