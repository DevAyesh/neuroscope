'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { generateWaveData, ActivationType } from '@/lib/nn-engine';
import { audioSynth } from '@/lib/audio-synth';
import DecisionBoundary from './DecisionBoundary';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Activity,
  Layers,
  Zap,
  Skull,
  Eye,
  EyeOff,
  Cpu,
  Info,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';

interface Particle {
  fromLayer: number;
  fromIndex: number;
  toLayer: number;
  toIndex: number;
  t: number; // 0 to 1
  speed: number;
  isBackprop: boolean;
  color: string;
  size: number;
}

interface NodeCoord {
  x: number;
  y: number;
  r: number;
  layerIndex: number;
  neuronIndex: number;
}

export default function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zustand Store selectors
  const {
    engine,
    topology,
    isPlaying,
    trainingSpeed,
    showBackpropGradients,
    showOscilloscopes,
    showParticles,
    minWeightThreshold,
    currentDataset,
    trainDataset,
    selectedNeuron,
    hoveredNeuron,
    stepMathIndex,
    stepMathTraces,
    nextMathStep,
    setSelectedNeuron,
    setHoveredNeuron,
    toggleNeuronDisabled,
    syncMetrics,
    setHiddenActivation,
    currentPresetId,
    isTourOpen,
    tourStep,
    backpropPulseCount,
    setSpotlightTarget,
    setSecondarySpotlightTarget,
  } = useNetworkStore();

  interface HeaderClickBox {
    layerIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  const headerClickBoxesRef = useRef<HeaderClickBox[]>([]);
  const hoveredHeaderLayerRef = useRef<number | null>(null);

  // Canvas Pan & Zoom state (stored in ref for smooth 60fps rendering without re-renders)
  const transformRef = useRef({
    panX: 70,
    panY: 30,
    zoom: 1.0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  });

  const [fps, setFps] = useState(60);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  const [legendOpen, setLegendOpen] = useState(false);
  const nodeCoordsRef = useRef<NodeCoord[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSyncTimeRef = useRef(0);
  const lastMathStepTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsCalcTimeRef = useRef(performance.now());
  const waveTimeRef = useRef(0);
  const hasUserInteractedRef = useRef(false);

  // Helper spacing metrics to ensure circles never overlap and fit nicely
  const getLayerSpacing = useCallback(
    (layerCount: number) => Math.max(180, Math.min(320, 960 / Math.max(1, layerCount - 1))),
    []
  );
  const getNodeSpacing = useCallback(
    (count: number) => (count > 20 ? 36 : count > 15 ? 44 : count > 8 ? 54 : 64),
    []
  );
  const getNodeRadius = useCallback(
    (count: number) => (count > 20 ? 10.5 : count > 15 ? 12 : 14),
    []
  );

  // Center / reset camera view so the network fills ~80% of viewport
  const handleResetCamera = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width <= 0 || height <= 0) return;

    // Topology metrics
    const currentTopology = topology.length > 0 ? topology : engine.topology;
    const layerCount = currentTopology.length;
    const layerSpacing = getLayerSpacing(layerCount);

    // Compute bounding box in world coordinates
    const maxTotalHeight = Math.max(
      ...currentTopology.map((c) => (c - 1) * getNodeSpacing(c))
    );

    // World X bounds (including oscilloscopes or headers)
    const minWorldX = showOscilloscopes ? 34 : 50;
    const maxWorldX = (layerCount - 1) * layerSpacing + 120 + 72;
    const worldWidth = Math.max(200, maxWorldX - minWorldX);

    // World Y bounds (including headers at top and node labels at bottom)
    const minWorldY = 38;
    const maxWorldY = 100 + maxTotalHeight + 32;
    const worldHeight = Math.max(200, maxWorldY - minWorldY);

    // Network fills ~80% of viewport height/width
    const targetWidth = width * 0.80;
    const targetHeight = height * 0.80;

    let fitZoom = Math.min(targetWidth / worldWidth, targetHeight / worldHeight);
    fitZoom = Math.max(0.42, Math.min(1.5, fitZoom));

    // Centered camera pan
    const panX = (width - worldWidth * fitZoom) / 2 - minWorldX * fitZoom;
    const panY = (height - worldHeight * fitZoom) / 2 - minWorldY * fitZoom;

    transformRef.current = {
      panX,
      panY,
      zoom: fitZoom,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
    };
    setZoomDisplay(Math.round(fitZoom * 100));
  }, [topology, engine.topology, showOscilloscopes, getLayerSpacing, getNodeSpacing]);

  // Adjust zoom smoothly
  const handleZoom = (delta: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    hasUserInteractedRef.current = true;
    const newZoom = Math.max(0.3, Math.min(3.0, transformRef.current.zoom + delta));
    const factor = newZoom / transformRef.current.zoom;
    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;

    transformRef.current.panX = centerX - (centerX - transformRef.current.panX) * factor;
    transformRef.current.panY = centerY - (centerY - transformRef.current.panY) * factor;
    transformRef.current.zoom = newZoom;
    setZoomDisplay(Math.round(newZoom * 100));
  };

  const handleAutoFitClick = useCallback(() => {
    hasUserInteractedRef.current = false;
    handleResetCamera();
  }, [handleResetCamera]);

  // Main 60 FPS Render & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (timestamp: number) => {
      // 1. Calculate FPS
      frameCountRef.current++;
      if (timestamp - lastFpsCalcTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (timestamp - lastFpsCalcTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsCalcTimeRef.current = timestamp;
      }

      // 2. High-DPI Canvas Resizing
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      // 3. Neural Network Simulation Step
      const isMathMode = currentPresetId === 'step_math_xray';

      if (isPlaying) {
        if (isMathMode) {
          // Slows training down to 1 step per second (1000ms per phase) per Requirement 5
          if (timestamp - lastMathStepTimeRef.current >= 1000) {
            nextMathStep();
            lastMathStepTimeRef.current = timestamp;
          }
        } else if (currentDataset.length > 0) {
          // In Sensor Array mode, stream real-time continuous wave signals into input nodes
          if (currentPresetId === 'signal_debugger') {
            waveTimeRef.current += 0.04;
            const inputDim = engine.topology[0] || 17;
            const liveSample = generateWaveData(waveTimeRef.current, 1, inputDim)[0];
            if (liveSample) {
              engine.forward(liveSample.inputs, false);
            }
          }

          const datasetToUse = trainDataset && trainDataset.length > 0 ? trainDataset : currentDataset;
          for (let s = 0; s < trainingSpeed; s++) {
            engine.trainStep(datasetToUse, 1);
          }
          audioSynth.triggerTrainingPulse(isPlaying, engine.metrics.gradNorm);
        }

        // Throttled sync to React state every ~100ms
        if (timestamp - lastSyncTimeRef.current > 100) {
          syncMetrics();
          audioSynth.updateMetrics(
            engine.metrics.loss,
            engine.metrics.accuracy,
            engine.metrics.gradNorm,
            engine.metrics.deadNeuronCount,
            isPlaying
          );
          lastSyncTimeRef.current = timestamp;
        }
      } else {
        if (timestamp - lastSyncTimeRef.current > 400) {
          audioSynth.updateMetrics(
            engine.metrics.loss,
            engine.metrics.accuracy,
            engine.metrics.gradNorm,
            engine.metrics.deadNeuronCount,
            false
          );
          lastSyncTimeRef.current = timestamp;
        }
      }

      // 4. Begin Drawing
      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear with flat matte carbon background
      ctx.fillStyle = '#111215';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle C++ Workstation Background Grid
      const gridSize = 32 * transformRef.current.zoom;
      const offsetX = transformRef.current.panX % gridSize;
      const offsetY = transformRef.current.panY % gridSize;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = offsetX; x < displayWidth; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
      }
      for (let y = offsetY; y < displayHeight; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
      }
      ctx.stroke();

      // Apply Pan & Zoom transformation
      ctx.save();
      ctx.translate(transformRef.current.panX, transformRef.current.panY);
      ctx.scale(transformRef.current.zoom, transformRef.current.zoom);

      // Compute Node Coordinates
      const currentTopology = topology.length > 0 ? topology : engine.topology;
      const layerSpacing = getLayerSpacing(currentTopology.length);

      const layerCoords: NodeCoord[][] = [];
      const allCoords: NodeCoord[] = [];

      // Find max layer vertical span to center all layers vertically
      const maxTotalHeight = Math.max(
        ...currentTopology.map((c) => (c - 1) * getNodeSpacing(c))
      );
      const centerY = 100 + maxTotalHeight / 2;

      for (let l = 0; l < currentTopology.length; l++) {
        const count = currentTopology[l];
        layerCoords[l] = [];
        const x = l * layerSpacing + 120;

        // Increased vertical spacing for layers with >15 nodes so circles never overlap
        const nodeSpacing = getNodeSpacing(count);
        const r = getNodeRadius(count);
        const totalHeight = (count - 1) * nodeSpacing;
        const startY = centerY - totalHeight / 2;

        for (let n = 0; n < count; n++) {
          const y = startY + n * nodeSpacing;
          const coord: NodeCoord = {
            x,
            y,
            r,
            layerIndex: l,
            neuronIndex: n,
          };
          layerCoords[l].push(coord);
          allCoords.push(coord);
        }
      }
      nodeCoordsRef.current = allCoords;

      // 5. Draw Layer Headers (Authentic Dear ImGui Monospace Workstation style)
      headerClickBoxesRef.current = [];
      const headerY = 36;
      for (let l = 0; l < currentTopology.length; l++) {
        const layer = engine.layers[l];
        if (!layer) continue;
        const x = l * layerSpacing + 120;
        const isOutputLayer = l === currentTopology.length - 1;
        const headerWidth = isOutputLayer ? 170 : 120;
        const leftX = x - 35;

        // Subtle top border line
        ctx.strokeStyle = '#2a2b30';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, headerY);
        ctx.lineTo(leftX + headerWidth, headerY);
        ctx.stroke();

        // Plain left-aligned monospace text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Line 1: Layer Title
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f4f4f5';
        const title = l === 0 ? 'INPUT' : isOutputLayer ? 'OUTPUT' : `HL ${l}`;
        ctx.fillText(title, leftX, headerY + 6);

        // Line 2: Neurons count
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`Neurons: ${layer.size}`, leftX, headerY + 19);

        // Line 3: Activation (click)
        if (l > 0) {
          let actDisplay = 'Linear';
          if (layer.activation === 'softmax') {
            actDisplay = 'Softmax';
          } else if (layer.activation === 'sigmoid') {
            actDisplay = isOutputLayer ? 'Sigmoid (Multi-label)' : 'Sigmoid';
          } else if (layer.activation === 'relu') {
            actDisplay = 'ReLU';
          } else if (layer.activation === 'leaky_relu') {
            actDisplay = 'Leaky ReLU';
          } else if (layer.activation === 'tanh') {
            actDisplay = 'Tanh';
          }

          const isHoveredAct = hoveredHeaderLayerRef.current === l;
          ctx.fillStyle = isHoveredAct ? '#60a5fa' : '#93c5fd';
          ctx.fillText(`Activation: ${actDisplay} (click)`, leftX, headerY + 32);

          headerClickBoxesRef.current.push({
            layerIndex: l,
            x: leftX,
            y: headerY + 30,
            width: headerWidth,
            height: 16,
          });
        }
      }

      // 6. Draw Synapses (Crisp Straight Lines, Batch Rendering, Threshold Culling, No shadowBlur)
      const hasFocusNeuron = selectedNeuron !== null || hoveredNeuron !== null;
      const focus = hoveredNeuron || selectedNeuron;
      const mathPhase = isMathMode ? stepMathIndex : -1;

      const severedLines: [NodeCoord, NodeCoord][] = [];
      const dimmedLines: [NodeCoord, NodeCoord][] = [];
      const mathPhase1Lines: [NodeCoord, NodeCoord][] = [];
      const mathPhase4Lines: [NodeCoord, NodeCoord][] = [];
      const focusLines: Array<{ from: NodeCoord; to: NodeCoord; color: string; width: number; isNegative: boolean }> = [];

      const posLow: [NodeCoord, NodeCoord][] = [];
      const posMid: [NodeCoord, NodeCoord][] = [];
      const posHigh: [NodeCoord, NodeCoord][] = [];
      const negLow: [NodeCoord, NodeCoord][] = [];
      const negMid: [NodeCoord, NodeCoord][] = [];
      const negHigh: [NodeCoord, NodeCoord][] = [];

      // For dense networks, cap particle count to a maximum of 120 active particles
      const maxParticles = 120;

      for (let l = 0; l < currentTopology.length - 1; l++) {
        const fromCoords = layerCoords[l];
        const toCoords = layerCoords[l + 1];
        if (!fromCoords || !toCoords) continue;

        for (let f = 0; f < fromCoords.length; f++) {
          const fromNode = fromCoords[f];
          const fromNeuron = engine.layers[l]?.neurons[f];
          if (!fromNode || !fromNeuron) continue;

          for (let t = 0; t < toCoords.length; t++) {
            const toNode = toCoords[t];
            const toNeuron = engine.layers[l + 1]?.neurons[t];
            const synapse = engine.synapses[l]?.[f]?.[t];
            if (!toNode || !toNeuron || !synapse) continue;

            const weight = synapse.weight;
            const absW = Math.abs(weight);
            const isConnectedToFocus =
              hasFocusNeuron &&
              focus &&
              ((focus.layerIndex === l && focus.neuronIndex === f) ||
                (focus.layerIndex === l + 1 && focus.neuronIndex === t));

            const isMathTargetSynapse =
              isMathMode &&
              focus &&
              focus.layerIndex === l + 1 &&
              focus.neuronIndex === t;

            // Threshold Culling: Skip drawing weights below minWeightThreshold unless focused
            const effectiveThreshold = hasFocusNeuron ? 0.01 : (minWeightThreshold ?? 0.04);
            if (!isConnectedToFocus && !isMathTargetSynapse && absW < effectiveThreshold) {
              // Culled
            } else if (fromNeuron.disabled || toNeuron.disabled) {
              severedLines.push([fromNode, toNode]);
            } else if (isMathMode && mathPhase === 1 && isMathTargetSynapse) {
              mathPhase1Lines.push([fromNode, toNode]);
            } else if (isMathMode && mathPhase === 4 && isMathTargetSynapse) {
              mathPhase4Lines.push([fromNode, toNode]);
            } else if (isConnectedToFocus) {
              const alpha = Math.min(0.95, Math.max(0.4, absW * 0.45 + 0.35));
              const color = weight >= 0 ? `rgba(245, 158, 11, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
              const strokeWidth = Math.min(2.5, Math.max(0.8, absW * 1.5));
              focusLines.push({ from: fromNode, to: toNode, color, width: strokeWidth, isNegative: weight < 0 });
            } else if (hasFocusNeuron && !isConnectedToFocus) {
              dimmedLines.push([fromNode, toNode]);
            } else {
              if (weight >= 0) {
                if (absW < 0.20) posLow.push([fromNode, toNode]);
                else if (absW < 0.65) posMid.push([fromNode, toNode]);
                else posHigh.push([fromNode, toNode]);
              } else {
                if (absW < 0.20) negLow.push([fromNode, toNode]);
                else if (absW < 0.65) negMid.push([fromNode, toNode]);
                else negHigh.push([fromNode, toNode]);
              }
            }

            // Spawn Particles along active synapses (capped at 120 across the screen)
            if (
              showParticles &&
              isPlaying &&
              !fromNeuron.disabled &&
              !toNeuron.disabled &&
              particlesRef.current.length < maxParticles
            ) {
              const spawnRate = isConnectedToFocus ? 0.08 : 0.015;
              if (Math.random() < spawnRate * Math.min(2.5, absW + 0.2)) {
                // Forward particle (Amber / Steel Blue)
                particlesRef.current.push({
                  fromLayer: l,
                  fromIndex: f,
                  toLayer: l + 1,
                  toIndex: t,
                  t: 0,
                  speed: 0.02 + Math.random() * 0.015,
                  isBackprop: false,
                  color: weight >= 0 ? '#f59e0b' : '#3b82f6',
                  size: 2.0,
                });

                if (Math.random() < 0.03) {
                  audioSynth.triggerPulse('forward');
                }

                // Backpropagation particle (Red / Amber)
                if (showBackpropGradients && Math.abs(toNeuron.gradZ) > 0.005) {
                  particlesRef.current.push({
                    fromLayer: l,
                    fromIndex: f,
                    toLayer: l + 1,
                    toIndex: t,
                    t: 1.0,
                    speed: 0.025 + Math.random() * 0.02,
                    isBackprop: true,
                    color: Math.abs(toNeuron.gradZ) > 0.5 ? '#ef4444' : '#f59e0b',
                    size: 2.2,
                  });
                  if (Math.random() < 0.03) {
                    audioSynth.triggerPulse('backward');
                  }
                }
              }
            }
          }
        }
      }

      // Helper function to draw straight connection lines in batches (with dashed support for colorblind distinction)
      const drawLineBatch = (
        lines: [NodeCoord, NodeCoord][],
        strokeStyle: string,
        lineWidth: number,
        isDashed = false
      ) => {
        if (lines.length === 0) return;
        if (isDashed) {
          ctx.setLineDash([4, 3]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < lines.length; i++) {
          ctx.moveTo(lines[i][0].x, lines[i][0].y);
          ctx.lineTo(lines[i][1].x, lines[i][1].y);
        }
        ctx.stroke();
        if (isDashed) {
          ctx.setLineDash([]);
        }
      };

      // Draw batches cleanly with opacity and thickness scaling (negative weights dashed)
      drawLineBatch(severedLines, 'rgba(239, 68, 68, 0.22)', 0.6, true);
      drawLineBatch(dimmedLines, 'rgba(255, 255, 255, 0.025)', 0.5, false);

      drawLineBatch(posLow, 'rgba(245, 158, 11, 0.20)', 0.6, false);
      drawLineBatch(posMid, 'rgba(245, 158, 11, 0.55)', 1.1, false);
      drawLineBatch(posHigh, 'rgba(254, 240, 138, 0.88)', 1.8, false);

      drawLineBatch(negLow, 'rgba(239, 68, 68, 0.24)', 0.6, true);
      drawLineBatch(negMid, 'rgba(239, 68, 68, 0.58)', 1.1, true);
      drawLineBatch(negHigh, 'rgba(249, 115, 22, 0.90)', 1.8, true);

      drawLineBatch(mathPhase1Lines, 'rgba(254, 240, 138, 0.95)', 2.0, false);
      drawLineBatch(mathPhase4Lines, 'rgba(236, 72, 153, 0.95)', 2.0, false);

      for (let i = 0; i < focusLines.length; i++) {
        const fl = focusLines[i];
        if (fl.isNegative) ctx.setLineDash([4, 3]);
        else ctx.setLineDash([]);
        ctx.strokeStyle = fl.color;
        ctx.lineWidth = fl.width;
        ctx.beginPath();
        ctx.moveTo(fl.from.x, fl.from.y);
        ctx.lineTo(fl.to.x, fl.to.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 7. Update and Draw Particles (Linear Straight-Line Interpolation, NO shadowBlur)
      if (showParticles) {
        const remainingParticles: Particle[] = [];
        const particlesByColor: Record<string, Array<{ x: number; y: number; size: number }>> = {};

        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i];
          const fromNode = layerCoords[p.fromLayer]?.[p.fromIndex];
          const toNode = layerCoords[p.toLayer]?.[p.toIndex];

          if (!fromNode || !toNode) continue;

          // Advance particle position
          if (p.isBackprop) {
            p.t -= p.speed;
            if (p.t <= 0) continue;
          } else {
            p.t += p.speed;
            if (p.t >= 1) continue;
          }

          // Linear interpolation along straight synapse
          const px = fromNode.x + (toNode.x - fromNode.x) * p.t;
          const py = fromNode.y + (toNode.y - fromNode.y) * p.t;

          if (!particlesByColor[p.color]) {
            particlesByColor[p.color] = [];
          }
          particlesByColor[p.color].push({ x: px, y: py, size: p.size });
          remainingParticles.push(p);
        }
        particlesRef.current = remainingParticles;

        // Batch render particles by color without shadowBlur
        for (const color in particlesByColor) {
          ctx.fillStyle = color;
          ctx.beginPath();
          const pts = particlesByColor[color];
          for (let i = 0; i < pts.length; i++) {
            ctx.moveTo(pts[i].x + pts[i].size, pts[i].y);
            ctx.arc(pts[i].x, pts[i].y, pts[i].size, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }

      // 8. Draw Neurons and Input Oscilloscopes
      for (let l = 0; l < currentTopology.length; l++) {
        const coords = layerCoords[l];
        const layer = engine.layers[l];
        if (!coords || !layer) continue;

        for (let n = 0; n < coords.length; n++) {
          const coord = coords[n];
          const neuron = layer.neurons[n];
          if (!coord || !neuron) continue;

          const isSelected = selectedNeuron?.layerIndex === l && selectedNeuron?.neuronIndex === n;
          const isHovered = hoveredNeuron?.layerIndex === l && hoveredNeuron?.neuronIndex === n;

          // Math mode phase illumination check
          const isMathPhaseInput = isMathMode && mathPhase === 0 && l === 0;
          const isMathPhaseNeuron = isMathMode && mathPhase === 2 && isSelected;
          const isMathPhaseLoss = isMathMode && mathPhase === 3 && l === currentTopology.length - 1;

          // 8A. Miniature Input Signal Oscilloscope (Beside Input Nodes)
          if (l === 0 && showOscilloscopes) {
            const oscWidth = 62;
            const oscHeight = 22;
            const oscX = coord.x - oscWidth - 22;
            const oscY = coord.y - oscHeight / 2;

            // Oscilloscope Container
            ctx.fillStyle = isMathPhaseInput ? 'rgba(59, 130, 246, 0.25)' : 'rgba(24, 25, 28, 0.85)';
            ctx.strokeStyle = isMathPhaseInput ? '#3b82f6' : '#2a2b30';
            ctx.lineWidth = isMathPhaseInput ? 1.5 : 1;
            ctx.beginPath();
            ctx.roundRect(oscX, oscY, oscWidth, oscHeight, 1);
            ctx.fill();
            ctx.stroke();

            // Center zero axis
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(oscX, oscY + oscHeight / 2);
            ctx.lineTo(oscX + oscWidth, oscY + oscHeight / 2);
            ctx.stroke();

            // Waveform Sparkline
            const hist = neuron.historyA;
            if (hist && hist.length > 1) {
              ctx.strokeStyle = isMathPhaseInput ? '#60a5fa' : '#3b82f6';
              ctx.lineWidth = 1.2;
              ctx.beginPath();

              const minVal = Math.min(0, ...hist);
              const maxVal = Math.max(1, ...hist);
              const range = Math.max(0.1, maxVal - minVal);

              for (let h = 0; h < hist.length; h++) {
                const hx = oscX + 2 + (h / (hist.length - 1)) * (oscWidth - 4);
                const norm = (hist[h] - minVal) / range;
                const hy = oscY + oscHeight - 3 - Math.max(0, Math.min(1, norm)) * (oscHeight - 6);
                if (h === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
              }
              ctx.stroke();
            }

            // Real-time Numeric Readout
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#93c5fd';
            ctx.textAlign = 'right';
            ctx.fillText(neuron.a.toFixed(2), oscX + oscWidth - 3, oscY + 8);
          }

          // 8B. Neuron Node Body (Crisp Industrial Rendering, ZERO shadowBlur)
          const r = coord.r;
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, r, 0, Math.PI * 2);

          if (neuron.disabled) {
            // Disabled / Dropped out
            ctx.fillStyle = 'rgba(17, 18, 21, 0.9)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();

            // Red Strike 'X'
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(coord.x - r * 0.6, coord.y - r * 0.6);
            ctx.lineTo(coord.x + r * 0.6, coord.y + r * 0.6);
            ctx.moveTo(coord.x + r * 0.6, coord.y - r * 0.6);
            ctx.lineTo(coord.x - r * 0.6, coord.y + r * 0.6);
            ctx.stroke();
          } else if (neuron.isDead) {
            // Dying ReLU Necrotic State
            ctx.fillStyle = 'rgba(127, 29, 29, 0.4)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.8;
            ctx.fill();
            ctx.stroke();

            // Mini Dead Icon Marker inside circle
            const symbolScale = Math.max(0.7, Math.min(1.8, 1 / transformRef.current.zoom));
            ctx.font = `bold ${Math.max(10, Math.round(11 * symbolScale))}px "JetBrains Mono", monospace`;
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('†', coord.x, coord.y);
          } else {
            // Active Neuron
            const act = Math.max(0, Math.min(1, neuron.a));
            const baseColor = l === 0 ? '59, 130, 246' : l === currentTopology.length - 1 ? '59, 130, 246' : '245, 158, 11';

            ctx.fillStyle = `rgba(${baseColor}, ${0.15 + act * 0.65})`;
            ctx.strokeStyle = isSelected
              ? '#38bdf8'
              : isHovered
              ? '#fef08a'
              : isMathPhaseNeuron
              ? '#a855f7'
              : isMathPhaseLoss
              ? '#ef4444'
              : `rgba(${baseColor}, ${0.4 + act * 0.6})`;
            ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2.0 : isMathPhaseNeuron ? 2.5 : 1.2;

            ctx.fill();
            ctx.stroke();

            // Inner Core Dot for high activation
            if (act > 0.15 && r > 10) {
              ctx.beginPath();
              ctx.arc(coord.x, coord.y, r * 0.35 * act, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
            }

            // ONLY ONE short value per node inside circle, scaled with zoom
            const innerScale = Math.max(0.7, Math.min(1.6, 1 / transformRef.current.zoom));
            const innerFontSize = Math.max(9, Math.round(10 * innerScale));
            ctx.font = `${innerFontSize}px "JetBrains Mono", monospace`;
            ctx.fillStyle = '#f4f4f5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(neuron.a.toFixed(1), coord.x, coord.y);
          }

          // Node Label: Single short value, scaled with zoom level so it stays >= 11px on screen, WCAG AA contrast
          const screenScale = Math.max(0.75, Math.min(2.0, 1 / transformRef.current.zoom));
          const labelFontSize = Math.max(11, Math.round(11 * screenScale));
          ctx.font = `bold ${labelFontSize}px "JetBrains Mono", monospace`;
          ctx.fillStyle = isSelected
            ? '#38bdf8'
            : isHovered
            ? '#fef08a'
            : neuron.isDead
            ? '#f87171'
            : '#e4e4e7';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const nodeLabelText = neuron.isDead && !neuron.disabled ? `${neuron.label} [DEAD]` : neuron.label;
          ctx.fillText(nodeLabelText, coord.x, coord.y + r + 4);
        }
      }

      ctx.restore(); // restore pan/zoom
      ctx.restore(); // restore dpr scale

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    engine,
    isPlaying,
    trainingSpeed,
    showBackpropGradients,
    showOscilloscopes,
    showParticles,
    currentDataset,
    selectedNeuron,
    hoveredNeuron,
    stepMathIndex,
    nextMathStep,
    syncMetrics,
    currentPresetId,
  ]);

  // Initial auto-fit and viewport responsiveness via ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    hasUserInteractedRef.current = false;
    handleResetCamera();

    const ro = new ResizeObserver(() => {
      if (!hasUserInteractedRef.current) {
        handleResetCamera();
      }
    });
    ro.observe(canvas);

    const handleWindowResize = () => {
      if (!hasUserInteractedRef.current) {
        handleResetCamera();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleResetCamera, currentPresetId, topology]);

  // Spawn burst of backpropagation particles on manual trigger
  const prevPulseCountRef = useRef(0);
  useEffect(() => {
    if (backpropPulseCount > prevPulseCountRef.current) {
      prevPulseCountRef.current = backpropPulseCount;
      const topology = engine.topology;
      for (let l = topology.length - 2; l >= 0; l--) {
        const fromCount = topology[l];
        const toCount = topology[l + 1];
        for (let f = 0; f < fromCount; f++) {
          for (let t = 0; t < toCount; t++) {
            if (particlesRef.current.length >= 120) break;
            if (Math.random() < 0.6) {
              particlesRef.current.push({
                fromLayer: l,
                fromIndex: f,
                toLayer: l + 1,
                toIndex: t,
                t: 1.0,
                speed: 0.03 + Math.random() * 0.02,
                isBackprop: true,
                color: '#ec4899',
                size: 3.5,
              });
            }
          }
          if (particlesRef.current.length >= 120) break;
        }
        if (particlesRef.current.length >= 120) break;
      }
    }
  }, [backpropPulseCount, engine.topology]);

  // Compute and broadcast Spotlight Target for Interactive Guided Tour
  useEffect(() => {
    if (!isTourOpen) return;

    const updateSpotlight = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const coords = nodeCoordsRef.current;
      if (!coords || coords.length === 0) return;

      const { panX, panY, zoom } = transformRef.current;
      const toScreenX = (wx: number) => rect.left + panX + wx * zoom;
      const toScreenY = (wy: number) => rect.top + panY + wy * zoom;

      if (tourStep === 0) {
        // Step 1: Input Oscilloscopes
        setSecondarySpotlightTarget(null);
        const l0Nodes = coords.filter((c) => c.layerIndex === 0);
        if (l0Nodes.length > 0) {
          const first = l0Nodes[0];
          const last = l0Nodes[l0Nodes.length - 1];
          const wx1 = first.x - 85;
          const wx2 = first.x + 35;
          const wy1 = first.y - 25;
          const wy2 = last.y + 25;

          setSpotlightTarget({
            x: Math.max(10, toScreenX(wx1)),
            y: Math.max(10, toScreenY(wy1)),
            width: Math.max(120, (wx2 - wx1) * zoom),
            height: Math.max(120, (wy2 - wy1) * zoom),
            title: 'Input Oscilloscopes',
          });
        }
      } else if (tourStep === 1) {
        // Step 2: Synapses (Weights)
        setSecondarySpotlightTarget(null);
        const l0Nodes = coords.filter((c) => c.layerIndex === 0);
        const l1Nodes = coords.filter((c) => c.layerIndex === 1);
        if (l0Nodes.length > 0 && l1Nodes.length > 0) {
          const wx1 = l0Nodes[0].x - 15;
          const wx2 = l1Nodes[0].x + 15;
          const wy1 = Math.min(l0Nodes[0].y, l1Nodes[0].y) - 25;
          const wy2 = Math.max(l0Nodes[l0Nodes.length - 1].y, l1Nodes[l1Nodes.length - 1].y) + 25;

          setSpotlightTarget({
            x: Math.max(10, toScreenX(wx1)),
            y: Math.max(10, toScreenY(wy1)),
            width: (wx2 - wx1) * zoom,
            height: (wy2 - wy1) * zoom,
            title: 'Synapses (Weights)',
          });
        }
      } else if (tourStep === 2) {
        // Step 3: Spotlight Hidden Neuron AND Activation Graph
        const targetNode = coords.find((c) => c.layerIndex === 1 && c.neuronIndex === 0) || coords[1];
        if (targetNode) {
          const wx1 = targetNode.x - 32;
          const wy1 = targetNode.y - 32;
          setSpotlightTarget({
            x: toScreenX(wx1),
            y: toScreenY(wy1),
            width: 64 * zoom,
            height: 64 * zoom,
            title: 'Hidden Neuron (L1-N0)',
          });
        }

        // Secondary Spotlight: Neuron Inspector & Activation Graph
        const inspectorEl = typeof document !== 'undefined' ? document.getElementById('neuron-inspector-panel') : null;
        if (inspectorEl) {
          const iRect = inspectorEl.getBoundingClientRect();
          setSecondarySpotlightTarget({
            x: iRect.left,
            y: iRect.top,
            width: iRect.width,
            height: iRect.height,
            title: "Activation Graph: f'(z)",
          });
        } else if (typeof window !== 'undefined') {
          // Dynamic fallback based on right viewport position
          const panelWidth = Math.min(340, window.innerWidth - 32);
          setSecondarySpotlightTarget({
            x: Math.max(16, window.innerWidth - panelWidth - 16),
            y: 58,
            width: panelWidth,
            height: Math.min(480, window.innerHeight - 100),
            title: "Activation Graph: f'(z)",
          });
        }
      } else if (tourStep === 3) {
        // Step 4: Backpropagation pulse
        setSecondarySpotlightTarget(null);
        const allNodes = coords;
        if (allNodes.length > 0) {
          const minWx = Math.min(...allNodes.map((c) => c.x)) - 30;
          const maxWx = Math.max(...allNodes.map((c) => c.x)) + 30;
          const minWy = Math.min(...allNodes.map((c) => c.y)) - 25;
          const maxWy = Math.max(...allNodes.map((c) => c.y)) + 25;

          setSpotlightTarget({
            x: Math.max(10, toScreenX(minWx)),
            y: Math.max(10, toScreenY(minWy)),
            width: (maxWx - minWx) * zoom,
            height: (maxWy - minWy) * zoom,
            title: 'Backpropagation Gradients',
          });
        }
      } else if (tourStep === 4) {
        // Step 5: Invite to kill a neuron
        setSecondarySpotlightTarget(null);
        const targetNode = coords.find((c) => c.layerIndex === 1 && c.neuronIndex === 0) || coords[1];
        if (targetNode) {
          const wx1 = targetNode.x - 32;
          const wy1 = targetNode.y - 32;
          setSpotlightTarget({
            x: toScreenX(wx1),
            y: toScreenY(wy1),
            width: 64 * zoom,
            height: 64 * zoom,
            title: 'Target Neuron: Click to Kill',
          });
        }
      }
    };

    updateSpotlight();
    const interval = setInterval(updateSpotlight, 200);
    window.addEventListener('resize', updateSpotlight);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [isTourOpen, tourStep, setSpotlightTarget, setSecondarySpotlightTarget]);

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    hasUserInteractedRef.current = true;
    transformRef.current.isDragging = true;
    transformRef.current.dragStartX = e.clientX - transformRef.current.panX;
    transformRef.current.dragStartY = e.clientY - transformRef.current.panY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (transformRef.current.isDragging) {
      transformRef.current.panX = e.clientX - transformRef.current.dragStartX;
      transformRef.current.panY = e.clientY - transformRef.current.dragStartY;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - transformRef.current.panX) / transformRef.current.zoom;
    const worldY = (mouseY - transformRef.current.panY) / transformRef.current.zoom;

    // Check header activation click boxes
    let hoveringHeaderLayer: number | null = null;
    for (const box of headerClickBoxesRef.current) {
      if (
        worldX >= box.x &&
        worldX <= box.x + box.width &&
        worldY >= box.y &&
        worldY <= box.y + box.height
      ) {
        hoveringHeaderLayer = box.layerIndex;
        break;
      }
    }
    hoveredHeaderLayerRef.current = hoveringHeaderLayer;
    if (hoveringHeaderLayer !== null) {
      canvas.style.cursor = 'pointer';
      if (hoveredNeuron !== null) {
        setHoveredNeuron(null);
      }
      return;
    }

    let found: NodeCoord | null = null;
    for (const coord of nodeCoordsRef.current) {
      const dist = Math.hypot(worldX - coord.x, worldY - coord.y);
      if (dist <= coord.r + 5) {
        found = coord;
        break;
      }
    }

    if (found) {
      canvas.style.cursor = 'pointer';
      if (
        hoveredNeuron?.layerIndex !== found.layerIndex ||
        hoveredNeuron?.neuronIndex !== found.neuronIndex
      ) {
        setHoveredNeuron({ layerIndex: found.layerIndex, neuronIndex: found.neuronIndex });
      }
    } else {
      canvas.style.cursor = 'grab';
      if (hoveredNeuron !== null) {
        setHoveredNeuron(null);
      }
    }
  };

  const handleMouseUp = () => {
    transformRef.current.isDragging = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - transformRef.current.panX) / transformRef.current.zoom;
    const worldY = (mouseY - transformRef.current.panY) / transformRef.current.zoom;

    // Check if clicked an activation header to cycle activation function
    for (const box of headerClickBoxesRef.current) {
      if (
        worldX >= box.x &&
        worldX <= box.x + box.width &&
        worldY >= box.y &&
        worldY <= box.y + box.height
      ) {
        const currentTopology = topology.length > 0 ? topology : engine.topology;
        const isOutput = box.layerIndex === currentTopology.length - 1;
        const activations: ActivationType[] = isOutput
          ? ['softmax', 'sigmoid', 'linear']
          : ['relu', 'leaky_relu', 'sigmoid', 'tanh', 'linear'];
        const currentAct = engine.layers[box.layerIndex].activation;
        const nextAct = activations[(activations.indexOf(currentAct) + 1) % activations.length];

        if (box.layerIndex > 0 && box.layerIndex < currentTopology.length - 1) {
          engine.setActivation(nextAct, box.layerIndex);
          setHiddenActivation(nextAct);
        } else {
          engine.outputActivation = nextAct;
          engine.layers[box.layerIndex].activation = nextAct;
          if (nextAct === 'softmax') {
            engine.lossType = 'cross_entropy';
            useNetworkStore.setState({ outputActivation: nextAct, lossType: 'cross_entropy' });
          } else {
            useNetworkStore.setState({ outputActivation: nextAct });
          }
          syncMetrics();
        }
        return;
      }
    }

    for (const coord of nodeCoordsRef.current) {
      const dist = Math.hypot(worldX - coord.x, worldY - coord.y);
      if (dist <= coord.r + 6) {
        // Direct click toggles kill/dropout intervention per Requirement 3.6
        toggleNeuronDisabled(coord.layerIndex, coord.neuronIndex);
        setSelectedNeuron({ layerIndex: coord.layerIndex, neuronIndex: coord.neuronIndex });
        return;
      }
    }

    // Clicked empty space: deselect
    setSelectedNeuron(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    hasUserInteractedRef.current = true;
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const currentZoom = transformRef.current.zoom;
    const newZoom = Math.max(0.35, Math.min(3.0, currentZoom * zoomFactor));
    const factor = newZoom / currentZoom;

    transformRef.current.panX = mouseX - (mouseX - transformRef.current.panX) * factor;
    transformRef.current.panY = mouseY - (mouseY - transformRef.current.panY) * factor;
    transformRef.current.zoom = newZoom;
    setZoomDisplay(Math.round(newZoom * 100));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#111215] select-none">
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Floating Top-Left HUD (Hardware/Kernel Metrics) - Hidden during Guided Tour */}
      {!isTourOpen && (
        <div className="absolute top-3 left-4 flex items-center space-x-2 text-[11px] font-mono pointer-events-none">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#18191c] border border-[#2a2b30] rounded-[2px] text-[#e4e4e7]">
            <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="text-zinc-300 font-semibold">FPS:</span>
            <span className={fps >= 55 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {fps}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#18191c] border border-[#2a2b30] rounded-[2px] text-[#e4e4e7]">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-300 font-semibold">PARAMS:</span>
            <span className="text-zinc-100 font-bold">
              {engine.metrics.totalParameters.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#18191c] border border-[#2a2b30] rounded-[2px] text-[#e4e4e7]">
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-300 font-semibold">SPEED:</span>
            <span className="text-zinc-100 font-bold">{trainingSpeed}x</span>
          </div>
        </div>
      )}

      {/* Floating Interactive Canvas Legend (Requirement 7) */}
      <div className="absolute bottom-11 left-4 z-20 font-mono text-[11px]">
        {!legendOpen ? (
          <button
            onClick={() => setLegendOpen(true)}
            title="Expand Canvas Legend"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#18191c]/95 hover:bg-[#25272c] border border-[#2a2b30] text-zinc-200 hover:text-white rounded-[2px] shadow transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">LEGEND</span>
            <ChevronUp className="w-3 h-3 text-zinc-400" />
          </button>
        ) : (
          <div className="bg-[#18191c]/95 border border-[#2a2b30] rounded-[2px] p-2.5 text-zinc-200 shadow-2xl max-w-xs space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1 border-b border-[#2a2b30]">
              <span className="font-bold text-zinc-100 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>CANVAS LEGEND</span>
              </span>
              <button
                onClick={() => setLegendOpen(false)}
                className="text-zinc-400 hover:text-white p-0.5 rounded-[2px] hover:bg-[#25272c] transition-colors"
                title="Collapse Legend"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weights */}
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">SYNAPSE WEIGHTS</div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-0.5 bg-amber-400 inline-block" />
                <span>Positive (w &gt; 0, Solid)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-0.5 border-b-2 border-dashed border-red-500 inline-block" />
                <span>Negative (w &lt; 0, Dashed)</span>
              </div>
              <div className="text-[10px] text-zinc-400">Opacity &amp; thickness scaled by |w|</div>
            </div>

            {/* Neurons */}
            <div className="space-y-1 pt-1 border-t border-[#2a2b30]/60">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">NEURON NODES</div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300 inline-block" />
                  <span>Input/Output</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 inline-block" />
                  <span>Hidden</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-500 inline-block text-[8px] text-center leading-[8px] text-red-400 font-bold">†</span>
                  <span>Dead ReLU</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-red-500 inline-block text-[8px] text-center leading-[8px] text-red-400 font-bold">✕</span>
                  <span>Killed</span>
                </div>
              </div>
            </div>

            {/* Particles */}
            <div className="space-y-1 pt-1 border-t border-[#2a2b30]/60">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">PARTICLE SIGNALS</div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Forward Feed (L → R)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                <span>Backprop Gradient (R → L)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom-Left Prompt / Interaction Tips */}
      <div className="absolute bottom-3 left-4 hidden md:flex items-center space-x-2 text-[11px] font-mono pointer-events-none text-zinc-300 bg-[#18191c]/95 px-3 py-1 rounded-[2px] border border-[#2a2b30]">
        <span className="text-[#3b82f6] font-semibold">[Click Node]</span>
        <span>Kill / Dropout Neuron</span>
        <span className="text-[#2a2b30]">|</span>
        <span className="text-[#f59e0b] font-semibold">[Hover Node]</span>
        <span>Formula Inspector</span>
        <span className="text-[#2a2b30]">|</span>
        <span className="text-zinc-100">[Drag &amp; Wheel]</span>
        <span>Pan &amp; Zoom</span>
      </div>

      {/* 2D Decision Boundary Canvas in the Corner per Requirement 4.4 */}
      {(currentPresetId === '2d_classifier' || engine.topology[0] === 2) && (
        <div className="absolute bottom-10 right-4 z-20 border border-[#2a2b30] rounded-[2px]">
          <DecisionBoundary />
        </div>
      )}

      {/* Floating Top-Right Viewport Camera Controls */}
      <div className="absolute top-3 right-4 flex items-center space-x-1 bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-1 font-mono">
        <button
          onClick={() => handleZoom(0.15)}
          title="Zoom In"
          className="p-1.5 hover:bg-[#222429] text-zinc-300 hover:text-white rounded-[2px] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="px-1.5 text-[11px] font-mono text-zinc-200 min-w-[42px] text-center font-bold">
          {zoomDisplay}%
        </div>
        <button
          onClick={() => handleZoom(-0.15)}
          title="Zoom Out"
          className="p-1.5 hover:bg-[#222429] text-zinc-300 hover:text-white rounded-[2px] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-[#2a2b30]" />
        <button
          onClick={handleAutoFitClick}
          title="Fit Network to View"
          className="flex items-center space-x-1 px-2 py-1 bg-[#1f2024] hover:bg-[#25272c] text-zinc-200 hover:text-white rounded-[2px] transition-colors border border-[#2a2b30] text-[11px] font-semibold"
        >
          <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">FIT TO VIEW</span>
        </button>
      </div>
    </div>
  );
}
