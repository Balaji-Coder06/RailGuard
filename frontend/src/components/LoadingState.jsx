import React from "react";

export default function LoadingState() {
  return (
    <div className="loading-card">
      <div className="loading-scanner-container">
        <div className="radar-spinner">
          <div className="radar-circle circle-1" />
          <div className="radar-circle circle-2" />
          <div className="radar-beam" />
        </div>
      </div>

      <div className="loading-text-group">
        <h4 className="loading-title">Analyzing track...</h4>
        <p className="loading-subtitle">Running YOLO11n defect detection</p>
      </div>

      <div className="loading-pulse-line">
        <div className="pulse-bar" />
      </div>
    </div>
  );
}
