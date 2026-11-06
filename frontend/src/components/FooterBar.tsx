import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Clock,
  Laptop,
  ShieldCheck,
  Radio,
  Wifi,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FooterBar: React.FC = () => {
  const { language, toggleLanguage, theme, toggleTheme, clientInfo, t } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setCurrentTime(`${timeStr} - ${dateStr}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [language]);

  return (
    <footer className="h-9 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between select-none text-[11px] shrink-0 z-30 transition-colors">
      {/* Left: System Status & Offline LAN Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold">HEPCO LAN</span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500">|</span>
          <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-400">
            {t('status_offline_capable')}
          </span>
        </div>
      </div>

      {/* Right Side: Language, DateTime, Client Machine/IP, Light/Dark Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Client Machine Hostname & IP */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono shadow-xs"
          title={`${t('client_label')}: ${clientInfo.hostname} (${clientInfo.ip})`}
        >
          <Laptop className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {clientInfo.hostname}
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {clientInfo.ip}
          </span>
        </div>

        {/* 2. Realtime Date & Time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono shadow-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="font-medium text-[11px]">{currentTime}</span>
        </div>

        {/* 3. Language Toggle (English / Vietnamese) */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 transition font-bold shadow-xs active:scale-95 cursor-pointer"
          title={t('lang_toggle_tip')}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex items-center text-[11px] font-mono">
            <span
              className={`px-1 rounded ${
                language === 'vi'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              VI
            </span>
            <span className="text-slate-300 dark:text-slate-600 px-0.5">/</span>
            <span
              className={`px-1 rounded ${
                language === 'en'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              EN
            </span>
          </div>
        </button>

        {/* 4. Light / Dark Theme Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-1.5 rounded-md bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-amber-300 transition shadow-xs active:scale-95 cursor-pointer"
          title={theme === 'dark' ? t('theme_switch_to_light') : t('theme_switch_to_dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 fill-slate-200" />
          )}
        </button>
      </div>
    </footer>
  );
};
