'use client';

import React, { useState } from 'react';
import LossOscilloscope from './LossOscilloscope';
import TerminalLogs from './TerminalLogs';
import DecisionBoundary from './DecisionBoundary';
import StepMathXRay from './StepMathXRay';
import { useNetworkStore } from '@/store/useNetworkStore';
import {
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

export default function DiagnosticsDrawer() {
  const { epoch, currentLoss, currentAccuracy, lossHistory, currentPresetId } = useNetworkStore();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand drawer if user switches to step math mode
  React.useEffect(() => {
    if (currentPresetId === 'step_math_xray') {
      setIsOpen(true);
    }
  }, [currentPresetId]);

  const is2DMode = currentPresetId === '2d_classifier';
  const isMathMode = currentPresetId === 'step_math_xray';

  // Mini loss sparkline calculation from the last 24 iterations
  const recentHistory = lossHistory.slice(-24);
  let sparklinePoints = '';
  let sparklineAreaPoints = '';

  if (recentHistory.length > 1) {
    const losses = recentHistory.map((h) => h.loss);
    const minL = Math.min(...losses);
    const maxL = Math.max(...losses);
    const range = Math.max(0.0001, maxL - minL);

    const coords = recentHistory.map((h, i) => {
      const x = (i / (recentHistory.length - 1)) * 44 + 2;
      const y = 14 - ((h.loss - minL) / range) * 11;
      return { x, y };
    });

    sparklinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    sparklineAreaPoints = `${coords[0].x.toFixed(1)},15 ${sparklinePoints} ${coords[coords.length - 1].x.toFixed(1)},15`;
  }

  return (
    <div
      className={`border-t border-[#2a2b30] bg-[#18191c] transition-all duration-300 flex flex-col font-mono z-30 select-none ${
        isOpen ? 'h-64 sm:h-60' : 'h-10'
      }`}
    >
      {/* High-Visibility Dock Bar / Telemetry HUD Header */}
      <div className="h-10 bg-[#1f2024] px-3 sm:px-4 flex items-center justify-between border-b border-[#2a2b30] text-xs shadow-none">
        {/* Left: Deck Title & Mode Indicators */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 font-bold text-xs text-zinc-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline tracking-wider">DIAGNOSTICS & TELEMETRY DECK</span>
            <span className="sm:hidden tracking-wider">TELEMETRY</span>
          </div>

          <div className="hidden xl:flex items-center space-x-2 text-[10px] text-zinc-500">
            <span>• LOSS OSCILLOSCOPE</span>
            <span>• TERMINAL</span>
            {is2DMode && <span className="text-zinc-300 font-semibold">• 2D HEATMAP</span>}
            {isMathMode && <span className="text-purple-300 font-semibold">• STEP MATH X-RAY</span>}
          </div>
        </div>

        {/* Right: Floating Telemetry & Loss Pill HUD with 1-Click Expand/Collapse */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* 1. Live Epoch Pill */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">EPOCH:</span>
            <span className="text-zinc-200 font-bold min-w-[28px] text-right">
              {epoch.toLocaleString()}
            </span>
          </div>

          {/* 2. Live Loss Pill with Mini Sparkline */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">LOSS:</span>
            <span className="text-amber-400 font-bold min-w-[42px]">
              {currentLoss.toFixed(4)}
            </span>

            {/* Mini Sparkline */}
            <div className="flex items-center w-12 h-3.5">
              <svg className="w-12 h-3.5 overflow-visible" viewBox="0 0 48 16">
                {sparklinePoints ? (
                  <>
                    <defs>
                      <linearGradient id="dockLossSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon points={sparklineAreaPoints} fill="url(#dockLossSparkGrad)" />
                    <polyline
                      points={sparklinePoints}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  <line x1="0" y1="8" x2="48" y2="8" stroke="#3a3b40" strokeWidth="1" strokeDasharray="2,2" />
                )}
              </svg>
            </div>
          </div>

          {/* 3. Live Accuracy Pill */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">ACC:</span>
            <span className="text-emerald-400 font-bold min-w-[38px]">
              {(currentAccuracy <= 1 ? currentAccuracy * 100 : currentAccuracy).toFixed(1)}%
            </span>
          </div>

          {/* 4. 1-Click Expand/Collapse Deck Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse Diagnostics Drawer' : 'Expand Diagnostics Drawer'}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] border border-[#3a3b40] text-zinc-200 hover:text-white text-[11px] font-semibold transition-all"
          >
            <span className="hidden sm:inline">{isOpen ? 'COLLAPSE' : 'EXPAND'}</span>
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="flex-1 p-2 sm:p-3 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 overflow-y-auto">
          {/* Section 1: Loss & Accuracy Plot (3 or 4 cols) */}
          <div className="md:col-span-4 xl:col-span-3">
            <LossOscilloscope />
          </div>

          {/* Section 2: Decision Boundary (if in 2D mode, 3 cols) OR Step Math X-Ray */}
          {is2DMode && (
            <div className="md:col-span-3 xl:col-span-2">
              <DecisionBoundary />
            </div>
          )}

          {isMathMode && (
            <div className="md:col-span-4 xl:col-span-4">
              <StepMathXRay />
            </div>
          )}

          {/* Section 3: Retro Terminal Output & Output Gauges (remaining cols) */}
          <div
            className={
              is2DMode
                ? 'md:col-span-5 xl:col-span-7'
                : isMathMode
                ? 'md:col-span-4 xl:col-span-5'
                : 'md:col-span-8 xl:col-span-9'
            }
          >
            <TerminalLogs />
          </div>
        </div>
      )}
    </div>
  );
}
