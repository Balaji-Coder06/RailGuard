import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Crosshair } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'System Overview',
          subtitle: 'Real-time telemetry and defect detection telemetry',
        };
      case '/new-inspection':
        return {
          title: 'New Inspection',
          subtitle: 'Upload rail surface imagery for autonomous YOLO11s analysis',
        };
      case '/history':
        return {
          title: 'Inspection History',
          subtitle: 'Audit trail of processed railway tracks and defect coordinates',
        };
      case '/performance':
        return {
          title: 'Model Performance',
          subtitle: 'Verified historical benchmarks & neural network metrics',
        };
      case '/settings':
        return {
          title: 'System Settings',
          subtitle: 'Inference runtime, API connection, and diagnostics',
        };
      default:
        return {
          title: 'RailGuard Intelligence',
          subtitle: 'Railway Track Defect Detection',
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#080b11]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {location.pathname !== '/new-inspection' && (
          <Link
            to="/new-inspection"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#a3e635] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#bef264] transition-all shadow-md shadow-[#a3e635]/20"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Inspection</span>
            <span className="sm:hidden">Inspect</span>
          </Link>
        )}
      </div>
    </header>
  );
};
