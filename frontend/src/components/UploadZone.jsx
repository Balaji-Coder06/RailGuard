import React, { useState, useRef } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_MB = 20;

export default function UploadZone({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClear,
  onAnalyze,
  isAnalyzing,
  confidence,
  onConfidenceChange,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setFileError(null);
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    const isValidExt = ALLOWED_EXTS.includes(ext);
    const isValidMime = ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/");

    if (!isValidExt && !isValidMime) {
      setFileError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please choose a smaller image.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="upload-section">
      {!previewUrl ? (
        <div
          className={`upload-dropzone ${isDragOver ? "drag-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
          />

          <div className="upload-icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <h3 className="upload-title">Upload Track Image</h3>
          <p className="upload-subtitle">Drag &amp; drop or browse image</p>

          <div className="upload-formats-badge">
            <span>JPG</span>
            <span className="dot-sep">•</span>
            <span>PNG</span>
            <span className="dot-sep">•</span>
            <span>WEBP</span>
          </div>

          <p className="upload-hint">High-resolution track bed or rail surface photos recommended</p>
        </div>
      ) : (
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-meta">
              <span className="preview-file-name">{selectedFile?.name}</span>
              <span className="preview-file-size">({formatFileSize(selectedFile?.size || 0)})</span>
            </div>
            <button
              className="btn-text-danger"
              onClick={onClear}
              disabled={isAnalyzing}
              title="Remove image"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Remove</span>
            </button>
          </div>

          <div className="preview-media-container">
            <img src={previewUrl} alt="Track preview" className="preview-image" />
          </div>

          <div className="preview-controls-bar">
            <div className="confidence-control">
              <label htmlFor="conf-slider" className="conf-label">
                <span>Threshold:</span>
                <strong className="conf-value">{Math.round(confidence * 100)}%</strong>
              </label>
              <input
                id="conf-slider"
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={confidence}
                onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
                disabled={isAnalyzing}
                className="conf-slider"
              />
            </div>

            <button
              className="btn-primary analyze-button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Analyze Track</span>
            </button>
          </div>
        </div>
      )}

      {fileError && (
        <div className="upload-error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
}
