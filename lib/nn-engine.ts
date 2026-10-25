// NeuroScope - Core Neural Network Engine (Pure TypeScript)
// Implements dynamic multi-layer perceptron with exact forward/backward math,
// gradient tracking, He/Xavier initialization, SGD & Momentum, and interactive neuron killing.

export type ActivationType = 'relu' | 'leaky_relu' | 'sigmoid' | 'tanh' | 'linear' | 'softmax';
export type OptimizerType = 'sgd' | 'momentum';
export type LossType = 'mse' | 'cross_entropy';

export interface ActivationFunction {
  name: ActivationType;
  fn: (z: number) => number;
  df: (z: number, a?: number) => number;
  description: string;
  formula: string;
  derivativeFormula: string;
}

export function formatLoss(loss: number): string {
  if (!Number.isFinite(loss)) return '0.0000';
  if (loss === 0) return '0.0000';
  if (Math.abs(loss) < 0.001) {
    return loss.toExponential(3);
  }
  return loss.toFixed(4);
}

export const ACTIVATIONS: Record<ActivationType, ActivationFunction> = {
  relu: {
    name: 'relu',
    fn: (z) => (z > 0 ? z : 0),
    df: (z) => (z > 0 ? 1 : 0),
    description: 'Rectified Linear Unit. Sets negative values to 0. Prone to dying neurons under high learning rates.',
    formula: 'f(z) = max(0, z)',
    derivativeFormula: "f'(z) = 1 if z > 0 else 0",
  },
  leaky_relu: {
    name: 'leaky_relu',
    fn: (z) => (z > 0 ? z : 0.01 * z),
    df: (z) => (z > 0 ? 1 : 0.01),
    description: 'Leaky ReLU. Small slope (0.01) for negative values prevents permanently dead neurons.',
    formula: 'f(z) = z if z > 0 else 0.01z',
    derivativeFormula: "f'(z) = 1 if z > 0 else 0.01",
  },
  sigmoid: {
    name: 'sigmoid',
    fn: (z) => {
      const clamped = Math.max(-45, Math.min(45, z));
      return 1 / (1 + Math.exp(-clamped));
    },
    df: (z, a) => {
      const sig = a !== undefined ? a : ACTIVATIONS.sigmoid.fn(z);
      return sig * (1 - sig);
    },
    description: 'Logistic Sigmoid (Multi-label). S-shaped curve mapping to (0, 1). Maximum gradient is 0.25, causing vanishing gradients in deep networks.',
    formula: 'σ(z) = 1 / (1 + e^(-z))',
    derivativeFormula: "σ'(z) = σ(z) * (1 - σ(z))",
  },
  tanh: {
    name: 'tanh',
    fn: (z) => {
      const clamped = Math.max(-20, Math.min(20, z));
      return Math.tanh(clamped);
    },
    df: (z, a) => {
      const t = a !== undefined ? a : Math.tanh(z);
      return 1 - t * t;
    },
    description: 'Hyperbolic Tangent. Zero-centered mapping to (-1, 1). Steeper gradients than Sigmoid but still susceptible to saturation.',
    formula: 'tanh(z) = (e^z - e^(-z)) / (e^z + e^(-z))',
    derivativeFormula: "tanh'(z) = 1 - tanh^2(z)",
  },
  linear: {
    name: 'linear',
    fn: (z) => z,
    df: () => 1,
    description: 'Identity / Linear pass-through. Used for unconstrained regression or baseline diagnostics.',
    formula: 'f(z) = z',
    derivativeFormula: "f'(z) = 1",
  },
  softmax: {
    name: 'softmax',
    fn: (z) => {
      const clamped = Math.max(-45, Math.min(45, z));
      return Math.exp(clamped);
    },
    df: (z, a) => {
      const s = a !== undefined ? a : 0.5;
      return s * (1 - s);
    },
    description: 'Softmax. Normalizes pre-activations into a normalized multi-class probability distribution summing to 1.0. Paired with Cross-Entropy loss.',
    formula: 'σ(z)_i = e^(z_i) / ∑ e^(z_j)',
    derivativeFormula: "∂a_i/∂z_j = a_i(δ_ij - a_j)",
  },
};

export interface NeuronState {
  id: string; // e.g. "L0-N0"
  layerIndex: number;
  neuronIndex: number;
  label: string;
  z: number; // Pre-activation
  a: number; // Post-activation
  bias: number;
  biasGradient: number;
  biasVelocity: number;
  gradA: number; // dL/da
  gradZ: number; // dL/dz (delta)
  disabled: boolean; // Manually killed by user
  droppedOut: boolean; // Inverted dropout mask for this step
  isDead: boolean; // ReLU dead detector
  consecutiveZeroGrads: number;
  historyA: number[]; // Sparkline history (last 16 values)
}

export interface SynapseState {
  id: string; // "L0N1->L1N2"
  fromLayer: number;
  fromIndex: number;
  toLayer: number;
  toIndex: number;
  weight: number;
  weightGradient: number;
  velocity: number;
  lastDelta: number;
}

export interface LayerState {
  layerIndex: number;
  isInput: boolean;
  isOutput: boolean;
  size: number;
  activation: ActivationType;
  neurons: NeuronState[];
}

export interface TrainingMetrics {
  epoch: number;
  step: number;
  loss: number;
  accuracy: number;
  learningRate: number;
  gradNorm: number;
  deadNeuronCount: number;
  activeNeuronCount: number;
  totalParameters: number;
}

export interface DataSample {
  inputs: number[];
  targets: number[];
  label?: string;
  coords?: [number, number]; // for 2D visualizations
}

export interface StepTraceMath {
  stepPhase: 'idle' | 'input' | 'forward_sum' | 'activation' | 'loss' | 'backward_delta' | 'weight_update';
  phaseName: string;
  currentLayer: number;
  currentNeuron: number;
  explanation: string;
  formula: string;
  inputValues: number[];
  weights: number[];
  bias: number;
  zValue: number;
  aValue: number;
  targetValue?: number;
  lossValue?: number;
  gradZ?: number;
  weightGrads?: number[];
}

