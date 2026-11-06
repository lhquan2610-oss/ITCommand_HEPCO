import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Copy, ShieldCheck, Activity } from 'lucide-react';
import { HEPCO_LOGO } from '../assets/logoBase64';

declare global {
  interface Window {
    hiccDesktop?: {
      isElectron: boolean;
      minimize: () => Promise<void>;
      maximizeToggle: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      onMaximizedState: (callback: (state: boolean) => void) => void;
      ping: (host: string) => Promise<{ success: boolean; output: string; isAlive: boolean; latency?: number | null }>;
      arpScan: () => Promise<{ success: boolean; devices: Array<{ ip: string; mac: string; vendor?: string; type?: string }> }>;
      deepScan: () => Promise<{ success: boolean; count: number; devices: any[] }>;
      portScan: (ip: string, ports?: number[]) => Promise<{ ip: string; openPorts: number[] }>;
      subnetSweep: (baseIp: string, start?: number, end?: number) => Promise<{ success: boolean; activeHosts: Array<{ ip: string; isAlive: boolean; rtt?: number }>; scannedCount?: number }>;
      traceroute: (host: string) => Promise<{ success: boolean; output: string }>;
      wakeOnLan: (mac: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      launchRdp: (ip: string) => Promise<{ success: boolean; error?: string }>;
      launchSsh: (ip: string) => Promise<{ success: boolean }>;
      launchWeb: (ip: string) => Promise<{ success: boolean }>;
      resolveHostname: (ip: string) => Promise<{ success: boolean; hostname: string; fullHost?: string; user?: string; method?: string }>;
      loadInventory: () => Promise<{ success: boolean; devices: any[] | null }>;
      saveInventory: (devices: any[]) => Promise<{ success: boolean; error?: string }>;
      startPingStream: (host: string) => Promise<{ success: boolean }>;
      stopPingStream: () => Promise<{ success: boolean }>;
      onPingStreamTick: (callback: (data: { raw: string; rtt: number | null; timestamp: number }) => void) => void;
      onPingStreamEnd: (callback: () => void) => void;
      getSystemInfo: () => Promise<any>;
      openTrackingWindow?: (options?: any) => Promise<any>;
    };
  }
}

export const TitleBar: React.FC = () => {
  const isDesktop = typeof window !== 'undefined' && !!window.hiccDesktop;
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isDesktop && window.hiccDesktop?.onMaximizedState) {
      window.hiccDesktop.onMaximizedState((state) => setIsMaximized(state));
      window.hiccDesktop.isMaximized().then(setIsMaximized).catch(() => {});
    }
  }, [isDesktop]);

  const handleMinimize = () => window.hiccDesktop?.minimize();
  const handleMaximize = async () => {
    const state = await window.hiccDesktop?.maximizeToggle();
    if (state !== undefined) setIsMaximized(state);
  };
  const handleClose = () => window.hiccDesktop?.close();

  return (
    <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between select-none text-xs drag-region px-3 z-50 shadow-xs">
      {/* App Branding & Logo */}
      <div className="flex items-center gap-2.5 font-semibold">
        <img
          src={HEPCO_LOGO}
          alt="HEPCO Logo"
          className="w-6 h-6 object-contain rounded-full shadow-xs shrink-0"
        />
        <span className="font-bold tracking-tight text-slate-800 text-[13px] flex items-center gap-1.5">
          <span>HEPCO</span>
          <span className="text-emerald-700 font-extrabold">COMMAND</span>
        </span>
      </div>

      {/* Center Status Pill */}
      <div className="hidden md:flex items-center gap-2 no-drag px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span className="font-semibold">Hạ Tầng Mạng Nội Bộ HEPCO</span>
        <span className="text-emerald-300">|</span>
        <span className="text-emerald-700 font-bold">HOẠT ĐỘNG 100% OFFLINE</span>
      </div>

      {/* Windows Window Controls */}
      {isDesktop ? (
        <div className="flex items-center no-drag">
          <button
            onClick={handleMinimize}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition rounded"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition rounded"
            title={isMaximized ? "Thu nhỏ kích thước" : "Phóng to"}
          >
            {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 transition rounded"
            title="Đóng ứng dụng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Bản Trình Duyệt Web
        </div>
      )}
    </div>
  );
};
