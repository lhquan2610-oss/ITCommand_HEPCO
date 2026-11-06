import React from 'react';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'UNREACHABLE' | 'UNKNOWN' | 'MAINTENANCE' | string;
  icmpBlocked?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, icmpBlocked = false }) => {
  const s = status.toUpperCase();
  if (s === 'ONLINE') {
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs inline-flex items-center whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1.5 animate-pulse shrink-0"></span>
          ONLINE
        </span>
        {icmpBlocked && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap" title="Chặn Ping ICMP nhưng đang phản hồi ARP/TCP">
            ICMP-BLK
          </span>
        )}
      </div>
    );
  }

  if (s === 'OFFLINE') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300 inline-flex items-center whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block mr-1.5 shrink-0"></span>
        OFFLINE
      </span>
    );
  }

  if (s === 'MAINTENANCE') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap shrink-0">
        BẢO TRÌ
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap shrink-0">
      UNKNOWN
    </span>
  );
};