export class NeuralNetwork {
  public topology: number[];
  public layers: LayerState[];
  public synapses: SynapseState[][][]; // [fromLayer][fromNeuron][toNeuron]
  public optimizer: OptimizerType = 'momentum';
  public momentumBeta: number = 0.9;
  public learningRate: number = 0.05;
  public lossType: LossType = 'mse';
  public hiddenActivation: ActivationType = 'relu';
  public outputActivation: ActivationType = 'sigmoid';
  public dropoutRate: number = 0.0;
  public metrics: TrainingMetrics = {
    epoch: 0,
    step: 0,
    loss: 0,
    accuracy: 0,
    learningRate: 0.05,
    gradNorm: 0,
    deadNeuronCount: 0,
    activeNeuronCount: 0,
    totalParameters: 0,
  };

  constructor(
    topology: number[] = [17, 26, 16, 8],
    hiddenActivation: ActivationType = 'relu',
    outputActivation: ActivationType = 'sigmoid',
    learningRate: number = 0.05,
    optimizer: OptimizerType = 'momentum'
  ) {
    this.topology = [...topology];
    this.hiddenActivation = hiddenActivation;
    this.outputActivation = outputActivation;
    this.learningRate = learningRate;
    this.optimizer = optimizer;
    this.layers = [];
    this.synapses = [];
    this.rebuildArchitecture(topology, hiddenActivation, outputActivation);
  }

  public rebuildArchitecture(
    topology: number[],
    hiddenActivation?: ActivationType,
    outputActivation?: ActivationType
  ): void {
    this.topology = [...topology];
    if (hiddenActivation) this.hiddenActivation = hiddenActivation;
    if (outputActivation) this.outputActivation = outputActivation;
    if (this.outputActivation === 'softmax') {
      this.lossType = 'cross_entropy';
    }

    this.layers = [];
    this.synapses = [];

    let totalParams = 0;

    for (let l = 0; l < topology.length; l++) {
      const size = topology[l];
      const isInput = l === 0;
      const isOutput = l === topology.length - 1;
      const activation: ActivationType = isInput ? 'linear' : isOutput ? this.outputActivation : this.hiddenActivation;

      const neurons: NeuronState[] = [];
      for (let n = 0; n < size; n++) {
        let label = `H${l}_${n + 1}`;
        if (isInput) label = `In${n + 1}`;
        if (isOutput) label = `Out${n + 1}`;

        neurons.push({
          id: `L${l}-N${n}`,
          layerIndex: l,
          neuronIndex: n,
          label,
          z: 0,
          a: 0,
          bias: isInput ? 0 : (Math.random() - 0.5) * 0.1,
          biasGradient: 0,
          biasVelocity: 0,
          gradA: 0,
          gradZ: 0,
          disabled: false,
          droppedOut: false,
          isDead: false,
          consecutiveZeroGrads: 0,
          historyA: new Array(16).fill(0),
        });

        if (!isInput) totalParams += 1; // 1 bias per non-input neuron
      }

      this.layers.push({
        layerIndex: l,
        isInput,
        isOutput,
        size,
        activation,
        neurons,
      });
    }

    // Initialize Synapses
    for (let l = 0; l < topology.length - 1; l++) {
      const fromSize = topology[l];
      const toSize = topology[l + 1];
      const targetActivation = this.layers[l + 1].activation;

      // He init for ReLU/LeakyReLU, Xavier/Glorot for Sigmoid/Tanh/Linear
      const isHe = targetActivation === 'relu' || targetActivation === 'leaky_relu';
      const stdDev = isHe
        ? Math.sqrt(2.0 / fromSize)
        : Math.sqrt(2.0 / (fromSize + toSize));

      this.synapses[l] = [];
      for (let f = 0; f < fromSize; f++) {
        this.synapses[l][f] = [];
        for (let t = 0; t < toSize; t++) {
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.random();
          const randNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const weight = randNormal * stdDev;

          this.synapses[l][f][t] = {
            id: `L${l}N${f}->L${l + 1}N${t}`,
            fromLayer: l,
            fromIndex: f,
            toLayer: l + 1,
            toIndex: t,
            weight,
            weightGradient: 0,
            velocity: 0,
            lastDelta: 0,
          };
          totalParams += 1;
        }
      }
    }

    this.metrics.totalParameters = totalParams;
    this.updateNeuronDeadState();
  }

  public setActivation(activation: ActivationType, layerIndex?: number): void {
    if (layerIndex !== undefined && layerIndex > 0 && layerIndex < this.layers.length) {
      this.layers[layerIndex].activation = activation;
    } else {
      this.hiddenActivation = activation;
      for (let l = 1; l < this.layers.length - 1; l++) {
        this.layers[l].activation = activation;
      }
    }
  }

  public resetWeights(mode: 'he' | 'xavier' | 'random' = 'he'): void {
    for (let l = 0; l < this.topology.length - 1; l++) {
      const fromSize = this.topology[l];
      const toSize = this.topology[l + 1];
      const targetActivation = this.layers[l + 1].activation;
      const isHe = mode === 'he' || (mode !== 'xavier' && (targetActivation === 'relu' || targetActivation === 'leaky_relu'));
      const stdDev = isHe ? Math.sqrt(2.0 / fromSize) : Math.sqrt(2.0 / (fromSize + toSize));

      for (let f = 0; f < fromSize; f++) {
        for (let t = 0; t < toSize; t++) {
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.random();
          const randNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const weight = mode === 'random' ? (Math.random() - 0.5) * 0.5 : randNormal * stdDev;

          const syn = this.synapses[l][f][t];
          syn.weight = weight;
          syn.weightGradient = 0;
          syn.velocity = 0;
          syn.lastDelta = 0;
        }
      }
    }

    // Reset biases and neuron states
    for (let l = 1; l < this.layers.length; l++) {
      for (const neuron of this.layers[l].neurons) {
        neuron.bias = 0;
        neuron.biasGradient = 0;
        neuron.biasVelocity = 0;
        neuron.gradA = 0;
        neuron.gradZ = 0;
        neuron.consecutiveZeroGrads = 0;
        neuron.isDead = false;
        neuron.droppedOut = false;
      }
    }
    this.metrics.epoch = 0;
    this.metrics.step = 0;
  }

  public perturbWeights(noiseLevel: number = 0.2): void {
    for (let l = 0; l < this.topology.length - 1; l++) {
      for (let f = 0; f < this.topology[l]; f++) {
        for (let t = 0; t < this.topology[l + 1]; t++) {
          const noise = (Math.random() - 0.5) * 2 * noiseLevel;
          this.synapses[l][f][t].weight += noise;
        }
      }
    }
  }

