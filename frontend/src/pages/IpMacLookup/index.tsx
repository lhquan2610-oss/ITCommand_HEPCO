import React, { useState } from 'react';
import { Search, History, ArrowRight, ShieldCheck, Laptop } from 'lucide-react';
import { lookupIp, lookupMac } from '../../services/api';

export const IpMacLookupPage: React.FC = () => {
  const [queryType, setQueryType] = useState<'IP' | 'MAC'>('IP');
  const [queryValue, setQueryValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = queryType === 'IP'
        ? await lookupIp(queryValue.trim())
        : await lookupMac(queryValue.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tìm thấy dữ liệu hoặc xảy ra lỗi.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-hepco-surface border border-hepco-border">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-hepco-cyan" /> Tra Cứu Lịch Sử Cấp Phát IP & Địa Chỉ MAC
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Truy vết vòng đời: Một IP trong quá khứ từng thuộc về những máy nào, hoặc một máy (MAC) từng nhận những IP nào qua DHCP.
        </p>

        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-xl bg-hepco-card border border-hepco-border p-1">
            <button
              type="button"
              onClick={() => { setQueryType('IP'); setResult(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                queryType === 'IP' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tra Cứu Theo IP
            </button>
            <button
              type="button"
              onClick={() => { setQueryType('MAC'); setResult(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                queryType === 'MAC' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tra Cứu Theo MAC
            </button>
          </div>

          <input
            type="text"
            placeholder={queryType === 'IP' ? 'Nhập địa chỉ IPv4 (VD: 192.168.10.45)...' : 'Nhập địa chỉ MAC (VD: F8:B1:56:AA:BB:CC)...'}
            value={queryValue}
            onChange={(e) => setQueryValue(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-hepco-card border border-hepco-border text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-hepco-green"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Đang Tra Cứu...' : 'Tra Cứu Lịch Sử'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
          {error}
        </div>
      )}

      {result && result.bindings && (
        <div className="p-5 rounded-2xl bg-hepco-surface border border-hepco-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hepco-border">
            <div className="text-xs font-bold text-slate-300">
              Kết Quả Tra Cứu: <span className="font-mono text-hepco-cyan">{result.ip_address || result.mac_address}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{result.bindings.length} mốc liên kết lịch sử</span>
          </div>

          <div className="space-y-3">
            {result.bindings.map((b: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  b.is_current
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'bg-hepco-card/50 border-hepco-border/50 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{b.display_name || b.hostname || 'Chưa đặt tên'}</span>
                    {b.is_current ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">HIỆN TẠI</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">LỊCH SỬ</span>
                    )}
                  </div>
                  <div className="font-mono text-slate-400 mt-1">
                    {queryType === 'IP' ? `MAC: ${b.mac_address || 'N/A'}` : `IP: ${b.ip_address}`}
                    {b.mac_vendor && <span className="text-slate-500 ml-2">({b.mac_vendor})</span>}
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400">
                  <div>Thấy lần đầu: {new Date(b.first_seen).toLocaleString('vi-VN')}</div>
                  <div>Thấy lần cuối: {new Date(b.last_seen).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
