import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({
  status,
  count,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-semibold';

  if (status === 'DEFECT_DETECTED') {
    return (
      <span
        className={`inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 tracking-wider shadow-sm shadow-amber-500/10 ${sizeClasses} ${className}`}
      >
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>DEFECT DETECTED</span>
        {typeof count === 'number' && (
          <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono text-[10px]">
            {count}
          </span>
        )}
      </span>
    );
  }

  if (status === 'NO_DEFECT_DETECTED') {
    return (
      <span
        className={`inline-flex items-center rounded-md border border-[#a3e635]/30 bg-[#a3e635]/10 text-[#a3e635] tracking-wider shadow-sm shadow-[#a3e635]/10 ${sizeClasses} ${className}`}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>NO DEFECT DETECTED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 tracking-wider ${sizeClasses} ${className}`}
    >
      <XCircle className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>ANALYSIS FAILED</span>
    </span>
  );
};
