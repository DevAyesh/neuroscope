'use client';

import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { TrendingDown, Activity } from 'lucide-react';

export default function LossOscilloscope() {
  const { lossHistory, currentLoss, currentAccuracy, epoch, step } = useNetworkStore();

  const width = 280;
  const height = 90;
  const padding = 12;

  // Compute SVG polyline points for loss
  let lossPoints = '';
  let accPoints = '';

  if (lossHistory.length > 1) {
    const maxLoss = Math.max(0.1, ...lossHistory.map((h) => h.loss));
    const minLoss = Math.min(...lossHistory.map((h) => h.loss));
    const lossRange = Math.max(0.01, maxLoss - minLoss);

    lossPoints = lossHistory
      .map((h, i) => {
        const x = padding + (i / (lossHistory.length - 1)) * (width - 2 * padding);
        const norm = (h.loss - minLoss) / lossRange;
        const y = height - padding - norm * (height - 2 * padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    accPoints = lossHistory
      .map((h, i) => {
        const x = padding + (i / (lossHistory.length - 1)) * (width - 2 * padding);
        const norm = (h.accuracy || 0) / 100;
        const y = height - padding - norm * (height - 2 * padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <div className="bg-[#090d16] border border-[#1e293b] rounded-md p-2.5 font-mono text-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold">
            LOSS & ACCURACY OSCILLOSCOPE
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="text-amber-400">
            L: <span className="font-bold">{currentLoss.toFixed(4)}</span>
          </span>
          <span className="text-emerald-400">
            ACC: <span className="font-bold">{currentAccuracy.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div className="relative w-full h-[85px] bg-[#07090e] border border-[#1e293b]/60 rounded overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-slate-700" />
          <div className="border-r border-b border-slate-700" />
          <div className="border-r border-b border-slate-700" />
          <div className="border-b border-slate-700" />
          <div className="border-r border-b border-slate-700" />
          <div className="border-r border-b border-slate-700" />
          <div className="border-r border-b border-slate-700" />
          <div className="border-b border-slate-700" />
          <div className="border-r border-slate-700" />
          <div className="border-r border-slate-700" />
          <div className="border-r border-slate-700" />
          <div />
        </div>

        {lossHistory.length > 1 ? (
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Loss Polyline (Amber) */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={lossPoints}
            />

            {/* Accuracy Polyline (Emerald) */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              points={accPoints}
            />
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-slate-500">
            Buffering telemetry data...
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-1 right-2 flex items-center space-x-2 text-[9px]">
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" />
            <span>Loss</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
            <span>Accuracy</span>
          </span>
        </div>
      </div>

      {/* Epoch Footer */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
        <span>EPOCH: {epoch}</span>
        <span>STEPS: {step.toLocaleString()}</span>
      </div>
    </div>
  );
}
