'use client';

import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { ACTIVATIONS } from '@/lib/nn-engine';
import ActivationGraph from './ActivationGraph';
import {
  X,
  Zap,
  Activity,
  Calculator,
  Skull,
  Power,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export default function NeuronInspector() {
  const {
    engine,
    selectedNeuron,
    hoveredNeuron,
    setSelectedNeuron,
    toggleNeuronDisabled,
    syncMetrics,
    addLog,
  } = useNetworkStore();

  const target = selectedNeuron || hoveredNeuron;
  if (!target) return null;

  const layer = engine.layers[target.layerIndex];
  if (!layer) return null;
  const neuron = layer.neurons[target.neuronIndex];
  if (!neuron) return null;

  const isInput = layer.isInput;
  const isOutput = layer.isOutput;
  const prevLayer = target.layerIndex > 0 ? engine.layers[target.layerIndex - 1] : null;
  const actInfo = ACTIVATIONS[layer.activation];

  // Incoming Synapses
  const incomingWeights: {
    sourceLabel: string;
    sourceA: number;
    weight: number;
    product: number;
    gradient: number;
  }[] = [];

  if (prevLayer) {
    for (let f = 0; f < prevLayer.size; f++) {
      const srcNeuron = prevLayer.neurons[f];
      const syn = engine.synapses[target.layerIndex - 1]?.[f]?.[target.neuronIndex];
      if (syn) {
        incomingWeights.push({
          sourceLabel: srcNeuron.label,
          sourceA: srcNeuron.a,
          weight: syn.weight,
          product: srcNeuron.a * syn.weight,
          gradient: syn.weightGradient,
        });
      }
    }
  }

  // Handle manual bias reset
  const handleResetBias = () => {
    neuron.bias = 0;
    neuron.biasGradient = 0;
    neuron.biasVelocity = 0;
    syncMetrics();
    addLog('info', `Reset bias of ${neuron.label} to 0.000`);
  };

  // Handle manual noise injection
  const handlePerturbNeuron = () => {
    if (prevLayer) {
      for (let f = 0; f < prevLayer.size; f++) {
        const syn = engine.synapses[target.layerIndex - 1]?.[f]?.[target.neuronIndex];
        if (syn) {
          syn.weight += (Math.random() - 0.5) * 0.4;
        }
      }
      neuron.bias += (Math.random() - 0.5) * 0.2;
      syncMetrics();
      addLog('warn', `Injected Gaussian noise into ${neuron.label} incoming synapses.`);
    }
  };

  return (
    <div
      id="neuron-inspector-panel"
      className="absolute right-4 top-14 w-84 max-w-[calc(100vw-32px)] bg-[#18191c] border border-[#2a2b30] rounded-[2px] shadow-lg backdrop-blur-md z-30 font-mono text-xs overflow-hidden flex flex-col max-h-[82vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1f2024] border-b border-[#2a2b30]">
        <div className="flex items-center space-x-2">
          <Calculator className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-bold text-zinc-200">
            NEURON INSPECTOR: <span className="text-zinc-100 font-bold">{neuron.label}</span>
          </span>
          {neuron.disabled && (
            <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#111215] border border-red-500/60 text-red-400">
              KILLED
            </span>
          )}
          {neuron.isDead && !neuron.disabled && (
            <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#111215] border border-red-500/80 text-red-300 flex items-center space-x-1">
              <Skull className="w-2.5 h-2.5" />
              <span>DEAD ReLU</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setSelectedNeuron(null)}
          className="text-zinc-400 hover:text-white p-1 rounded-[2px] hover:bg-[#2a2b30] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto">
        {/* State Indicators Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
            <div className="text-zinc-400 text-[10px]">PRE-ACTIVATION (z)</div>
            <div className="text-amber-400 font-bold text-sm">
              {neuron.z.toFixed(4)}
            </div>
            <div className="text-[9px] text-zinc-500">∑ (wᵢ · xᵢ) + b</div>
          </div>

          <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
            <div className="text-zinc-400 text-[10px]">POST-ACTIVATION (a)</div>
            <div className="text-blue-400 font-bold text-sm">
              {neuron.a.toFixed(4)}
            </div>
            <div className="text-[9px] text-zinc-500">{actInfo.name.toUpperCase()}(z)</div>
          </div>

          {!isInput && (
            <>
              <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
                <div className="text-zinc-400 text-[10px]">BIAS (b)</div>
                <div className="text-zinc-200 font-bold">
                  {neuron.bias.toFixed(4)}
                </div>
                <div className="text-[9px] text-zinc-500">
                  ∂L/∂b: {neuron.biasGradient.toFixed(4)}
                </div>
              </div>

              <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
                <div className="text-zinc-400 text-[10px]">GRADIENT (δ = ∂L/∂z)</div>
                <div
                  className={`font-bold ${
                    Math.abs(neuron.gradZ) < 1e-4
                      ? 'text-red-400'
                      : Math.abs(neuron.gradZ) > 0.5
                      ? 'text-purple-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {neuron.gradZ.toFixed(6)}
                </div>
                <div className="text-[9px] text-zinc-500">
                  Sensitivity δ
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Mathematical Formula Card */}
        <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-2">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>LIVE MATHEMATICAL FORMULA</span>
            <span className="text-zinc-200 font-bold">{layer.activation.toUpperCase()}</span>
          </div>
          <div className="p-2 bg-[#18191c] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200 overflow-x-auto space-y-1">
            {isInput ? (
              <div>x<sub>{target.neuronIndex + 1}</sub> = {neuron.a.toFixed(4)} (Direct Signal Feed)</div>
            ) : (
              <>
                <div className="text-zinc-400 text-[9px]">
                  a = ACT(∑ (wᵢ · xᵢ) + b)
                </div>
                <div className="text-zinc-200 font-semibold truncate">
                  z = ({incomingWeights.slice(0, 3).map((w) => `${w.weight.toFixed(2)} · ${w.sourceA.toFixed(2)}`).join(' + ')}{incomingWeights.length > 3 ? ' + ...' : ''}) + ({neuron.bias.toFixed(3)}) = {neuron.z.toFixed(4)}
                </div>
                <div className="text-amber-300 font-bold">
                  a = {actInfo.name}({neuron.z.toFixed(4)}) = {neuron.a.toFixed(4)}
                </div>
              </>
            )}
          </div>

          {!isInput && (
            <div className="pt-1">
              <ActivationGraph
                activation={layer.activation}
                currentZ={neuron.z}
                currentA={neuron.a}
                width={200}
                height={65}
              />
            </div>
          )}

          <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-[#2a2b30]">
            <span>Local Sensitivity f′(z):</span>
            <span className="text-zinc-200 font-bold">
              {actInfo.df(neuron.z, neuron.a).toFixed(4)}
            </span>
          </div>
        </div>

        {/* Incoming Synapses Table */}
        {!isInput && incomingWeights.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
              <span>INCOMING SYNAPSES ({incomingWeights.length})</span>
              <span>wᵢ · aᵢ</span>
            </div>
            <div className="max-h-36 overflow-y-auto border border-[#2a2b30] rounded-[2px] bg-[#111215]">
              <table className="w-full text-[10px]">
                <thead className="bg-[#1f2024] text-zinc-400 sticky top-0">
                  <tr>
                    <th className="py-1 px-2 text-left font-normal">Source</th>
                    <th className="py-1 px-1 text-right font-normal">Weight</th>
                    <th className="py-1 px-1 text-right font-normal">Product</th>
                    <th className="py-1 px-2 text-right font-normal">∂L/∂wᵢ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2b30]">
                  {incomingWeights.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#18191c]">
                      <td className="py-1 px-2 text-zinc-300">{row.sourceLabel}</td>
                      <td
                        className={`py-1 px-1 text-right ${
                          row.weight >= 0 ? 'text-amber-400' : 'text-orange-400'
                        }`}
                      >
                        {row.weight.toFixed(3)}
                      </td>
                      <td className="py-1 px-1 text-right text-zinc-300">
                        {row.product.toFixed(3)}
                      </td>
                      <td className="py-1 px-2 text-right text-purple-400">
                        {row.gradient.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 border-t border-[#2a2b30] space-y-2">
          <div className="text-[10px] text-zinc-400 uppercase">INTERVENTIONS & EXPERIMENTS</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleNeuronDisabled(target.layerIndex, target.neuronIndex)}
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded-[2px] text-[11px] font-semibold border transition-colors ${
                neuron.disabled
                  ? 'bg-[#1f2024] border-emerald-600/50 text-emerald-300 hover:bg-[#25272c]'
                  : 'bg-[#1f2024] border-red-600/50 text-red-300 hover:bg-[#25272c]'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{neuron.disabled ? 'Restore Neuron' : 'Kill / Dropout'}</span>
            </button>

            {!isInput && (
              <button
                onClick={handlePerturbNeuron}
                className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded-[2px] text-[11px] font-semibold bg-[#1f2024] border border-[#2a2b30] text-zinc-300 hover:bg-[#25272c] hover:text-white transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Perturb Synapses</span>
              </button>
            )}
          </div>

          {!isInput && (
            <button
              onClick={handleResetBias}
              className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 rounded-[2px] text-[10px] text-zinc-400 hover:text-zinc-200 bg-[#111215] border border-[#2a2b30] hover:bg-[#1f2024] transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset Bias (b = 0.000)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
