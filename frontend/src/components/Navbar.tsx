import React from 'react';
import { RefreshCw, User, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSecurity } from '../context/SecurityContext';
import { TrafficAnomalyManager } from './TrafficAnomalyManager';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing = false }) => {
  const { t } = useApp();
  const { policy, currentUserPermission, isAdmin } = useSecurity();

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 flex items-center justify-between shrink-0 shadow-xs z-10 transition-colors">
      {/* Left: Quick System Status & Realtime Traffic Anomaly Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
            {t('status_stable')}
          </span>
        </div>

        {/* IP Guard Active Indicator */}
        {policy.enabled && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              IP Guard: Đã Khóa Cho Phép ({policy.allowedIps.length} IP)
            </span>
          </div>
        )}

        {/* Real-time Traffic Anomaly Monitor Pill */}
        <TrafficAnomalyManager />
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 hover:border-emerald-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 transition shadow-xs disabled:opacity-50 cursor-pointer"
            title="Đồng bộ & làm mới dữ liệu"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('status_refresh')}</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
            <User className="w-3 h-3" />
          </div>
          <div className="text-left hidden sm:block leading-tight">
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
              {currentUserPermission.name}
            </div>
            <div className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              {isAdmin ? 'Quản Trị Viên (Full)' : `Quyền xem: ${currentUserPermission.allowedFeatures.length} mục`}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
