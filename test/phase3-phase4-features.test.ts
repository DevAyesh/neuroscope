import {
  NeuralNetwork,
  ACTIVATIONS,
  formatLoss,
  formatScenarioBriefing,
  PRESET_SCENARIOS,
  splitTrainVal,
} from '../lib/nn-engine';

console.log('=== RUNNING PHASE 3 & 4 TEST SUITE ===');

// Test 1: formatLoss scientific notation
console.log('[Test 1] Verifying formatLoss scientific notation under 0.001...');
const largeLoss = 0.0452;
const tinyLoss = 0.0000854;
const zeroLoss = 0;
if (formatLoss(largeLoss) !== '0.0452') {
  throw new Error(`Expected 0.0452 but got ${formatLoss(largeLoss)}`);
}
if (!formatLoss(tinyLoss).includes('e-5')) {
  throw new Error(`Expected scientific notation with e-5 but got ${formatLoss(tinyLoss)}`);
}
if (formatLoss(zeroLoss) !== '0.0000') {
  throw new Error(`Expected 0.0000 but got ${formatLoss(zeroLoss)}`);
}
console.log('✓ formatLoss scientific notation verified.');

// Test 2: Dynamic Scenario Briefing text
console.log('[Test 2] Verifying formatScenarioBriefing derives from dynamic topology...');
const preset = PRESET_SCENARIOS[0]; // signal_debugger
const customTopology = [12, 18, 5];
const nn = new NeuralNetwork(customTopology, 'relu', 'softmax');
const text = formatScenarioBriefing(preset, customTopology, nn.layers);
if (!text.includes('12 live oscillating harmonic input signals')) {
  throw new Error(`Expected text to mention 12 inputs, but got: ${text}`);
}
if (!text.includes('5 Output waveform classes')) {
  throw new Error(`Expected text to mention 5 output classes, but got: ${text}`);
}
console.log('✓ Dynamic Scenario Briefing derives from layer sizes correctly.');

// Test 3: Train / Validation split
console.log('[Test 3] Verifying splitTrainVal 80/20 partitioning...');
const dummyData = Array.from({ length: 50 }, (_, i) => ({
  inputs: [i, i * 2],
  targets: [1, 0],
}));
const { train, val } = splitTrainVal(dummyData, 0.8);
if (train.length !== 40 || val.length !== 10) {
  throw new Error(`Expected 40 train and 10 val samples, got train=${train.length}, val=${val.length}`);
}
console.log('✓ Train / Validation split verified.');

// Test 4: Softmax default with Categorical Cross Entropy & Output activation options
console.log('[Test 4] Verifying Softmax output activation with Cross-Entropy...');
const net = new NeuralNetwork([4, 8, 3], 'relu', 'softmax', 'cross_entropy');
const out = net.forward([0.5, 0.2, 0.9, 0.1]);
const sumExp = out.reduce((a, b) => a + b, 0);
if (Math.abs(sumExp - 1.0) > 1e-4) {
  throw new Error(`Expected Softmax sum to equal 1.0, got ${sumExp}`);
}
if (net.outputActivation !== 'softmax' || net.lossType !== 'cross_entropy') {
  throw new Error('Softmax should pair with cross_entropy');
}
console.log('✓ Softmax probability distribution and cross-entropy verified.');

// Test 5: Leaky ReLU prevents and revives dead neurons
console.log('[Test 5] Verifying Leaky ReLU non-zero gradients for negative pre-activations...');
const zNegative = -4.5;
const leakyDeriv = ACTIVATIONS.leaky_relu.df(zNegative);
const reluDeriv = ACTIVATIONS.relu.df(zNegative);
if (reluDeriv !== 0) throw new Error('ReLU derivative for negative z should be 0');
if (leakyDeriv !== 0.01) throw new Error('Leaky ReLU derivative for negative z should be 0.01');
console.log('✓ Leaky ReLU non-zero gradient confirmed (0.01).');

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Test A: Adam optimizer convergence on XOR
console.log('[Test A] Verifying Adam optimizer convergence on XOR...');
const netAdam = new NeuralNetwork([2, 8, 1], 'tanh', 'sigmoid', 0.05, 'adam');
netAdam.lossType = 'mse';
const xorData = [
  { inputs: [0, 0], targets: [0] },
  { inputs: [1, 0], targets: [1] },
  { inputs: [0, 1], targets: [1] },
  { inputs: [1, 1], targets: [0] },
];
netAdam.trainStep(xorData, 1000);
assert(netAdam.metrics.loss < 0.1, `Adam: XOR loss should converge below 0.1 (got ${netAdam.metrics.loss})`);
assert(netAdam.adamT > 0, 'Adam: adamT step counter should be non-zero');
assert(netAdam.synapses[0][0][0].adamM !== 0, 'Adam: first moment should be non-zero after training');
assert(netAdam.synapses[0][0][0].adamV !== 0, 'Adam: second moment should be non-zero after training');
console.log('✓ Adam optimizer convergence verified.');

// Test B: Mini-batch SGD convergence
console.log('[Test B] Verifying Mini-batch SGD convergence...');
const netBatch = new NeuralNetwork([2, 8, 1], 'tanh', 'sigmoid', 0.1, 'sgd');
netBatch.batchSize = 8;
netBatch.lossType = 'mse';
netBatch.trainStep(xorData, 3000);
assert(netBatch.batchSize === 8, 'batchSize should be 8');
assert(netBatch.metrics.loss < 0.1, `Mini-batch: XOR should converge reasonably (got ${netBatch.metrics.loss})`);
console.log('✓ Mini-batch SGD verified.');

console.log('=== ALL PHASE 3 & 4 TESTS PASSED! ===');
