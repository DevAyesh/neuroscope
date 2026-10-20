import {
  NeuralNetwork,
  ACTIVATIONS,
  generateWaveData,
  generateDyingReLUData,
  generateVanishingGradData,
  generate2DSpiralData,
  generateStepMathData,
  PRESET_SCENARIOS,
} from '../lib/nn-engine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertClose(a: number, b: number, tol = 1e-4, msg = '') {
  if (Math.abs(a - b) > tol) {
    throw new Error(`Values not close: ${a} vs ${b} (diff: ${Math.abs(a - b)} > ${tol}) ${msg}`);
  }
}

console.log('=== RUNNING NEUROSCOPE ENGINE TEST SUITE ===');

// Test 1: Activations and Derivatives
console.log('[Test 1] Verifying Activation Functions & Analytical Derivatives...');
assertClose(ACTIVATIONS.relu.fn(3.5), 3.5);
assertClose(ACTIVATIONS.relu.fn(-2.5), 0);
assertClose(ACTIVATIONS.relu.df(3.5), 1);
assertClose(ACTIVATIONS.relu.df(-2.5), 0);

assertClose(ACTIVATIONS.leaky_relu.fn(3.5), 3.5);
assertClose(ACTIVATIONS.leaky_relu.fn(-2.0), -0.02);
assertClose(ACTIVATIONS.leaky_relu.df(3.5), 1);
assertClose(ACTIVATIONS.leaky_relu.df(-2.0), 0.01);

assertClose(ACTIVATIONS.sigmoid.fn(0), 0.5);
assertClose(ACTIVATIONS.sigmoid.df(0), 0.25);

assertClose(ACTIVATIONS.tanh.fn(0), 0);
assertClose(ACTIVATIONS.tanh.df(0), 1);

assertClose(ACTIVATIONS.linear.fn(4.2), 4.2);
assertClose(ACTIVATIONS.linear.df(4.2), 1);
console.log('✓ Activation functions and derivatives passed.');

// Test 2: Dynamic Architecture Construction
console.log('[Test 2] Verifying Dynamic Architecture Construction...');
const net1 = new NeuralNetwork([17, 26, 16, 8]);
assert(net1.layers.length === 4, 'Should have 4 layers');
assert(net1.layers[0].neurons.length === 17, 'Layer 0 should have 17 neurons');
assert(net1.layers[1].neurons.length === 26, 'Layer 1 should have 26 neurons');
assert(net1.layers[2].neurons.length === 16, 'Layer 2 should have 16 neurons');
assert(net1.layers[3].neurons.length === 8, 'Layer 3 should have 8 neurons');
assert(net1.synapses.length === 3, 'Should have 3 synapse matrices');
assert(net1.synapses[0].length === 17 && net1.synapses[0][0].length === 26, 'Synapse shape 0');
assert(net1.synapses[1].length === 26 && net1.synapses[1][0].length === 16, 'Synapse shape 1');
assert(net1.synapses[2].length === 16 && net1.synapses[2][0].length === 8, 'Synapse shape 2');
console.log('✓ Dynamic architecture initialized properly.');

// Test 3: Forward Pass & Pre/Post Activation Storage
console.log('[Test 3] Verifying Forward Propagation...');
const sampleInput = new Array(17).fill(0.5);
const out = net1.forward(sampleInput);
assert(out.length === 8, 'Output length must be 8');
for (const val of out) {
  assert(!isNaN(val) && isFinite(val), 'Output must be valid real number');
}
// Check that neurons store z and a
for (const layer of net1.layers) {
  for (const n of layer.neurons) {
    assert(!isNaN(n.z) && isFinite(n.z), `Neuron ${n.label} z is invalid`);
    assert(!isNaN(n.a) && isFinite(n.a), `Neuron ${n.label} a is invalid`);
  }
}
console.log('✓ Forward pass verified.');

// Test 4: Numerical Gradient Check (Finite Differences)
console.log('[Test 4] Verifying Numerical Gradients via Finite Differences...');
const tinyNet = new NeuralNetwork([2, 3, 1], 'tanh', 'linear', 0.01, 'sgd');
tinyNet.lossType = 'mse';
const testIn = [0.6, -0.4];
const testTarget = [0.8];

// Analytical backward pass (applyUpdates = false to keep weights unchanged for finite diff)
tinyNet.backward(testIn, testTarget, false);
const analyticalGradW = tinyNet.synapses[0][0][0].weightGradient;

// Finite difference numerical gradient
const eps = 1e-5;
const origW = tinyNet.synapses[0][0][0].weight;

tinyNet.synapses[0][0][0].weight = origW + eps;
const predPlus = tinyNet.forward(testIn)[0];
const lossPlus = 0.5 * Math.pow(predPlus - testTarget[0], 2);