  public toggleNeuron(layerIndex: number, neuronIndex: number): boolean {
    if (layerIndex >= 0 && layerIndex < this.layers.length) {
      const neuron = this.layers[layerIndex].neurons[neuronIndex];
      if (neuron) {
        neuron.disabled = !neuron.disabled;
        return neuron.disabled;
      }
    }
    return false;
  }

  public predict(inputs: number[]): number[] {
    let currentActivations = inputs.map((v, i) =>
      this.layers[0]?.neurons[i]?.disabled ? 0 : (v ?? 0)
    );

    for (let l = 1; l < this.layers.length; l++) {
      const prevActivations = currentActivations;
      const currLayer = this.layers[l];
      const nextActivations = new Array(currLayer.size);
      const actFn = ACTIVATIONS[currLayer.activation].fn;

      for (let j = 0; j < currLayer.size; j++) {
        if (currLayer.neurons[j].disabled) {
          nextActivations[j] = 0;
          continue;
        }

        let sum = currLayer.neurons[j].bias;
        for (let i = 0; i < prevActivations.length; i++) {
          if (!this.layers[l - 1].neurons[i].disabled) {
            sum += prevActivations[i] * this.synapses[l - 1][i][j].weight;
          }
        }
        nextActivations[j] = actFn(sum);
      }

      // If output layer has softmax activation, apply numerically stable Softmax
      if (currLayer.isOutput && currLayer.activation === 'softmax') {
        let maxZ = -Infinity;
        for (let j = 0; j < currLayer.size; j++) {
          if (!currLayer.neurons[j].disabled && nextActivations[j] > maxZ) {
            maxZ = nextActivations[j];
          }
        }
        let expSum = 0;
        for (let j = 0; j < currLayer.size; j++) {
          if (currLayer.neurons[j].disabled) {
            nextActivations[j] = 0;
          } else {
            const expVal = Math.exp(Math.max(-50, nextActivations[j] - (Number.isFinite(maxZ) ? maxZ : 0)));
            nextActivations[j] = expVal;
            expSum += expVal;
          }
        }
        const denom = expSum > 0 ? expSum : 1;
        for (let j = 0; j < currLayer.size; j++) {
          if (!currLayer.neurons[j].disabled) {
            nextActivations[j] /= denom;
          }
        }
      }

      currentActivations = nextActivations;
    }

    return currentActivations;
  }

  public forward(inputs: number[], isTraining: boolean = false): number[] {
    const inputLayer = this.layers[0];
    for (let i = 0; i < inputLayer.size; i++) {
      const neuron = inputLayer.neurons[i];
      neuron.droppedOut = false;
      const val = inputs[i] !== undefined ? inputs[i] : 0;
      neuron.z = val;
      neuron.a = neuron.disabled ? 0 : val;
      neuron.historyA.push(neuron.a);
      if (neuron.historyA.length > 24) neuron.historyA.shift();
    }

    // Hidden and Output layers
    for (let l = 1; l < this.layers.length; l++) {
      const prevLayer = this.layers[l - 1];
      const currLayer = this.layers[l];
      const activationFn = ACTIVATIONS[currLayer.activation].fn;

      for (let j = 0; j < currLayer.size; j++) {
        const neuron = currLayer.neurons[j];
        neuron.droppedOut = false;

        if (neuron.disabled) {
          neuron.z = 0;
          neuron.a = 0;
          neuron.historyA.push(0);
          if (neuron.historyA.length > 24) neuron.historyA.shift();
          continue;
        }

        // Apply inverted dropout during training on hidden layers
        if (isTraining && !currLayer.isOutput && this.dropoutRate > 0) {
          if (Math.random() < this.dropoutRate) {
            neuron.droppedOut = true;
            neuron.z = 0;
            neuron.a = 0;
            neuron.historyA.push(0);
            if (neuron.historyA.length > 24) neuron.historyA.shift();
            continue;
          }
        }

        let sum = neuron.bias;
        for (let i = 0; i < prevLayer.size; i++) {
          const prevNeuron = prevLayer.neurons[i];
          if (!prevNeuron.disabled && !prevNeuron.droppedOut) {
            sum += prevNeuron.a * this.synapses[l - 1][i][j].weight;
          }
        }

        neuron.z = sum;

        // Output layer softmax check
        if (currLayer.isOutput && currLayer.activation === 'softmax') {
          // Softmax will be computed as a collective vector below
          neuron.a = sum;
        } else {
          let actVal = activationFn(sum);
          if (isTraining && !currLayer.isOutput && this.dropoutRate > 0) {
            actVal /= (1 - this.dropoutRate);
          }
          neuron.a = actVal;
        }

        neuron.historyA.push(neuron.a);
        if (neuron.historyA.length > 24) neuron.historyA.shift();
      }

      // If output layer has softmax activation, apply numerically stable Softmax
      if (currLayer.isOutput && currLayer.activation === 'softmax') {
        let maxZ = -Infinity;
        for (let j = 0; j < currLayer.size; j++) {
          if (!currLayer.neurons[j].disabled && currLayer.neurons[j].z > maxZ) {
            maxZ = currLayer.neurons[j].z;
          }
        }
        let expSum = 0;
        for (let j = 0; j < currLayer.size; j++) {
          const n = currLayer.neurons[j];
          if (n.disabled) {
            n.a = 0;
          } else {
            const expVal = Math.exp(Math.max(-50, n.z - (Number.isFinite(maxZ) ? maxZ : 0)));
            n.a = expVal;
            expSum += expVal;
          }
        }
        const denom = expSum > 0 ? expSum : 1;
        for (let j = 0; j < currLayer.size; j++) {
          const n = currLayer.neurons[j];
          if (!n.disabled) {
            n.a /= denom;
          }
          n.historyA[n.historyA.length - 1] = n.a;
        }
      }
    }

    const outputLayer = this.layers[this.layers.length - 1];
    return outputLayer.neurons.map((n) => n.a);
  }

