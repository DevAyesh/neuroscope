'use client';

import React, { useState, useMemo } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { BarChart3, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { formatLoss } from '@/lib/nn-engine';

export default function LayerHistograms() {
  const { engine, epoch, step, topology, setSelectedNeuron } = useNetworkStore();
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(1);

  // Keep selected layer index valid when topology changes
  const numLayers = engine.layers.length;
  const safeLayerIndex = Math.min(Math.max(1, selectedLayerIndex), Math.max(1, numLayers - 1));
  const currentLayer = engine.layers[safeLayerIndex];
  const isOutputLayer = safeLayerIndex === numLayers - 1;

  // 1. Compute weight distribution from incoming synapses
  const { weightBins, weightStats } = useMemo(() => {
    if (safeLayerIndex <= 0 || !engine.synapses[safeLayerIndex - 1]) {
      return { weightBins: [], weightStats: { count: 0, min: 0, max: 0, meanAbs: 0 } };
    }

    const weights: number[] = [];
    const layerSynapses = engine.synapses[safeLayerIndex - 1];
    for (let f = 0; f < layerSynapses.length; f++) {
      for (let t = 0; t < layerSynapses[f].length; t++) {
        weights.push(layerSynapses[f][t].weight);
      }
    }

    if (weights.length === 0) {
      return { weightBins: [], weightStats: { count: 0, min: 0, max: 0, meanAbs: 0 } };
    }

    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const maxAbs = Math.max(0.01, Math.max(Math.abs(min), Math.abs(max)));
    const meanAbs = weights.reduce((acc, w) => acc + Math.abs(w), 0) / weights.length;

    // 12 symmetric bins from -maxAbs to +maxAbs
    const binCount = 12;
    const binWidth = (2 * maxAbs) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      start: -maxAbs + i * binWidth,
      end: -maxAbs + (i + 1) * binWidth,
      count: 0,
    }));

    for (const w of weights) {
      const idx = Math.min(binCount - 1, Math.max(0, Math.floor((w + maxAbs) / binWidth)));
      bins[idx].count++;
    }

    return {
      weightBins: bins,
      weightStats: { count: weights.length, min, max, meanAbs },
    };
  }, [engine, safeLayerIndex, epoch, step]);

  // 2. Compute gradient distribution and detect dead ReLU neurons (zero gradients)
  const { gradBins, deadCount, totalNeurons, neuronsSummary } = useMemo(() => {
    if (!currentLayer) {
      return { gradBins: [], deadCount: 0, totalNeurons: 0, neuronsSummary: [] };
    }

    const neurons = currentLayer.neurons;
    const grads = neurons.map((n) => n.gradZ);
    let dead = 0;

    const summary = neurons.map((n) => {
      const isDeadRelu = n.isDead || (currentLayer.activation === 'relu' && Math.abs(n.gradZ) < 1e-6);
      if (isDeadRelu) dead++;
      return {
        id: n.id,
        index: n.neuronIndex,
        label: n.label || `N${n.neuronIndex}`,
        gradZ: n.gradZ,
        gradA: n.gradA,
        isDead: isDeadRelu,
        neuron: n,
      };
    });

    // Compute histogram bins for gradients
    const absGrads = grads.map((g) => Math.abs(g));
    const maxAbsGrad = Math.max(0.001, ...absGrads);

    // 8 bins: Bin 0 is specifically for Zero/Dead Gradients (|gradZ| < 1e-6)
    const activeBinCount = 7;
    const binWidth = maxAbsGrad / activeBinCount;

    const bins = [
      {
        label: '0 (DEAD)',
        isZeroBin: true,
        count: dead,
        tooltip: `${dead} dead / zero-gradient neuron(s)`,
      },
      ...Array.from({ length: activeBinCount }, (_, i) => {
        const start = i * binWidth;
        const end = (i + 1) * binWidth;
        const count = grads.filter((g) => {
          const ag = Math.abs(g);
          return ag >= 1e-6 && ag >= start && (i === activeBinCount - 1 ? ag <= end : ag < end);
        }).length;
        return {
          label: `${start.toFixed(2)}`,
          isZeroBin: false,
          count,
          tooltip: `${count} neuron(s) in range [${start.toFixed(3)}, ${end.toFixed(3)}]`,
        };
      }),
    ];

    return {
      gradBins: bins,
      deadCount: dead,
      totalNeurons: neurons.length,
      neuronsSummary: summary,
    };
  }, [currentLayer, epoch, step]);

  const maxWeightCount = Math.max(1, ...weightBins.map((b) => b.count));
  const maxGradCount = Math.max(1, ...gradBins.map((b) => b.count));

  return (
    <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-2.5 font-mono text-xs flex flex-col h-full justify-between overflow-hidden select-none">
      {/* Header with Layer Switcher Tabs */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2b30] flex-wrap gap-1">
        <div className="flex items-center space-x-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-[10px] text-zinc-200 uppercase font-bold tracking-wider">
            LAYER HISTOGRAMS
          </span>
          <span className="text-[9px] text-zinc-500 hidden sm:inline">• WEIGHTS & ∇z</span>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex items-center space-x-1">
          {engine.layers.slice(1).map((layer) => {
            const idx = layer.layerIndex;
            const isSelected = idx === safeLayerIndex;
            const isOut = idx === numLayers - 1;
            const title = isOut ? `OUT [${layer.size}]` : `H${idx} [${layer.size}]`;

            return (
              <button
                key={idx}
                onClick={() => setSelectedLayerIndex(idx)}
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border transition-colors ${
                  isSelected
                    ? 'bg-[#25272c] border-blue-500/80 text-blue-300'
                    : 'bg-[#1f2024] border-[#2a2b30] text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Inspect Layer ${idx} (${layer.size} neurons, activation: ${layer.activation.toUpperCase()})`}
              >
                {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dead ReLU Alert Banner (Requirement 15) */}
      <div className="my-1">
        {deadCount > 0 ? (
          <div className="flex items-center justify-between px-2 py-0.5 bg-red-950/40 border border-red-500/50 rounded-[2px] text-[10px] text-red-300">
            <span className="flex items-center space-x-1 font-bold">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>
                {deadCount} DEAD RELU NEURON{deadCount > 1 ? 'S' : ''} DETECTED
              </span>
            </span>
            <span className="text-[9px] text-red-400/80">
              Zero gradient (f&apos;(z) = 0). Switch to Leaky ReLU to revive.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 py-0.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] text-[10px] text-emerald-400">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-zinc-300">All neurons active</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              ACT: {currentLayer?.activation.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Two Histograms: Weights & Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-0 my-1">
        {/* 1. Weight Histogram */}
        <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#2a2b30]/60">
            <span className="text-zinc-300 font-bold">WEIGHTS (w)</span>
            <span className="text-zinc-500 text-[9px]" suppressHydrationWarning>
              {weightStats.count} Synapses | avg |w|: {weightStats.meanAbs.toFixed(3)}
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-16 pt-2 pb-1 gap-0.5">
            {weightBins.map((bin, i) => {
              const heightPct = Math.round((bin.count / maxWeightCount) * 100);
              const isNegative = bin.end <= 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                    <div className="bg-[#1f2024] border border-[#3a3b40] text-zinc-200 text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                      [{bin.start.toFixed(2)}, {bin.end.toFixed(2)}]: {bin.count}
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    className={`w-full rounded-t-[1px] transition-all ${
                      isNegative
                        ? 'bg-amber-500/80 hover:bg-amber-400'
                        : 'bg-sky-500/80 hover:bg-sky-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
            <span>{weightStats.min.toFixed(2)}</span>
            <span>0</span>
            <span>+{weightStats.max.toFixed(2)}</span>
          </div>
        </div>

        {/* 2. Gradient Histogram (|dL/dz|) */}
        <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#2a2b30]/60">
            <span className="text-zinc-300 font-bold">GRADIENTS (|∂L/∂z|)</span>
            <span className="text-zinc-500 text-[9px]">
              {totalNeurons} Neurons | {deadCount} Zero/Dead
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-16 pt-2 pb-1 gap-1">
            {gradBins.map((bin, i) => {
              const heightPct = Math.round((bin.count / maxGradCount) * 100);
              const isDeadBar = bin.isZeroBin;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                    <div className="bg-[#1f2024] border border-[#3a3b40] text-zinc-200 text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-bold">
                      {bin.tooltip}
                    </div>
                  </div>
                  {/* Bar: Red for zero/dead gradients per Phase 4 item 15 */}
                  <div
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    className={`w-full rounded-t-[1px] transition-all ${
                      isDeadBar
                        ? bin.count > 0
                          ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                          : 'bg-zinc-800'
                        : 'bg-purple-500/80 hover:bg-purple-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-red-400 font-bold">0 (DEAD)</span>
            <span className="text-zinc-500">LOW</span>
            <span className="text-purple-400">HIGH</span>
          </div>
        </div>
      </div>

      {/* Per-Neuron Quick Status Strip */}
      <div className="mt-1 pt-1.5 border-t border-[#2a2b30]/60 flex items-center gap-1 overflow-x-auto text-[9px] scrollbar-thin">
        <span className="text-zinc-500 text-[8px] uppercase font-bold shrink-0">NODES:</span>
        {neuronsSummary.slice(0, 16).map((n) => (
          <button
            key={n.id}
            onClick={() => setSelectedNeuron(n.neuron)}
            className={`px-1 py-0.2 rounded-[2px] border shrink-0 transition-colors ${
              n.isDead
                ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                : 'bg-[#1f2024] border-[#2a2b30] text-zinc-300 hover:border-zinc-500'
            }`}
            title={`Neuron ${n.id} | gradZ: ${n.gradZ.toFixed(4)} | Click to inspect`}
          >
            {n.isDead ? `†N${n.index}` : `N${n.index}`}
          </button>
        ))}
        {neuronsSummary.length > 16 && (
          <span className="text-zinc-500 text-[8px]">+{neuronsSummary.length - 16} more</span>
        )}
      </div>
    </div>
  );
}
