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
} from 'lucide-react';

export default function TopControlBar() {
  const {
    currentPresetId,
    isPlaying,
    learningRate,
    hiddenActivation,
    optimizer,
    deadNeurons,
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

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

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
    <header className="h-12 bg-[#0f141f] border-b border-[#1e293b] flex items-center justify-between px-2 sm:px-3 z-40 relative select-none w-full">
      {/* Left: Brand & Preset Selector */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/30">
            <Activity className="w-3 h-3 text-white" />
          </div>
          <div className="flex items-center">
            <span className="font-bold tracking-tight text-white font-mono text-xs">
              NEURO<span className="text-cyan-400">SCOPE</span>
            </span>
            <span className="hidden sm:inline ml-1 px-1 py-0.2 text-[8px] bg-[#1e293b] text-cyan-300 rounded font-mono border border-cyan-800/40">
              v1.0
            </span>
          </div>
        </div>

        <div className="h-3.5 w-px bg-[#1e293b] hidden md:block" />

        {/* Preset Selector Dropdown / Pills */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={presetDropdownOpen}
            className={`flex items-center space-x-1 px-1.5 py-1 rounded bg-[#161d2d] hover:bg-[#1e293b] border ${
              presetDropdownOpen
                ? 'border-cyan-500/60 text-cyan-300 bg-[#1e293b]'
                : 'border-[#1e293b] text-slate-200'
            } text-xs font-mono transition-colors shadow-sm`}
          >
            <span className="text-cyan-400 font-semibold hidden xl:inline">[PRESET]</span>
            <span className="truncate max-w-[90px] sm:max-w-[120px] md:max-w-[140px] xl:max-w-[170px]">{currentPreset.title}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${
                presetDropdownOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {presetDropdownOpen && (
            <div
              role="listbox"
              aria-label="Educational Scenarios"
              className="fixed left-2 right-2 sm:right-auto sm:left-0 top-12 sm:top-full mt-1.5 sm:w-80 max-w-[calc(100vw-1rem)] bg-[#0f141f] border border-[#1e293b] rounded-lg shadow-2xl p-1 z-50 font-mono text-xs max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="px-2 py-1 text-[10px] text-slate-500 uppercase border-b border-[#1e293b] mb-1 flex items-center justify-between">
                <span>Select Educational Scenario</span>
                <span className="text-[9px] text-cyan-500/80 font-normal">ESC to close</span>
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
                      className={`w-full text-left p-2 rounded transition-colors flex flex-col space-y-1 ${
                        isSelected
                          ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-300'
                          : 'hover:bg-[#161d2d] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSelected ? (
                            <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 shrink-0" />
                          )}
                          <span className="font-semibold text-xs truncate">{preset.title}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${preset.badgeColor}`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate pl-[18px]">{preset.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Lesson Button for first-time and curious visitors */}
        <button
          onClick={() => {
            setIsFirstTime(false);
            startTour();
          }}
          title="Start 5-Step Interactive Guided Lesson"
          className={`flex items-center space-x-1 px-1.5 py-1 rounded font-mono text-xs font-semibold border transition-all ${
            isTourOpen
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20'
              : isFirstTime
              ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-cyan-300 border-cyan-400/60 hover:border-cyan-400 shadow-md animate-pulse'
              : 'bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-cyan-400 border-[#1e293b]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] hidden md:inline">LESSON</span>
          {isFirstTime && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>

        {/* Learning Guide & Pedagogical Outcomes Modal Trigger */}
        <button
          onClick={openLearningGuide}
          title="Open Learning Guide & Pedagogical Outcomes"
          aria-label="Open Learning Guide & Pedagogical Outcomes"
          className="flex items-center space-x-1 px-1.5 py-1 rounded font-mono text-xs font-semibold bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-cyan-400 border border-[#1e293b] hover:border-cyan-500/40 transition-all shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] hidden md:inline">GUIDE</span>
        </button>
      </div>

      {/* Center: Playback & Step Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pause Simulation (Space)' : 'Start Simulation (Space)'}
          className={`flex items-center space-x-1 px-2 py-1 rounded font-mono text-xs font-bold transition-all shadow-md ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10'
              : 'bg-emerald-600 text-white border border-emerald-400 hover:bg-emerald-500 shadow-emerald-600/30'
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
          title="Step Forward 1 Epoch"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-cyan-400 border border-[#1e293b] rounded font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">STEP</span>
        </button>

        <button
          onClick={resetWeights}
          title="Reset Weights & Biases"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-red-400 border border-[#1e293b] rounded font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">RESET</span>
        </button>

        <button
          onClick={perturbWeights}
          title="Perturb Weights (Noise Injection)"
          className="p-1 sm:px-1.5 sm:py-1 bg-[#161d2d] hover:bg-[#1e293b] text-slate-300 hover:text-amber-400 border border-[#1e293b] rounded font-mono text-xs flex items-center space-x-1 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">JITTER</span>
        </button>

        {/* Dying ReLU quick fix button (shown if necrotic neurons exist or in dying_relu preset) */}
        {(deadNeurons > 0 || currentPresetId === 'dying_relu') && (
          <button
            onClick={reviveDyingNeurons}
            title="Revive Dead Neurons using Leaky ReLU"
            className="flex items-center space-x-1 px-1.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500 text-red-300 rounded font-mono text-xs animate-pulse transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">REVIVE</span>
          </button>
        )}
      </div>

      {/* Right: Hyperparameters & Share */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Learning Rate Slider (visible on wide 2xl screens, also available in sidebar) */}
        <div className="hidden 2xl:flex items-center space-x-1 bg-[#161d2d] px-1.5 py-0.5 rounded border border-[#1e293b]">
          <span className="text-[10px] font-mono text-slate-400">LR:</span>
          <input
            type="range"
            min="0.0001"
            max="1.0"
            step="0.0005"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-14 accent-cyan-400 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-cyan-400 font-bold w-10 text-right">
            {learningRate.toFixed(4)}
          </span>
        </div>

        {/* Activation Selector */}
        <div className="flex items-center space-x-1 bg-[#161d2d] px-1.5 py-1 rounded border border-[#1e293b] shrink-0">
          <span className="text-[10px] font-mono text-slate-400">ACT:</span>
          <select
            value={hiddenActivation}
            onChange={(e) => setHiddenActivation(e.target.value as ActivationType)}
            className="bg-transparent text-cyan-300 font-mono text-xs outline-none cursor-pointer"
          >
            <option value="relu" className="bg-[#0f141f]">ReLU</option>
            <option value="leaky_relu" className="bg-[#0f141f]">Leaky</option>
            <option value="sigmoid" className="bg-[#0f141f]">Sigmoid</option>
            <option value="tanh" className="bg-[#0f141f]">Tanh</option>
            <option value="linear" className="bg-[#0f141f]">Linear</option>
          </select>
        </div>

        {/* Optimizer Toggle */}
        <div className="hidden 2xl:flex items-center space-x-1 bg-[#161d2d] px-1.5 py-1 rounded border border-[#1e293b] shrink-0">
          <span className="text-[10px] font-mono text-slate-400">OPT:</span>
          <button
            onClick={() => setOptimizer(optimizer === 'momentum' ? 'sgd' : 'momentum')}
            className="text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors"
          >
            {optimizer.toUpperCase()}
          </button>
        </div>

        {/* Web Audio Sonification Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Web Audio Sonification (Harmonic Synth)' : 'Mute Web Audio Sonification'}
          className={`flex items-center space-x-1 px-1.5 py-1 rounded font-mono text-xs border transition-all shrink-0 ${
            !isAudioMuted
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-[#161d2d] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-[#334155]'
          }`}
        >
          {!isAudioMuted ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="hidden sm:inline">{!isAudioMuted ? 'SYNTH ON' : 'SYNTH'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          title="Share Configuration (Copy URL with state)"
          className={`flex items-center space-x-1 px-1.5 py-1 rounded font-mono text-xs border transition-colors shrink-0 ${
            copied
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
              : 'bg-[#161d2d] border-[#1e293b] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'COPIED!' : 'SHARE'}</span>
        </button>
      </div>
    </header>
  );
}