  public backward(
    inputs: number[],
    targets: number[],
    applyUpdates: boolean = true
  ): { loss: number; predictions: number[] } {
    const predictions = this.forward(inputs, true);
    const outputLayer = this.layers[this.layers.length - 1];

    let loss = 0;
    const isSoftmaxCE = outputLayer.activation === 'softmax' && this.lossType === 'cross_entropy';
    const isBinaryCE = outputLayer.activation !== 'softmax' && this.lossType === 'cross_entropy';

    // Output Layer Gradients
    for (let j = 0; j < outputLayer.size; j++) {
      const neuron = outputLayer.neurons[j];
      const target = targets[j] !== undefined ? targets[j] : 0;
      const pred = neuron.a;

      if (neuron.disabled || neuron.droppedOut) {
        neuron.gradA = 0;
        neuron.gradZ = 0;
        neuron.biasGradient = 0;
        continue;
      }

      if (isSoftmaxCE) {
        // Cross Entropy Loss with Softmax: dL/dz = pred - target
        const safePred = Math.max(1e-12, Math.min(1.0, pred));
        loss += -(target * Math.log(safePred));
        neuron.gradZ = pred - target;
        neuron.gradA = pred - target;
      } else if (isBinaryCE) {
        // Binary Cross Entropy: L = -(y log(p) + (1-y) log(1-p))
        const safePred = Math.max(1e-12, Math.min(1.0 - 1e-12, pred));
        loss += -(target * Math.log(safePred) + (1 - target) * Math.log(1 - safePred));
        if (outputLayer.activation === 'sigmoid') {
          neuron.gradZ = pred - target;
          neuron.gradA = (pred - target) / (safePred * (1 - safePred));
        } else {
          const dL_da = (pred - target) / (safePred * (1 - safePred));
          neuron.gradA = dL_da;
          neuron.gradZ = dL_da * ACTIVATIONS[outputLayer.activation].df(neuron.z, neuron.a);
        }
      } else {
        // MSE Loss: L = 0.5 * (pred - target)^2
        const diff = pred - target;
        loss += 0.5 * diff * diff;
        neuron.gradA = diff; // dL/da = a - y
        const df = ACTIVATIONS[outputLayer.activation].df(neuron.z, neuron.a);
        neuron.gradZ = diff * df; // dL/dz = (a - y) * f'(z)
      }

      neuron.biasGradient = neuron.gradZ;
    }

    // Backpropagate through Hidden Layers
    for (let l = this.layers.length - 2; l >= 1; l--) {
      const currLayer = this.layers[l];
      const nextLayer = this.layers[l + 1];
      const df = ACTIVATIONS[currLayer.activation].df;

      for (let i = 0; i < currLayer.size; i++) {
        const neuron = currLayer.neurons[i];
        if (neuron.disabled || neuron.droppedOut) {
          neuron.gradA = 0;
          neuron.gradZ = 0;
          neuron.biasGradient = 0;
          continue;
        }

        // dL/da_i = sum_j (dL/dz_j * w_{ij})
        let gradSum = 0;
        for (let j = 0; j < nextLayer.size; j++) {
          const nextNeuron = nextLayer.neurons[j];
          if (!nextNeuron.disabled && !nextNeuron.droppedOut) {
            gradSum += nextNeuron.gradZ * this.synapses[l][i][j].weight;
          }
        }

        // If inverted dropout was applied during forward, scale gradient accordingly
        if (this.dropoutRate > 0) {
          gradSum /= (1 - this.dropoutRate);
        }

        neuron.gradA = gradSum;
        const derivative = df(neuron.z, neuron.a);
        neuron.gradZ = gradSum * derivative;
        neuron.biasGradient = neuron.gradZ;

        // Dying ReLU detector
        if (currLayer.activation === 'relu') {
          if (neuron.z <= 0 && Math.abs(neuron.gradZ) < 1e-6) {
            neuron.consecutiveZeroGrads++;
          } else {
            neuron.consecutiveZeroGrads = 0;
          }
          neuron.isDead = neuron.consecutiveZeroGrads >= 10;
        } else {
          neuron.isDead = false;
          neuron.consecutiveZeroGrads = 0;
        }
      }
    }

    // Compute Weight Gradients for all synapses
    let sumGradSq = 0;
    for (let l = 0; l < this.layers.length - 1; l++) {
      const fromLayer = this.layers[l];
      const toLayer = this.layers[l + 1];

      for (let f = 0; f < fromLayer.size; f++) {
        const fromNeuron = fromLayer.neurons[f];
        for (let t = 0; t < toLayer.size; t++) {
          const toNeuron = toLayer.neurons[t];
          const syn = this.synapses[l][f][t];

          if (fromNeuron.disabled || fromNeuron.droppedOut || toNeuron.disabled || toNeuron.droppedOut) {
            syn.weightGradient = 0;
            continue;
          }

          // dL/dw_{ft} = a_f * dL/dz_t
          const gradW = fromNeuron.a * toNeuron.gradZ;
          syn.weightGradient = gradW;
          sumGradSq += gradW * gradW;
        }
      }
    }

    this.metrics.gradNorm = Math.sqrt(sumGradSq);

    // Apply optimizer step (SGD or Momentum) if requested
    if (applyUpdates) {
      this.applyOptimizerUpdates();
    }

    return { loss, predictions };
  }

  private applyOptimizerUpdates(): void {
    const lr = this.learningRate;
    const beta = this.momentumBeta;
    const isMomentum = this.optimizer === 'momentum';

    // Update Synapse Weights
    for (let l = 0; l < this.layers.length - 1; l++) {
      for (let f = 0; f < this.topology[l]; f++) {
        for (let t = 0; t < this.topology[l + 1]; t++) {
          const syn = this.synapses[l][f][t];
          if (
            this.layers[l].neurons[f].disabled ||
            this.layers[l].neurons[f].droppedOut ||
            this.layers[l + 1].neurons[t].disabled ||
            this.layers[l + 1].neurons[t].droppedOut
          ) {
            continue;
          }

          let delta = 0;
          if (isMomentum) {
            // v = beta * v - lr * grad
            syn.velocity = beta * syn.velocity - lr * syn.weightGradient;
            delta = syn.velocity;
          } else {
            // Standard SGD
            delta = -lr * syn.weightGradient;
          }

          // Clip exploding delta to [-10, 10]
          delta = Math.max(-10, Math.min(10, delta));
          syn.weight += delta;
          syn.lastDelta = delta;
        }
      }
    }

    // Update Neuron Biases
    for (let l = 1; l < this.layers.length; l++) {
      for (let n = 0; n < this.layers[l].size; n++) {
        const neuron = this.layers[l].neurons[n];
        if (neuron.disabled || neuron.droppedOut) continue;

        let deltaB = 0;
        if (isMomentum) {
          neuron.biasVelocity = beta * neuron.biasVelocity - lr * neuron.biasGradient;
          deltaB = neuron.biasVelocity;
        } else {
          deltaB = -lr * neuron.biasGradient;
        }
        deltaB = Math.max(-10, Math.min(10, deltaB));
        neuron.bias += deltaB;
      }
    }
  }

