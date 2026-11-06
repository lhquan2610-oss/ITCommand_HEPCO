import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'green' | 'cyan' | 'amber' | 'rose' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
}) => {
  const styles = {
    green: {
      border: 'border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      cardBg: 'bg-white',
    },
    cyan: {
      border: 'border-sky-200 hover:border-sky-400',
      iconBg: 'bg-sky-50 text-sky-700',
      text: 'text-sky-700',
      cardBg: 'bg-white',
    },
    amber: {
      border: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      cardBg: 'bg-white',
    },
    rose: {
      border: 'border-rose-200 hover:border-rose-400',
      iconBg: 'bg-rose-50 text-rose-700',
      text: 'text-rose-700',
      cardBg: 'bg-white',
    },
    default: {
      border: 'border-slate-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-700',
      text: 'text-slate-800',
      cardBg: 'bg-white',
    },
  }[variant];

  return (
    <div
      className={`p-5 rounded-2xl ${styles.cardBg} border ${styles.border} shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between`}
    >
      <div>
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">{title}</p>
        <p className={`text-2xl font-black mt-1 font-mono tracking-tight ${styles.text}`}>{value}</p>
        {subtext && <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtext}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${styles.iconBg} shadow-xs`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
