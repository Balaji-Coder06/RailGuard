import React from "react";

export default function DetectionList({ detections, hasDefects }) {
  if (!hasDefects || detections.length === 0) {
    return (
      <div className="defect-list-empty">
        <div className="empty-icon-shield">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <h4 className="empty-title">All Clear</h4>
        <p className="empty-desc">
          No surface defects or structural rail faults detected within the active confidence threshold.
        </p>
      </div>
    );
  }

  return (
    <div className="defect-list-container">
      <div className="defect-list-header">
        <h4 className="defect-list-title">Detected Defects ({detections.length})</h4>
        <span className="defect-list-badge">Model Class: defect</span>
      </div>

      <div className="defect-items-scroll">
        {detections.map((item, index) => {
          const confPercent = (item.confidence * 100).toFixed(1);
          const box = item.box || {};
          const boxLabel = `[${Math.round(box.x1)}, ${Math.round(box.y1)}] → [${Math.round(box.x2)}, ${Math.round(box.y2)}]`;

          return (
            <div key={index} className="defect-item-row">
              <div className="defect-item-left">
                <span className="defect-item-index">#{index + 1}</span>
                <div className="defect-item-info">
                  <span className="defect-class-name">
                    {item.class_name.charAt(0).toUpperCase() + item.class_name.slice(1)}
                  </span>
                  <span className="defect-coords" title="Bounding Box Coordinates">
                    {boxLabel}
                  </span>
                </div>
              </div>

              <div className="defect-item-right">
                <div className="defect-conf-meter">
                  <div
                    className="defect-conf-fill"
                    style={{ width: `${Math.min(100, item.confidence * 100)}%` }}
                  />
                </div>
                <span className="defect-confidence-tag">{confPercent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
