'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import {
  X,
  GraduationCap,
  Eye,
  Share2,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Layers,
  Activity,
  Calculator,
  Skull,
  Sliders,
  CheckCircle2,
  Copy,
  ExternalLink,
  Volume2,
  Cpu,
  Compass,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function LearningOutcomesModal() {
  const {
    isLearningGuideOpen,
    closeLearningGuide,
    selectPreset,
    startTour,
    setTourStep,
    toggleNeuronDisabled,
    getShareableUrl,
    addLog,
  } = useNetworkStore();

  const [activeTab, setActiveTab] = useState<'outcomes' | 'glossary' | 'educators'>('outcomes');
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isLearningGuideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLearningGuide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLearningGuideOpen, closeLearningGuide]);

  if (!isLearningGuideOpen) return null;

  const handleShareClick = () => {
    const url = getShareableUrl();
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', url);
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true);
          addLog('info', 'Lab configuration permalink copied to clipboard.');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          setCopied(true);
          addLog('info', 'Lab configuration permalink synced to address bar.');
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      setCopied(true);
      addLog('info', 'Lab configuration permalink synced to address bar.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeLearningGuide();
        }
      }}
    >
      <div className="max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#0f141f] border border-[#1e293b] rounded-xl shadow-2xl shadow-cyan-950/40 overflow-hidden font-mono text-slate-200">
        {/* Modal Header */}
        <div className="h-16 px-5 sm:px-6 bg-[#161d2d] border-b border-[#1e293b] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="learning-guide-title" className="font-bold text-sm sm:text-base text-white tracking-wide">
                  NEUROSCOPE // LEARNING GUIDE & OUTCOMES
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded">
                  PEDAGOGICAL SUITE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                First-principles visual debugger for deep neural network architectures & telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={closeLearningGuide}
              className="p-1.5 rounded-lg bg-[#0f141f] hover:bg-[#1e293b] text-slate-400 hover:text-white border border-[#1e293b] transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0b0f19] px-4 sm:px-6 border-b border-[#1e293b] flex space-x-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('outcomes')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'outcomes'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>1. CORE LEARNING OUTCOMES</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-900/50 text-cyan-300 border border-cyan-700/40">
              6 Modules
            </span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'glossary'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. GLOSSARY OF VISUALS & ACOUSTICS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Canvas Semantics
            </span>
          </button>

          <button
            onClick={() => setActiveTab('educators')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'educators'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>3. EDUCATORS & LAB SHARING</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/40">
              URL Labs
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CORE LEARNING OUTCOMES */}
          {activeTab === 'outcomes' && (
            <div className="space-y-4">
              <div className="bg-[#161d2d] border border-cyan-900/30 rounded-lg p-3 sm:p-4 text-xs text-slate-300 flex items-start space-x-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-cyan-300 font-semibold">First-Principles Deep Learning Curriculum:</span> Each
                  of the 6 core outcomes below addresses a foundational concept often obscured by black-box abstractions.
                  Click <span className="text-cyan-400 font-bold">&quot;TRY IT NOW&quot;</span> on any card to load the
                  exact scenario preset or guided tour step into the live engine!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Demystifying the Black Box */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-cyan-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                        Concept 01 // Glass-Box Architecture
                      </span>
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      1. Demystifying the Black Box
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-cyan-300">
                      <code>z = ∑(w_i · x_i) + b → a = σ(z) → f&apos;(z) = dσ/dz</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Treating neural networks as inscrutable &quot;magic&quot; prevents engineers from diagnosing numerical
                      drift. NeuroScope renders every floating-point state at 60 FPS: incoming scalar products, pre-activations,
                      activation saturations, and live backpropagation gradients.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-cyan-400 font-semibold">Key Telemetry:</span> Inspect hover cards for exact dot
                      products and live continuous waveforms on the input oscilloscopes.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Interactive Walkthrough</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        startTour(0);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Non-Linearity & Space Warping */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-emerald-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        Concept 02 // Geometric Manifolds
                      </span>
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                      2. Non-Linearity & Space Warping
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-emerald-300">
                      <code>W_2(W_1·x + b_1) + b_2 ≡ W&apos;·x + b&apos; (Linear Collapse)</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Without non-linear activations, stacking 100 deep layers is algebraically identical to a single linear layer
                      (y = mx + b). Non-linear activations (ReLU, Tanh, Sigmoid) fold, bend, and warp the Euclidean coordinate space
                      so that non-linearly separable datasets (like spirals or XOR) can be separated.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-emerald-400 font-semibold">Key Telemetry:</span> The 32x32 Decision Boundary Heatmap
                      displays live spatial warping as hidden layers twist coordinate space.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Preset: 2D Classifier</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('2d_classifier');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Pathological Failure Modes */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-red-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/50">
                        Concept 03 // Numerical Necrosis
                      </span>
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-300 transition-colors">
                      3. Pathological Failure Modes: Dying ReLU & Vanishing Gradients
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-red-300">
                      <code>ReLU&apos;(z&lt;0) = 0 (Dead) | σ&apos;(z) ≤ 0.25 → ∏(0.25)^L → 0.0000</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      High learning rates push standard ReLU neurons into negative pre-activations where derivative f&apos;(z) = 0.
                      The gradient is permanently zeroed—killing the neuron. In deep Sigmoid networks, repeated multiplication of
                      small derivatives (≤ 0.25) causes backpropagated error to extinguish before reaching Layer 1.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-red-400 font-semibold">Key Telemetry:</span> Necrotic neurons turn crimson with
                      &quot;†&quot;, the 58Hz acoustic buzzer fires, and gradients drop to 0.0000.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between space-x-2">
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('vanishing_grad');
                      }}
                      className="px-2 py-1.5 rounded bg-[#161d2d] hover:bg-[#1e293b] text-amber-300 border border-amber-600/30 text-[10px] font-semibold transition-colors"
                      title="Load deep 6-layer Sigmoid benchmark"
                    >
                      VANISHING GRAD
                    </button>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('dying_relu');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md shadow-red-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4. Visual Calculus & Chain Rule */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-purple-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800/50">
                        Concept 04 // Multivariate Chain Rule
                      </span>
                      <Calculator className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                      4. Visual Calculus & The Chain Rule
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-purple-300">
                      <code>∂L/∂w_ij = (∂L/∂z_j) · a_i = δ_j · a_i,  δ_j = (∑ δ_k w_jk) · σ&apos;(z_j)</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Backpropagation is the rigorous application of multivariate calculus. In Step Math X-Ray Mode, the simulation
                      pauses to step through 5 arithmetic phases: (1) Input Vector, (2) Linear Dot Product, (3) Activation Tangent
                      Slope f&apos;(z), (4) Loss Computation, and (5) Backprop Synapse Update.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-purple-400 font-semibold">Key Telemetry:</span> Step-by-step math cards with animated
                      geometric tangent lines directly on the activation curve.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Preset: Step Math X-Ray</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('step_math_xray');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. Fault Tolerance & Self-Healing */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-amber-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50">
                        Concept 05 // Connectionist Resilience
                      </span>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                      5. Fault Tolerance & Self-Healing via Ablation
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-amber-300">
                      <code>a_killed = 0,  w_*j = 0  →  L_spike  →  L_recovered → min</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Unlike classical brittle software where a single null-pointer crash halts execution, neural network knowledge
                      is distributed holographically across thousands of synaptic weights. Severing any neuron induces an immediate
                      loss spike, followed by parallel pathways dynamically scaling weights to self-heal accuracy.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-amber-400 font-semibold">Key Telemetry:</span> Click any node to sever it with a red
                      &quot;X&quot; and watch surrounding Bezier synapses reroute signal flow.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Tour Step 5: Sever Neuron</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        startTour(4);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 6. Hyperparameter Intuition */}
                <div className="bg-[#121926] border border-[#1e293b] hover:border-blue-500/40 rounded-lg p-4 flex flex-col justify-between transition-all group shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                        Concept 06 // Optimization Dynamics
                      </span>
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                      6. Hyperparameter Intuition & Saddle Escape
                    </h3>
                    <div className="p-2 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-blue-300">
                      <code>w ← w - η ∇L  vs.  v ← βv + η ∇L,  w ← w - v (Momentum)</code>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Learning rate (η) dictates step length on the error manifold. Undersized rates trap models in shallow local
                      minima; oversized rates overshoot valleys and cause catastrophic divergence. Momentum dampens oscillations
                      along steep canyon walls, while Gaussian jitter injection enables escape from saddle points.
                    </p>
                    <div className="text-[10px] text-slate-300 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                      <span className="text-blue-400 font-semibold">Key Telemetry:</span> Live Loss Oscilloscope responds
                      instantaneously to LR sliders, Momentum toggle, and JITTER noise injection.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Signal Debugger</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('signal_debugger');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-900/40"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GLOSSARY OF VISUALS & ACOUSTICS */}
          {activeTab === 'glossary' && (
            <div className="space-y-5">
              <div className="bg-[#161d2d] border border-[#1e293b] rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
                NeuroScope implements an explicit, 1-to-1 visual grammar mapping every pixel, curve, particle, and harmonic sound wave
                directly to mathematical linear algebra and multivariate calculus operations.
              </div>

              {/* Section 1: Synapse Bezier Curves */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Synapse Bezier Splines & Colors (Weights w_ij)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#090d16] border border-amber-900/40 rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 border border-yellow-200 shadow-sm shadow-amber-400/50" />
                      <span className="font-bold text-amber-300">Glowing Amber to Yellow (w &gt; 0)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Excitatory positive connection. As scalar weight increases, color brightens toward electric yellow (#fef08a).
                      Amplifies input signals during the forward dot product.
                    </p>
                  </div>

                  <div className="p-3 bg-[#090d16] border border-red-900/40 rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shadow-sm shadow-red-500/50" />
                      <span className="font-bold text-red-300">Deep Crimson to Orange (w &lt; 0)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inhibitory negative connection. As negative magnitude grows, color interpolates to burnt orange (#f97316).
                      Inverts incoming signal polarity.
                    </p>
                  </div>

                  <div className="p-3 bg-[#090d16] border border-slate-800 rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" />
                      <span className="font-bold text-slate-300">Dimmed Slate (|w| &lt; 0.05)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Near-zero synaptic weight. Indicates dead or pruned pathways with minimal mathematical influence on the subsequent
                      layer&apos;s activation.
                    </p>
                  </div>

                  <div className="p-3 bg-[#090d16] border border-purple-900/40 rounded space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-pink-500 border border-pink-300 shadow-sm shadow-pink-500/50" />
                      <span className="font-bold text-pink-300">Magenta / Yellow Glows (Math Mode)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Illuminates active computation paths in Step Math X-Ray: Yellow glow indicates forward sum (Phase 1);
                      Magenta glow indicates gradient update step (Phase 4).
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#0d121c] border border-[#1e293b] rounded text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-bold">Bezier Curve Thickness:</span> Line width is dynamically calculated as{' '}
                  <code className="text-amber-300 font-mono">clamp(0.6px, |w| · 1.5, 3.8px)</code> (or up to 5.5px on hover/focus).
                  Wider splines denote major throughput conduits carrying high numerical weight.
                </div>
              </div>

              {/* Section 2: Neurons & Input Oscilloscopes */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Neuron Bodies, States & Input Oscilloscopes
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded space-y-1">
                    <span className="text-emerald-400 font-bold block">Emerald Nodes (L0)</span>
                    <p className="text-[10px] text-slate-400">
                      Sensory input layer. Directly injects normalized features x_i into the network.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded space-y-1">
                    <span className="text-amber-400 font-bold block">Amber Nodes (Hidden)</span>
                    <p className="text-[10px] text-slate-400">
                      Inner manifold representations. Core brightness and radius scale with post-activation a = σ(z).
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded space-y-1">
                    <span className="text-cyan-400 font-bold block">Cyan Nodes (Output)</span>
                    <p className="text-[10px] text-slate-400">
                      Classification classes. Emits final output probabilities paired with live horizontal gauge bars.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-red-900/40 rounded space-y-1">
                    <span className="text-red-400 font-bold block">Necrotic Red (†)</span>
                    <p className="text-[10px] text-slate-400">
                      Dying ReLU flatline. When z &lt; 0 for all training points, gradient vanishes permanently to 0.0000.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-red-900/40 rounded space-y-1">
                    <span className="text-red-400 font-bold block">Severed Red (X)</span>
                    <p className="text-[10px] text-slate-400">
                      Manually ablated or dropped out neuron. Zero transmission; verifies distributed fault tolerance.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-cyan-800/40 rounded space-y-1">
                    <span className="text-cyan-300 font-bold block">Cyan Halo Ring</span>
                    <p className="text-[10px] text-slate-400">
                      Active selected neuron displayed in the floating Neuron Inspector HUD.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#0d121c] border border-emerald-900/30 rounded space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Green Input Oscilloscopes:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Flanking each input neuron on the left edge, miniature sparklines plot continuous harmonic waveform
                    equations <code className="text-emerald-300 font-mono">x_i(t) = sin(ω_i t + φ) ∈ [-1.0, +1.0]</code> over time.
                    This visually illustrates sensory quantization—how physical analog reality (sound, sensor voltage, pixels) is
                    digitized into discrete floating-point tensors before entering Layer 0.
                  </p>
                </div>
              </div>

              {/* Section 3: Particles & Web Audio Sonification */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Forward/Backward Particles & Web Audio Sonification
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded space-y-1">
                    <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block" />
                      <span>Forward Particles (Yellow / Cyan)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Traverse synapses from left to right along Bezier trajectories. Represent forward inference activations{' '}
                      <code>a_i · w_ij</code> feeding into the next layer&apos;s dot product summation.
                    </p>
                  </div>

                  <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded space-y-1">
                    <span className="font-bold text-pink-300 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
                      <span>Backward Particles (Magenta / Crimson)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Traverse synapses in reverse from output back to input. Represent backpropagated error gradients{' '}
                      <code>δ_j = ∂L/∂z_j</code> adjusting weights via the chain rule. Particle velocity and brightness reflect gradient magnitude.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#0d121c] border border-purple-900/30 rounded space-y-2 text-xs">
                  <span className="font-bold text-purple-300 flex items-center space-x-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Web Audio API Acoustic Synthesizer:</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    <li>
                      <span className="text-cyan-300 font-semibold">Dual Drone Carrier (Triangle C3 + Sine G3):</span> Pitch and
                      low-pass filter frequency rise and clarify as training loss converges toward zero.
                    </li>
                    <li>
                      <span className="text-red-300 font-semibold">58Hz Sawtooth Buzzer:</span> Flatline buzzer emits warning audio
                      whenever Dying ReLU necrotic neurons are detected.
                    </li>
                    <li>
                      <span className="text-pink-300 font-semibold">Chirps & Pulses:</span> Subtle acoustic clicks signal forward
                      mini-batch evaluations and backward gradient error flushes.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDUCATORS & SHARING */}
          {activeTab === 'educators' && (
            <div className="space-y-5">
              <div className="bg-[#161d2d] border border-emerald-900/30 rounded-lg p-3 sm:p-4 text-xs text-slate-300 flex items-start space-x-3">
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-emerald-300 font-semibold">Zero-Backend Reproducible Labs:</span> NeuroScope runs 100%
                  client-side with zero Python dependencies, zero server roundtrips, and zero GPU configuration. Instructors can
                  pre-configure complex architectures, draw custom datasets, and distribute assignments via URL permalinks!
                </div>
              </div>

              {/* Lab 1: URL Parameter Permalinks */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      One-Click State Permalinks
                    </h4>
                  </div>
                  <button
                    onClick={handleShareClick}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#161d2d] hover:bg-[#1e293b] border border-cyan-500/40 text-cyan-300 text-xs transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CURRENT LAB URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Clicking <span className="text-cyan-400 font-bold">&quot;SHARE&quot;</span> in the top bar serializes your complete
                  experimental configuration into URL query parameters:
                </p>
                <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded font-mono text-[10px] text-cyan-300 overflow-x-auto whitespace-nowrap">
                  <code>https://neuroscope.vercel.app/?preset=2d_classifier&topology=2,12,12,2&act=tanh&lr=0.08&opt=momentum</code>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong className="text-slate-200">topology:</strong> Full layer neuron dimensions (e.g., [2, 16, 16, 1])</li>
                  <li><strong className="text-slate-200">act / outAct:</strong> Hidden and output activation functions (ReLU, Leaky, Sigmoid, Tanh)</li>
                  <li><strong className="text-slate-200">lr & opt:</strong> Exact learning rate float and optimizer algorithm (SGD or Momentum)</li>
                  <li><strong className="text-slate-200">preset:</strong> Pre-loaded dataset and scenario metadata</li>
                </ul>
              </div>

              {/* Lab 2: Custom 2D Drawing Pad */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive 2D Dataset Drawing Pad
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In the 2D Point Classifier preset (`2d_classifier`), students can interact directly with the Decision Boundary canvas
                  to paint custom coordinate distributions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[#090d16] border border-cyan-900/40 rounded space-y-1">
                    <span className="font-bold text-cyan-300">Left-Click / Cyan Brush:</span>
                    <p className="text-[10px] text-slate-400">
                      Places Class 0 coordinates (target [0, 1]). Draw concentric clusters, spiral arms, or arbitrary non-convex shapes.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-amber-900/40 rounded space-y-1">
                    <span className="font-bold text-amber-300">Right-Click / Amber Brush:</span>
                    <p className="text-[10px] text-slate-400">
                      Places Class 1 coordinates (target [1, 0]). Watch the neural network fold coordinate space in real time to isolate the two classes!
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 bg-[#161d2d] p-2 rounded border border-[#1e293b]">
                  <span className="text-emerald-400 font-bold">Try dragging:</span> Click and drag across the canvas to rapidly paint hundreds of points; the 32x32 evaluation grid adapts dynamically.
                </div>
              </div>

              {/* Lab 3: Sample Assignment Ideas */}
              <div className="bg-[#121926] border border-[#1e293b] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recommended Classroom Lab Exercises
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded">
                    <span className="text-amber-300 font-bold block mb-1">Exercise A: The Dying ReLU Threshold</span>
                    <p className="text-[11px] text-slate-400">
                      Load preset &quot;The Dying ReLU Problem&quot;. Instruct students to find the exact critical learning rate where
                      more than 50% of hidden neurons die within 500 epochs. Have them explain why Leaky ReLU (α = 0.01) completely prevents this failure mode.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded">
                    <span className="text-cyan-300 font-bold block mb-1">Exercise B: Vanishing Gradient Depth Limit</span>
                    <p className="text-[11px] text-slate-400">
                      Load &quot;Vanishing vs. Exploding Gradients&quot;. Have students compare Layer 1 backpropagation gradient norm
                      under Sigmoid vs. ReLU as hidden layer depth scales from 2 to 6 layers. Why do modern LLMs and deep ResNets avoid Sigmoid in hidden layers?
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded">
                    <span className="text-emerald-300 font-bold block mb-1">Exercise C: Distributed Fault Recovery</span>
                    <p className="text-[11px] text-slate-400">
                      Train the Signal Wave Classifier to &gt; 95% accuracy. Click on the 2 largest neurons in Hidden Layer 1 to ablate them.
                      Record how many epochs the network requires to reroute synaptic throughput and recover to &gt; 90% accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-5 sm:px-6 bg-[#161d2d] border-t border-[#1e293b] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#090d16] border border-[#1e293b] text-cyan-400 text-[10px]">
              ESC
            </kbd>
            <span className="hidden sm:inline">to close anytime</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                closeLearningGuide();
                startTour(0);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#121926] hover:bg-[#1e293b] text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>LAUNCH GUIDED TOUR</span>
            </button>

            <button
              onClick={closeLearningGuide}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md shadow-cyan-950/50"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
