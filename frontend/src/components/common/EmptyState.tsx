import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0d121c]/40 my-6">
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-sm">{description}</p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#a3e635] text-slate-950 font-semibold text-xs tracking-wider uppercase hover:bg-[#bef264] transition-all shadow-md shadow-[#a3e635]/20"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#a3e635] text-slate-950 font-semibold text-xs tracking-wider uppercase hover:bg-[#bef264] transition-all shadow-md shadow-[#a3e635]/20"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
