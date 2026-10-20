'use client';

import React, { useEffect, useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Activity,
  Skull,
  RotateCcw,
  CheckCircle2,
  Layers,
  ArrowRight,
  Play,
} from 'lucide-react';

interface StepInfo {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  mathFormula: string;
  plainEnglishExplanation: string;
}

const TOUR_STEPS: StepInfo[] = [
  {
    stepNumber: 1,
    badge: 'STEP 1 OF 5 • SENSORY DIGITIZATION',
    title: 'Input Oscilloscopes',
    subtitle: 'Continuous wave sampling into discrete numerical vectors',
    mathFormula: 'xᵢ(t) = sin(ωᵢt + φ)  →  x = [x₀, x₁, ..., xₙ₋₁]ᵀ ∈ [-1.0, 1.0]',
    plainEnglishExplanation:
      'Input oscilloscopes continuously sample analog waveforms and quantize them into normalized vectors between -1.0 and +1.0. These floating-point numbers feed directly into the input neurons of Layer 0.',
  },
  {
    stepNumber: 2,
    badge: 'STEP 2 OF 5 • SYNAPSE DYNAMICS',
    title: 'Synapses & Weight Matrix',
    subtitle: 'Excitatory and inhibitory signal propagation',
    mathFormula: 'zⱼ = ∑ (wᵢⱼ · xᵢ) + bⱼ',
    plainEnglishExplanation:
      'Synapse connection lines scale signals: amber denotes positive excitation, while crimson red denotes negative inhibition. Neurons compute the dot product of incoming inputs scaled by synapse weights, adding an intrinsic bias.',
  },
  {
    stepNumber: 3,
    badge: 'STEP 3 OF 5 • NON-LINEARITY',
    title: 'Hidden Neurons & Non-Linearity',
    subtitle: 'Activation functions and manifold bending',
    mathFormula: 'aⱼ = σ(zⱼ) = 1 / (1 + e⁻ᶻʲ)   or   ReLU(zⱼ) = max(0, zⱼ)',
    plainEnglishExplanation:
      'Non-linear activation functions prevent multilayer networks from collapsing into a trivial linear matrix (y = mx + b). The local tangent derivative f′(z) governs how gradient signals flow backwards during training.',
  },
  {
    stepNumber: 4,
    badge: 'STEP 4 OF 5 • ERROR CORRECTION',
    title: 'Backpropagation & Gradient Descent',
    subtitle: 'Chain-rule sensitivity calculation and weight updates',
    mathFormula: 'δⱼ = (∂L/∂aⱼ) · σ′(zⱼ),   wᵢⱼ ← wᵢⱼ - η · (∂L/∂wᵢⱼ)',
    plainEnglishExplanation:
      'Backpropagation applies the multivariate calculus chain rule from the output loss backward through every layer. Each synapse updates in proportion to its gradient sensitivity δ to minimize total prediction error.',
  },
  {
    stepNumber: 5,
    badge: 'STEP 5 OF 5 • SELF-HEALING RECOVERY',
    title: 'Fault Tolerance & Neuron Severing',
    subtitle: 'Distributed representation and self-healing dynamics',
    mathFormula: 'a_killed = 0,  w_{*j} = 0  →  L_spike  →  L_recovered → min',
    plainEnglishExplanation:
      'Click neuron L1-N0 to sever its connections and simulate acute hardware ablation damage. Because deep representations are distributed across parallel synapses, surrounding weights dynamically adapt to recover accuracy.',
  },
];