  public trainStep(dataset: DataSample[], batchSize: number = 1): { loss: number; accuracy: number } {
    if (dataset.length === 0) return { loss: 0, accuracy: 0 };

    let totalLoss = 0;
    let correct = 0;
    const count = Math.min(dataset.length, batchSize > 0 ? batchSize : dataset.length);

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * dataset.length);
      const sample = dataset[idx];
      const { loss, predictions } = this.backward(sample.inputs, sample.targets);
      totalLoss += loss;

      // Accuracy evaluation
      if (sample.targets.length === 1) {
        // Binary / Regression
        const predBinary = predictions[0] >= 0.5 ? 1 : 0;
        const targetBinary = sample.targets[0] >= 0.5 ? 1 : 0;
        if (predBinary === targetBinary) correct++;
      } else {
        // Multi-class classification: argmax
        let maxPredIdx = 0;
        let maxPredVal = -Infinity;
        let maxTargetIdx = 0;
        let maxTargetVal = -Infinity;

        for (let k = 0; k < predictions.length; k++) {
          if (predictions[k] > maxPredVal) {
            maxPredVal = predictions[k];
            maxPredIdx = k;
          }
          if (sample.targets[k] > maxTargetVal) {
            maxTargetVal = sample.targets[k];
            maxTargetIdx = k;
          }
        }
        if (maxPredIdx === maxTargetIdx) correct++;
      }
    }

    const avgLoss = totalLoss / count;
    const stepAcc = (correct / count) * 100;

    this.metrics.step += count;
    this.metrics.epoch += 1;
    this.metrics.loss = avgLoss;
    
    // For single-sample SGD, smooth accuracy with EMA so it reflects moving average performance
    // rather than oscillating wildly between 0% and 100% on individual samples
    if (count === 1) {
      this.metrics.accuracy = this.metrics.accuracy > 0
        ? this.metrics.accuracy * 0.94 + stepAcc * 0.06
        : stepAcc;
    } else {
      this.metrics.accuracy = stepAcc;
    }
    
    this.updateNeuronDeadState();

    return { loss: avgLoss, accuracy: this.metrics.accuracy };
  }

  private updateNeuronDeadState(): void {
    let dead = 0;
    let active = 0;
    for (let l = 1; l < this.layers.length - 1; l++) {
      for (const neuron of this.layers[l].neurons) {
        if (neuron.disabled) continue;
        if (neuron.isDead) dead++;
        else active++;
      }
    }
    this.metrics.deadNeuronCount = dead;
    this.metrics.activeNeuronCount = active;
  }

  public evaluate(dataset: DataSample[]): { loss: number; accuracy: number } {
    if (!dataset || dataset.length === 0) return { loss: 0, accuracy: 0 };
    let totalLoss = 0;
    let correct = 0;
    const outputLayer = this.layers[this.layers.length - 1];
    const isSoftmax = outputLayer?.activation === 'softmax';
    const isCE = this.lossType === 'cross_entropy';

    for (let i = 0; i < dataset.length; i++) {
      const sample = dataset[i];
      const preds = this.predict(sample.inputs);

      // Loss calculation
      if (isSoftmax && isCE) {
        for (let j = 0; j < preds.length; j++) {
          const pred = preds[j];
          const target = sample.targets[j] !== undefined ? sample.targets[j] : 0;
          const safePred = Math.max(1e-12, Math.min(1.0, pred));
          totalLoss += -(target * Math.log(safePred));
        }
      } else if (isCE) {
        for (let j = 0; j < preds.length; j++) {
          const pred = preds[j];
          const target = sample.targets[j] !== undefined ? sample.targets[j] : 0;
          const safePred = Math.max(1e-12, Math.min(1.0 - 1e-12, pred));
          totalLoss += -(target * Math.log(safePred) + (1 - target) * Math.log(1 - safePred));
        }
      } else {
        for (let j = 0; j < preds.length; j++) {
          const pred = preds[j];
          const target = sample.targets[j] !== undefined ? sample.targets[j] : 0;
          const diff = pred - target;
          totalLoss += 0.5 * diff * diff;
        }
      }

      // Accuracy evaluation
      if (sample.targets.length === 1) {
        const predBinary = (preds[0] ?? 0) >= 0.5 ? 1 : 0;
        const targetBinary = (sample.targets[0] ?? 0) >= 0.5 ? 1 : 0;
        if (predBinary === targetBinary) correct++;
      } else {
        let maxPredIdx = 0;
        let maxPredVal = -Infinity;
        let maxTargetIdx = 0;
        let maxTargetVal = -Infinity;
        for (let k = 0; k < preds.length; k++) {
          if (preds[k] > maxPredVal) {
            maxPredVal = preds[k];
            maxPredIdx = k;
          }
          if (sample.targets[k] > maxTargetVal) {
            maxTargetVal = sample.targets[k];
            maxTargetIdx = k;
          }
        }
        if (maxPredIdx === maxTargetIdx) correct++;
      }
    }

    const avgLoss = totalLoss / dataset.length;
    const accuracy = (correct / dataset.length) * 100;
    return { loss: avgLoss, accuracy };
  }

  // Educational Step-by-Step Math Inspector Trace
  public getStepTrace(sample: DataSample, targetLayer: number = 1, targetNeuron: number = 0): StepTraceMath[] {
    const traces: StepTraceMath[] = [];

    // Phase 1: Input signal
    traces.push({
      stepPhase: 'input',
      phaseName: '1. Input Signal Ingestion',
      currentLayer: 0,
      currentNeuron: 0,
      explanation: 'Raw input feature vector enters the network through the input buffer.',
      formula: `x = [${sample.inputs.map((v) => v.toFixed(2)).join(', ')}]`,
      inputValues: sample.inputs.slice(0, 8),
      weights: [],
      bias: 0,
      zValue: 0,
      aValue: 0,
    });

    // Run genuine forward and backward pass for this exact sample without applying optimizer updates
    this.backward(sample.inputs, sample.targets, false);

    const safeLayerIdx = Math.max(0, Math.min(this.layers.length - 1, targetLayer));
    const layer = this.layers[safeLayerIdx] || this.layers[1] || this.layers[0];
    const safeNeuronIdx = Math.max(0, Math.min(layer.size - 1, targetNeuron));
    const neuron = layer.neurons[safeNeuronIdx] || layer.neurons[0];
    const prevLayer = safeLayerIdx > 0 ? this.layers[safeLayerIdx - 1] : null;

    const inputActivations = prevLayer ? prevLayer.neurons.map((n) => n.a) : [];
    const weights = prevLayer ? prevLayer.neurons.map((_, i) => this.synapses[safeLayerIdx - 1][i][neuron.neuronIndex].weight) : [];

    // Phase 2: Weighted Sum
    const sumTerms = weights.map((w, i) => `${w.toFixed(2)} * ${(inputActivations[i] ?? 0).toFixed(2)}`);
    const previewSum = sumTerms.slice(0, 3).join(' + ') + (sumTerms.length > 3 ? ' + ...' : '');
    traces.push({
      stepPhase: 'forward_sum',
      phaseName: '2. Linear Affine Combination (Weighted Sum)',
      currentLayer: safeLayerIdx,
      currentNeuron: neuron.neuronIndex,
      explanation: `Neuron aggregates inputs from the previous layer scaled by synapse weights, adding its intrinsic bias: z = ∑ (wᵢ · aᵢ) + b`,
      formula: prevLayer
        ? `z = (${previewSum || '0.00'}) + (${neuron.bias.toFixed(3)}) = ${neuron.z.toFixed(4)}`
        : `x${neuron.neuronIndex + 1} = ${neuron.a.toFixed(4)}`,
      inputValues: inputActivations,
      weights,
      bias: neuron.bias,
      zValue: neuron.z,
      aValue: neuron.a,
    });

    // Phase 3: Non-Linear Activation
    const act = ACTIVATIONS[layer.activation];
    traces.push({
      stepPhase: 'activation',
      phaseName: `3. Non-Linear Activation: ${act.name.toUpperCase()}`,
      currentLayer: safeLayerIdx,
      currentNeuron: neuron.neuronIndex,
      explanation: `Applies non-linear transform to linear sum z, enabling the network to approximate arbitrary non-linear manifolds: ${act.formula}`,
      formula: `a = ${act.name}(${neuron.z.toFixed(4)}) = ${neuron.a.toFixed(4)} | f′(z) = ${act.df(neuron.z, neuron.a).toFixed(4)}`,
      inputValues: inputActivations,
      weights,
      bias: neuron.bias,
      zValue: neuron.z,
      aValue: neuron.a,
    });

    // Phase 4: Output & Loss
    const outputLayer = this.layers[this.layers.length - 1];
    const primaryOut = outputLayer.neurons[0].a;
    const targetVal = sample.targets[0] ?? 0;
    const isCE = this.lossType === 'cross_entropy';
    const err = primaryOut - targetVal;
    const lossVal = isCE
      ? -(targetVal * Math.log(Math.max(1e-12, primaryOut)) + (1 - targetVal) * Math.log(Math.max(1e-12, 1 - primaryOut)))
      : 0.5 * err * err;

    traces.push({
      stepPhase: 'loss',
      phaseName: `4. Loss Function Evaluation (${isCE ? 'Cross-Entropy' : 'MSE'})`,
      currentLayer: this.layers.length - 1,
      currentNeuron: 0,
      explanation: `Measures divergence between network prediction ŷ and ground truth target y: ${isCE ? 'L = -∑ y log(ŷ)' : 'L = 1/2 · (ŷ - y)²'}`,
      formula: isCE
        ? `L = -(${targetVal} · log(${primaryOut.toFixed(4)})) = ${lossVal.toFixed(6)}`
        : `L = 0.5 · (${primaryOut.toFixed(4)} - ${targetVal.toFixed(4)})² = ${lossVal.toFixed(6)}`,
      inputValues: outputLayer.neurons.map((n) => n.a),
      weights: [],
      bias: 0,
      zValue: outputLayer.neurons[0].z,
      aValue: primaryOut,
      targetValue: targetVal,
      lossValue: lossVal,
    });

    // Phase 5: Backward Gradient & Update
    const weightGradients = weights.map((w, i) => (inputActivations[i] ?? 0) * neuron.gradZ);
    traces.push({
      stepPhase: 'backward_delta',
      phaseName: '5. Gradient Backpropagation & Chain Rule Update',
      currentLayer: safeLayerIdx,
      currentNeuron: neuron.neuronIndex,
      explanation: `Calculates exact sensitivity δ = ∂L/∂z = (∂L/∂a) · f′(z) and synapse gradient ∂L/∂wᵢ = a_prev · δ, adjusting weights via Δw = -η · ∂L/∂w`,
      formula: `δ = ${neuron.gradZ.toFixed(6)} | Δw₁ = -(${this.learningRate.toFixed(4)}) · (${(weightGradients[0] ?? 0).toFixed(4)}) = ${(-this.learningRate * (weightGradients[0] ?? 0)).toFixed(6)}`,
      inputValues: inputActivations,
      weights,
      bias: neuron.bias,
      zValue: neuron.z,
      aValue: neuron.a,
      gradZ: neuron.gradZ,
      weightGrads: weightGradients,
    });

    return traces;
  }
}

