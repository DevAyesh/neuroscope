'use client';

import React, { useState } from 'react';
import LossOscilloscope from './LossOscilloscope';
import LayerHistograms from './LayerHistograms';
import TerminalLogs from './TerminalLogs';
import DecisionBoundary from './DecisionBoundary';
import StepMathXRay from './StepMathXRay';
import { useNetworkStore } from '@/store/useNetworkStore';
import { formatLoss } from '@/lib/nn-engine';
import {
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  Activity,
  Terminal as TerminalIcon,
} from 'lucide-react';

export default function DiagnosticsDrawer() {
  const { epoch, currentLoss, currentAccuracy, valLoss, valAccuracy, lossHistory, currentPresetId } = useNetworkStore();
  // Expanded by default per Phase 3 Item 10
  const [isOpen, setIsOpen] = useState(true);
  const [activeDeckTab, setActiveDeckTab] = useState<'all' | 'chart' | 'boundary' | 'histograms' | 'terminal'>('all');

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
        isOpen ? (activeDeckTab === 'chart' ? 'h-96 sm:h-[370px] lg:h-[390px]' : 'h-80 sm:h-80 lg:h-80') : 'h-10'
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

          {/* Quick Deck View Tab Filter (visible when deck is expanded) */}
          {isOpen && (
            <div className="hidden lg:flex items-center space-x-1 bg-[#111215] p-0.5 rounded-[2px] border border-[#2a2b30] text-[10px]">
              <button
                onClick={() => setActiveDeckTab('all')}
                className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                  activeDeckTab === 'all'
                    ? 'bg-[#25272c] text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveDeckTab('chart')}
                className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                  activeDeckTab === 'chart'
                    ? 'bg-[#25272c] text-amber-300 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CHART
              </button>
              {is2DMode && (
                <button
                  onClick={() => setActiveDeckTab('boundary')}
                  className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                    activeDeckTab === 'boundary'
                      ? 'bg-[#25272c] text-sky-300 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  2D PAD
                </button>
              )}
              <button
                onClick={() => setActiveDeckTab('histograms')}
                className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                  activeDeckTab === 'histograms'
                    ? 'bg-[#25272c] text-blue-300 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                HISTOGRAMS
              </button>
              <button
                onClick={() => setActiveDeckTab('terminal')}
                className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                  activeDeckTab === 'terminal'
                    ? 'bg-[#25272c] text-zinc-100 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                LOGS
              </button>
            </div>
          )}
        </div>

        {/* Right: Floating Telemetry & Loss Pill HUD with 1-Click Expand/Collapse */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* 1. Live Epoch Pill */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">EPOCH:</span>
            <span className="text-zinc-200 font-bold min-w-[28px] text-right">
              {epoch.toLocaleString()}
            </span>
          </div>

          {/* 2. Live Train Loss Pill */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]" title="Training Loss">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">TRN LOSS:</span>
            <span className="text-amber-400 font-bold font-mono">
              {formatLoss(currentLoss)}
            </span>

            {/* Mini Sparkline */}
            <div className="hidden sm:flex items-center w-8 h-3.5 ml-0.5">
              <svg className="w-8 h-3.5 overflow-visible" viewBox="0 0 48 16">
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

          {/* 3. Live Val Loss Pill */}
          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]" title="Validation Loss">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">VAL LOSS:</span>
            <span className="text-sky-400 font-bold font-mono">
              {formatLoss(valLoss)}
            </span>
          </div>

          {/* 4. Live Train & Val Accuracy Pills */}
          <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]" title="Training Accuracy">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">TRN ACC:</span>
            <span className="text-emerald-400 font-bold">
              {(currentAccuracy <= 1 ? currentAccuracy * 100 : currentAccuracy).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[11px]" title="Validation Accuracy">
            <span className="text-[9px] text-zinc-400 font-bold uppercase">VAL ACC:</span>
            <span className="text-teal-300 font-bold">
              {(valAccuracy <= 1 ? valAccuracy * 100 : valAccuracy).toFixed(1)}%
            </span>
          </div>

          {/* 5. 1-Click Expand/Collapse Deck Button */}
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
        <div
          className={`flex-1 p-2 sm:p-2.5 min-h-0 ${
            activeDeckTab === 'chart' || activeDeckTab === 'boundary'
              ? 'flex flex-col overflow-hidden'
              : 'grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 overflow-hidden'
          }`}
        >
          {/* Section 1: Loss & Accuracy Plot (Larger chart by default, Requirement 10) */}
          {(activeDeckTab === 'all' || activeDeckTab === 'chart') && (
            <div
              className={
                activeDeckTab === 'chart'
                  ? 'w-full h-full flex flex-col min-h-0'
                  : is2DMode
                  ? 'md:col-span-6 lg:col-span-3 h-full min-h-0'
                  : isMathMode
                  ? 'md:col-span-6 lg:col-span-3 h-full min-h-0'
                  : 'md:col-span-4 lg:col-span-4 h-full min-h-0'
              }
            >
              <LossOscilloscope />
            </div>
          )}

          {/* Section 2: Decision Boundary (if in 2D mode) OR Step Math X-Ray */}
          {(activeDeckTab === 'all' || activeDeckTab === 'boundary') && is2DMode && (
            <div
              className={
                activeDeckTab === 'boundary'
                  ? 'w-full h-full flex flex-col min-h-0'
                  : 'md:col-span-6 lg:col-span-3 h-full min-h-0'
              }
            >
              <DecisionBoundary />
            </div>
          )}

          {activeDeckTab === 'all' && isMathMode && (
            <div className="md:col-span-6 lg:col-span-4 h-full min-h-0">
              <StepMathXRay />
            </div>
          )}

          {/* Section 3: Layer Histograms (Weights & Gradients, with Dead ReLU zero bars, Requirement 15) */}
          {(activeDeckTab === 'all' || activeDeckTab === 'histograms') && (
            <div
              className={
                activeDeckTab === 'histograms'
                  ? 'md:col-span-12 h-full min-h-0'
                  : is2DMode
                  ? 'md:col-span-6 lg:col-span-3 h-full min-h-0'
                  : isMathMode
                  ? 'md:col-span-6 lg:col-span-5 h-full min-h-0'
                  : 'md:col-span-4 lg:col-span-4 h-full min-h-0'
              }
            >
              <LayerHistograms />
            </div>
          )}

          {/* Section 4: Retro Terminal Output & Output Gauges */}
          {(activeDeckTab === 'all' || activeDeckTab === 'terminal') && (
            <div
              className={
                activeDeckTab === 'terminal'
                  ? 'md:col-span-12 h-full min-h-0'
                  : is2DMode
                  ? 'md:col-span-6 lg:col-span-3 h-full min-h-0'
                  : isMathMode
                  ? 'hidden'
                  : 'md:col-span-4 lg:col-span-4 h-full min-h-0'
              }
            >
              <TerminalLogs />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
