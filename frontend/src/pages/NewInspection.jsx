import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Crosshair,
  Sliders,
  CheckCircle2,
  XCircle,
  Download,
  FileJson,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api, buildImageUrl } from '../services/api';
import { ImageComparisonSlider } from '../components/common/ImageComparisonSlider';
import { StatusBadge } from '../components/common/StatusBadge';

export const NewInspection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setErrorMessage(null);
    setInspectionResult(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i)) {
      setErrorMessage('Unsupported file format. Please upload a JPEG, PNG, WEBP, or BMP image.');
      return;
    }

    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setErrorMessage('File size exceeds the 15 MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setInspectionResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSampleTrack = async (samplePath, filename) => {
    setErrorMessage(null);
    setInspectionResult(null);
    try {
      const response = await fetch(samplePath);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      validateAndSetFile(file);
    } catch {
      setErrorMessage(`Failed to load sample image from ${samplePath}`);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await api.detect(selectedFile, selectedFile.name, confidence);
      setInspectionResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Inspection pipeline encountered an unexpected error.');
      }
      setInspectionResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadAnnotatedImage = async () => {
    if (!inspectionResult) return;
    try {
      const url = buildImageUrl(inspectionResult.annotated_image_url);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `railguard_${inspectionResult.id}_annotated.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Failed to download annotated image.');
    }
  };

  const handleExportJson = () => {
    if (!inspectionResult) return;
    const jsonStr = JSON.stringify(inspectionResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `railguard_inspection_${inspectionResult.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#a3e635]" />
            Track Surface Defect Inspection
          </h2>
          <p className="text-xs text-slate-400">
            Autonomous YOLO11s computer vision inference on railway track imagery.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#a3e635]" />
            Test Samples:
          </span>
          <button
            type="button"
            onClick={() => loadSampleTrack('/samples/sample_rail_defect.jpg', 'sample_rail_defect.jpg')}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:border-[#a3e635] hover:text-[#a3e635] transition-all"
          >
            Track with Defect
          </button>
          <button
            type="button"
            onClick={() => loadSampleTrack('/samples/sample_rail_clean.jpg', 'sample_rail_clean.jpg')}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:border-[#a3e635] hover:text-[#a3e635] transition-all"
          >
            Clean Track
          </button>
        </div>
      </div>

      {/* Main Grid: Upload & Controls on Left, Analysis/Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Parameters (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          {/* File Upload Zone */}
          <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#a3e635]" />
                Image Input
              </h3>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#a3e635] bg-[#a3e635]/10 shadow-lg shadow-[#a3e635]/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-[#a3e635] mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white tracking-wide">
                  Drag and drop track image here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  or click to browse from file system
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-3">
                  Supported: JPEG, PNG, WEBP, BMP (Max 15MB)
                </p>
              </div>
            ) : (
              /* Image Preview Box */
              <div className="space-y-3">
                <div className="relative rounded-xl border border-slate-800 bg-black aspect-video overflow-hidden flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Replace
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/bmp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        validateAndSetFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                  <span>{selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0'} MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Inference Parameter: Confidence Threshold Slider */}
          <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#a3e635]" />
                Inference Parameters
              </h3>
              <span className="text-xs font-mono font-bold text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded border border-[#a3e635]/20">
                {(confidence * 100).toFixed(0)}% Threshold
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Confidence Cutoff (IoU: 0.70)</span>
                <span className="font-mono text-slate-300">Default: 0.25</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-[#a3e635] bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.05 (High Sensitivity)</span>
                <span>0.50</span>
                <span>0.95 (High Specificity)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isAnalyzing}
                onClick={handleAnalyze}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !selectedFile || isAnalyzing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-[#a3e635] text-slate-950 hover:bg-[#bef264] shadow-[#a3e635]/20 hover:scale-[1.01]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Track Surface...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4" />
                    <span>Analyze Track</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Safety Disclaimer Card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Safety & Compliance Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A negative model prediction does not establish that a railway track is structurally safe.
              Automated AI inspection assists certified track inspectors and must not replace manual track safety audits.
            </p>
          </div>
        </div>

        {/* Right Column: Results & Interactive Comparison (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Analysis in Progress State */}
          {isAnalyzing && (
            <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-12 text-center shadow-xl flex flex-col items-center justify-center gap-4 min-h-[420px]">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-[#a3e635] animate-spin" />
                <div className="w-12 h-12 rounded-full bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
                  <Crosshair className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Executing YOLO11s Inference Pipeline
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Preprocessing 640x640 tensor &bull; Forward pass &bull; Bounding box suppression
                </p>
              </div>
            </div>
          )}

          {/* Analysis Failed State */}
          {errorMessage && !isAnalyzing && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-bold text-rose-300">ANALYSIS FAILED</h4>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-2 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* Success Inspection Result */}
          {inspectionResult && !isAnalyzing && (
            <div className="space-y-5">
              {/* Status Header Banner */}
              <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={inspectionResult.status}
                      count={inspectionResult.detection_count}
                      size="lg"
                    />
                    <span className="text-xs font-mono text-slate-400">
                      ID: {inspectionResult.id.slice(0, 8)}...
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Image: <span className="text-slate-200 font-mono">{inspectionResult.filename}</span> ({inspectionResult.width} &times; {inspectionResult.height}px)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadAnnotatedImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-[#a3e635] text-slate-200 hover:text-white text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#a3e635]" />
                    Download Image
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-semibold transition-all"
                  >
                    <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                    Export JSON
                  </button>
                </div>
              </div>

              {/* Comparison Slider / Side-by-side */}
              <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl">
                <ImageComparisonSlider
                  originalSrc={buildImageUrl(inspectionResult.original_image_url)}
                  annotatedSrc={buildImageUrl(inspectionResult.annotated_image_url)}
                  detectionCount={inspectionResult.detection_count}
                />
              </div>

              {/* Detection Coordinates Breakdown */}
              <div className="rounded-xl border border-slate-800 bg-[#0d121c]/90 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#a3e635]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Verified Detection Breakdown
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Latency: <strong className="text-white">{inspectionResult.inference_time_ms} ms</strong>
                  </span>
                </div>

                {inspectionResult.detections.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#a3e635]" />
                    <p className="font-semibold text-white">No Surface Anomalies Detected</p>
                    <p className="text-slate-500 max-w-sm">
                      Model did not locate any defect bounding boxes passing the {((inspectionResult.confidence_threshold) * 100).toFixed(0)}% confidence threshold.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Class Label</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Bounding Box [X1, Y1, X2, Y2]</th>
                          <th className="py-2.5 px-3 text-right">Box Dimensions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectionResult.detections.map((det, idx) => {
                          const [x1, y1, x2, y2] = det.bbox;
                          const boxW = Math.round(x2 - x1);
                          const boxH = Math.round(y2 - y1);
                          return (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 text-slate-500 font-bold">{idx + 1}</td>
                              <td className="py-2.5 px-3 text-[#a3e635] font-bold uppercase">
                                DEFECT
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                                  {det.confidence_percent.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                [{x1.toFixed(1)}, {y1.toFixed(1)}, {x2.toFixed(1)}, {y2.toFixed(1)}]
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-400">
                                {boxW} &times; {boxH} px
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Idle / Initial State */}
          {!inspectionResult && !isAnalyzing && !errorMessage && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0d121c]/40 p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[420px]">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                <Crosshair className="w-10 h-10 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                Awaiting Inspection Input
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select or drag a railway track image on the left, set your desired confidence threshold, and click &ldquo;Analyze Track&rdquo; to begin computer vision detection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
