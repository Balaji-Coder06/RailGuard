import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Crosshair,
  History,
  Activity,
  Settings as SettingsIcon,
  ShieldCheck,
  AlertCircle,
  Wifi,
  Cpu,
} from 'lucide-react';
import { api } from '../../services/api';
import type { HealthStatus, ModelInfo } from '../../types';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  const fetchStatus = async () => {
    try {
      const [h, m] = await Promise.all([api.getHealth(), api.getModelInfo()]);
      setHealth(h);
      setModelInfo(m);
    } catch {
      setHealth({
        status: 'offline',
        model_loaded: false,
        model_path: '',
        database_connected: false,
        storage_type: 'unknown',
        version: '1.0.0',
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'New Inspection', to: '/new-inspection', icon: Crosshair },
    { name: 'Inspection History', to: '/history', icon: History },
    { name: 'Model Performance', to: '/performance', icon: Activity },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`w-64 flex flex-col justify-between border-r border-slate-800/80 bg-[#080b11] text-slate-200 select-none ${className}`}
    >
      {/* Top Branding */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e1726] border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635] shadow-lg shadow-[#a3e635]/10">
              <ShieldCheck className="w-5 h-5 text-[#a3e635]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">RailGuard</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#a3e635]/15 text-[#a3e635] font-bold border border-[#a3e635]/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                Defect Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#a3e635] text-slate-950 shadow-md shadow-[#a3e635]/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-4 border-t border-slate-800/80 bg-[#06080d]/80 space-y-3">
        {/* Live Backend & Model Health Card */}
        <div className="p-3 rounded-lg border border-slate-800 bg-[#0d121c]/70 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-slate-400" />
              Backend Link
            </span>
            {health?.status === 'healthy' ? (
              <span className="flex items-center gap-1 text-[11px] text-[#a3e635] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" />
                ONLINE
              </span>
            ) : health?.status === 'degraded' ? (
              <span className="text-[11px] text-amber-400 font-mono font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                DEGRADED
              </span>
            ) : (
              <span className="text-[11px] text-rose-400 font-mono font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                OFFLINE
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" />
              Model
            </span>
            <span className="text-white font-mono font-medium">
              {modelInfo?.name || 'YOLO11s'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Verified Class</span>
            <span className="text-[#a3e635] font-mono uppercase font-bold text-[10px] bg-[#a3e635]/10 px-1 rounded border border-[#a3e635]/20">
              1-Class: DEFECT
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <span>v1.0.0 (Ultralytics)</span>
          <span className="text-[#a3e635] hover:underline cursor-pointer" onClick={fetchStatus}>
            refresh
          </span>
        </div>
      </div>
    </aside>
  );
};
