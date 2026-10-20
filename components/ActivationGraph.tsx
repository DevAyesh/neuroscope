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
    <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 font-mono text-[10px] select-none shadow-none">
      <div className="flex items-center justify-between text-zinc-400 mb-1">
        <span className="text-zinc-200 font-bold uppercase">{actInfo.name} CURVE</span>
        <span className="text-[9px] text-zinc-500">f′(z)={derivative.toFixed(3)}</span>
      </div>

      <div className="relative mx-auto flex items-center justify-center">
        <svg width={width} height={height} className="block overflow-hidden rounded-[2px] bg-[#18191c]">
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
            stroke="#3b82f6"
            strokeWidth="1.8"
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
          <circle cx={curX} cy={curY} r="3.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-1 px-1">
        <span>z: <strong className="text-amber-400">{currentZ.toFixed(2)}</strong></span>
        <span>a: <strong className="text-zinc-200">{computedA.toFixed(2)}</strong></span>
      </div>
    </div>
  );
}
