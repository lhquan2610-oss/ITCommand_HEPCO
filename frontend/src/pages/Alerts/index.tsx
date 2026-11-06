import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, Check, MessageSquare } from 'lucide-react';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../../services/api';
import { AlertItem } from '../../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | ''>('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const loadAlerts = async () => {
    try {
      const res = await getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const handleAck = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      loadAlerts();
    } catch (err: any) {
      alert('Lỗi tiếp nhận: ' + err.message);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !resolveNote.trim()) return;
    try {
      await resolveAlert(selectedAlert.id, resolveNote.trim());
      setSelectedAlert(null);
      setResolveNote('');
      loadAlerts();
    } catch (err: any) {
      alert('Lỗi xử lý: ' + err.message);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-hepco-surface border border-hepco-border">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Quản Lý & Tiếp Nhận Cảnh Báo An Ninh / Hạ Tầng
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cơ chế chống trùng lặp Deduplication: Các sự cố lặp lại chỉ tăng occurrence_count, không sinh cảnh báo rác.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-xs text-slate-300 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Đang Mở (OPEN)</option>
            <option value="ACKNOWLEDGED">Đã Tiếp Nhận</option>
            <option value="RESOLVED">Đã Xử Lý Xong</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-xs text-slate-300 focus:outline-none"
          >
            <option value="">Tất cả mức độ</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-hepco-surface border border-hepco-border space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors ${
              a.status === 'RESOLVED'
                ? 'bg-hepco-card/40 border-hepco-border/40 opacity-70'
                : 'bg-hepco-card border-hepco-border'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                {getSeverityBadge(a.severity)}
                <span className="font-bold text-white text-sm">{a.title}</span>
                {a.occurrence_count > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                    Lặp lại {a.occurrence_count} lần
                  </span>
                )}
              </div>
              <p className="text-slate-300 font-medium leading-relaxed">{a.description}</p>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-4">
                <span>Phát hiện: {new Date(a.detected_at).toLocaleString('vi-VN')}</span>
                <span>Lần cuối: {new Date(a.last_occurred_at).toLocaleString('vi-VN')}</span>
                {a.resolution_note && <span className="text-emerald-400">Ghi chú: {a.resolution_note}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {a.status === 'OPEN' && (
                <button
                  onClick={() => handleAck(a.id)}
                  className="px-3 py-1.5 rounded-lg bg-hepco-card hover:bg-hepco-hover border border-hepco-border text-hepco-cyan font-bold"
                >
                  Tiếp Nhận
                </button>
              )}
              {a.status !== 'RESOLVED' && (
                <button
                  onClick={() => { setSelectedAlert(a); setResolveNote(''); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Đóng Sự Cố
                </button>
              )}
              {a.status === 'RESOLVED' && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" /> Đã Khắc Phục
                </span>
              )}
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-500 font-mono">
            Hạ tầng an toàn, không có cảnh báo nào trong danh mục này.
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-hepco-surface border border-hepco-border rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Đóng Sự Cố Cảnh Báo</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedAlert.title}</p>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Biện Pháp Đã Xử Lý / Khắc Phục <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Đã cắm lại dây mạng Switch, cấu hình gán IP tĩnh chuẩn trên router..."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-hepco-card border border-hepco-border text-xs text-white focus:outline-none focus:border-hepco-green"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl bg-hepco-card text-xs text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                >
                  Xác Nhận Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
