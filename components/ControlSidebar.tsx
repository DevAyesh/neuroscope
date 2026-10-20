'use client';

import React, { useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { PRESET_SCENARIOS, ActivationType, OptimizerType } from '@/lib/nn-engine';
import {
  Layers,
  Sliders,
  Plus,
  Minus,
  Sparkles,
  Zap,
  Activity,
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Gauge,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

export default function ControlSidebar() {
  const {
    topology,
    totalParameters,
    hiddenActivation,
    outputActivation,
    learningRate,
    optimizer,
    dropoutRate,
    trainingSpeed,
    showBackpropGradients,
    showOscilloscopes,
    showParticles,
    currentPresetId,
    addHiddenLayer,
    removeHiddenLayer,
    setLayerNeuronCount,
    setDropoutRate,
    setTrainingSpeed,
    setShowBackpropGradients,
    setShowOscilloscopes,
    setShowParticles,
    setHiddenActivation,
    setOptimizer,
    setLearningRate,
  } = useNetworkStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPreset = PRESET_SCENARIOS.find((p) => p.id === currentPresetId) || PRESET_SCENARIOS[0];

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] bg-[#0f141f] border-r border-[#1e293b] flex flex-col transition-all duration-300 z-30 font-mono select-none ${
        isCollapsed ? 'w-10' : 'w-72 lg:w-80'
      }`}
    >
      {/* Collapse/Expand Toggle Header */}
      <div className="h-9 px-3 bg-[#161d2d] border-b border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tracking-wider text-[11px] text-slate-200 uppercase">
              DEBUGGER CONTROLS
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-[#1e293b] text-slate-400 hover:text-cyan-400 rounded transition-colors ml-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* 1. Interactive Layer Topology Builder */}
          <div className="space-y-2.5 bg-[#0b0f19] p-3 rounded-lg border border-cyan-900/50 shadow-lg shadow-cyan-950/20">
            {/* Header with Title and Layer Add/Remove Buttons */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>TOPOLOGY BUILDER</span>
              </span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => removeHiddenLayer(topology.length - 2)}
                  disabled={topology.length <= 3}
                  title={topology.length <= 3 ? "Minimum 1 hidden layer required" : "Remove Last Hidden Layer"}
                  className="px-1.5 py-0.5 bg-[#161d2d] hover:bg-red-950/60 disabled:opacity-30 disabled:hover:bg-[#161d2d] disabled:cursor-not-allowed border border-[#1e293b] hover:border-red-500/50 text-slate-300 hover:text-red-300 disabled:text-slate-500 rounded text-[10px] flex items-center space-x-0.5 transition-colors"
                >
                  <Minus className="w-2.5 h-2.5" />
                  <span>LAYER</span>
                </button>
                <button
                  onClick={addHiddenLayer}
                  disabled={topology.length >= 8}
                  title={topology.length >= 8 ? "Maximum 6 hidden layers reached" : "Add Hidden Layer"}
                  className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 disabled:opacity-30 disabled:hover:bg-cyan-950/60 disabled:cursor-not-allowed border border-cyan-500/50 text-cyan-300 disabled:text-slate-500 rounded text-[10px] flex items-center space-x-0.5 transition-colors shadow-sm"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>LAYER</span>
                </button>
              </div>
            </div>

            {/* Visual Topology Chain Pills: e.g. [17] -> [26] -> [16] -> [8] */}
            <div className="bg-[#070a10] p-2 rounded border border-[#1e293b]/70 flex items-center flex-wrap gap-1.5 justify-center select-none">
              {topology.map((count, idx) => {
                const isInput = idx === 0;
                const isOutput = idx === topology.length - 1;
                const pillColor = isInput
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  : isOutput
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/50';
                const label = isInput ? 'IN' : isOutput ? 'OUT' : `H${idx}`;

                return (
                  <React.Fragment key={idx}>
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded border text-xs font-mono font-bold shadow-sm ${pillColor}`}
                      title={`${label} Layer: ${count} Neurons`}
                    >
                      <span className="text-[9px] opacity-70">{label}:</span>
                      <span>[{count}]</span>
                    </div>
                    {idx < topology.length - 1 && (
                      <span className="text-slate-500 font-bold text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Neuron Count Sliders for each Layer */}
            <div className="space-y-2 bg-[#090d16] p-2 rounded border border-[#1e293b]">
              {topology.map((count, layerIdx) => {
                const isInput = layerIdx === 0;
                const isOutput = layerIdx === topology.length - 1;
                const title = isInput
                  ? 'INPUT'
                  : isOutput
                  ? 'OUTPUT'
                  : `HIDDEN ${layerIdx}`;
                const titleColor = isInput
                  ? 'text-emerald-400'
                  : isOutput
                  ? 'text-cyan-400'
                  : 'text-amber-400';

                return (
                  <div
                    key={layerIdx}
                    className="flex items-center justify-between space-x-1.5 text-[11px] py-1 border-b border-[#1e293b]/40 last:border-0"
                  >
                    <div className="w-16 truncate">
                      <span className={`font-semibold ${titleColor}`}>
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 flex-1">
                      <button
                        onClick={() => setLayerNeuronCount(layerIdx, Math.max(1, count - 1))}
                        disabled={count <= 1}
                        className="w-4 h-4 flex items-center justify-center bg-[#161d2d] hover:bg-[#1e293b] disabled:opacity-30 rounded text-[10px] text-slate-300 border border-[#1e293b]"
                        title="Decrement 1 Neuron"
                      >
                        -
                      </button>

                      <input
                        type="range"
                        min="1"
                        max="32"
                        value={count}
                        onChange={(e) =>
                          setLayerNeuronCount(layerIdx, parseInt(e.target.value, 10))
                        }
                        className="w-full accent-cyan-400 h-1 cursor-pointer"
                      />

                      <button
                        onClick={() => setLayerNeuronCount(layerIdx, Math.min(32, count + 1))}
                        disabled={count >= 32}
                        className="w-4 h-4 flex items-center justify-center bg-[#161d2d] hover:bg-[#1e293b] disabled:opacity-30 rounded text-[10px] text-slate-300 border border-[#1e293b]"
                        title="Increment 1 Neuron"
                      >
                        +
                      </button>

                      <span className="w-7 text-right font-bold text-slate-200">
                        {count}N
                      </span>
                    </div>

                    {!isInput && !isOutput && topology.length > 3 && (
                      <button
                        onClick={() => removeHiddenLayer(layerIdx)}
                        title="Delete This Hidden Layer"
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors ml-1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Architecture Metadata Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 px-1 font-mono">
              <span>{topology.length} LAYERS</span>
              <span className="text-slate-600">•</span>
              <span>{topology.reduce((a, b) => a + b, 0)} NODES</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-bold">{totalParameters.toLocaleString()} PARAMS</span>
            </div>
          </div>

          {/* 2. Simulation Speed & Engine Settings */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>EXECUTION KERNEL</span>
            </span>

            <div className="space-y-2.5 bg-[#090d16] p-2.5 rounded border border-[#1e293b]">
              {/* Training Speed */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">SIMULATION VELOCITY:</span>
                  <span className="text-purple-300 font-bold">{trainingSpeed}x</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 5, 10].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setTrainingSpeed(speed)}
                      className={`py-1 rounded text-[10px] border transition-colors ${
                        trainingSpeed === speed
                          ? 'bg-purple-950/70 border-purple-500/70 text-purple-300'
                          : 'bg-[#161d2d] border-[#1e293b] text-slate-400 hover:bg-[#1e293b]'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropout Rate */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">RANDOM DROPOUT:</span>
                  <span className="text-amber-300 font-bold">
                    {(dropoutRate * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={dropoutRate}
                  onChange={(e) => setDropoutRate(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1 cursor-pointer"
                />
              </div>

              {/* Optimizer Type */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">OPTIMIZER:</span>
                <div className="flex space-x-1">
                  {(['momentum', 'sgd'] as OptimizerType[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setOptimizer(opt)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase border transition-colors ${
                        optimizer === opt
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-[#161d2d] border-[#1e293b] text-slate-400 hover:bg-[#1e293b]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Visual & Particle Toggles */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>VISUALIZER LAYERS</span>
            </span>

            <div className="space-y-2 bg-[#090d16] p-2.5 rounded border border-[#1e293b] text-[11px]">
              {/* Backprop Gradients */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Show Backprop Gradients</span>
                <input
                  type="checkbox"
                  checked={showBackpropGradients}
                  onChange={(e) => setShowBackpropGradients(e.target.checked)}
                  className="w-3.5 h-3.5 accent-pink-500 rounded bg-[#1e293b] cursor-pointer"
                />
              </label>

              {/* Input Oscilloscopes */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Live Input Oscilloscopes</span>
                <input
                  type="checkbox"
                  checked={showOscilloscopes}
                  onChange={(e) => setShowOscilloscopes(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded bg-[#1e293b] cursor-pointer"
                />
              </label>

              {/* Signal Particles */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Signal Particles</span>
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                  className="w-3.5 h-3.5 accent-cyan-500 rounded bg-[#1e293b] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 4. Educational Scenario Briefing & Tips */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>SCENARIO BRIEFING</span>
            </span>

            <div className="p-2.5 bg-[#090d16] rounded border border-cyan-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-[11px]">
                  {currentPreset.title}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${currentPreset.badgeColor}`}
                >
                  {currentPreset.badge}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                {currentPreset.description}
              </p>

              <div className="pt-2 border-t border-[#1e293b] space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">
                  FIELD EXPERIMENTS:
                </span>
                <ul className="text-[10px] text-slate-300 space-y-1 pl-2">
                  {currentPreset.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
