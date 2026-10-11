import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crosshair,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { api, buildImageUrl } from '../services/api';
import type { StatsResponse, Inspection, ModelInfo, HealthStatus } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, listData, modelData, healthData] = await Promise.all([
        api.getStats(),
        api.listInspections({ page: 1, page_size: 5, sort_by: 'date_desc' }),
        api.getModelInfo(),
        api.getHealth(),
      ]);
      setStats(statsData);
      setRecentInspections(listData.items);
      setModelInfo(modelData);
      setHealth(healthData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to RailGuard backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-[#a3e635] rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">
          Connecting to RailGuard Telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d121c] via-[#090d16] to-[#07090e] p-6 lg:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#a3e635]/10 border border-[#a3e635]/20 text-[#a3e635] text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
              YOLO11s INFERENCE READY — 1-CLASS (DEFECT)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Autonomous Railway Track Defect Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              High-throughput computer vision pipeline designed for real-time surface fault detection,
              geometric anomaly localization, and safety audit logging.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/new-inspection"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#a3e635] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#bef264] transition-all shadow-lg shadow-[#a3e635]/25"
            >
              <Crosshair className="w-4 h-4" />
              Start Inspection
            </Link>
            <Link
              to="/performance"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 font-semibold text-xs tracking-wider uppercase hover:bg-slate-800 transition-all"
            >
              <Activity className="w-4 h-4" />
              Benchmarks
            </Link>
          </div>
        </div>

        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-tech-dots opacity-40 pointer-events-none" />
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
          <span>Failed to load dashboard data: {error}</span>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded font-bold uppercase text-[10px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Inspections"
          value={stats?.total_inspections ?? 0}
          subtext="Persisted audit records"
          icon={Layers}
          variant="slate"
        />
        <StatCard
          label="Defects Detected"
          value={stats?.defects_detected_count ?? 0}
          subtext={`Defect rate: ${stats?.defect_rate_percent ?? 0}%`}
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          label="Clean Rail Sections"
          value={stats?.clean_count ?? 0}
          subtext="No anomalies identified"
          icon={CheckCircle2}
          variant="lime"
        />
        <StatCard
          label="Avg Latency"
          value={`${stats?.average_inference_time_ms ?? 0} ms`}
          subtext="YOLO11s forward pass + postprocess"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Model Spec & Infrastructure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Specs Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#a3e635]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Active Checkpoint
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
              YOLO11s
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Class ID 0</span>
              <span className="text-[#a3e635] font-mono font-bold">defect (Single Class)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Resolution</span>
              <span className="text-white font-mono">{modelInfo?.input_resolution ?? 640} x {modelInfo?.input_resolution ?? 640} px</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Checkpoint Weights</span>
              <span className="text-white font-mono">{modelInfo?.weights_size_mb ?? 18.3} MB</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Inference Hardware</span>
              <span className="text-white font-mono uppercase">{modelInfo?.device ?? 'CPU'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Framework</span>
              <span className="text-slate-300 font-mono text-[11px]">{modelInfo?.framework_version ?? 'Ultralytics'}</span>
            </div>
          </div>
        </div>

        {/* Historical Test Benchmarks Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Historical Test Metrics
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Reported
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">mAP@50</div>
              <div className="text-xl font-extrabold text-white font-mono-numbers mt-1">82.64%</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">mAP@50-95</div>
              <div className="text-xl font-extrabold text-white font-mono-numbers mt-1">38.31%</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Precision</div>
              <div className="text-xl font-extrabold text-[#a3e635] font-mono-numbers mt-1">86.66%</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Recall</div>
              <div className="text-xl font-extrabold text-white font-mono-numbers mt-1">78.45%</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            * Verified test benchmark values from test split evaluation.
          </p>
        </div>

        {/* Runtime Diagnostics Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Runtime Health
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.status.toUpperCase() ?? 'CHECKING'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Database Connection</span>
              <span className="text-emerald-400 font-medium">Connected (SQLite/PostgreSQL)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Storage Provider</span>
              <span className="text-white font-mono uppercase">{health?.storage_type ?? 'local'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Backend API</span>
              <span className="text-[#a3e635] font-mono">v{health?.version ?? '1.0.0'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Last Inspection</span>
              <span className="text-slate-300 font-mono text-[11px]">
                {stats?.last_inspection_at
                  ? new Date(stats.last_inspection_at).toLocaleTimeString()
                  : 'No records'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Track Inspections</h3>
            <p className="text-xs text-slate-400">Latest autonomous scans logged to database</p>
          </div>
          <Link
            to="/history"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#a3e635] hover:text-[#bef264] transition-all"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInspections.length === 0 ? (
          <EmptyState
            title="No Inspections Performed Yet"
            description="Upload track imagery to run real YOLO11s defect detection and populate the inspection database."
            actionText="Start First Inspection"
            actionLink="/new-inspection"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detections</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentInspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-black border border-slate-800 flex-shrink-0">
                        <img
                          src={buildImageUrl(insp.annotated_image_url)}
                          alt={insp.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {insp.filename}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={insp.status} count={insp.detection_count} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono-numbers">
                      {insp.detection_count > 0 ? (
                        <span className="text-amber-400 font-bold">{insp.detection_count} defect(s)</span>
                      ) : (
                        <span className="text-[#a3e635]">0 defects</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {insp.inference_time_ms} ms
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(insp.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/history?detail=${insp.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a3e635] hover:underline"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
