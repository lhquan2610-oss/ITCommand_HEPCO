import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldCheck, Laptop, Building2, User, Network, Activity, CheckCircle2 } from 'lucide-react';
import { lookupIp, lookupMac } from '../../services/api';
import { getCachedInventorySync, loadInventoryFast } from '../../utils/inventoryCache';
import { StatusBadge } from '../../components/StatusBadge';

export const IpMacLookupPage: React.FC = () => {
  const [queryType, setQueryType] = useState<'IP' | 'MAC'>('IP');
  const [queryValue, setQueryValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>(() => getCachedInventorySync());

  useEffect(() => {
    loadInventoryFast().then((list) => {
      if (list.length > 0) setInventory(list);
    });
  }, []);

  // Instant matching from local inventory
  const instantMatches = useMemo(() => {
    const q = queryValue.trim().toLowerCase();
    if (!q) return inventory.slice(0, 12);
    return inventory.filter((d) => {
      if (queryType === 'IP') {
        return (
          (d.ip && d.ip.toLowerCase().includes(q)) ||
          (d.display_name && d.display_name.toLowerCase().includes(q)) ||
          (d.assigned_user && d.assigned_user.toLowerCase().includes(q))
        );
      }
      return (
        (d.mac && d.mac.toLowerCase().includes(q)) ||
        (d.display_name && d.display_name.toLowerCase().includes(q)) ||
        (d.assigned_user && d.assigned_user.toLowerCase().includes(q))
      );
    });
  }, [inventory, queryType, queryValue]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryValue.trim();
    if (!q) return;
    setLoading(true);
    setError(null);

    // Build local bindings from real inventory first so results always appear immediately
    const localHits = inventory.filter((d) =>
      queryType === 'IP'
        ? d.ip?.toLowerCase().includes(q.toLowerCase())
        : d.mac?.toLowerCase().includes(q.toLowerCase())
    );

    try {
      const res = queryType === 'IP' ? await lookupIp(q) : await lookupMac(q);
      if (res && Array.isArray(res.bindings) && res.bindings.length > 0) {
        setResult(res);
      } else if (localHits.length > 0) {
        setResult({
          ip_address: queryType === 'IP' ? q : undefined,
          mac_address: queryType === 'MAC' ? q : undefined,
          bindings: localHits.map((d) => ({
            display_name: d.assigned_user || d.display_name,
            hostname: d.display_name,
            ip_address: d.ip,
            mac_address: d.mac,
            mac_vendor: d.vendor || d.department,
            department: d.department,
            category: d.category,
            is_current: true,
            first_seen: d.last_seen || new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })),
        });
      } else {
        setError(`Không tìm thấy thiết bị nào khớp với ${queryType}: "${q}" trong hệ thống.`);
        setResult(null);
      }
    } catch {
      if (localHits.length > 0) {
        setResult({
          ip_address: queryType === 'IP' ? q : undefined,
          mac_address: queryType === 'MAC' ? q : undefined,
          bindings: localHits.map((d) => ({
            display_name: d.assigned_user || d.display_name,
            hostname: d.display_name,
            ip_address: d.ip,
            mac_address: d.mac,
            mac_vendor: d.vendor || d.department,
            department: d.department,
            category: d.category,
            is_current: true,
            first_seen: d.last_seen || new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })),
        });
      } else {
        setError(`Không tìm thấy thiết bị nào khớp với ${queryType}: "${q}" trong cơ sở dữ liệu mạng LAN.`);
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans pb-10">
      {/* Header & Search Form Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-slate-800 border border-emerald-200/80 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Tra Cứu Địa Chỉ IP & Định Danh Thiết Bị MAC
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tìm kiếm nhanh thiết bị, người sử dụng, phòng ban và lịch sử cấp phát theo địa chỉ IP hoặc MAC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{inventory.length} Thiết Bị Đã Định Danh</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setQueryType('IP');
                setResult(null);
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                queryType === 'IP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tìm Theo IP
            </button>
            <button
              type="button"
              onClick={() => {
                setQueryType('MAC');
                setResult(null);
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                queryType === 'MAC'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tìm Theo MAC
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                queryType === 'IP'
                  ? 'Nhập địa chỉ IP hoặc tên người dùng (VD: 10.1.1.45, 10.0.0.1, Lê Hồng Quân)...'
                  : 'Nhập địa chỉ MAC hoặc hãng sản xuất (VD: C0:25:A5:96:66:7A, 08:F1:EA)...'
              }
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-xs cursor-pointer shrink-0"
          >
            {loading ? 'Đang Tra Cứu...' : 'Tra Cứu Ngay'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
          {error}
        </div>
      )}

      {/* Detailed Lookup Result */}
      {result && result.bindings && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Kết Quả Tra Cứu Chi Tiết:{' '}
              <span className="font-mono text-emerald-700 dark:text-emerald-400">
                {result.ip_address || result.mac_address}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Tìm thấy {result.bindings.length} bản ghi
            </span>
          </div>

          <div className="space-y-2.5">
            {result.bindings.map((b: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {b.display_name || b.hostname || 'Thiết bị mạng nội bộ'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                      ĐANG CẤP PHÁT
                    </span>
                    {b.department && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                        {b.department}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-3 flex-wrap">
                    <span>
                      IP: <strong className="text-emerald-700 dark:text-emerald-400">{b.ip_address}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      MAC: <strong>{b.mac_address || 'N/A'}</strong>
                    </span>
                    {b.mac_vendor && <span className="text-slate-500">({b.mac_vendor})</span>}
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500">
                  <div>Cập nhật: {new Date(b.last_seen).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instant Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {queryValue.trim()
                ? `Danh Sách Khớp Nhanh (${instantMatches.length} thiết bị)`
                : 'Danh Bạ Định Danh IP & MAC Tiêu Biểu'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Gõ vào ô tìm kiếm để lọc tức thì</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13522C] text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022]">STT</th>
                <th className="py-2.5 px-3 border-r border-[#0F4022]">Tên Thiết Bị / Người Sử Dụng</th>
                <th className="py-2.5 px-3 border-r border-[#0F4022]">Phòng Ban / Đơn Vị</th>
                <th className="py-2.5 px-3 text-center border-r border-[#0F4022]">Địa Chỉ IP</th>
                <th className="py-2.5 px-3 text-center border-r border-[#0F4022]">Địa Chỉ MAC</th>
                <th className="py-2.5 px-3 text-center border-r border-[#0F4022]">Phân Loại</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {instantMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không có thiết bị nào khớp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                instantMatches.slice(0, 30).map((d, idx) => (
                  <tr key={d.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-100">
                      {d.assigned_user || d.display_name}
                      {d.assigned_user && d.display_name && d.assigned_user !== d.display_name && (
                        <div className="text-[11px] font-normal text-slate-500">{d.display_name}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                      {d.department || 'Mạng Nội Bộ HEPCO'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 border-r border-slate-100">
                      {d.ip}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-100">
                      {d.mac || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-semibold">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={d.status || 'ONLINE'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
