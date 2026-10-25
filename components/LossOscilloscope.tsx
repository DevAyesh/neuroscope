'use client';

import React, { useState, useRef } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { formatLoss } from '@/lib/nn-engine';
import { Activity } from 'lucide-react';

export default function LossOscilloscope() {
  const { lossHistory, currentLoss, currentAccuracy, valLoss, valAccuracy, epoch, step } = useNetworkStore();
  const [isLogScale, setIsLogScale] = useState(false);
  const [isZeroBaseline, setIsZeroBaseline] = useState(true);
  const [showLoss, setShowLoss] = useState(true);
  const [showAcc, setShowAcc] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const viewBoxW = 800;
  const viewBoxH = 220;
  const padLeft = 52;
  const padRight = 44;
  const padTop = 16;
  const padBottom = 22;
  const plotW = viewBoxW - padLeft - padRight;
  const plotH = viewBoxH - padTop - padBottom;

  // Compute SVG polyline points for loss & accuracy
  let trainLossPoints = '';
  let valLossPoints = '';
  let trainAccPoints = '';
  let valAccPoints = '';

  let lossTop = 1.0;
  let lossBottom = 0.0;
  const hasData = lossHistory.length > 1;

  if (hasData) {
    const allLosses = lossHistory.flatMap((h) => [h.loss, h.valLoss ?? h.loss]);
    const maxLossRaw = Math.max(0.01, ...allLosses);
    const minLossRaw = Math.max(1e-6, Math.min(...allLosses));

    if (isLogScale) {
      lossBottom = Math.floor(Math.log10(minLossRaw));
      lossTop = Math.max(lossBottom + 1, Math.ceil(Math.log10(maxLossRaw)));
    } else if (isZeroBaseline) {
      lossBottom = 0;
      lossTop = Math.max(0.05, maxLossRaw * 1.15);
    } else {
      const span = Math.max(0.001, maxLossRaw - minLossRaw);
      lossBottom = Math.max(0, minLossRaw - span * 0.1);
      lossTop = maxLossRaw + span * 0.1;
    }

    const calcLossY = (l: number) => {
      if (isLogScale) {
        const logVal = Math.log10(Math.max(1e-6, l));
        const norm = (logVal - lossBottom) / Math.max(0.1, lossTop - lossBottom);
        return (padTop + plotH) - Math.max(0, Math.min(1, norm)) * plotH;
      } else {
        const norm = (l - lossBottom) / Math.max(0.001, lossTop - lossBottom);
        return (padTop + plotH) - Math.max(0, Math.min(1, norm)) * plotH;
      }
    };

    const calcAccY = (acc: number) => {
      const norm = Math.max(0, Math.min(100, acc || 0)) / 100;
      return (padTop + plotH) - norm * plotH;
    };

    trainLossPoints = lossHistory
      .map((h, i) => {
        const x = padLeft + (i / (lossHistory.length - 1)) * plotW;
        const y = calcLossY(h.loss);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    valLossPoints = lossHistory
      .map((h, i) => {
        const x = padLeft + (i / (lossHistory.length - 1)) * plotW;
        const y = calcLossY(h.valLoss ?? h.loss);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    // 5-point moving average smoothing on accuracy points to prevent dense barcode artifacts
    const smoothedTrainAcc = lossHistory.map((_, i) => {
      const window = lossHistory.slice(Math.max(0, i - 2), Math.min(lossHistory.length, i + 3));
      return window.reduce((sum, h) => sum + (h.accuracy || 0), 0) / window.length;
    });

    const smoothedValAcc = lossHistory.map((_, i) => {
      const window = lossHistory.slice(Math.max(0, i - 2), Math.min(lossHistory.length, i + 3));
      return window.reduce((sum, h) => sum + (h.valAccuracy ?? h.accuracy ?? 0), 0) / window.length;
    });

    trainAccPoints = smoothedTrainAcc
      .map((acc, i) => {
        const x = padLeft + (i / (lossHistory.length - 1)) * plotW;
        const y = calcAccY(acc);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    valAccPoints = smoothedValAcc
      .map((acc, i) => {
        const x = padLeft + (i / (lossHistory.length - 1)) * plotW;
        const y = calcAccY(acc);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  // Generate 4 horizontal grid intervals
  const hGrid = [0, 0.333, 0.667, 1.0].map((frac) => {
    const y = padTop + (1 - frac) * plotH;
    let lossLabel = '';
    if (isLogScale) {
      const val = lossBottom + frac * (lossTop - lossBottom);
      lossLabel = `1e${val.toFixed(0)}`;
    } else {
      const val = lossBottom + frac * (lossTop - lossBottom);
      lossLabel = formatLoss(val);
    }
    const accLabel = `${Math.round(frac * 100)}%`;
    return { y, lossLabel, accLabel, frac };
  });

  // Generate 4 vertical grid intervals
  const vGrid = [0, 0.333, 0.667, 1.0].map((frac) => {
    const x = padLeft + frac * plotW;
    let epochLabel = '';
    if (hasData) {
      const idx = Math.min(lossHistory.length - 1, Math.round(frac * (lossHistory.length - 1)));
      epochLabel = `E${lossHistory[idx]?.epoch ?? 0}`;
    }
    return { x, epochLabel, frac };
  });

  // Hover data calculation
  const hoveredPoint = hoverIndex !== null && lossHistory[hoverIndex] ? lossHistory[hoverIndex] : null;
  const hoverX = hoveredPoint && hasData ? padLeft + (hoverIndex! / (lossHistory.length - 1)) * plotW : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasData || !svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = rect.width / viewBoxW;
    const padLeftPx = padLeft * scaleX;
    const plotWPx = plotW * scaleX;

    const frac = (mouseX - padLeftPx) / plotWPx;
    const idx = Math.round(frac * (lossHistory.length - 1));
    if (idx >= 0 && idx < lossHistory.length) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-2 sm:p-2.5 font-mono text-xs flex flex-col h-full min-h-0 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1 shrink-0">
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">
            LOSS & ACCURACY PLOT
          </span>
          <span className="hidden sm:inline text-[9px] text-zinc-500 font-normal">
            (Dual Y-Axis)
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px]">
          {/* Loss Curve Visibility Toggle */}
          <button
            onClick={() => setShowLoss(!showLoss)}
            className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold border transition-colors ${
              showLoss
                ? 'bg-[#25272c] border-amber-500/70 text-amber-300'
                : 'bg-[#1f2024] border-[#2a2b30] text-zinc-500 hover:text-zinc-300'
            }`}
            title={showLoss ? 'Loss curves visible. Click to hide.' : 'Loss curves hidden. Click to show.'}
          >
            LOSS
          </button>

          {/* Accuracy Curve Visibility Toggle */}
          <button
            onClick={() => setShowAcc(!showAcc)}
            className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold border transition-colors ${
              showAcc
                ? 'bg-[#25272c] border-emerald-500/70 text-emerald-300'
                : 'bg-[#1f2024] border-[#2a2b30] text-zinc-500 hover:text-zinc-300'
            }`}
            title={showAcc ? 'Accuracy curves visible. Click to hide.' : 'Accuracy curves hidden. Click to show.'}
          >
            ACC
          </button>

          {/* Linear / Log Toggle */}
          <button
            onClick={() => setIsLogScale(!isLogScale)}
            className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold border transition-colors ${
              isLogScale
                ? 'bg-[#25272c] border-amber-500/60 text-amber-300'
                : 'bg-[#1f2024] border-[#2a2b30] text-zinc-400 hover:text-zinc-200'
            }`}
            title={isLogScale ? 'Log scale active. Click for linear.' : 'Linear scale active. Click for log scale.'}
          >
            {isLogScale ? 'LOG' : 'LIN'}
          </button>

          {/* 0-Baseline vs Zoom Toggle (in linear mode) */}
          {!isLogScale && (
            <button
              onClick={() => setIsZeroBaseline(!isZeroBaseline)}
              className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold border transition-colors ${
                isZeroBaseline
                  ? 'bg-[#1f2024] border-[#2a2b30] text-zinc-300 hover:text-white'
                  : 'bg-[#25272c] border-sky-500/60 text-sky-300'
              }`}
              title={isZeroBaseline ? '0-Baseline active. Click to auto-zoom.' : 'Auto-zoom active. Click for 0-baseline.'}
            >
              {isZeroBaseline ? '0-BASE' : 'ZOOM'}
            </button>
          )}

          {/* Live Values */}
          {showLoss && (
            <>
              <span className="text-amber-400 font-mono" title="Training Loss">
                TL: <span className="font-bold">{formatLoss(currentLoss)}</span>
              </span>
              <span className="text-sky-400 font-mono" title="Validation Loss">
                VL: <span className="font-bold">{formatLoss(valLoss)}</span>
              </span>
            </>
          )}
          {showAcc && (
            <>
              <span className="text-emerald-400 font-mono hidden sm:inline" title="Training Accuracy">
                TA: <span className="font-bold">{(currentAccuracy || 0).toFixed(1)}%</span>
              </span>
              <span className="text-teal-300 font-mono hidden md:inline" title="Validation Accuracy">
                VA: <span className="font-bold">{(valAccuracy || 0).toFixed(1)}%</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* SVG Plot Canvas */}
      <div
        ref={svgContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative w-full flex-1 min-h-0 bg-[#111215] border border-[#2a2b30] rounded-[2px] overflow-hidden cursor-crosshair flex flex-col"
      >
        {hasData ? (
          <svg
            className="w-full h-full block"
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            preserveAspectRatio="none"
          >
            {/* Grid Lines & Labels */}
            {hGrid.map((g, idx) => (
              <g key={`h-${idx}`}>
                <line
                  x1={padLeft}
                  y1={g.y}
                  x2={padLeft + plotW}
                  y2={g.y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray={g.frac === 0 || g.frac === 1 ? 'none' : '3,3'}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Left Y Axis (Loss) */}
                <text
                  x={padLeft - 6}
                  y={g.y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {g.lossLabel}
                </text>
                {/* Right Y Axis (Accuracy) */}
                {showAcc && (
                  <text
                    x={padLeft + plotW + 6}
                    y={g.y + 3}
                    textAnchor="start"
                    fill="#10b981"
                    fillOpacity="0.75"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {g.accLabel}
                  </text>
                )}
              </g>
            ))}

            {/* Vertical Grid Lines & Epoch Labels */}
            {vGrid.map((v, idx) => (
              <g key={`v-${idx}`}>
                <line
                  x1={v.x}
                  y1={padTop}
                  x2={v.x}
                  y2={padTop + plotH}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2,3"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={v.x}
                  y={padTop + plotH + 14}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {v.epochLabel}
                </text>
              </g>
            ))}

            {/* Left Y-axis vertical boundary line */}
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + plotH}
              stroke="#3f3f46"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            {/* Right Y-axis vertical boundary line */}
            <line
              x1={padLeft + plotW}
              y1={padTop}
              x2={padLeft + plotW}
              y2={padTop + plotH}
              stroke="#3f3f46"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            {/* Train Accuracy Polyline (Emerald Dashed) */}
            {showAcc && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                points={trainAccPoints}
              />
            )}

            {/* Val Accuracy Polyline (Teal Dashed) */}
            {showAcc && (
              <polyline
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.4"
                strokeDasharray="3,3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                points={valAccPoints}
              />
            )}

            {/* Train Loss Polyline (Amber Solid) */}
            {showLoss && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                points={trainLossPoints}
              />
            )}

            {/* Validation Loss Polyline (Sky Blue Solid) */}
            {showLoss && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                points={valLossPoints}
              />
            )}

            {/* Interactive Crosshair Line */}
            {hoverX !== null && (
              <line
                x1={hoverX}
                y1={padTop}
                x2={hoverX}
                y2={padTop + plotH}
                stroke="#a1a1aa"
                strokeWidth="1"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-zinc-500">
            Buffering telemetry data...
          </div>
        )}

        {/* Hover Inspector Tooltip Pill */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#18191c]/95 border border-[#3a3b40] shadow-lg px-2.5 py-1 rounded-[2px] flex items-center space-x-3 text-[10px] font-mono pointer-events-none z-10">
            <span className="text-zinc-300 font-bold">Epoch {hoveredPoint.epoch}</span>
            {showLoss && (
              <>
                <span className="text-amber-400">TL: {formatLoss(hoveredPoint.loss)}</span>
                <span className="text-sky-400">VL: {formatLoss(hoveredPoint.valLoss)}</span>
              </>
            )}
            {showAcc && (
              <>
                <span className="text-emerald-400">TA: {(hoveredPoint.accuracy || 0).toFixed(1)}%</span>
                <span className="text-teal-300">VA: {(hoveredPoint.valAccuracy || 0).toFixed(1)}%</span>
              </>
            )}
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-1 right-2 flex items-center space-x-2 text-[9px] bg-[#111215]/85 px-1.5 py-0.5 rounded-[2px] border border-[#2a2b30]/60 pointer-events-none">
          {showLoss && (
            <>
              <span className="flex items-center space-x-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" />
                <span>Train L</span>
              </span>
              <span className="flex items-center space-x-1 text-sky-400">
                <span className="w-2 h-0.5 bg-sky-400 inline-block" />
                <span>Val L</span>
              </span>
            </>
          )}
          {showAcc && (
            <>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-0.5 border-b border-dashed border-emerald-400 inline-block" />
                <span>Train Acc</span>
              </span>
              <span className="flex items-center space-x-1 text-teal-300">
                <span className="w-2 h-0.5 border-b border-dashed border-teal-300 inline-block" />
                <span>Val Acc</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Epoch Footer Bar */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400 shrink-0">
        <span>EPOCH: {epoch.toLocaleString()}</span>
        <span>STEPS: {step.toLocaleString()}</span>
        <span>SAMPLES: {lossHistory.length}</span>
        <span>
          MODE:{' '}
          <span className="text-zinc-200">
            {isLogScale ? 'LOG10' : isZeroBaseline ? 'LINEAR (0-BASE)' : 'LINEAR (ZOOM)'}
          </span>
        </span>
      </div>
    </div>
  );
}