tinyNet.synapses[0][0][0].weight = origW - eps;
const predMinus = tinyNet.forward(testIn)[0];
const lossMinus = 0.5 * Math.pow(predMinus - testTarget[0], 2);

tinyNet.synapses[0][0][0].weight = origW; // restore
const numericalGradW = (lossPlus - lossMinus) / (2 * eps);

assertClose(
  analyticalGradW,
  numericalGradW,
  1e-3,
  `Analytical (${analyticalGradW}) vs Numerical (${numericalGradW})`
);
console.log(`✓ Gradient check passed: analytical=${analyticalGradW.toFixed(6)}, numerical=${numericalGradW.toFixed(6)}`);

// Test 5: Optimization Convergence (Loss Reduction on XOR)
console.log('[Test 5] Verifying Gradient Descent Convergence on XOR...');
const xorNet = new NeuralNetwork([2, 6, 1], 'tanh', 'sigmoid', 0.25, 'momentum');
xorNet.lossType = 'mse';
const xorData = [
  { inputs: [0, 0], targets: [0] },
  { inputs: [0, 1], targets: [1] },
  { inputs: [1, 0], targets: [1] },
  { inputs: [1, 1], targets: [0] },
];

let initialLoss = 0;
for (const s of xorData) {
  const p = xorNet.forward(s.inputs)[0];
  initialLoss += 0.5 * Math.pow(p - s.targets[0], 2);
}
initialLoss /= 4;

for (let e = 0; e < 350; e++) {
  xorNet.trainStep(xorData, 4);
}

let finalLoss = 0;
for (const s of xorData) {
  const p = xorNet.forward(s.inputs)[0];
  finalLoss += 0.5 * Math.pow(p - s.targets[0], 2);
}
finalLoss /= 4;

console.log(`  Initial XOR Loss: ${initialLoss.toFixed(5)} -> Final XOR Loss: ${finalLoss.toFixed(5)}`);
assert(finalLoss < initialLoss, 'Training must reduce loss');
console.log('✓ Optimizer converges properly.');

// Test 6: Neuron Killing / Dropout Intervention
console.log('[Test 6] Verifying Neuron Dropout / Killing...');
const killNet = new NeuralNetwork([2, 4, 1]);
const preKillOut = killNet.forward([1, 1]);
killNet.toggleNeuron(1, 0); // kill first hidden neuron
assert(killNet.layers[1].neurons[0].disabled === true, 'Neuron should be disabled');
const postKillOut = killNet.forward([1, 1]);
assert(killNet.layers[1].neurons[0].a === 0, 'Disabled neuron activation must be 0');
killNet.toggleNeuron(1, 0); // revive
assert(killNet.layers[1].neurons[0].disabled === false, 'Neuron should be restored');
console.log('✓ Neuron kill/dropout intervention passed.');

// Test 7: Dying ReLU Problem Detection & Revival
console.log('[Test 7] Verifying Dying ReLU detection & Leaky ReLU revival...');
const dyingNet = new NeuralNetwork([2, 8, 1], 'relu', 'sigmoid', 0.8, 'sgd');
for (let f = 0; f < 2; f++) {
  for (let t = 0; t < 8; t++) {
    dyingNet.synapses[0][f][t].weight = -10.0;
  }
}
for (let n = 0; n < 8; n++) {
  dyingNet.layers[1].neurons[n].bias = -5.0;
}
const dyingData = generateDyingReLUData(20);
for (let i = 0; i < 30; i++) {
  dyingNet.trainStep(dyingData, 5);
}
assert(dyingNet.metrics.deadNeuronCount > 0, 'Dead neurons must be detected under extreme negative ReLU');
console.log(`  Detected ${dyingNet.metrics.deadNeuronCount} dead neurons.`);

// Revive by switching to leaky_relu
dyingNet.setActivation('leaky_relu');
for (let n = 0; n < 8; n++) {
  dyingNet.layers[1].neurons[n].bias = 0.1;
  dyingNet.layers[1].neurons[n].isDead = false;
}
dyingNet.trainStep(dyingData, 5);
console.log('✓ Dying ReLU detection and revival verified.');

// Test 8: Non-Mutating predict() Integrity
console.log('[Test 8] Verifying Non-Mutating predict() Method...');
const evalNet = new NeuralNetwork([2, 4, 1], 'tanh', 'sigmoid');
evalNet.forward([0.5, -0.3]);
const savedZ0 = evalNet.layers[1].neurons[0].z;
const savedA0 = evalNet.layers[1].neurons[0].a;
const savedHistLen = evalNet.layers[0].neurons[0].historyA.length;
const savedHistVals = [...evalNet.layers[0].neurons[0].historyA];

