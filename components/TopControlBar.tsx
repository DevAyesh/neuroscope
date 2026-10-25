'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { PRESET_SCENARIOS, ActivationType, OptimizerType } from '@/lib/nn-engine';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Flame,
  Zap,
  Activity,
  Layers,
  Sliders,
  ChevronDown,
  Volume2,
  VolumeX,
  GraduationCap,
  BookOpen,
  Undo2,
} from 'lucide-react';

export default function TopControlBar() {
  const {
    currentPresetId,
    isPlaying,
    learningRate,
    hiddenActivation,
    optimizer,
    deadNeurons,
    killedNeuronsHistory,
    undoLastKill,
    togglePlay,
    stepOnce,
    resetWeights,
    perturbWeights,
    reviveDyingNeurons,
    selectPreset,
    setLearningRate,
    setHiddenActivation,
    setOptimizer,
    getShareableUrl,
    addLog,
    startTour,
    isTourOpen,
    openLearningGuide,
    isAudioMuted,
    toggleAudio,
  } = useNetworkStore();

  const [copied, setCopied] = useState(false);
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close preset dropdown on outside click or Escape key
  useEffect(() => {
    if (!presetDropdownOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPresetDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPresetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [presetDropdownOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const completed = localStorage.getItem('neuroscope_tour_completed');
        if (!completed) {
          setIsFirstTime(true);
        }
      } catch (_) {}
    }
  }, []);

  // Global Keyboard shortcuts: Space = Play/Pause, S = Step, R = Reset, J = Jitter, U = Undo kill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stepOnce();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetWeights();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        perturbWeights();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        undoLastKill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepOnce, resetWeights, perturbWeights, undoLastKill]);

  const handleShare = () => {
    const url = getShareableUrl();
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', url);
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      addLog('info', 'Configuration URL copied to clipboard & address bar.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPreset = PRESET_SCENARIOS.find((p) => p.id === currentPresetId) || PRESET_SCENARIOS[0];

  return (
    <header className="h-11 bg-[#18191c] border-b border-[#2a2b30] flex items-center justify-between px-2 sm:px-3 z-40 relative select-none w-full">
      {/* Left: Brand & Preset Selector */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-5 h-5 rounded-[2px] bg-[#2a2b30] flex items-center justify-center border border-[#3a3b40]">
            <Activity className="w-3 h-3 text-zinc-300" />
          </div>
          <div className="flex items-center">
            <span className="font-bold tracking-tight text-zinc-100 font-mono text-xs">
              NEURO<span className="text-zinc-400">SCOPE</span>
            </span>
            <span className="hidden sm:inline ml-1 px-1 py-0.2 text-[8px] bg-[#111215] text-zinc-400 rounded-[2px] font-mono border border-[#2a2b30]">
              v1.0
            </span>
          </div>
        </div>

        <div className="h-3.5 w-px bg-[#2a2b30] hidden md:block" />

        {/* Preset Selector Dropdown / Pills */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={presetDropdownOpen}
            className={`flex items-center space-x-1 px-1.5 py-1 rounded-[2px] bg-[#1f2024] hover:bg-[#25272c] border ${
              presetDropdownOpen
                ? 'border-[#3a3b40] text-zinc-100 bg-[#25272c]'
                : 'border-[#2a2b30] text-zinc-200'
            } text-xs font-mono transition-colors shadow-none`}
          >
            <span className="text-zinc-400 font-semibold hidden xl:inline">[PRESET]</span>
            <span className="truncate max-w-[90px] sm:max-w-[120px] md:max-w-[140px] xl:max-w-[170px]">{currentPreset.title}</span>
            <ChevronDown
              className={`w-3 h-3 text-zinc-400 shrink-0 transition-transform duration-200 ${
                presetDropdownOpen ? 'rotate-180 text-zinc-200' : ''
              }`}
            />
          </button>

          {presetDropdownOpen && (
            <div
              role="listbox"
              aria-label="Educational Scenarios"
              className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-[#18191c] border border-[#2a2b30] rounded-[2px] shadow-2xl p-1 z-50 font-mono text-xs max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase border-b border-[#2a2b30] mb-1 flex items-center justify-between">
                <span>Select Educational Scenario</span>
                <span className="text-[9px] text-zinc-400 font-normal">ESC to close</span>
              </div>
              <div className="space-y-1">
                {PRESET_SCENARIOS.map((preset) => {
                  const isSelected = currentPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        selectPreset(preset.id);
                        setPresetDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-[2px] transition-colors flex flex-col space-y-1 ${
                        isSelected
                          ? 'bg-[#25272c] border border-[#3a3b40] text-zinc-100'
                          : 'hover:bg-[#1f2024] text-zinc-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSelected ? (
                            <Check className="w-3 h-3 text-zinc-200 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 shrink-0" />
                          )}
                          <span className="font-semibold text-xs truncate">{preset.title}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-[2px] border shrink-0 ${preset.badgeColor}`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 truncate pl-[18px]">{preset.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Lesson Button */}
        <button
          onClick={() => {
            setIsFirstTime(false);
            startTour();
          }}
          title="Start 5-Step Interactive Guided Lesson"
          className={`flex items-center space-x-1 px-1.5 py-1 rounded-[2px] font-mono text-xs font-semibold border transition-all ${
            isTourOpen
              ? 'bg-[#25272c] text-zinc-100 border-[#3a3b40]'
              : 'bg-[#1f2024] hover:bg-[#25272c] text-zinc-300 hover:text-white border-[#2a2b30]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-[11px] hidden md:inline">LESSON</span>
        </button>

        {/* Learning Guide & Pedagogical Outcomes Modal Trigger */}
        <button
          onClick={openLearningGuide}
          title="Open Learning Guide & Pedagogical Outcomes"
          aria-label="Open Learning Guide & Pedagogical Outcomes"
          className="flex items-center space-x-1 px-1.5 py-1 rounded-[2px] font-mono text-xs font-semibold bg-[#1f2024] hover:bg-[#25272c] text-zinc-300 hover:text-white border border-[#2a2b30] transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-[11px] hidden md:inline">GUIDE</span>
        </button>
      </div>

      {/* Center: Playback & Step Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pause Simulation (Space)' : 'Start Simulation (Space)'}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold transition-all ${
            isPlaying
              ? 'bg-[#25272c] text-amber-300 border border-amber-500/40 hover:bg-[#2e3036]'
              : 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-500'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">TRAIN</span>
            </>
          )}
        </button>

        <button
          onClick={stepOnce}
          title="Step Forward 1 Epoch (S)"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#1f2024] hover:bg-[#25272c] text-zinc-200 hover:text-white border border-[#2a2b30] rounded-[2px] font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">STEP (S)</span>
        </button>

        <button
          onClick={resetWeights}
          title="Reset Weights & Biases (R)"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#1f2024] hover:bg-[#25272c] text-zinc-200 hover:text-white border border-[#2a2b30] rounded-[2px] font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">RESET (R)</span>
        </button>

        <button
          onClick={perturbWeights}
          title="Perturb Weights / Jitter (J)"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#1f2024] hover:bg-[#25272c] text-zinc-200 hover:text-white border border-[#2a2b30] rounded-[2px] font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">JITTER (J)</span>
        </button>

        {/* Undo Kill Action Button (visible when killed neurons exist) */}
        {killedNeuronsHistory.length > 0 && (
          <button
            onClick={undoLastKill}
            title="Undo Last Killed Neuron (U)"
            className="flex items-center space-x-1 px-1.5 py-1 bg-[#1f2024] hover:bg-[#25272c] border border-amber-500/60 text-amber-300 rounded-[2px] font-mono text-xs transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">UNDO KILL</span>
          </button>
        )}

        {/* Dying ReLU quick fix button (ONLY shown when dead neurons exist per Requirement 13) */}
        {deadNeurons > 0 && (
          <button
            onClick={reviveDyingNeurons}
            title={`Revive ${deadNeurons} Dead Neurons using Leaky ReLU`}
            className="flex items-center space-x-1 px-1.5 py-1 bg-[#1f2024] hover:bg-[#25272c] border border-red-500/60 text-red-300 rounded-[2px] font-mono text-xs transition-colors animate-pulse"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">REVIVE ({deadNeurons})</span>
          </button>
        )}
      </div>

      {/* Right: Hyperparameters & Share */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Learning Rate Slider (visible on wide 2xl screens, also available in sidebar) */}
        <div className="hidden 2xl:flex items-center space-x-1 bg-[#1f2024] px-1.5 py-0.5 rounded-[2px] border border-[#2a2b30]">
          <span className="text-[10px] font-mono text-zinc-400">LR:</span>
          <input
            type="range"
            min="0.0001"
            max="1.0"
            step="0.0005"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-14 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-zinc-200 font-bold w-10 text-right">
            {learningRate.toFixed(4)}
          </span>
        </div>

        {/* Activation Selector */}
        <div className="flex items-center space-x-1 bg-[#1f2024] px-1.5 py-1 rounded-[2px] border border-[#2a2b30] shrink-0">
          <span className="text-[10px] font-mono text-zinc-400">ACT:</span>
          <select
            value={hiddenActivation}
            onChange={(e) => setHiddenActivation(e.target.value as ActivationType)}
            className="bg-transparent text-zinc-200 font-mono text-xs outline-none cursor-pointer"
          >
            <option value="relu" className="bg-[#18191c]">ReLU</option>
            <option value="leaky_relu" className="bg-[#18191c]">Leaky ReLU</option>
            <option value="sigmoid" className="bg-[#18191c]">Sigmoid</option>
            <option value="tanh" className="bg-[#18191c]">Tanh</option>
            <option value="linear" className="bg-[#18191c]">Linear</option>
          </select>
        </div>

        {/* Optimizer Toggle */}
        <div className="hidden 2xl:flex items-center space-x-1 bg-[#1f2024] px-1.5 py-1 rounded-[2px] border border-[#2a2b30] shrink-0">
          <span className="text-[10px] font-mono text-zinc-400">OPT:</span>
          <button
            onClick={() => setOptimizer(optimizer === 'momentum' ? 'sgd' : 'momentum')}
            className="text-xs font-mono text-zinc-200 hover:text-white transition-colors"
          >
            {optimizer.toUpperCase()}
          </button>
        </div>

        {/* Web Audio Sonification Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Web Audio Sonification (Harmonic Synth)' : 'Mute Web Audio Sonification'}
          className={`flex items-center space-x-1 px-1.5 py-1 rounded-[2px] font-mono text-xs border transition-all shrink-0 ${
            !isAudioMuted
              ? 'bg-[#25272c] border-[#3a3b40] text-zinc-200'
              : 'bg-[#1f2024] border-[#2a2b30] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {!isAudioMuted ? (
            <Volume2 className="w-3.5 h-3.5 text-zinc-200" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span className="hidden sm:inline">{!isAudioMuted ? 'SYNTH ON' : 'SYNTH'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          title="Share Configuration (Copy URL with state)"
          className={`flex items-center space-x-1 px-1.5 py-1 rounded-[2px] font-mono text-xs border transition-colors shrink-0 ${
            copied
              ? 'bg-[#25272c] border-emerald-500/60 text-emerald-300'
              : 'bg-[#1f2024] border-[#2a2b30] text-zinc-300 hover:text-white'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'COPIED!' : 'SHARE'}</span>
        </button>
      </div>
    </header>
  );
}
