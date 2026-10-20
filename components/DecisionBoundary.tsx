'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Grid, Trash2, RotateCcw, MousePointer, Paintbrush } from 'lucide-react';

export default function DecisionBoundary() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    engine,
    currentDataset,
    currentPresetId,
    epoch,
    addCustomPoint,
    clearCustomDataset,
    resetDatasetToPreset,
  } = useNetworkStore();

  const is2DMode = currentPresetId === '2d_classifier' || engine.topology[0] === 2;

  const [isDrawing, setIsDrawing] = useState(false);
  const [activeBrush, setActiveBrush] = useState<0 | 1>(0);
  const drawingClassRef = useRef<0 | 1>(0);
  const lastDrawnPosRef = useRef<{ x: number; y: number } | null>(null);

  // Render 32x32 Heatmap and Dataset Points
  useEffect(() => {
    if (!is2DMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 140;
    const height = 140;
    const resolution = 32; // 32x32 evaluation grid
    const cellWidth = width / resolution;
    const cellHeight = height / resolution;

    // Evaluate 2D grid
    for (let gx = 0; gx < resolution; gx++) {
      for (let gy = 0; gy < resolution; gy++) {
        // Map grid coordinate to [-1.5, 1.5]
        const nx = ((gx + 0.5) / resolution) * 3.0 - 1.5;
        const ny = ((gy + 0.5) / resolution) * 3.0 - 1.5;

        const out = engine.predict([nx, ny]);
        let prob = 0.5;
        if (out.length >= 2) {
          prob = out[1] / (out[0] + out[1] + 1e-9);
        } else if (out.length === 1) {
          prob = out[0];
        }

        // Color interpolation: Cyan (Class 0: prob -> 1) vs Amber (Class 1: prob -> 0)
        const r = Math.round(245 * (1 - prob) + 6 * prob);
        const g = Math.round(158 * (1 - prob) + 182 * prob);
        const b = Math.round(11 * (1 - prob) + 212 * prob);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(gx * cellWidth, gy * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
    }

    // Draw coordinate axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Overlay Dataset Samples
    for (const sample of currentDataset) {
      if (!sample.coords) continue;
      const [sx, sy] = sample.coords;
      const px = ((sx + 1.5) / 3.0) * width;
      const py = ((sy + 1.5) / 3.0) * height;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        // Class 0 (Cyan) has target[1] > 0.5; Class 1 (Amber) has target[0] > 0.5
        const isCyan = (sample.targets[1] ?? sample.targets[0]) > 0.5;
        ctx.beginPath();
        ctx.arc(px, py, 3.0, 0, Math.PI * 2);
        ctx.fillStyle = isCyan ? '#38bdf8' : '#fef08a';
        ctx.strokeStyle = isCyan ? '#0284c7' : '#d97706';
        ctx.lineWidth = 1.0;
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [engine, currentDataset, is2DMode, epoch]);

  // Handle Point Placement by client viewport coordinates
  const handlePlaceCoord = useCallback(
    (clientX: number, clientY: number, classType: 0 | 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Coordinate mapping to [-1.5, 1.5]
      const nx = Math.max(-1.45, Math.min(1.45, (clickX / rect.width) * 3.0 - 1.5));
      const ny = Math.max(-1.45, Math.min(1.45, (clickY / rect.height) * 3.0 - 1.5));

      // Prevent duplicate points within 0.08 units distance
      if (lastDrawnPosRef.current) {
        const dist = Math.hypot(nx - lastDrawnPosRef.current.x, ny - lastDrawnPosRef.current.y);
        if (dist < 0.08) return;
      }

      lastDrawnPosRef.current = { x: nx, y: ny };
      addCustomPoint(nx, ny, classType);
    },
    [addCustomPoint]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Right-Click (e.button === 2 or buttons bitmask 2) or Shift-Click -> Class 1 (Amber)
    const isAmber = e.button === 2 || (e.buttons & 2) === 2 || e.shiftKey || activeBrush === 1;
    const classToDraw: 0 | 1 = isAmber ? 1 : 0;
    drawingClassRef.current = classToDraw;
    setIsDrawing(true);
    handlePlaceCoord(e.clientX, e.clientY, classToDraw);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    // Keep class consistent across drag stroke (honoring right-click drag or active brush)
    const isAmber = (e.buttons & 2) === 2 || e.shiftKey || drawingClassRef.current === 1;
    handlePlaceCoord(e.clientX, e.clientY, isAmber ? 1 : 0);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastDrawnPosRef.current = null;
  };

  // Touch Support for Mobile / Tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDrawing(true);
    drawingClassRef.current = activeBrush;
    handlePlaceCoord(touch.clientX, touch.clientY, activeBrush);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length === 0) return;
    const touch = e.touches[0];
    handlePlaceCoord(touch.clientX, touch.clientY, drawingClassRef.current);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    lastDrawnPosRef.current = null;
  };

  if (!is2DMode) return null;

  return (
    <div className="bg-[#090d16] border border-[#1e293b] rounded-md p-2.5 font-mono text-xs flex flex-col justify-between shadow-2xl select-none">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-300 uppercase font-semibold">
            2D DRAWING PAD
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearCustomDataset}
            title="Clear points (Draw from scratch)"
            className="p-1 rounded bg-[#161d2d] hover:bg-red-950/60 hover:text-red-300 border border-[#1e293b] text-slate-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={resetDatasetToPreset}
            title="Reset to Spiral Dataset"
            className="p-1 rounded bg-[#161d2d] hover:bg-cyan-950/60 hover:text-cyan-300 border border-[#1e293b] text-slate-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Class Selector Pills (supports tap-to-switch on mobile/touch & visual confirmation) */}
      <div className="flex items-center justify-between mb-1.5 bg-[#07090e] p-1 rounded border border-[#1e293b]">
        <button
          onClick={() => setActiveBrush(0)}
          className={`flex-1 py-0.5 px-1.5 rounded text-[9px] font-bold flex items-center justify-center space-x-1 transition-all ${
            activeBrush === 0
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Left-Click or tap to paint Class 0 (Cyan)"
        >
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block" />
          <span>CYAN (C0)</span>
        </button>
        <button
          onClick={() => setActiveBrush(1)}
          className={`flex-1 py-0.5 px-1.5 rounded text-[9px] font-bold flex items-center justify-center space-x-1 transition-all ${
            activeBrush === 1
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Right-Click, Shift-Click or tap to paint Class 1 (Amber)"
        >
          <span className="w-2 h-2 rounded-full bg-[#fef08a] inline-block" />
          <span>AMBER (C1)</span>
        </button>
      </div>

      {/* Mini Canvas */}
      <div className="relative mx-auto border border-[#1e293b] rounded overflow-hidden shadow-inner group">
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          className="block w-[140px] h-[140px] cursor-crosshair touch-none"
          title="Left-Click: Class 0 (Cyan) | Right/Shift-Click: Class 1 (Amber)"
        />
        {/* Sub-label overlay on hover */}
        <div className="absolute bottom-1 right-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-[#07090e]/80 text-[8px] px-1 py-0.5 rounded border border-[#1e293b] text-slate-400 flex items-center space-x-1">
          <Paintbrush className="w-2.5 h-2.5 text-cyan-400" />
          <span>Draw</span>
        </div>
      </div>

      {/* Class legend & Drawing instructions */}
      <div className="flex flex-col space-y-1 mt-1.5 text-[9px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block border border-sky-600" />
            <span className="text-cyan-300 font-semibold">Left: C0 (Cyan)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#fef08a] inline-block border border-amber-600" />
            <span className="text-amber-300 font-semibold">Right/Shift: C1 (Amber)</span>
          </span>
        </div>
        <div className="text-[8px] text-slate-500 text-center truncate">
          {currentDataset.length} Points • Boundary warps in real time
        </div>
      </div>
    </div>
  );
}
