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
      <div className="max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#18191c] border border-[#2a2b30] rounded-[2px] shadow-2xl overflow-hidden font-mono text-zinc-200">
        {/* Modal Header */}
        <div className="h-14 px-5 sm:px-6 bg-[#1f2024] border-b border-[#2a2b30] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-[2px] bg-[#2a2b30] flex items-center justify-center border border-[#3a3b40]">
              <GraduationCap className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="learning-guide-title" className="font-bold text-sm sm:text-base text-zinc-100 tracking-wide">
                  NEUROSCOPE // LEARNING GUIDE & OUTCOMES
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-[#111215] text-zinc-400 border border-[#2a2b30] rounded-[2px]">
                  PEDAGOGICAL SUITE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs sm:max-w-md">
                First-principles visual debugger for deep neural network architectures & telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={closeLearningGuide}
              className="p-1.5 rounded-[2px] bg-[#18191c] hover:bg-[#2a2b30] text-zinc-400 hover:text-white border border-[#2a2b30] transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#111215] px-4 sm:px-6 border-b border-[#2a2b30] flex space-x-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('outcomes')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'outcomes'
                ? 'border-blue-500 text-zinc-100 bg-[#18191c]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>1. CORE LEARNING OUTCOMES</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#1f2024] text-zinc-300 border border-[#2a2b30]">
              6 Modules
            </span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'glossary'
                ? 'border-blue-500 text-zinc-100 bg-[#18191c]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. GLOSSARY OF VISUALS & ACOUSTICS</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#1f2024] text-zinc-300 border border-[#2a2b30]">
              Canvas Semantics
            </span>
          </button>

          <button
            onClick={() => setActiveTab('educators')}
            className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'educators'
                ? 'border-blue-500 text-zinc-100 bg-[#18191c]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>3. EDUCATORS & LAB SHARING</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#1f2024] text-zinc-300 border border-[#2a2b30]">
              URL Labs
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CORE LEARNING OUTCOMES */}
          {activeTab === 'outcomes' && (
            <div className="space-y-4">
              <div className="bg-[#1f2024] border border-[#2a2b30] rounded-[2px] p-3 sm:p-4 text-xs text-zinc-300 flex items-start space-x-3">
                <Sparkles className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-zinc-100 font-semibold">First-Principles Deep Learning Curriculum:</span> Each
                  of the 6 core outcomes below addresses a foundational concept often obscured by black-box abstractions.
                  Click <span className="text-blue-400 font-bold">&quot;TRY IT NOW&quot;</span> on any card to load the
                  exact scenario preset or guided tour step into the live engine!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Demystifying the Black Box */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 01 // Glass-Box Architecture
                      </span>
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      1. Demystifying the Black Box
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>z = ∑ (wᵢ · xᵢ) + b → a = σ(z) → f′(z) = dσ/dz</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Treating neural networks as inscrutable &quot;magic&quot; prevents engineers from diagnosing numerical
                      drift. NeuroScope renders every floating-point state at 60 FPS: incoming scalar products, pre-activations,
                      activation saturations, and live backpropagation gradients.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> Inspect hover cards for exact dot
                      products and live continuous waveforms on the input oscilloscopes.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Interactive Walkthrough</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        startTour(0);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Non-Linearity & Space Warping */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 02 // Geometric Manifolds
                      </span>
                      <Compass className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      2. Non-Linearity & Space Warping
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>W₂(W₁ · x + b₁) + b₂ ≡ W′ · x + b′ (Linear Collapse)</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Without non-linear activations, stacking 100 deep layers is algebraically identical to a single linear layer
                      (y = mx + b). Non-linear activations (ReLU, Tanh, Sigmoid) fold, bend, and warp the Euclidean coordinate space
                      so that non-linearly separable datasets (like spirals or XOR) can be separated.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> The 32x32 Decision Boundary Heatmap
                      displays live spatial warping as hidden layers twist coordinate space.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Preset: 2D Classifier</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('2d_classifier');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Pathological Failure Modes */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 03 // Numerical Necrosis
                      </span>
                      <Skull className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      3. Pathological Failure Modes: Dying ReLU & Vanishing Gradients
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>ReLU′(z &lt; 0) = 0 (Dead) | σ′(z) ≤ 0.25 → ∏(0.25)ᴸ → 0.0000</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      High learning rates push standard ReLU neurons into negative pre-activations where derivative f′(z) = 0.
                      The gradient is permanently zeroed—killing the neuron. In deep Sigmoid networks, repeated multiplication of
                      small derivatives (≤ 0.25) causes backpropagated error to extinguish before reaching Layer 1.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> Necrotic neurons turn crimson with
                      &quot;†&quot;, the 58Hz acoustic buzzer fires, and gradients drop to 0.0000.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between space-x-2">
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('vanishing_grad');
                      }}
                      className="px-2 py-1.5 rounded-[2px] bg-[#1f2024] hover:bg-[#25272c] text-zinc-300 border border-[#2a2b30] text-[10px] font-semibold transition-colors"
                      title="Load deep 6-layer Sigmoid benchmark"
                    >
                      VANISHING GRAD
                    </button>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('dying_relu');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4. Visual Calculus & Chain Rule */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 04 // Multivariate Chain Rule
                      </span>
                      <Calculator className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      4. Visual Calculus & The Chain Rule
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>∂L/∂wᵢⱼ = (∂L/∂zⱼ) · aᵢ = δⱼ · aᵢ, δⱼ = (∑ δₖ · wⱼₖ) · σ′(zⱼ)</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Backpropagation is the rigorous application of multivariate calculus. In Step Math X-Ray Mode, the simulation
                      pauses to step through 5 arithmetic phases: (1) Input Vector, (2) Linear Dot Product, (3) Activation Tangent
                      Slope f′(z), (4) Loss Computation, and (5) Backprop Synapse Update.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> Step-by-step math cards with animated
                      geometric tangent lines directly on the activation curve.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Preset: Step Math X-Ray</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('step_math_xray');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. Fault Tolerance & Self-Healing */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 05 // Connectionist Resilience
                      </span>
                      <Zap className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      5. Fault Tolerance & Self-Healing via Ablation
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>{'a_killed = 0, w_{*j} = 0 → L_spike → L_recovered → min'}</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Unlike classical brittle software where a single null-pointer crash halts execution, neural network knowledge
                      is distributed holographically across thousands of synaptic weights. Severing any neuron induces an immediate
                      loss spike, followed by parallel pathways dynamically scaling weights to self-heal accuracy.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> Click any node to sever it with a red
                      &quot;X&quot; and watch surrounding synapses reroute signal flow.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Tour Step 5: Sever Neuron</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        startTour(4);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
                    >
                      <span>TRY IT NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 6. Hyperparameter Intuition */}
                <div className="bg-[#18191c] border border-[#2a2b30] hover:border-[#3e4048] rounded-[2px] p-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#111215] text-zinc-300 border border-[#2a2b30]">
                        Concept 06 // Optimization Dynamics
                      </span>
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      6. Hyperparameter Intuition & Saddle Escape
                    </h3>
                    <div className="p-2 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-200">
                      <code>w ← w - η · ∇L vs. v ← βv + η · ∇L, w ← w - v (Momentum)</code>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Learning rate (η) dictates step length on the error manifold. Undersized rates trap models in shallow local
                      minima; oversized rates overshoot valleys and cause catastrophic divergence. Momentum dampens oscillations
                      along steep canyon walls, while Gaussian jitter injection enables escape from saddle points.
                    </p>
                    <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                      <span className="text-zinc-100 font-semibold">Key Telemetry:</span> Live Loss Oscilloscope responds
                      instantaneously to LR sliders, Momentum toggle, and JITTER noise injection.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2b30] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Signal Debugger</span>
                    <button
                      onClick={() => {
                        closeLearningGuide();
                        selectPreset('signal_debugger');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-100 font-bold text-xs border border-[#3a3b40] transition-all"
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
              <div className="bg-[#1f2024] border border-[#2a2b30] rounded-[2px] p-3 text-xs text-zinc-300 leading-relaxed">
                NeuroScope implements an explicit, 1-to-1 visual grammar mapping every pixel, line, particle, and acoustic waveform
                directly to mathematical linear algebra and multivariate calculus operations.
              </div>

              {/* Section 1: Synapse Lines */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#2a2b30] pb-2">
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Synapse Lines & Colors (Weights wᵢⱼ)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-400 border border-amber-300" />
                      <span className="font-bold text-amber-300">Amber to Yellow (w &gt; 0)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Excitatory positive connection. As scalar weight increases, color brightens toward electric yellow (#fef08a).
                      Amplifies input signals during the forward dot product.
                    </p>
                  </div>

                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 border border-orange-400" />
                      <span className="font-bold text-orange-300">Crimson to Orange (w &lt; 0)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Inhibitory negative connection. As negative magnitude grows, color interpolates to burnt orange (#f97316).
                      Inverts incoming signal polarity.
                    </p>
                  </div>

                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-zinc-600 border border-zinc-500" />
                      <span className="font-bold text-zinc-300">Dimmed Zinc (|w| &lt; 0.05)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Near-zero synaptic weight. Indicates dead or pruned pathways with minimal mathematical influence on the subsequent
                      layer&apos;s activation.
                    </p>
                  </div>

                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-purple-400 border border-purple-300" />
                      <span className="font-bold text-purple-300">Purple / Amber Highlights (Math Mode)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Illuminates active computation paths in Step Math X-Ray: Amber indicates forward sum (Phase 1);
                      Purple indicates gradient update step (Phase 4).
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#151619] border border-[#2a2b30] rounded-[2px] text-[11px] text-zinc-300">
                  <span className="text-zinc-100 font-bold">Line Thickness:</span> Line width is dynamically calculated as{' '}
                  <code className="text-zinc-200 font-mono">clamp(0.5px, |w| · 1.5, 2.0px)</code> (or up to 4.0px on hover/focus).
                  Wider lines denote major throughput conduits carrying high numerical weight.
                </div>
              </div>

              {/* Section 2: Neurons & Input Oscilloscopes */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#2a2b30] pb-2">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Neuron Bodies, States & Input Oscilloscopes
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-emerald-400 font-bold block">Emerald Nodes (L0)</span>
                    <p className="text-[10px] text-zinc-400">
                      Sensory input layer. Directly injects normalized features xᵢ into the network.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-amber-400 font-bold block">Amber Nodes (Hidden)</span>
                    <p className="text-[10px] text-zinc-400">
                      Inner manifold representations. Core brightness and radius scale with post-activation a = σ(z).
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-blue-400 font-bold block">Blue Nodes (Output)</span>
                    <p className="text-[10px] text-zinc-400">
                      Classification classes. Emits final output probabilities paired with live horizontal gauge bars.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-red-400 font-bold block">Necrotic Red (†)</span>
                    <p className="text-[10px] text-zinc-400">
                      Dying ReLU flatline. When z &lt; 0 for all training points, gradient vanishes permanently to 0.0000.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-red-400 font-bold block">Severed Red (X)</span>
                    <p className="text-[10px] text-zinc-400">
                      Manually ablated or dropped out neuron. Zero transmission; verifies distributed fault tolerance.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="text-blue-300 font-bold block">White Reticle Ring</span>
                    <p className="text-[10px] text-zinc-400">
                      Active selected neuron displayed in the floating Neuron Inspector HUD.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#151619] border border-[#2a2b30] rounded-[2px] space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-zinc-200 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Input Oscilloscopes:</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Flanking each input neuron on the left edge, miniature sparklines plot continuous harmonic waveform
                    equations <code className="text-zinc-200 font-mono">xᵢ(t) = sin(ωᵢt + φ) ∈ [-1.0, 1.0]</code> over time.
                    This visually illustrates sensory quantization—how physical analog reality (sound, sensor voltage, pixels) is
                    digitized into discrete floating-point tensors before entering Layer 0.
                  </p>
                </div>
              </div>

              {/* Section 3: Particles & Web Audio Sonification */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#2a2b30] pb-2">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Forward/Backward Particles & Web Audio Sonification
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-[2px] bg-yellow-300 inline-block" />
                      <span>Forward Particles (Yellow / Cyan)</span>
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Traverse synapses from left to right along straight lines. Represent forward inference activations{' '}
                      <code>aᵢ · wᵢⱼ</code> feeding into the next layer&apos;s dot product summation.
                    </p>
                  </div>

                  <div className="p-3 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="font-bold text-orange-300 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-[2px] bg-orange-400 inline-block" />
                      <span>Backward Particles (Magenta / Orange)</span>
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Traverse synapses in reverse from output back to input. Represent backpropagated error gradients{' '}
                      <code>δⱼ = ∂L/∂zⱼ</code> adjusting weights via the chain rule. Particle velocity and brightness reflect gradient magnitude.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#151619] border border-[#2a2b30] rounded-[2px] space-y-2 text-xs">
                  <span className="font-bold text-zinc-200 flex items-center space-x-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Web Audio API Acoustic Synthesizer:</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
                    <li>
                      <span className="text-zinc-200 font-semibold">Dual Drone Carrier (Triangle C3 + Sine G3):</span> Pitch and
                      low-pass filter frequency rise and clarify as training loss converges toward zero.
                    </li>
                    <li>
                      <span className="text-red-300 font-semibold">58Hz Sawtooth Buzzer:</span> Flatline buzzer emits warning audio
                      whenever Dying ReLU necrotic neurons are detected.
                    </li>
                    <li>
                      <span className="text-zinc-300 font-semibold">Chirps & Pulses:</span> Subtle acoustic clicks signal forward
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
              <div className="bg-[#1f2024] border border-[#2a2b30] rounded-[2px] p-3 sm:p-4 text-xs text-zinc-300 flex items-start space-x-3">
                <Share2 className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-zinc-100 font-semibold">Zero-Backend Reproducible Labs:</span> NeuroScope runs 100%
                  client-side with zero Python dependencies, zero server roundtrips, and zero GPU configuration. Instructors can
                  pre-configure complex architectures, draw custom datasets, and distribute assignments via URL permalinks!
                </div>
              </div>

              {/* Lab 1: URL Parameter Permalinks */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2b30] pb-2">
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                      One-Click State Permalinks
                    </h4>
                  </div>
                  <button
                    onClick={handleShareClick}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] border border-[#3a3b40] text-zinc-200 text-xs transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CURRENT LAB URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Clicking <span className="text-zinc-200 font-bold">&quot;SHARE&quot;</span> in the top bar serializes your complete
                  experimental configuration into URL query parameters:
                </p>
                <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-nowrap">
                  <code>https://neuroscope.vercel.app/?preset=2d_classifier&topology=2,12,12,2&act=tanh&lr=0.08&opt=momentum</code>
                </div>
                <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                  <li><strong className="text-zinc-200">topology:</strong> Full layer neuron dimensions (e.g., [2, 16, 16, 1])</li>
                  <li><strong className="text-zinc-200">act / outAct:</strong> Hidden and output activation functions (ReLU, Leaky, Sigmoid, Tanh)</li>
                  <li><strong className="text-zinc-200">lr & opt:</strong> Exact learning rate float and optimizer algorithm (SGD or Momentum)</li>
                  <li><strong className="text-zinc-200">preset:</strong> Pre-loaded dataset and scenario metadata</li>
                </ul>
              </div>

              {/* Lab 2: Custom 2D Drawing Pad */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#2a2b30] pb-2">
                  <Compass className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Interactive 2D Dataset Drawing Pad
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  In the 2D Point Classifier preset (`2d_classifier`), students can interact directly with the Decision Boundary canvas
                  to paint custom coordinate distributions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="font-bold text-blue-300">Left-Click / Class 0 Brush:</span>
                    <p className="text-[10px] text-zinc-400">
                      Places Class 0 coordinates (target [0, 1]). Draw concentric clusters, spiral arms, or arbitrary non-convex shapes.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px] space-y-1">
                    <span className="font-bold text-amber-300">Right-Click / Class 1 Brush:</span>
                    <p className="text-[10px] text-zinc-400">
                      Places Class 1 coordinates (target [1, 0]). Watch the neural network fold coordinate space in real time to isolate the two classes!
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-300 bg-[#1f2024] p-2 rounded-[2px] border border-[#2a2b30]">
                  <span className="text-zinc-100 font-bold">Try dragging:</span> Click and drag across the canvas to rapidly paint hundreds of points; the 32x32 evaluation grid adapts dynamically.
                </div>
              </div>

              {/* Lab 3: Sample Assignment Ideas */}
              <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#2a2b30] pb-2">
                  <GraduationCap className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Recommended Classroom Lab Exercises
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
                    <span className="text-zinc-200 font-bold block mb-1">Exercise A: The Dying ReLU Threshold</span>
                    <p className="text-[11px] text-zinc-400">
                      Load preset &quot;The Dying ReLU Problem&quot;. Instruct students to find the exact critical learning rate where
                      more than 50% of hidden neurons die within 500 epochs. Have them explain why Leaky ReLU (α = 0.01) completely prevents this failure mode.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
                    <span className="text-zinc-200 font-bold block mb-1">Exercise B: Vanishing Gradient Depth Limit</span>
                    <p className="text-[11px] text-zinc-400">
                      Load &quot;Vanishing vs. Exploding Gradients&quot;. Have students compare Layer 1 backpropagation gradient norm
                      under Sigmoid vs. ReLU as hidden layer depth scales from 2 to 6 layers. Why do modern LLMs and deep ResNets avoid Sigmoid in hidden layers?
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#111215] border border-[#2a2b30] rounded-[2px]">
                    <span className="text-zinc-200 font-bold block mb-1">Exercise C: Distributed Fault Recovery</span>
                    <p className="text-[11px] text-zinc-400">
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
        <div className="h-14 px-5 sm:px-6 bg-[#1f2024] border-t border-[#2a2b30] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-zinc-400 text-[11px]">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 rounded-[2px] bg-[#111215] border border-[#2a2b30] text-zinc-300 text-[10px]">
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#25272c] hover:bg-[#2e3036] text-zinc-200 border border-[#3a3b40] text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>LAUNCH GUIDED TOUR</span>
            </button>

            <button
              onClick={closeLearningGuide}
              className="px-4 py-1.5 rounded-[2px] bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
