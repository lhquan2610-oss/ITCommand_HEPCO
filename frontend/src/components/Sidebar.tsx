import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Monitor,
  Printer,
  Network,
  Video,
  CreditCard,
  FileText,
  Search,
  Share2,
  Truck,
  Settings,
  ShieldAlert,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { HEPCO_LOGO } from '../assets/logoBase64';
import { useApp } from '../context/AppContext';
import { useSecurity } from '../context/SecurityContext';
import { FeatureKey } from '../types/electron';

export const Sidebar: React.FC = () => {
  const { t } = useApp();
  const { canAccessFeature, currentUserPermission, isAdmin, simulatedUserIp, setSimulatedUserIp } = useSecurity();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/', featureKey: 'dashboard' as FeatureKey, labelKey: 'nav_dashboard', defaultLabel: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { path: '/traffic', featureKey: 'traffic' as FeatureKey, labelKey: 'nav_traffic', defaultLabel: 'Giám Sát Lưu Lượng', icon: Activity },
    { path: '/computers', featureKey: 'computers' as FeatureKey, labelKey: 'nav_computers', defaultLabel: 'Máy Tính & Máy Chủ', icon: Monitor },
    { path: '/printers', featureKey: 'printers' as FeatureKey, labelKey: 'nav_printers', defaultLabel: 'Máy In & Photocopy', icon: Printer },
    { path: '/cameras', featureKey: 'cameras' as FeatureKey, labelKey: 'nav_cameras', defaultLabel: 'Camera IP & NVR', icon: Video },
    { path: '/pos', featureKey: 'pos' as FeatureKey, labelKey: 'nav_pos', defaultLabel: 'Máy POS Thu Phí', icon: CreditCard },
    { path: '/dispatches', featureKey: 'dispatches' as FeatureKey, labelKey: 'nav_dispatches', defaultLabel: 'Quản Lý Công Văn', icon: FileText },
    { path: '/switches', featureKey: 'switches' as FeatureKey, labelKey: 'nav_switches', defaultLabel: 'Switch & Mạng Lõi', icon: Network },
    { path: '/lookup', featureKey: 'lookup' as FeatureKey, labelKey: 'nav_lookup', defaultLabel: 'Tra Cứu IP & MAC', icon: Search },
    { path: '/network-map', featureKey: 'network-map' as FeatureKey, labelKey: 'nav_network_map', defaultLabel: 'Sơ Đồ Mạng (Map)', icon: Share2 },
    { path: '/tracking', featureKey: 'tracking' as FeatureKey, labelKey: 'nav_tracking', defaultLabel: 'Giám Sát Xe Rác (GPS)', icon: Truck },
    { path: '/settings', featureKey: 'settings' as FeatureKey, labelKey: 'nav_settings', defaultLabel: 'Cài Đặt Hệ Thống', icon: Settings },
  ];

  const visibleNavItems = navItems.filter((item) => canAccessFeature(item.featureKey));

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-56'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)] z-20 transition-all duration-200`}>
      {/* Brand Header */}
      <div className={`h-14 ${isCollapsed ? 'px-2 justify-center' : 'px-3.5 justify-between'} flex items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 max-w-[36px] max-h-[36px] p-0.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/25 dark:border-emerald-500/40 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={HEPCO_LOGO}
              alt="HEPCO Logo"
              className="w-8 h-8 max-w-[32px] max-h-[32px] object-contain rounded-lg sharp-logo"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-[13px] tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                HEPCO <span className="text-emerald-600 dark:text-emerald-400 font-black">COMMAND</span>
              </div>
              <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">
                IT Operations Center
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Simulation Banner (if Admin is testing another user's view) */}
      {simulatedUserIp && !isCollapsed && (
        <div className="mx-2 mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-[10px] text-amber-900 dark:text-amber-200">
          <div className="font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Mô Phỏng IP</span>
            </span>
            <button
              onClick={() => setSimulatedUserIp(null)}
              className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white font-bold cursor-pointer"
            >
              Hủy
            </button>
          </div>
          <div className="font-semibold truncate mt-0.5" title={currentUserPermission.name}>
            {currentUserPermission.name}
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {!isCollapsed && (
          <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>{t('nav_section_mgmt')}</span>
          </div>
        )}

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey, item.defaultLabel);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'} py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border-l-3 border-emerald-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-3 border-transparent'
                }`
              }
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* User Identity & Role Footer Info */}
      <div className={`p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 ${isCollapsed ? 'flex flex-col items-center' : 'space-y-1.5'}`}>
        {!isCollapsed ? (
          <>
            <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[110px]" title={currentUserPermission.name}>
                  {currentUserPermission.name}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    isAdmin
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Phân Quyền'}
                </span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                IP: {currentUserPermission.ip}
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-[10px]">Hạ Tầng LAN</span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {t('status_ready')}
              </span>
            </div>
          </>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-xs" title={`${currentUserPermission.name} (${currentUserPermission.ip})`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
