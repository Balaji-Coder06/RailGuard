import React, { useState } from "react";
import DetectionList from "./DetectionList";
import { getResultImageUrl } from "../services/api";

export default function DetectionResult({
  resultData,
  originalPreviewUrl,
  onReset,
}) {
  const [viewMode, setViewMode] = useState("annotated"); // 'annotated' or 'original'
  const [isDownloading, setIsDownloading] = useState(false);

  const hasDefects = resultData.result === "DEFECT DETECTED" && resultData.defect_count > 0;
  const annotatedUrl = getResultImageUrl(resultData.annotated_image_url || resultData.image_id);
  const displayImageUrl = viewMode === "annotated" && annotatedUrl ? annotatedUrl : originalPreviewUrl;

  const highestConfStr = resultData.highest_confidence
    ? `${(resultData.highest_confidence * 100).toFixed(1)}%`
    : "N/A";

  const handleDownload = async () => {
    if (!annotatedUrl) return;
    try {
      setIsDownloading(true);
      const res = await fetch(annotatedUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `railguard_defect_annotated_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download annotated image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="result-container">
      {/* Top Banner Status Card */}
      <div className={`status-summary-card ${hasDefects ? "status-danger" : "status-safe"}`}>
        <div className="status-main-badge">
          {hasDefects ? (
            <div className="status-indicator-chip danger">
              <span className="dot-pulse-danger" />
              <strong className="status-heading">● DEFECT DETECTED</strong>
            </div>
          ) : (
            <div className="status-indicator-chip safe">
              <span className="dot-safe" />
              <strong className="status-heading">✓ NO DEFECT DETECTED</strong>
            </div>
          )}
        </div>

        <div className="status-metrics-row">
          <div className="metric-cell">
            <span className="metric-label">Defects Identified</span>
            <span className="metric-value">
              {resultData.defect_count} {resultData.defect_count === 1 ? "defect" : "defects"}
            </span>
          </div>

          <div className="metric-cell">
            <span className="metric-label">Highest Confidence</span>
            <span className="metric-value">{highestConfStr}</span>
          </div>

          {resultData.inference_time_ms && (
            <div className="metric-cell">
              <span className="metric-label">Inference Time</span>
              <span className="metric-value">{resultData.inference_time_ms} ms</span>
            </div>
          )}

          {resultData.image_width && (
            <div className="metric-cell">
              <span className="metric-label">Resolution</span>
              <span className="metric-value">
                {resultData.image_width} × {resultData.image_height}
              </span>
            </div>
          )}
        </div>

        {!hasDefects && (
          <p className="safe-reassurance-text">
            No visible railway track defects were detected in this image.
          </p>
        )}
      </div>

      {/* Main Grid: Visual Feed + Sidebar */}
      <div className="result-main-grid">
        {/* Left Column: Visual Display */}
        <div className="image-display-panel">
          <div className="image-panel-toolbar">
            <div className="view-toggle-group">
              <button
                className={`toggle-btn ${viewMode === "annotated" ? "active" : ""}`}
                onClick={() => setViewMode("annotated")}
                disabled={!annotatedUrl}
              >
                Annotated View
              </button>
              <button
                className={`toggle-btn ${viewMode === "original" ? "active" : ""}`}
                onClick={() => setViewMode("original")}
              >
                Original View
              </button>
            </div>

            <div className="image-actions-group">
              {annotatedUrl && (
                <button
                  className="btn-toolbar"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  title="Download annotated image"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{isDownloading ? "Saving..." : "Download Image"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="image-frame">
            <img
              src={displayImageUrl}
              alt="Track Analysis"
              className="annotated-render-image"
            />
          </div>

          <div className="image-caption-bar">
            <span>
              {viewMode === "annotated"
                ? "Annotated railway track defect localization"
                : "Original camera capture"}
            </span>
            <span className="image-model-pill">YOLO11n Detector</span>
          </div>
        </div>

        {/* Right Column: Breakdown & Actions */}
        <div className="result-details-panel">
          <DetectionList
            detections={resultData.detections || []}
            hasDefects={hasDefects}
          />

          <div className="result-action-footer">
            <button className="btn-secondary analyze-another-btn" onClick={onReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Analyze Another Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