// ==========================================
// DATASET GENERATORS & PRESET SCENARIOS
// ==========================================

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  topology: number[];
  hiddenActivation: ActivationType;
  outputActivation: ActivationType;
  learningRate: number;
  optimizer: OptimizerType;
  lossType: LossType;
  datasetName: 'wave_17' | 'dying_relu' | 'vanishing_grad' | 'xor_spiral' | 'step_math';
  badge: string;
  badgeColor: string;
  tips: string[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'signal_debugger',
    title: 'Signal Wave Classifier',
    subtitle: 'C++ Debugger / High-Density Sensor Array',
    description: '17 live oscillating harmonic input signals -> 26 ReLU hidden neurons -> 8 Output waveform classes. Visualizes live oscilloscope streams and high-throughput synapse routing.',
    topology: [17, 26, 8],
    hiddenActivation: 'relu',
    outputActivation: 'softmax',
    learningRate: 0.05,
    optimizer: 'momentum',
    lossType: 'cross_entropy',
    datasetName: 'wave_17',
    badge: 'ImGui-style Theme',
    badgeColor: 'border-[#2a2b30] text-[#cbd5e1] bg-[#18191c]',
    tips: [
      'Observe the green waveform oscilloscopes on the left edge.',
      'Click any neuron to inject dropout and watch weights reroute in real time.',
      'Hover over dense synapse bundles to isolate critical signal conduits.',
    ],
  },
  {
    id: 'dying_relu',
    title: 'The Dying ReLU Problem',
    subtitle: 'Gradient Starvation & Dead Neuron Necrosis',
    description: 'Pre-configured with an aggressive learning rate (0.6) and standard ReLU. Large negative gradient updates push weights into negative space where f\'(z) = 0 permanently, turning neurons dark ("dead").',
    topology: [2, 16, 16, 1],
    hiddenActivation: 'relu',
    outputActivation: 'sigmoid',
    learningRate: 0.65,
    optimizer: 'sgd',
    lossType: 'mse',
    datasetName: 'dying_relu',
    badge: 'Necrosis Diagnostic',
    badgeColor: 'border-[#2a2b30] text-[#8e9299] bg-[#18191c]',
    tips: [
      'Watch neurons turn crimson/gray and freeze as their gradients hit 0.0000 permanently.',
      'Click "Revive with Leaky ReLU" to introduce a 0.01 slope and recover dead neurons.',
      'Notice how SGD with high learning rate causes more aggressive neuron death than Momentum.',
    ],
  },
  {
    id: 'vanishing_grad',
    title: 'Vanishing vs. Exploding Gradients',
    subtitle: 'Deep Manifold Attenuation Benchmark',
    description: 'A deep 6-layer architecture using Sigmoid activation. Because σ\'(z) ≤ 0.25, multiplying derivatives backwards causes gradients near layer 1 to decay exponentially to 0.0000.',
    topology: [2, 12, 12, 12, 12, 12, 1],
    hiddenActivation: 'sigmoid',
    outputActivation: 'sigmoid',
    learningRate: 0.2,
    optimizer: 'momentum',
    lossType: 'mse',
    datasetName: 'vanishing_grad',
    badge: 'Deep Architecture',
    badgeColor: 'border-[#2a2b30] text-[#8e9299] bg-[#18191c]',
    tips: [
      'Toggle "Show Backprop Gradients" to see the magenta backprop pulse extinguish before reaching Layer 1.',
      'Switch Activation to "ReLU" in the top bar to witness gradients penetrate all the way through.',
      'Compare the gradient norms displayed in the top HUD.',
    ],
  },
  {
    id: '2d_classifier',
    title: '2D Point Classifier & Manifold',
    subtitle: 'Non-Linear Space Folding (Spiral / XOR)',
    description: 'Classifies non-linear 2D coordinates with a live decision boundary heatmap in the bottom-right corner, demonstrating how hidden layers warp space to separate intertwined classes.',
    topology: [2, 12, 12, 2],
    hiddenActivation: 'tanh',
    outputActivation: 'softmax',
    learningRate: 0.08,
    optimizer: 'momentum',
    lossType: 'cross_entropy',
    datasetName: 'xor_spiral',
    badge: 'Heatmap Visualizer',
    badgeColor: 'border-[#2a2b30] text-[#8e9299] bg-[#18191c]',
    tips: [
      'Inspect the live Decision Boundary canvas in the diagnostics drawer.',
      'Watch the boundary morph from linear planes into complex contours.',
      'Try killing 2 neurons in Hidden Layer 1 to see boundary collapse.',
    ],
  },
  {
    id: 'step_math_xray',
    title: 'Step-by-Step Math X-Ray Mode',
    subtitle: 'Deterministic 1-Second Cycle Microscope',
    description: 'Slows down execution to an illuminated 5-phase cycle: (1) Input vector, (2) Weighted sum ∑w·x+b, (3) Activation function σ(z), (4) Loss calculation, and (5) Backprop gradient update.',
    topology: [3, 4, 3, 2],
    hiddenActivation: 'relu',
    outputActivation: 'softmax',
    learningRate: 0.1,
    optimizer: 'sgd',
    lossType: 'cross_entropy',
    datasetName: 'step_math',
    badge: 'Pedagogical X-Ray',
    badgeColor: 'border-[#2a2b30] text-[#8e9299] bg-[#18191c]',
    tips: [
      'Click "Next Math Step" in the X-Ray drawer to manually advance each computation.',
      'Every weight and activation is rendered with exact arithmetic precision.',
      'Observe the direct numerical correlation between the formula and canvas pulses.',
    ],
  },
];

