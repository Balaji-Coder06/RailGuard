import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'lime' | 'amber' | 'slate' | 'default';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
}) => {
  const iconColors = {
    lime: 'text-[#a3e635] bg-[#a3e635]/10 border-[#a3e635]/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    slate: 'text-slate-300 bg-slate-800/60 border-slate-700/50',
    default: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }[variant];

  return (
    <div className="relative group rounded-xl border border-slate-800/80 bg-[#0d121c]/90 p-5 shadow-lg shadow-black/40 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <div className={`p-2.5 rounded-lg border ${iconColors}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono-numbers">
          {value}
        </span>
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          {subtext}
        </p>
      )}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/40 to-transparent group-hover:via-[#a3e635]/40 transition-all" />
    </div>
  );
};
