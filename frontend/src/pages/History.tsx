import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Trash2,
  ExternalLink,
  Download,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api, buildImageUrl } from '../services/api';
import type { Inspection } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ImageComparisonSlider } from '../components/common/ImageComparisonSlider';

export const History: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Detail Modal & Delete Confirmation Modal
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [inspectionToDelete, setInspectionToDeleteToDelete] = useState<Inspection | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.listInspections({
        page,
        page_size: 12,
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sort_by: sortBy,
      });
      setInspections(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);

      // Check if detail query param exists in URL
      const detailId = searchParams.get('detail');
      if (detailId && !selectedInspection) {
        const match = res.items.find((i) => i.id === detailId);
        if (match) {
          setSelectedInspection(match);
        } else {
          // Fetch directly
          try {
            const single = await api.getInspection(detailId);
            setSelectedInspection(single);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async () => {
    if (!inspectionToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteInspection(inspectionToDelete.id);
      if (selectedInspection?.id === inspectionToDelete.id) {
        setSelectedInspection(null);
        searchParams.delete('detail');
        setSearchParams(searchParams);
      }
      setInspectionToDeleteToDelete(null);
      await fetchHistory();
    } catch (err) {
      alert(`Failed to delete inspection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Inspection Audit History</h2>
          <p className="text-xs text-slate-400">
            Persistent database records of previous track surface detection runs ({total} total).
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0d121c] p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'table' ? 'bg-[#a3e635] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'grid' ? 'bg-[#a3e635] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-4 shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search inspections by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#a3e635]"
          />
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#a3e635]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DEFECT_DETECTED">Defect Detected</option>
              <option value="NO_DEFECT_DETECTED">No Defect (Clean)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#a3e635]"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="count_desc">Highest Defect Count</option>
              <option value="count_asc">Lowest Defect Count</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Table or Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="w-8 h-8 text-[#a3e635] animate-spin" />
        </div>
      ) : inspections.length === 0 ? (
        <EmptyState
          title="No Inspection Records Found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Start a new inspection to populate the persistent database history.'
          }
          actionText="New Inspection"
          actionLink="/new-inspection"
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detections</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setSelectedInspection(insp)}
                        className="w-14 h-10 rounded-md overflow-hidden bg-black border border-slate-800 flex-shrink-0 cursor-pointer hover:border-[#a3e635] transition-all"
                      >
                        <img
                          src={buildImageUrl(insp.annotated_image_url)}
                          alt={insp.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      <button
                        type="button"
                        onClick={() => setSelectedInspection(insp)}
                        className="hover:text-[#a3e635] transition-all text-left"
                      >
                        {insp.filename}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={insp.status} count={insp.detection_count} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono-numbers">
                      {insp.detection_count > 0 ? (
                        <span className="text-amber-400 font-bold">{insp.detection_count}</span>
                      ) : (
                        <span className="text-[#a3e635]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {(insp.confidence_threshold * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {insp.inference_time_ms} ms
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(insp.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInspection(insp)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-[#a3e635] text-slate-300 hover:text-white"
                          title="View Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectionToDeleteToDelete(insp)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="rounded-xl border border-slate-800 bg-[#0d121c]/90 overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div
                className="relative aspect-video bg-black cursor-pointer group"
                onClick={() => setSelectedInspection(insp)}
              >
                <img
                  src={buildImageUrl(insp.annotated_image_url)}
                  alt={insp.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <StatusBadge status={insp.status} count={insp.detection_count} size="sm" />
                </div>
                <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {insp.inference_time_ms} ms
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white truncate" title={insp.filename}>
                    {insp.filename}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(insp.created_at).toLocaleDateString()} &bull; {insp.width}&times;{insp.height}px
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setSelectedInspection(insp)}
                    className="text-xs font-semibold text-[#a3e635] hover:underline flex items-center gap-1"
                  >
                    View Details
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionToDeleteToDelete(insp)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-50 text-slate-300 hover:text-white"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-50 text-slate-300 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedInspection(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0a0e17] p-6 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={selectedInspection.status}
                  count={selectedInspection.detection_count}
                  size="md"
                />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedInspection.filename}</h3>
                  <p className="text-[11px] text-slate-400">
                    ID: {selectedInspection.id} &bull; {new Date(selectedInspection.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Comparison Slider */}
            <div className="rounded-xl border border-slate-800 bg-black p-2">
              <ImageComparisonSlider
                originalSrc={buildImageUrl(selectedInspection.original_image_url)}
                annotatedSrc={buildImageUrl(selectedInspection.annotated_image_url)}
                detectionCount={selectedInspection.detection_count}
              />
            </div>

            {/* Coordinates table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Detections ({selectedInspection.detection_count})
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Latency: {selectedInspection.inference_time_ms} ms &bull; Threshold: {(selectedInspection.confidence_threshold * 100).toFixed(0)}%
                </span>
              </div>

              {selectedInspection.detections.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Clean track scan. No bounding boxes identified.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2">#</th>
                        <th className="py-1.5 px-2">Label</th>
                        <th className="py-1.5 px-2">Confidence</th>
                        <th className="py-1.5 px-2">Bounding Box [X1, Y1, X2, Y2]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {selectedInspection.detections.map((d, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2 text-slate-500">{i + 1}</td>
                          <td className="py-1.5 px-2 text-[#a3e635] font-bold">DEFECT</td>
                          <td className="py-1.5 px-2 text-amber-300">{d.confidence_percent.toFixed(1)}%</td>
                          <td className="py-1.5 px-2 text-slate-300">
                            [{d.bbox.map((n) => n.toFixed(1)).join(', ')}]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setInspectionToDeleteToDelete(selectedInspection);
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={buildImageUrl(selectedInspection.annotated_image_url)}
                  download={`railguard_${selectedInspection.id}_annotated.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-[#a3e635] text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#a3e635]" />
                  Download Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {inspectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setInspectionToDeleteToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0d121c] p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Inspection Record</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete inspection record <strong className="font-mono text-white">{inspectionToDelete.filename}</strong>? All associated original and annotated images will be permanently removed from disk storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectionToDeleteToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