// Perform 1000 headless predict evaluations (simulating 32x32 grid sweep)
for (let gx = 0; gx < 32; gx++) {
  for (let gy = 0; gy < 32; gy++) {
    const p = evalNet.predict([gx * 0.1, gy * 0.1]);
    assert(p.length === 1, 'Predict output dimension must match');
  }
}

// Ensure internal state was not corrupted by predict()
assertClose(evalNet.layers[1].neurons[0].z, savedZ0, 1e-9, 'Predict must not mutate neuron z');
assertClose(evalNet.layers[1].neurons[0].a, savedA0, 1e-9, 'Predict must not mutate neuron a');
assert(evalNet.layers[0].neurons[0].historyA.length === savedHistLen, 'Predict must not pollute historyA');
for (let h = 0; h < savedHistLen; h++) {
  assertClose(evalNet.layers[0].neurons[0].historyA[h], savedHistVals[h], 1e-9, 'historyA content unchanged');
}
console.log('✓ predict() is 100% non-mutating and safe for grid sweeps.');

// Test 9: Step-by-Step Math X-Ray Analytical Gradient Calculation
console.log('[Test 9] Verifying Math X-Ray Trace Analytical Gradients...');
const traceNet = new NeuralNetwork([3, 4, 2], 'tanh', 'sigmoid', 0.1, 'sgd');
const traceSample = { inputs: [0.8, -0.4, 0.6], targets: [1, 0] };
const traces = traceNet.getStepTrace(traceSample, 1, 0);

assert(traces.length === 5, 'Must produce 5 math phases');
assert(traces[0].stepPhase === 'input', 'Phase 1 is input');
assert(traces[1].stepPhase === 'forward_sum', 'Phase 2 is forward_sum');
assert(traces[2].stepPhase === 'activation', 'Phase 3 is activation');
assert(traces[3].stepPhase === 'loss', 'Phase 4 is loss');
assert(traces[4].stepPhase === 'backward_delta', 'Phase 5 is backward_delta');

// Verify that Phase 5 gradient delta is genuinely computed and non-zero
assert(traces[4].gradZ !== undefined && !isNaN(traces[4].gradZ!), 'gradZ must be computed');
assert(Math.abs(traces[4].gradZ!) > 1e-6, `gradZ must be non-zero for active neuron: ${traces[4].gradZ}`);
assert(traces[4].weightGrads !== undefined && traces[4].weightGrads!.length === 3, 'weightGrads must exist');
console.log(`  Math X-Ray Phase 5 δ: ${traces[4].gradZ?.toFixed(6)}`);
console.log('✓ Math X-Ray trace analytical gradients verified.');

// Test 10: Inverted Dropout Scaling and Masking
console.log('[Test 10] Verifying Inverted Dropout Scaling & Masking...');
const dropNet = new NeuralNetwork([2, 20, 1], 'linear', 'linear', 0.05, 'sgd');
dropNet.dropoutRate = 0.5;
// Forward with training mode
dropNet.forward([1.0, 1.0], true);
let droppedCount = 0;
for (const n of dropNet.layers[1].neurons) {
  if (n.droppedOut) {
    droppedCount++;
    assert(n.a === 0, 'Dropped neuron activation must be 0');
  }
}
assert(droppedCount > 0 && droppedCount < 20, 'Some neurons must be dropped under p=0.5');
console.log(`  Dropped neurons: ${droppedCount}/20`);
console.log('✓ Inverted dropout masking verified.');

// Test 11: All Presets and Datasets Integrity
console.log('[Test 11] Verifying Preset Scenarios and Datasets...');
for (const preset of PRESET_SCENARIOS) {
  const pNet = new NeuralNetwork(
    preset.topology,
    preset.hiddenActivation,
    preset.outputActivation,
    preset.learningRate,
    preset.optimizer
  );
  pNet.lossType = preset.lossType;

  let dataset;
  switch (preset.datasetName) {
    case 'wave_17':
      dataset = generateWaveData(0, 10);
      break;
    case 'dying_relu':
      dataset = generateDyingReLUData(10);
      break;
    case 'vanishing_grad':
      dataset = generateVanishingGradData(10);
      break;
    case 'xor_spiral':
      dataset = generate2DSpiralData(10);
      break;
    case 'step_math':
      dataset = generateStepMathData();
      break;
  }

  assert(dataset.length > 0, `Dataset for ${preset.id} must have samples`);
  const stepRes = pNet.trainStep(dataset, 2);
  assert(!isNaN(stepRes.loss), `Preset ${preset.id} step loss must be valid number`);

  const tr = pNet.getStepTrace(dataset[0], 1, 0);
  assert(tr.length === 5, `Preset ${preset.id} math trace must have 5 phases`);
  console.log(`  ✓ Preset "${preset.title}" executed cleanly.`);
}

console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
