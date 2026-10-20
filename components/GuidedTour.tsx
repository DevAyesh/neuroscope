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
              x={targetX - 8}
              y={targetY - 8}
              width={targetWidth + 16}
              height={targetHeight + 16}
              rx={2}
              fill="black"
            />
            {/* Black cutout 2: reveals secondary spotlighted element (Step 3: Activation Graph) */}
            {hasSecondary && (
              <rect
                x={secX - 6}
                y={secY - 6}
                width={secWidth + 12}
                height={secHeight + 12}
                rx={2}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Subtle dark backdrop */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#tour-spotlight-cutout)"
        />
      </svg>

      {/* 2A. Primary Cutout Spotlight Border (Clean 1px solid white/35, no reticles) */}
      <div
        style={{
          left: `${targetX - 8}px`,
          top: `${targetY - 8}px`,
          width: `${targetWidth + 16}px`,
          height: `${targetHeight + 16}px`,
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
        className={`absolute rounded-[2px] border border-white/35 transition-all duration-200 ${
          tourStep === 4 || tourStep === 3
            ? 'pointer-events-auto cursor-pointer'
            : 'pointer-events-none'
        }`}
      />

      {/* 2B. Secondary Cutout Spotlight Border (Step 3: Activation Graph / Inspector) */}
      {hasSecondary && (
        <div
          style={{
            left: `${secX - 6}px`,
            top: `${secY - 6}px`,
            width: `${secWidth + 12}px`,
            height: `${secHeight + 12}px`,
          }}
          className="absolute pointer-events-none rounded-[2px] border border-white/35 transition-all duration-200"
        />
      )}

      {/* 3. Redesigned Tour Card: Compact Technical Popover Dock */}
      <div
        className={`absolute ${cardPositionClass} w-[calc(100vw-32px)] sm:w-auto bg-[#18191c] border border-[#2e3036] rounded-[2px] p-4 text-[#e4e4e7] transition-all duration-200 flex flex-col space-y-3 pointer-events-auto max-h-[85vh] overflow-y-auto font-mono`}
      >
        {/* Card Header: Step Pill & Close */}
        <div className="flex items-center justify-between border-b border-[#2a2b30] pb-2">
          <span className="text-[10px] font-bold tracking-wider text-[#8e9299] uppercase">
            {currentStep.badge}
          </span>

          <button
            onClick={closeTour}
            title="Exit Guided Tour (Esc)"
            className="p-1 rounded-[2px] hover:bg-[#2a2b30] text-[#8e9299] hover:text-[#e4e4e7] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-[#e4e4e7] tracking-tight">
            {currentStep.title}
          </h2>
          <p className="text-xs text-[#8e9299]">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Mathematical Formula in dark #111215 code block */}
        <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 font-mono text-[11px] text-[#e4e4e7] overflow-x-auto">
          <code>{currentStep.mathFormula}</code>
        </div>

        {/* Concise Plain English Text (max 2 sentences) */}
        <p className="text-xs text-[#8e9299] leading-relaxed font-sans">
          {currentStep.plainEnglishExplanation}
        </p>

        {/* Interactive Step-Specific Action Elements */}
        {tourStep === 3 && (
          <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 flex items-center justify-between">
            <span className="text-[11px] text-[#8e9299]">Trigger backpropagation pulse</span>
            <button
              onClick={triggerBackpropPulse}
              className="px-2.5 py-1 rounded-[2px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>PULSE</span>
            </button>
          </div>
        )}

        {tourStep === 4 && (
          <div className="bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8e9299] font-medium">Fault Tolerance Simulation</span>
              {hasKilledNeuron && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[#18191c] text-emerald-400 border border-emerald-500/40">
                  SEVERED
                </span>
              )}
            </div>

            <button
              onClick={() => toggleNeuronDisabled(1, 0)}
              className={`w-full py-1.5 rounded-[2px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border ${
                hasKilledNeuron
                  ? 'bg-[#18191c] hover:bg-[#222429] text-[#e4e4e7] border-[#2a2b30]'
                  : 'bg-[#ef4444] hover:bg-[#dc2626] text-white border-transparent'
              }`}
            >
              {hasKilledNeuron ? (
                <>
                  <RotateCcw className="w-3 h-3" />
                  <span>RESTORE NEURON L1-N0</span>
                </>
              ) : (
                <>
                  <Skull className="w-3 h-3" />
                  <span>SEVER NEURON L1-N0</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Card Footer: Step Dots & Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2a2b30]">
          {/* Step Dots */}
          <div className="flex items-center space-x-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTourStep(idx)}
                title={`Jump to Step ${idx + 1}`}
                className={`h-1 rounded-[1px] transition-all ${
                  idx === tourStep
                    ? 'w-5 bg-[#3b82f6]'
                    : 'w-2 bg-[#2a2b30] hover:bg-[#3f424b]'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            {!isFirstStep && (
              <button
                onClick={prevTourStep}
                className="px-2.5 py-1 rounded-[2px] bg-[#18191c] hover:bg-[#222429] text-[#8e9299] hover:text-[#e4e4e7] border border-[#2a2b30] text-xs font-medium flex items-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={closeTour}
                className="px-3.5 py-1 rounded-[2px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <span>COMPLETE</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={nextTourStep}
                className="px-3.5 py-1 rounded-[2px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