export function formatScenarioBriefing(
  preset: PresetScenario,
  topology: number[],
  layers?: LayerState[]
): string {
  const inCount = topology[0] ?? 1;
  const outCount = topology[topology.length - 1] ?? 1;
  const hiddenCountStr = topology
    .slice(1, -1)
    .map((count, idx) => {
      const act = layers?.[idx + 1]?.activation ?? preset.hiddenActivation;
      const actLabel = act === 'leaky_relu' ? 'Leaky ReLU' : act === 'sigmoid' ? 'Sigmoid' : act.toUpperCase();
      return `${count} ${actLabel}`;
    })
    .join(' -> ');

  const outAct = layers?.[topology.length - 1]?.activation ?? preset.outputActivation;
  const outActLabel = outAct === 'softmax' ? 'Softmax' : outAct === 'sigmoid' ? 'Sigmoid (Multi-label)' : outAct.toUpperCase();

  switch (preset.id) {
    case 'signal_debugger':
      return `${inCount} live oscillating harmonic input signals -> ${hiddenCountStr || 'Direct'} hidden neurons -> ${outCount} Output waveform classes (${outActLabel}). Visualizes live oscilloscope streams and high-throughput synapse routing.`;
    case 'dying_relu':
      return `Pre-configured with ${inCount} inputs, ${hiddenCountStr} hidden neurons, and ${outCount} output (${outActLabel}) with aggressive learning rate (${preset.learningRate}). Large negative gradient updates push weights into negative space where f'(z) = 0 permanently, turning neurons dark ("dead").`;
    case 'vanishing_grad':
      return `A deep ${topology.length}-layer architecture (${inCount} inputs -> ${hiddenCountStr} -> ${outCount} output) using ${layers?.[1]?.activation ? ACTIVATIONS[layers[1].activation].name.toUpperCase() : 'Sigmoid'} activation. Because derivative ≤ 0.25, multiplying backwards causes gradients near layer 1 to decay exponentially to 0.0000.`;
    case '2d_classifier':
      return `Classifies non-linear 2D coordinates (${inCount} inputs -> ${hiddenCountStr} -> ${outCount} classes [${outActLabel}]) with a live decision boundary heatmap, demonstrating how hidden layers warp space to separate intertwined classes.`;
    case 'step_math_xray':
      return `Step-by-step cycle on ${inCount} inputs -> ${hiddenCountStr} -> ${outCount} outputs (${outActLabel}). Slows down execution to an illuminated 5-phase cycle: (1) Input vector, (2) Weighted sum ∑w·x+b, (3) Activation function σ(z), (4) Loss calculation, and (5) Backprop gradient update.`;
    default:
      return `${inCount} inputs -> ${hiddenCountStr} -> ${outCount} outputs (${outActLabel}). ${preset.description}`;
  }
}

