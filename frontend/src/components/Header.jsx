import React from "react";

export default function Header({ systemStatus }) {
  const isOnline = systemStatus && systemStatus.status === "ok" && systemStatus.model_loaded;

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">RailGuard</h1>
              <span className="brand-tag">v1.0 • YOLO11</span>
            </div>
            <p className="brand-subtitle">AI-Powered Railway Track Fault Detection</p>
          </div>
        </div>

        <div className="header-status-indicator">
          <div className={`status-dot ${isOnline ? "online" : "offline"}`} />
          <span className="status-label">
            {isOnline
              ? `Model: ${systemStatus.model || "YOLO11"} (${systemStatus.device || "Ready"})`
              : "Connecting to Model..."}
          </span>
        </div>
      </div>
    </header>
  );
}
