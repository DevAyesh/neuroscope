import { create } from 'zustand';
import {
  ActivationType,
  OptimizerType,
  LossType,
  NeuralNetwork,
  PRESET_SCENARIOS,
  PresetScenario,
  StepTraceMath,
  generateWaveData,
  generateDyingReLUData,
  generateVanishingGradData,
  generate2DSpiralData,
  generateStepMathData,
  DataSample,
} from '@/lib/nn-engine';
import { audioSynth } from '@/lib/audio-synth';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'grad' | 'necro';
  message: string;
}

export interface NetworkStoreState {
  // Scenario & Architecture
  currentPresetId: string;
  topology: number[];
  hiddenActivation: ActivationType;
  outputActivation: ActivationType;
  learningRate: number;
  optimizer: OptimizerType;
  lossType: LossType;
  dropoutRate: number;

  // Runtime Controls
  isPlaying: boolean;
  trainingSpeed: number; // updates per frame: 1, 2, 5, 10
  showBackpropGradients: boolean;
  showOscilloscopes: boolean;
  showParticles: boolean;
  viewportZoom: number;

  // Selected / Hovered state
  selectedNeuron: { layerIndex: number; neuronIndex: number } | null;
  hoveredNeuron: { layerIndex: number; neuronIndex: number } | null;

  // Step-by-Step Math Mode
  stepMathTraces: StepTraceMath[];
  stepMathIndex: number;

  // Live Metrics & Logs
  epoch: number;
  step: number;
  currentLoss: number;
  currentAccuracy: number;
  gradNorm: number;
  deadNeurons: number;
  activeNeurons: number;
  totalParameters: number;
  lossHistory: { epoch: number; loss: number; accuracy: number }[];
  terminalLogs: TerminalLogEntry[];

  // Output probabilities (for live gauge bars)
  outputProbabilities: { label: string; value: number }[];

  // Engine holder
  engine: NeuralNetwork;
  currentDataset: DataSample[];

  // Actions
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  stepOnce: () => void;
  setTrainingSpeed: (speed: number) => void;
  setShowBackpropGradients: (show: boolean) => void;
  setShowOscilloscopes: (show: boolean) => void;
  setShowParticles: (show: boolean) => void;
  setLearningRate: (lr: number) => void;
  setHiddenActivation: (act: ActivationType) => void;
  setOptimizer: (opt: OptimizerType) => void;
  setDropoutRate: (rate: number) => void;
  setSelectedNeuron: (neuron: { layerIndex: number; neuronIndex: number } | null) => void;
  setHoveredNeuron: (neuron: { layerIndex: number; neuronIndex: number } | null) => void;
  toggleNeuronDisabled: (layerIndex: number, neuronIndex: number) => void;
  
  // Architecture modification
  addHiddenLayer: () => void;
  removeHiddenLayer: (layerIndex: number) => void;
  setLayerNeuronCount: (layerIndex: number, count: number) => void;

  // Engine Actions
  resetWeights: () => void;
  perturbWeights: () => void;
  reviveDyingNeurons: () => void;
  selectPreset: (presetId: string) => void;
  nextMathStep: () => void;
  prevMathStep: () => void;
  setMathPhase: (phase: number) => void;
  syncMetrics: () => void;
  addLog: (level: TerminalLogEntry['level'], message: string) => void;
  getShareableUrl: () => string;
  loadStateFromUrl: (searchParams: URLSearchParams) => void;

  // Web Audio Sonification
  isAudioMuted: boolean;
  toggleAudio: () => void;
  setAudioMuted: (muted: boolean) => void;

  // Interactive Guided Tour
  isTourOpen: boolean;
  tourStep: number;
  spotlightTarget: {
    x: number;
    y: number;
    width: number;
    height: number;
    title?: string;
  } | null;
  secondarySpotlightTarget: {
    x: number;
    y: number;
    width: number;
    height: number;
    title?: string;
  } | null;
  backpropPulseCount: number;
  startTour: (initialStep?: number) => void;
  closeTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  setTourStep: (step: number) => void;
  setSpotlightTarget: (target: { x: number; y: number; width: number; height: number; title?: string } | null) => void;
  setSecondarySpotlightTarget: (target: { x: number; y: number; width: number; height: number; title?: string } | null) => void;
  triggerBackpropPulse: () => void;

