'use client';

import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import ActivationGraph from './ActivationGraph';
import {
  Calculator,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function StepMathXRay() {
  const {
    stepMathTraces,
    stepMathIndex,
    nextMathStep,
    prevMathStep,
    setMathPhase,
    currentPresetId,
    selectedNeuron,
    engine,
  } = useNetworkStore();

  const isMathMode = currentPresetId === 'step_math_xray' || selectedNeuron !== null;
  if (!isMathMode || stepMathTraces.length === 0) return null;

  const currentTrace = stepMathTraces[stepMathIndex] || stepMathTraces[0];
  const layer = engine.layers[currentTrace.currentLayer] || engine.layers[1] || engine.layers[0];
  const actName = layer?.activation || 'relu';

  return (
    <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-2.5 font-mono text-xs flex flex-col justify-between h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2a2b30] shrink-0">
        <div className="flex items-center space-x-1.5">
          <Calculator className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-200 uppercase font-semibold">
            MATH X-RAY STEP ENGINE
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {stepMathTraces.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setMathPhase(idx)}
              className={`w-4 h-4 rounded-[2px] text-[9px] font-bold flex items-center justify-center transition-colors border ${
                stepMathIndex === idx
                  ? 'bg-[#25272c] border-[#3a3b40] text-zinc-100'
                  : 'bg-[#111215] border-[#2a2b30] text-zinc-400 hover:text-white'
              }`}
              title={t.phaseName}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="space-y-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 overflow-y-auto flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-100">
            {currentTrace.phaseName}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[#1f2024] border border-[#2a2b30] text-zinc-300">
            Phase {stepMathIndex + 1}/5
          </span>
        </div>

        <p className="text-[10px] text-zinc-400 leading-relaxed">
          {currentTrace.explanation}
        </p>

        {/* Live Mathematical Formula Card */}
        <div className="p-1.5 bg-[#18191c] border border-[#2a2b30] rounded-[2px] font-mono text-[11px] text-zinc-200 overflow-x-auto whitespace-nowrap">
          <code>{currentTrace.formula}</code>
        </div>

        {/* Phase 3: Activation Function Graph */}
        {stepMathIndex === 2 && (
          <div className="pt-1">
            <ActivationGraph
              activation={actName}
              currentZ={currentTrace.zValue}
              currentA={currentTrace.aValue}
              width={180}
              height={70}
            />
          </div>
        )}

        {/* Value Badges */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {currentTrace.zValue !== undefined && (
            <div className="p-1 bg-[#1f2024] rounded-[2px] border border-[#2a2b30] flex justify-between">
              <span className="text-zinc-400">z (pre-act):</span>
              <span className="text-amber-400 font-bold">{currentTrace.zValue.toFixed(4)}</span>
            </div>
          )}

          {currentTrace.aValue !== undefined && (
            <div className="p-1 bg-[#1f2024] rounded-[2px] border border-[#2a2b30] flex justify-between">
              <span className="text-zinc-400">a (post-act):</span>
              <span className="text-blue-400 font-bold">{currentTrace.aValue.toFixed(4)}</span>
            </div>
          )}

          {currentTrace.lossValue !== undefined && (
            <div className="p-1 bg-[#1f2024] rounded-[2px] border border-[#2a2b30] flex justify-between">
              <span className="text-zinc-400">Loss (MSE):</span>
              <span className="text-red-400 font-bold">{currentTrace.lossValue.toFixed(6)}</span>
            </div>
          )}

          {currentTrace.gradZ !== undefined && (
            <div className="p-1 bg-[#1f2024] rounded-[2px] border border-[#2a2b30] flex justify-between">
              <span className="text-zinc-400">δ (∂L/∂z):</span>
              <span className="text-emerald-400 font-bold">{currentTrace.gradZ.toFixed(6)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 shrink-0">
        <button
          onClick={prevMathStep}
          className="flex items-center justify-center space-x-1 py-1 bg-[#1f2024] hover:bg-[#25272c] text-zinc-300 hover:text-white font-semibold rounded-[2px] text-xs transition-all border border-[#2a2b30]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>PREV STEP</span>
        </button>

        <button
          onClick={nextMathStep}
          className="flex items-center justify-center space-x-1 py-1 bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold rounded-[2px] text-xs transition-all border border-[#3a3b40]"
        >
          <span>NEXT STEP</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
