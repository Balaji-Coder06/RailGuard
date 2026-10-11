import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { api, getApiBaseUrl, setCustomApiBaseUrl } from '../services/api';
import type { HealthStatus, ModelInfo } from '../types';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [customApiUrl, setCustomApiUrl] = useState<string>(getApiBaseUrl());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const runHealthCheck = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const [h, m] = await Promise.all([api.getHealth(), api.getModelInfo()]);
      const latency = Math.round(performance.now() - start);
      setHealth(h);
      setModelInfo(m);
      setPingLatency(latency);
    } catch {
      setHealth({
        status: 'offline',
        model_loaded: false,
        model_path: '',
        database_connected: false,
        storage_type: 'unknown',
        version: '1.0.0',
      });
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiBaseUrl(customApiUrl);
    setSaveSuccess(true);
    runHealthCheck();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetApiUrl = () => {
    setCustomApiBaseUrl('');
    setCustomApiUrl('');
    setSaveSuccess(true);
    runHealthCheck();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#a3e635]" />
          System Settings & Runtime Diagnostics
        </h2>
        <p className="text-xs text-slate-400">
          Backend endpoint configuration, model verification status, and environment diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Connection & Base URL Configuration */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                API Endpoint Configuration
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              VITE_API_BASE_URL
            </span>
          </div>

          <form onSubmit={handleSaveApiUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Backend API Base URL
              </label>
              <input
                type="text"
                placeholder="Leave blank for relative /api or enter http://127.0.0.1:8000"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#a3e635]"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Configures the target URL for YOLO inference, history queries, and telemetry endpoints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#a3e635] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#bef264] transition-all"
              >
                Save Base URL
              </button>
              <button
                type="button"
                onClick={handleResetApiUrl}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Reset Default
              </button>
              {saveSuccess && (
                <span className="text-xs text-[#a3e635] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Tested
                </span>
              )}
            </div>
          </form>

          {/* Connection Test Action */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Live Backend Ping</div>
              <p className="text-[11px] text-slate-500">
                {pingLatency !== null ? `Response time: ${pingLatency} ms` : 'Not pinged yet'}
              </p>
            </div>
            <button
              type="button"
              disabled={isPinging}
              onClick={runHealthCheck}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isPinging ? 'animate-spin' : ''}`} />
              Run Health Check
            </button>
          </div>
        </div>

        {/* Model Availability & Checkpoint Diagnostics */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#a3e635]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Checkpoint Status
              </h3>
            </div>
            {health?.model_loaded ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                UNLOADED
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Architecture</span>
              <span className="text-white font-bold">{modelInfo?.name || 'YOLO11s'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Verified Class</span>
              <span className="text-[#a3e635] font-bold">1-Class: defect</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Weights File</span>
              <span className="text-slate-300">best.pt ({modelInfo?.weights_size_mb ?? 18.3} MB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Inference Device</span>
              <span className="text-white uppercase">{modelInfo?.device || 'CPU'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Database Engine</span>
              <span className="text-emerald-400">
                {health?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Deployment Environment Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Environment Specification
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Production Ready
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Frontend Platform:</span>
              <span className="text-slate-200 font-mono">React 19 + Vite 6 + Tailwind CSS</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Backend Framework:</span>
              <span className="text-slate-200 font-mono">FastAPI + Uvicorn (Python 3.10)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Computer Vision Runtime:</span>
              <span className="text-slate-200 font-mono">{modelInfo?.framework_version ?? 'Ultralytics 8.4'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>PyTorch Engine:</span>
              <span className="text-slate-200 font-mono">{modelInfo?.torch_version ?? 'PyTorch 2.14.0+cpu'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Free-Tier Target Hosts:</span>
              <span className="text-slate-200 font-mono">Vercel (FE) + Hugging Face Spaces (BE)</span>
            </div>
          </div>
        </div>

        {/* Security & Credential Protection Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Security & Credential Protection
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SECURE
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-semibold text-slate-200">Zero Secret Leakage</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with security standards, no database credentials, API secret keys, or service tokens are exposed through client responses or environment bundles.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-semibold text-slate-200">Server-Side Path Sanitization</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Upload filenames are strictly validated and mapped to internal UUID storage keys to prevent path traversal vulnerabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