export default function GuidedTour() {
  const {
    isTourOpen,
    tourStep,
    spotlightTarget,
    secondarySpotlightTarget,
    nextTourStep,
    prevTourStep,
    closeTour,
    setTourStep,
    triggerBackpropPulse,
    toggleNeuronDisabled,
    engine,
  } = useNetworkStore();

  const [hasKilledNeuron, setHasKilledNeuron] = useState(false);

  // Check if any neuron is currently killed/disabled
  useEffect(() => {
    if (!isTourOpen) return;
    const checkDisabled = () => {
      const anyDisabled = engine.layers.some((l) => l.neurons.some((n) => n.disabled));
      setHasKilledNeuron(anyDisabled);
    };
    checkDisabled();
    const interval = setInterval(checkDisabled, 250);
    return () => clearInterval(interval);
  }, [isTourOpen, engine]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTour();
      } else if (e.key === 'ArrowRight') {
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        prevTourStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, closeTour, nextTourStep, prevTourStep]);

  if (!isTourOpen) return null;

  const currentStep = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  // Fallback primary spotlight rect if canvas hasn't reported yet
  const targetX = spotlightTarget?.x ?? (typeof window !== 'undefined' ? window.innerWidth * 0.25 : 200);
  const targetY = spotlightTarget?.y ?? (typeof window !== 'undefined' ? window.innerHeight * 0.35 : 200);
  const targetWidth = Math.max(90, spotlightTarget?.width ?? 180);
  const targetHeight = Math.max(90, spotlightTarget?.height ?? 180);

  // Secondary spotlight rect (Step 3: Activation Graph / Neuron Inspector)
  const hasSecondary = secondarySpotlightTarget !== null && secondarySpotlightTarget !== undefined;
  const secX = secondarySpotlightTarget?.x ?? 0;
  const secY = secondarySpotlightTarget?.y ?? 0;
  const secWidth = secondarySpotlightTarget?.width ?? 0;
  const secHeight = secondarySpotlightTarget?.height ?? 0;

  // Smart placement for the tutorial explanation card:
  // - Step 1: Input Oscilloscopes (Left side) -> place card on Right side
  // - Step 2: Synapses (Center-left) -> place card on Right side
  // - Step 3: Hidden Neuron & Inspector (Center) -> place card on Left side
  // - Step 4: Backprop pulse (Full canvas) -> place card at Bottom-Center
  // - Step 5: Kill Neuron (Layer 1) -> place card on Right side
  let cardPositionClass = 'top-16 right-4 sm:right-6 max-w-lg';
  if (tourStep === 2) {
    cardPositionClass = 'top-16 left-4 sm:left-8 max-w-sm sm:max-w-md';
  } else if (tourStep === 3) {
    cardPositionClass = 'bottom-6 left-1/2 -translate-x-1/2 max-w-xl';
  } else if (tourStep === 0 || tourStep === 1 || tourStep === 4) {
    cardPositionClass = 'top-16 right-4 sm:right-6 max-w-lg';
  }

  return (
    <aside
      aria-label="Interactive Guided Tour"
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none select-none font-mono"
    >
      {/* 1. Fullscreen SVG Dimming Mask with Cutout Spotlight */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight-cutout">
            {/* White background: dim everything */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout 1: reveals primary spotlighted element */}
            <rect
              x={targetX - 10}
              y={targetY - 10}
              width={targetWidth + 20}
              height={targetHeight + 20}
              rx={16}
              fill="black"
            />
            {/* Black cutout 2: reveals secondary spotlighted element (Step 3: Activation Graph) */}
            {hasSecondary && (
              <rect
                x={secX - 8}
                y={secY - 8}
                width={secWidth + 16}
                height={secHeight + 16}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent dark obsidian veil */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 8, 15, 0.82)"
          mask="url(#tour-spotlight-cutout)"
        />
      </svg>

      {/* 2A. Primary Glowing Animated Spotlight Target Border */}
      <div
        style={{
          left: `${targetX - 10}px`,
          top: `${targetY - 10}px`,
          width: `${targetWidth + 20}px`,
          height: `${targetHeight + 20}px`,
        }}
        onClick={
          tourStep === 4
            ? () => toggleNeuronDisabled(1, 0)
            : tourStep === 3
            ? () => triggerBackpropPulse()
            : undefined
        }
        title={
          tourStep === 4
            ? hasKilledNeuron
              ? 'Click to restore neuron L1-N0'
              : 'Click to sever/kill neuron L1-N0'
            : tourStep === 3
            ? 'Click to trigger Backpropagation Pulse'
            : undefined
        }
        className={`absolute rounded-2xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.65)] transition-all duration-300 animate-pulse ${
          tourStep === 4
            ? 'pointer-events-auto cursor-pointer hover:border-red-400 hover:shadow-red-500/60'
            : tourStep === 3
            ? 'pointer-events-auto cursor-pointer hover:border-purple-400 hover:shadow-purple-500/60'
            : 'pointer-events-none'
        }`}
      >
        {/* Corner Reticles */}
        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

        {/* Target Badge Label */}
        {spotlightTarget?.title && (
          <div className="absolute -top-6 left-2 px-2 py-0.5 bg-cyan-950/90 border border-cyan-500/60 rounded text-[9px] text-cyan-300 font-bold tracking-wider uppercase backdrop-blur-sm">
            {spotlightTarget.title}
          </div>
        )}

        {/* Step 5 Interactive Click Badge on Reticle */}
        {tourStep === 4 && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 bg-red-950/95 border border-red-500/80 rounded-full text-[9px] text-red-200 font-bold tracking-wider uppercase backdrop-blur-sm shadow-lg flex items-center space-x-1.5 animate-bounce">
            <Skull className="w-3 h-3 text-red-400" />
            <span>{hasKilledNeuron ? 'CLICK TO RESTORE L1-N0' : 'CLICK TO KILL L1-N0'}</span>
          </div>
        )}

        {/* Step 4 Interactive Click Badge on Reticle */}
        {tourStep === 3 && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 bg-purple-950/95 border border-purple-500/80 rounded-full text-[9px] text-purple-200 font-bold tracking-wider uppercase backdrop-blur-sm shadow-lg flex items-center space-x-1.5">
            <Zap className="w-3 h-3 text-purple-300" />
            <span>CLICK TO TRIGGER ERROR CASCADE</span>
          </div>
        )}
      </div>

      {/* 2B. Secondary Glowing Animated Spotlight Target Border (Step 3: Activation Graph / Inspector) */}
      {hasSecondary && (
        <div
          style={{
            left: `${secX - 8}px`,
            top: `${secY - 8}px`,
            width: `${secWidth + 16}px`,
            height: `${secHeight + 16}px`,
          }}
          className="absolute pointer-events-none rounded-2xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.65)] transition-all duration-300 animate-pulse"
        >
          {/* Corner Reticles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

          {/* Target Badge Label */}
          {secondarySpotlightTarget.title && (
            <div className="absolute -top-6 left-2 px-2 py-0.5 bg-cyan-950/90 border border-cyan-500/60 rounded text-[9px] text-cyan-300 font-bold tracking-wider uppercase backdrop-blur-sm">
              {secondarySpotlightTarget.title}
            </div>
          )}
        </div>
      )}

      {/* 3. Interactive Walkthrough Explanatory Card */}
      <div
        className={`absolute ${cardPositionClass} w-[calc(100vw-32px)] sm:w-auto bg-[#0f1422]/98 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl p-4 sm:p-5 text-slate-200 transition-all duration-300 flex flex-col space-y-3.5 pointer-events-auto max-h-[85vh] overflow-y-auto`}
      >
        {/* Card Header: Step Pill & Close */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={closeTour}
            title="Exit Guided Tour (Esc)"
            className="p-1 rounded hover:bg-[#1e293b] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{currentStep.title}</span>
          </h2>
          <p className="text-xs text-cyan-300/90 font-medium">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Mathematical Formula Box */}
        <div className="bg-[#070a12] border border-cyan-900/50 rounded-lg p-2.5 font-mono text-[11px] text-amber-300 shadow-inner flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">[MATH]:</span>
            <code className="text-cyan-300 font-semibold">{currentStep.mathFormula}</code>
          </div>
        </div>

        {/* Plain English Deep Dive */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {currentStep.plainEnglishExplanation}
        </p>

        {/* Interactive Step-Specific Action Elements */}
        {tourStep === 3 && (
          <div className="bg-purple-950/40 border border-purple-500/40 rounded-lg p-3 flex items-center justify-between">
            <div className="text-[11px] text-purple-200">
              <span className="font-bold">Interactive Action:</span> Trigger an illuminated error pulse cascade!
            </div>
            <button
              onClick={triggerBackpropPulse}
              className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>TRIGGER PULSE</span>
            </button>
          </div>
        )}

        {tourStep === 4 && (
          <div className="bg-[#121929] border border-red-500/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-red-300 font-bold flex items-center space-x-1.5">
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>FAULT TOLERANCE SANDBOX</span>
              </span>
              {hasKilledNeuron && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>NEURON SEVERED!</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 font-sans">
              {hasKilledNeuron
                ? 'Great job! Notice how the disabled neuron is crossed out in red and its synapses are severed. The network dynamically adapts surrounding weights to recover prediction accuracy.'
                : 'Click directly on the glowing neuron on the canvas, or click this button to simulate neuron dropout:'}
            </p>

            <button
              onClick={() => toggleNeuronDisabled(1, 0)}
              className={`w-full py-2 rounded text-xs font-bold font-mono flex items-center justify-center space-x-2 transition-all shadow-md ${
                hasKilledNeuron
                  ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/60'
                  : 'bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/60 animate-pulse'
              }`}
            >
              {hasKilledNeuron ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESTORE NEURON L1-N0</span>
                </>
              ) : (
                <>
                  <Skull className="w-3.5 h-3.5" />
                  <span>SIMULATE KILL: NEURON L1-N0</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Key Takeaway Pill */}
        <div className="bg-[#161d2d]/80 rounded p-2 text-[10px] text-emerald-300 border border-emerald-900/40">
          {currentStep.keyTakeaway}
        </div>

        {/* Card Footer: Step Dots & Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
          {/* Step Dots */}
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTourStep(idx)}
                title={`Jump to Step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === tourStep
                    ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-[#1e293b] hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!isFirstStep && (
              <button
                onClick={prevTourStep}
                className="px-2.5 py-1.5 rounded bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#1e293b] text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={closeTour}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>COMPLETE LESSON</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={nextTourStep}
                className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1 shadow-lg shadow-cyan-600/30 transition-all"
              >
                <span>NEXT STEP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