  // Learning Guide & Outcomes Modal
  isLearningGuideOpen: boolean;
  openLearningGuide: () => void;
  closeLearningGuide: () => void;

  // 2D Custom Dataset Drawing Pad
  addCustomPoint: (x: number, y: number, classType: 0 | 1) => void;
  clearCustomDataset: () => void;
  resetDatasetToPreset: () => void;
}

const defaultPreset = PRESET_SCENARIOS[0];
const initialEngine = new NeuralNetwork(
  defaultPreset.topology,
  defaultPreset.hiddenActivation,
  defaultPreset.outputActivation,
  defaultPreset.learningRate,
  defaultPreset.optimizer
);
initialEngine.lossType = defaultPreset.lossType;
const initialDataset = generateWaveData(0, 80);

export const useNetworkStore = create<NetworkStoreState>((set, get) => ({
  currentPresetId: defaultPreset.id,
  topology: [...defaultPreset.topology],
  hiddenActivation: defaultPreset.hiddenActivation,
  outputActivation: defaultPreset.outputActivation,
  learningRate: defaultPreset.learningRate,
  optimizer: defaultPreset.optimizer,
  lossType: defaultPreset.lossType,
  dropoutRate: 0.0,

  isPlaying: true,
  trainingSpeed: 1,
  showBackpropGradients: true,
  showOscilloscopes: true,
  showParticles: true,
  viewportZoom: 1.0,

  isAudioMuted: true,
  isTourOpen: false,
  isLearningGuideOpen: false,
  tourStep: 0,
  spotlightTarget: null,
  secondarySpotlightTarget: null,
  backpropPulseCount: 0,

  selectedNeuron: null,
  hoveredNeuron: null,

  stepMathTraces: [],
  stepMathIndex: 0,

  epoch: 0,
  step: 0,
  currentLoss: 0,
  currentAccuracy: 0,
  gradNorm: 0,
  deadNeurons: 0,
  activeNeurons: initialEngine.metrics.activeNeuronCount,
  totalParameters: initialEngine.metrics.totalParameters,
  lossHistory: [],
  terminalLogs: [
    {
      id: 'init-1',
      timestamp: '00:00:00.000',
      level: 'info',
      message: 'NeuroScope C++ Debugger Kernel initialized. Ready for 60 FPS graph execution.',
    },
    {
      id: 'init-2',
      timestamp: '00:00:00.010',
      level: 'info',
      message: `Preset loaded: ${defaultPreset.title} | Topology: [${defaultPreset.topology.join(', ')}]`,
    },
  ],
  outputProbabilities: [],

  engine: initialEngine,
  currentDataset: initialDataset,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => {
    const isPlaying = !get().isPlaying;
    set({ isPlaying });
    get().addLog('info', isPlaying ? 'Engine execution resumed (60 FPS)' : 'Engine execution paused');
  },

  stepOnce: () => {
    const { engine, currentDataset } = get();
    engine.trainStep(currentDataset, 1);
    audioSynth.triggerPulse('forward');
    get().syncMetrics();
  },

  setTrainingSpeed: (trainingSpeed) => set({ trainingSpeed }),
  setShowBackpropGradients: (showBackpropGradients) => set({ showBackpropGradients }),
  setShowOscilloscopes: (showOscilloscopes) => set({ showOscilloscopes }),
  setShowParticles: (showParticles) => set({ showParticles }),

  setLearningRate: (learningRate) => {
    const { engine } = get();
    engine.learningRate = learningRate;
    set({ learningRate });
    get().addLog('grad', `Learning rate updated to ${learningRate.toFixed(4)}`);
  },

  setHiddenActivation: (act) => {
    const { engine } = get();
    engine.setActivation(act);
    set({ hiddenActivation: act });
    get().addLog('info', `Activation function changed to ${act.toUpperCase()}`);
    get().syncMetrics();
  },

  setOptimizer: (optimizer) => {
    const { engine } = get();
    engine.optimizer = optimizer;
    set({ optimizer });
    get().addLog('info', `Optimizer switched to ${optimizer.toUpperCase()}`);
  },

  setDropoutRate: (rate) => {
    const { engine } = get();
    engine.dropoutRate = rate;
    set({ dropoutRate: rate });
    get().addLog('info', `Dropout rate set to ${(rate * 100).toFixed(0)}%`);
  },

  setSelectedNeuron: (neuron) => {
    set({ selectedNeuron: neuron });
    if (neuron) {
      const { engine, currentDataset } = get();
      const sample = currentDataset[0] || { inputs: [0, 0], targets: [0] };
      const traces = engine.getStepTrace(sample, neuron.layerIndex, neuron.neuronIndex);
      set({ stepMathTraces: traces, stepMathIndex: 0 });
    }
  },

  setHoveredNeuron: (neuron) => set({ hoveredNeuron: neuron }),

  toggleNeuronDisabled: (layerIndex, neuronIndex) => {
    const { engine } = get();
    const isDisabled = engine.toggleNeuron(layerIndex, neuronIndex);
    const neuronLabel = engine.layers[layerIndex]?.neurons[neuronIndex]?.label || `L${layerIndex}N${neuronIndex}`;
    if (isDisabled) {
      audioSynth.triggerNeuronKill();
    } else {
      audioSynth.triggerRevival();
    }
    get().addLog(
      isDisabled ? 'warn' : 'success',
      isDisabled
        ? `[Dropout Intervention] ${neuronLabel} KILLED/DISABLED. Synapses severed.`
        : `[Neuron Restored] ${neuronLabel} RE-ENABLED. Synapses reconnected.`
    );
    get().syncMetrics();
  },

  addHiddenLayer: () => {
    const { topology, engine, hiddenActivation, outputActivation } = get();
    if (topology.length >= 8) {
      get().addLog('warn', 'Max hidden layers limit reached (6 hidden layers).');
      return;
    }
    // Insert new layer before output
    const newTopology = [...topology];
    const prevLayerSize = newTopology[newTopology.length - 2];
    newTopology.splice(newTopology.length - 1, 0, Math.min(16, Math.max(4, prevLayerSize)));
    engine.rebuildArchitecture(newTopology, hiddenActivation, outputActivation);
    set({ topology: newTopology });
    get().addLog('info', `Added Hidden Layer. New topology: [${newTopology.join(', ')}]`);
    get().syncMetrics();
  },

  removeHiddenLayer: (layerIndex) => {
    const { topology, engine, hiddenActivation, outputActivation } = get();
    if (topology.length <= 3) {
      get().addLog('warn', 'Minimum of 1 hidden layer required.');
      return;
    }
    const newTopology = [...topology];
    newTopology.splice(layerIndex, 1);
    engine.rebuildArchitecture(newTopology, hiddenActivation, outputActivation);
    set({ topology: newTopology, selectedNeuron: null });
    get().addLog('info', `Removed Layer ${layerIndex}. New topology: [${newTopology.join(', ')}]`);
    get().syncMetrics();
  },

  setLayerNeuronCount: (layerIndex, count) => {
    const { topology, engine, hiddenActivation, outputActivation } = get();
    if (count < 1 || count > 32) return;
    const newTopology = [...topology];
    newTopology[layerIndex] = count;
    engine.rebuildArchitecture(newTopology, hiddenActivation, outputActivation);
    set({ topology: newTopology, selectedNeuron: null });
    get().addLog('info', `Layer ${layerIndex} scaled to ${count} neurons.`);
    get().syncMetrics();
  },

  resetWeights: () => {
    const { engine } = get();
    engine.resetWeights('he');
    set({
      lossHistory: [],
      epoch: 0,
      step: 0,
      currentLoss: 0,
      currentAccuracy: 0,
    });
    get().addLog('info', 'Weights & biases re-initialized (He/Xavier distribution).');
    get().syncMetrics();
  },

  perturbWeights: () => {
    const { engine } = get();
    engine.perturbWeights(0.25);
    get().addLog('warn', 'Weight perturbation injected (Gaussian noise jitter ±0.25).');
    get().syncMetrics();
  },

  reviveDyingNeurons: () => {
    const { engine } = get();
    engine.setActivation('leaky_relu');
    engine.learningRate = Math.min(engine.learningRate, 0.08);
    // Perturb dead neurons specifically
    for (let l = 1; l < engine.layers.length - 1; l++) {
      for (const neuron of engine.layers[l].neurons) {
        if (neuron.isDead) {
          neuron.bias = 0.05;
          neuron.isDead = false;
          neuron.consecutiveZeroGrads = 0;
        }
      }
    }
    set({
      hiddenActivation: 'leaky_relu',
      learningRate: engine.learningRate,
    });
    audioSynth.triggerRevival();
    get().addLog(
      'success',
      'Revival protocol engaged: Hidden activation set to Leaky ReLU (slope 0.01), lr reduced to 0.08, necrotic neurons revived.'
    );
    get().syncMetrics();
  },

  selectPreset: (presetId) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;

    let dataset: DataSample[] = [];
    switch (preset.datasetName) {
      case 'wave_17':
        dataset = generateWaveData(0, 80);
        break;
      case 'dying_relu':
        dataset = generateDyingReLUData(80);
        break;
      case 'vanishing_grad':
        dataset = generateVanishingGradData(80);
        break;
      case 'xor_spiral':
        dataset = generate2DSpiralData(60);
        break;
      case 'step_math':
        dataset = generateStepMathData();
        break;
    }

    const newEngine = new NeuralNetwork(
      preset.topology,
      preset.hiddenActivation,
      preset.outputActivation,
      preset.learningRate,
      preset.optimizer
    );
    newEngine.lossType = preset.lossType;

    const sample = dataset[0] || { inputs: [0, 0], targets: [0] };
    const traces = newEngine.getStepTrace(sample, 1, 0);

    set({
      currentPresetId: preset.id,
      topology: [...preset.topology],
      hiddenActivation: preset.hiddenActivation,
      outputActivation: preset.outputActivation,
      learningRate: preset.learningRate,
      optimizer: preset.optimizer,
      lossType: preset.lossType,
      engine: newEngine,
      currentDataset: dataset,
      selectedNeuron: null,
      stepMathTraces: traces,
      stepMathIndex: 0,
      lossHistory: [],
      epoch: 0,
      step: 0,
      isPlaying: true,
      isTourOpen: false,
      spotlightTarget: null,
      secondarySpotlightTarget: null,
    });

    get().addLog('info', `Switched to Preset: "${preset.title}" - ${preset.subtitle}`);
    get().syncMetrics();
  },

  setMathPhase: (phase: number) => {
    const { stepMathTraces } = get();
    if (stepMathTraces.length === 0) return;
    const clamped = Math.max(0, Math.min(stepMathTraces.length - 1, phase));
    set({ stepMathIndex: clamped });
  },

  prevMathStep: () => {
    const { stepMathTraces, stepMathIndex } = get();
    if (stepMathTraces.length === 0) return;
    const prevIdx = (stepMathIndex - 1 + stepMathTraces.length) % stepMathTraces.length;
    set({ stepMathIndex: prevIdx });
  },

  nextMathStep: () => {
    const { stepMathTraces, stepMathIndex, engine, currentDataset, selectedNeuron } = get();
    if (stepMathTraces.length === 0) {
      const sample = currentDataset[0] || { inputs: [0, 0], targets: [0] };
      const layer = selectedNeuron?.layerIndex ?? 1;
      const neuron = selectedNeuron?.neuronIndex ?? 0;
      const traces = engine.getStepTrace(sample, layer, neuron);
      set({ stepMathTraces: traces, stepMathIndex: 0 });
      return;
    }

    const nextIdx = (stepMathIndex + 1) % stepMathTraces.length;
    set({ stepMathIndex: nextIdx });

    // If wrapped to 0, execute 1 actual training step
    if (nextIdx === 0) {
      engine.trainStep(currentDataset, 1);
      get().syncMetrics();
      const sample = currentDataset[0] || { inputs: [0, 0], targets: [0] };
      const layer = selectedNeuron?.layerIndex ?? 1;
      const neuron = selectedNeuron?.neuronIndex ?? 0;
      const traces = engine.getStepTrace(sample, layer, neuron);
      set({ stepMathTraces: traces });
    }
  },

  syncMetrics: () => {
    const { engine } = get();
    const outputLayer = engine.layers[engine.layers.length - 1];
    const probs = outputLayer
      ? outputLayer.neurons.map((n, i) => ({
          label: n.label || `Out${i + 1}`,
          value: Math.max(0, Math.min(1, n.a)),
        }))
      : [];

    set((state) => {
      const newHistory = [...state.lossHistory];
      if (newHistory.length === 0 || engine.metrics.epoch > (newHistory[newHistory.length - 1]?.epoch ?? 0)) {
        newHistory.push({
          epoch: engine.metrics.epoch,
          loss: engine.metrics.loss,
          accuracy: engine.metrics.accuracy,
        });
        if (newHistory.length > 50) newHistory.shift();
      }

      return {
        epoch: engine.metrics.epoch,
        step: engine.metrics.step,
        currentLoss: engine.metrics.loss,
        currentAccuracy: engine.metrics.accuracy,
        gradNorm: engine.metrics.gradNorm,
        deadNeurons: engine.metrics.deadNeuronCount,
        activeNeurons: engine.metrics.activeNeuronCount,
        totalParameters: engine.metrics.totalParameters,
        outputProbabilities: probs,
        lossHistory: newHistory,
      };
    });
  },

  addLog: (level, message) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    const entry: TerminalLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      level,
      message,
    };
    set((state) => ({
      terminalLogs: [...state.terminalLogs.slice(-49), entry],
    }));
  },

  getShareableUrl: () => {
    const { topology, hiddenActivation, outputActivation, learningRate, optimizer, currentPresetId } = get();
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    params.set('preset', currentPresetId);
    params.set('topology', topology.join(','));
    params.set('act', hiddenActivation);
    params.set('outAct', outputActivation);
    params.set('lr', learningRate.toString());
    params.set('opt', optimizer);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  },

  loadStateFromUrl: (searchParams) => {
    const preset = searchParams.get('preset');
    const topoStr = searchParams.get('topology');
    const act = searchParams.get('act') as ActivationType | null;
    const outAct = searchParams.get('outAct') as ActivationType | null;
    const lrStr = searchParams.get('lr');
    const opt = searchParams.get('opt') as OptimizerType | null;

    if (preset) {
      get().selectPreset(preset);
    }
    if (topoStr) {
      const topo = topoStr.split(',').map((x) => parseInt(x, 10)).filter((x) => !isNaN(x) && x > 0);
      if (topo.length >= 2) {
        const { engine, hiddenActivation, outputActivation } = get();
        engine.rebuildArchitecture(topo, act || hiddenActivation, outAct || outputActivation);
        set({ topology: topo, outputActivation: outAct || outputActivation });
      }
    }
    if (act) {
      get().setHiddenActivation(act);
    }
    if (outAct) {
      const { engine } = get();
      engine.outputActivation = outAct;
      if (engine.layers.length > 0) {
        engine.layers[engine.layers.length - 1].activation = outAct;
      }
      set({ outputActivation: outAct });
    }
    if (lrStr) {
      const lr = parseFloat(lrStr);
      if (!isNaN(lr) && lr > 0) get().setLearningRate(lr);
    }
    if (opt) {
      get().setOptimizer(opt);
    }
  },

  // Web Audio Sonification
  toggleAudio: () => {
    const nextMuted = !get().isAudioMuted;
    audioSynth.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
    get().addLog(
      'info',
      nextMuted
        ? 'Web Audio synth muted.'
        : 'Web Audio synth unmuted (Harmonic Low-Pass Synth active: tracking loss & signal pulses).'
    );
  },

  setAudioMuted: (muted) => {
    audioSynth.setMuted(muted);
    set({ isAudioMuted: muted });
  },

  // Interactive Guided Tour
  startTour: (initialStep = 0) => {
    const { selectPreset, currentPresetId, setShowOscilloscopes } = get();
    // Default to signal_debugger preset if not already there, to show waves & oscilloscopes
    if (currentPresetId !== 'signal_debugger') {
      selectPreset('signal_debugger');
    }
    setShowOscilloscopes(true);
    set({
      isTourOpen: true,
      isPlaying: true,
      isLearningGuideOpen: false,
    });
    get().setTourStep(initialStep);
    get().addLog('info', `Started Interactive Guided Lesson: Step ${Math.min(5, Math.max(1, initialStep + 1))} of 5.`);
  },

  closeTour: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('neuroscope_tour_completed', 'true');
      } catch (_) {}
    }
    set({ isTourOpen: false, selectedNeuron: null, spotlightTarget: null, secondarySpotlightTarget: null });
    get().addLog('info', 'Interactive Guided Lesson closed.');
  },

  nextTourStep: () => {
    const current = get().tourStep;
    const next = Math.min(4, current + 1);
    get().setTourStep(next);
  },

  prevTourStep: () => {
    const current = get().tourStep;
    const prev = Math.max(0, current - 1);
    get().setTourStep(prev);
  },

  setTourStep: (step) => {
    const clamped = Math.max(0, Math.min(4, step));
    set({ tourStep: clamped });

    if (clamped === 0) {
      // Step 1: Input Oscilloscopes
      get().setShowOscilloscopes(true);
      get().setSelectedNeuron(null);
      set({ secondarySpotlightTarget: null });
    } else if (clamped === 1) {
      // Step 2: Bezier Synapses
      get().setSelectedNeuron(null);
      set({ secondarySpotlightTarget: null });
    } else if (clamped === 2) {
      // Step 3: Hidden Neuron & Activation Graph
      get().setSelectedNeuron({ layerIndex: 1, neuronIndex: 0 });
    } else if (clamped === 3) {
      // Step 4: Backpropagation pulse
      get().setSelectedNeuron(null);
      set({ secondarySpotlightTarget: null });
      get().triggerBackpropPulse();
    } else if (clamped === 4) {
      // Step 5: Invite user to kill neuron
      get().setSelectedNeuron(null);
      set({ secondarySpotlightTarget: null });
    }
  },

  setSpotlightTarget: (target) => set({ spotlightTarget: target }),
  setSecondarySpotlightTarget: (target) => set({ secondarySpotlightTarget: target }),

  triggerBackpropPulse: () => {
    set((state) => ({
      backpropPulseCount: state.backpropPulseCount + 1,
      showBackpropGradients: true,
    }));
    audioSynth.triggerPulse('backward');
    get().addLog('grad', '⚡ Backpropagation error pulse triggered across all synapses.');
  },

  // Learning Guide & Outcomes Modal
  openLearningGuide: () => {
    set({ isLearningGuideOpen: true });
    get().addLog('info', 'Opened Learning Outcomes & Pedagogical Guide.');
  },
  closeLearningGuide: () => {
    set({ isLearningGuideOpen: false });
  },

  // 2D Custom Dataset Drawing Pad
  addCustomPoint: (x: number, y: number, classType: 0 | 1) => {
    const { engine } = get();
    const is2Output = engine.topology[engine.topology.length - 1] >= 2;
    // Class 0 = Cyan -> target [0, 1] or [1] (matches DecisionBoundary prob -> 1: Cyan)
    // Class 1 = Amber -> target [1, 0] or [0] (matches DecisionBoundary prob -> 0: Amber)
    const targets = is2Output
      ? classType === 0
        ? [0, 1]
        : [1, 0]
      : classType === 0
      ? [1]
      : [0];

    const newSample: DataSample = {
      inputs: [x, y],
      targets,
      label: classType === 0 ? 'Class 0 (Cyan)' : 'Class 1 (Amber)',
      coords: [x, y],
    };

    set((state) => ({
      currentDataset: [...state.currentDataset, newSample],
    }));

    audioSynth.triggerPulse('forward');
    get().syncMetrics();
  },

  clearCustomDataset: () => {
    set({ currentDataset: [] });
    get().addLog('info', '2D Dataset cleared. Left-click (Cyan) or Right-click (Amber) to draw custom dots.');
    get().syncMetrics();
  },

  resetDatasetToPreset: () => {
    const { currentPresetId } = get();
    let dataset: DataSample[] = [];
    if (currentPresetId === '2d_classifier') {
      dataset = generate2DSpiralData(60);
    } else if (currentPresetId === 'signal_debugger') {
      dataset = generateWaveData(0, 80);
    } else if (currentPresetId === 'dying_relu') {
      dataset = generateDyingReLUData(80);
    } else if (currentPresetId === 'vanishing_grad') {
      dataset = generateVanishingGradData(80);
    } else {
      dataset = generateStepMathData();
    }
    set({ currentDataset: dataset });
    get().addLog('info', 'Dataset restored to preset configuration.');
    get().syncMetrics();
  },
}));