export function splitTrainVal(dataset: DataSample[], trainRatio: number = 0.8): { train: DataSample[]; val: DataSample[] } {
  if (!dataset || dataset.length <= 4) {
    return { train: dataset ? [...dataset] : [], val: dataset ? [...dataset] : [] };
  }
  const splitIdx = Math.max(1, Math.floor(dataset.length * trainRatio));
  return {
    train: dataset.slice(0, splitIdx),
    val: dataset.slice(splitIdx),
  };
}

// Generates 17 continuous oscillating wave signals for Sensor Array Mode
export function generateWaveData(t: number, count: number = 64): DataSample[] {
  const samples: DataSample[] = [];
  const classes = [
    'Pure Sine',
    'Square Wave',
    'Sawtooth',
    'Chirp Sweep',
    'ECG Cardiac Pulse',
    'Chaotic Attractor',
    'Harmonic Resonator',
    'Brownian Gaussian',
  ];

  for (let s = 0; s < count; s++) {
    const classId = s % 8;
    const inputs: number[] = new Array(17);
    const timeOffset = t + s * 0.1;

    for (let i = 0; i < 17; i++) {
      const freq = 0.5 + i * 0.35;
      const phase = (i * Math.PI) / 8.5;

      switch (classId) {
        case 0: // Sine
          inputs[i] = Math.sin(timeOffset * freq + phase) * 0.5 + 0.5;
          break;
        case 1: // Square
          inputs[i] = Math.sin(timeOffset * freq + phase) >= 0 ? 0.9 : 0.1;
          break;
        case 2: // Sawtooth
          inputs[i] = ((timeOffset * freq + phase) % (2 * Math.PI)) / (2 * Math.PI);
          break;
        case 3: // Chirp
          inputs[i] = Math.sin(timeOffset * (freq * 1.8 + Math.sin(timeOffset * 0.2))) * 0.5 + 0.5;
          break;
        case 4: // ECG
          const beat = (timeOffset * 2 + i * 0.2) % 3;
          inputs[i] = beat < 0.3 ? 0.95 : beat < 0.6 ? 0.05 : 0.45;
          break;
        case 5: // Chaotic
          inputs[i] = (Math.sin(timeOffset * freq * 2.3) * Math.cos(timeOffset * 1.7 + phase) + 1) * 0.5;
          break;
        case 6: // Harmonic
          inputs[i] = (Math.sin(timeOffset * freq) + 0.5 * Math.sin(timeOffset * freq * 3) + 1.5) / 3;
          break;
        case 7: // Brownian
        default:
          inputs[i] = Math.max(0, Math.min(1, 0.5 + (Math.random() - 0.5) * 0.6));
          break;
      }
    }

    // 8-class one-hot targets
    const targets = new Array(8).fill(0);
    targets[classId] = 1;

    samples.push({
      inputs,
      targets,
      label: classes[classId],
    });
  }

  return samples;
}

// Generates feature data for Dying ReLU demonstration
export function generateDyingReLUData(count: number = 80): DataSample[] {
  const samples: DataSample[] = [];
  for (let i = 0; i < count; i++) {
    // Generate positive-skewed feature data typical of ReLU inputs (e.g. normalized sensor values)
    const x1 = Math.random() * 2;
    const x2 = Math.random() * 2;
    const target = x1 * 0.8 + x2 * 0.5 > 1.2 ? 1 : 0;
    samples.push({
      inputs: [x1, x2],
      targets: [target],
      coords: [x1, x2],
    });
  }
  return samples;
}

// Generates Deep Manifold data for Vanishing Gradient demonstration
export function generateVanishingGradData(count: number = 80): DataSample[] {
  const samples: DataSample[] = [];
  for (let i = 0; i < count; i++) {
    const x1 = Math.random() * 2 - 1;
    const x2 = Math.random() * 2 - 1;
    const target = Math.sin(x1 * 3) + Math.cos(x2 * 3) > 0 ? 1 : 0;
    samples.push({
      inputs: [x1, x2],
      targets: [target],
      coords: [x1, x2],
    });
  }
  return samples;
}

// Generates 2D Spirals or XOR for Decision Boundary
export function generate2DSpiralData(pointsPerSpiral: number = 60): DataSample[] {
  const samples: DataSample[] = [];

  // Spiral 1 (Class 0)
  for (let i = 0; i < pointsPerSpiral; i++) {
    const r = (i / pointsPerSpiral) * 1.0;
    const t = 1.75 * i * (2 * Math.PI / pointsPerSpiral) + (Math.random() - 0.5) * 0.15;
    const x = r * Math.sin(t);
    const y = r * Math.cos(t);
    samples.push({
      inputs: [x, y],
      targets: [1, 0],
      label: 'Spiral A',
      coords: [x, y],
    });
  }

  // Spiral 2 (Class 1)
  for (let i = 0; i < pointsPerSpiral; i++) {
    const r = (i / pointsPerSpiral) * 1.0;
    const t = 1.75 * i * (2 * Math.PI / pointsPerSpiral) + Math.PI + (Math.random() - 0.5) * 0.15;
    const x = r * Math.sin(t);
    const y = r * Math.cos(t);
    samples.push({
      inputs: [x, y],
      targets: [0, 1],
      label: 'Spiral B',
      coords: [x, y],
    });
  }

  return samples;
}

// Deterministic samples for Step-by-Step Math Mode
export function generateStepMathData(): DataSample[] {
  return [
    { inputs: [0.8, -0.4, 0.6], targets: [1, 0], label: 'Sample Alpha' },
    { inputs: [-0.7, 0.9, -0.2], targets: [0, 1], label: 'Sample Beta' },
    { inputs: [0.3, 0.5, 0.9], targets: [1, 0], label: 'Sample Gamma' },
  ];
}
