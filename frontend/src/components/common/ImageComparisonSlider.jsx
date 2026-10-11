import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';

export const ImageComparisonSlider = ({
  originalSrc,
  annotatedSrc,
  originalAlt = 'Original Track',
  annotatedAlt = 'Annotated Defects',
  detectionCount = 0,
}) => {
  const [mode, setMode] = useState('slider');
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="flex flex-col gap-3">
      {/* View controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Inspection Comparison
          </span>
          {detectionCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-numbers">
              {detectionCount} defect{detectionCount !== 1 ? 's' : ''} located
            </span>
          )}
        </div>

        <div className="flex items-center bg-[#0d121c] p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === 'slider'
                ? 'bg-[#a3e635] text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            Interactive Slider
          </button>
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === 'side-by-side'
                ? 'bg-[#a3e635] text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
        </div>
      </div>

      {mode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="relative select-none overflow-hidden rounded-xl border border-slate-800 bg-black aspect-video max-h-[580px] w-full cursor-ew-resize shadow-2xl"
        >
          {/* Base Layer: Original Image (Full width background) */}
          <img
            src={originalSrc}
            alt={originalAlt}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Top Layer: Annotated Image clipped to slider percentage */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={annotatedSrc}
              alt={annotatedAlt}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Visual Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#a3e635] pointer-events-none shadow-[0_0_12px_rgba(163,230,53,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Draggable Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#a3e635] text-slate-950 flex items-center justify-center shadow-lg shadow-black/80 border-2 border-slate-900 pointer-events-auto cursor-ew-resize">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#a3e635]/40 text-[11px] font-bold text-[#a3e635] tracking-wide pointer-events-none flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
            AI ANNOTATED
          </div>
          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/60 text-[11px] font-bold text-slate-300 tracking-wide pointer-events-none shadow-lg">
            ORIGINAL TRACK
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-xl border border-slate-800 bg-black overflow-hidden shadow-xl aspect-video max-h-[460px]">
            <img
              src={originalSrc}
              alt={originalAlt}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/60 text-xs font-semibold text-slate-300">
              ORIGINAL TRACK
            </div>
          </div>

          <div className="relative rounded-xl border border-[#a3e635]/30 bg-black overflow-hidden shadow-xl aspect-video max-h-[460px]">
            <img
              src={annotatedSrc}
              alt={annotatedAlt}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#a3e635]/40 text-xs font-bold text-[#a3e635] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
              AI ANNOTATED DEFECTS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
