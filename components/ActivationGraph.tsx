'use client';

import React from 'react';
import { ActivationType, ACTIVATIONS } from '@/lib/nn-engine';

interface ActivationGraphProps {
  activation: ActivationType;
  currentZ?: number;
  currentA?: number;
  width?: number;
  height?: number;
}

export default function ActivationGraph({
  activation,
  currentZ = 0,
  currentA,
  width = 160,
  height = 90,
}: ActivationGraphProps) {
  const actInfo = ACTIVATIONS[activation] || ACTIVATIONS.relu;
  const computedA = currentA !== undefined ? currentA : actInfo.fn(currentZ);
  const derivative = actInfo.df(currentZ, computedA);

  const padding = 12;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Domain for z: [-3.5, 3.5]
  const zMin = -3.5;
  const zMax = 3.5;

  // Range for a: depends on activation
  let aMin = -1.2;
  let aMax = 1.2;
  if (activation === 'relu' || activation === 'leaky_relu') {
    aMin = -0.5;
    aMax = 3.5;
  } else if (activation === 'sigmoid') {
    aMin = -0.1;
    aMax = 1.1;
  } else if (activation === 'linear') {
    aMin = -3.5;
    aMax = 3.5;
  }

  const mapX = (z: number) => padding + ((z - zMin) / (zMax - zMin)) * plotWidth;
  const mapY = (a: number) => padding + plotHeight - ((a - aMin) / (aMax - aMin)) * plotHeight;

  // Generate curve points
  const points: string[] = [];
  const samples = 48;
  for (let i = 0; i <= samples; i++) {
    const z = zMin + (i / samples) * (zMax - zMin);
    const a = actInfo.fn(z);
    const px = mapX(z);
    const py = Math.max(padding - 2, Math.min(height - padding + 2, mapY(a)));
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const polylineStr = points.join(' ');

  // Current operating point coordinates
  const curX = Math.max(padding, Math.min(width - padding, mapX(currentZ)));
  const curY = Math.max(padding, Math.min(height - padding, mapY(computedA)));

  const zeroX = mapX(0);
  const zeroY = mapY(0);

  return (
    <div className="bg-[#07090e] border border-cyan-900/40 rounded p-2 font-mono text-[10px] select-none shadow-inner">
      <div className="flex items-center justify-between text-slate-400 mb-1">
        <span className="text-cyan-400 font-bold uppercase">{actInfo.name} CURVE</span>
        <span className="text-[9px] text-slate-500">f&apos;(z)={derivative.toFixed(3)}</span>
      </div>

      <div className="relative mx-auto flex items-center justify-center">
        <svg width={width} height={height} className="block overflow-hidden rounded bg-[#0b0f19]">
          {/* Grid Zero Axes */}
          {zeroY >= padding && zeroY <= height - padding && (
            <line
              x1={padding}
              y1={zeroY}
              x2={width - padding}
              y2={zeroY}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
          )}
          {zeroX >= padding && zeroX <= width - padding && (
            <line
              x1={zeroX}
              y1={padding}
              x2={zeroX}
              y2={height - padding}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
          )}

          {/* Activation Curve */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Tangent Slope Line at Current Point */}
          {derivative !== undefined && (
            <line
              x1={curX - 14}
              y1={curY + 14 * derivative * (plotHeight / plotWidth)}
              x2={curX + 14}
              y2={curY - 14 * derivative * (plotHeight / plotWidth)}
              stroke="#ec4899"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              opacity="0.85"
            />
          )}

          {/* Current Operating Dot */}
          <circle cx={curX} cy={curY} r="4.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx={curX} cy={curY} r="7" fill="none" stroke="#fef08a" strokeWidth="0.8" opacity="0.6">
            <animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 px-1">
        <span>z: <strong className="text-amber-400">{currentZ.toFixed(2)}</strong></span>
        <span>a: <strong className="text-cyan-300">{computedA.toFixed(2)}</strong></span>
      </div>
    </div>
  );
}
