import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import LoadingState from "./components/LoadingState";
import DetectionResult from "./components/DetectionResult";
import { detectImage, checkHealth } from "./services/api";

export default function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [confidence, setConfidence] = useState(0.40);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check backend health on initial mount
  useEffect(() => {
    let isMounted = true;
    async function verifyHealth() {
      try {
        const health = await checkHealth();
        if (isMounted) {
          setSystemStatus(health);
        }
      } catch (err) {
        if (isMounted) {
          setSystemStatus({ status: "offline", model_loaded: false });
        }
      }
    }
    verifyHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelect = (file) => {
    // Revoke previous preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultData(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultData(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await detectImage(selectedFile, confidence);
      setResultData(response);
    } catch (err) {
      console.error("Detection error:", err);
      setErrorMessage(
        err.message || "Unable to analyze this image. Please try another railway-track image."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-layout">
      <Header systemStatus={systemStatus} />

      <main className="main-content">
        <div className="container">
          {errorMessage && (
            <div className="error-alert-banner">
              <div className="error-alert-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="error-text-wrap">
                  <strong className="error-heading">Analysis Notice</strong>
                  <p className="error-desc">{errorMessage}</p>
                </div>
              </div>
              <button className="error-dismiss-btn" onClick={() => setErrorMessage(null)} title="Dismiss">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {!resultData ? (
            <div className="workspace-card">
              <UploadZone
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onClear={handleClear}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                confidence={confidence}
                onConfidenceChange={setConfidence}
              />

              {isAnalyzing && <LoadingState />}
            </div>
          ) : (
            <DetectionResult
              resultData={resultData}
              originalPreviewUrl={previewUrl}
              onReset={handleClear}
            />
          )}
        </div>
      </main>

      <footer className="footer-bar">
        <div className="footer-content">
          <span>RailGuard • YOLO11n Railway Fault Detection</span>
          <span>Ultralytics YOLO11n Checkpoint • 640×640</span>
        </div>
      </footer>
    </div>
  );
}
