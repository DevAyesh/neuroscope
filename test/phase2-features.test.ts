import { useNetworkStore } from '../store/useNetworkStore';
import { audioSynth } from '../lib/audio-synth';
import { NeuralNetwork } from '../lib/nn-engine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('=== RUNNING PHASE 2 UPGRADE TEST SUITE ===');

// Test 1: Guided Tour state progression & navigation
console.log('[Test 1] Verifying Interactive Guided Tour Store State...');
const store = useNetworkStore.getState();

// Start tour
store.startTour();
assert(useNetworkStore.getState().isTourOpen === true, 'Tour should be open');
assert(useNetworkStore.getState().tourStep === 0, 'Tour should start at step 0');

// Step 1: Input Oscilloscopes
assert(useNetworkStore.getState().showOscilloscopes === true, 'Step 1 should enable oscilloscopes');

// Next step -> Step 2: Bezier Synapses
useNetworkStore.getState().nextTourStep();
assert(useNetworkStore.getState().tourStep === 1, 'Tour step should advance to 1 (Bezier Synapses)');

// Next step -> Step 3: Hidden Neuron & Activation Graph
useNetworkStore.getState().nextTourStep();
assert(useNetworkStore.getState().tourStep === 2, 'Tour step should advance to 2 (Hidden Neuron)');
assert(useNetworkStore.getState().selectedNeuron !== null, 'Step 3 should select a hidden neuron');
assert(useNetworkStore.getState().selectedNeuron?.layerIndex === 1, 'Selected neuron should be in Layer 1');
// Verify secondary spotlight target is set for Activation Graph
useNetworkStore.getState().setSecondarySpotlightTarget({
  x: 500,
  y: 60,
  width: 340,
  height: 480,
  title: "Activation Graph: f'(z)",
});
assert(useNetworkStore.getState().secondarySpotlightTarget !== null, 'Step 3 should allow secondary spotlight target for Activation Graph');

// Next step -> Step 4: Backpropagation pulse
const initialPulse = useNetworkStore.getState().backpropPulseCount;
useNetworkStore.getState().nextTourStep();
assert(useNetworkStore.getState().tourStep === 3, 'Tour step should advance to 3 (Backprop Pulse)');
assert(useNetworkStore.getState().secondarySpotlightTarget === null, 'Step 4 should clear secondary spotlight target');
assert(useNetworkStore.getState().backpropPulseCount > initialPulse, 'Step 4 should trigger backprop pulse');
assert(useNetworkStore.getState().showBackpropGradients === true, 'Gradients should be visible');

// Next step -> Step 5: Kill a neuron
useNetworkStore.getState().nextTourStep();
assert(useNetworkStore.getState().tourStep === 4, 'Tour step should advance to 4 (Kill a Neuron)');
assert(useNetworkStore.getState().secondarySpotlightTarget === null, 'Step 5 should not have secondary spotlight target');

// Upper clamp
useNetworkStore.getState().nextTourStep();
assert(useNetworkStore.getState().tourStep === 4, 'Tour step should clamp at 4');

// Prev step
useNetworkStore.getState().prevTourStep();
assert(useNetworkStore.getState().tourStep === 3, 'Tour step should move back to 3');

// Close tour
useNetworkStore.getState().closeTour();
assert(useNetworkStore.getState().isTourOpen === false, 'Tour should be closed');
assert(useNetworkStore.getState().secondarySpotlightTarget === null, 'Closing tour should clear secondary spotlight target');

// Verify startTour(initialStep) direct jump (e.g. Concept 5: Step 5 of 5)
useNetworkStore.getState().startTour(4);
assert(useNetworkStore.getState().isTourOpen === true, 'Tour should be open');
assert(useNetworkStore.getState().tourStep === 4, 'Tour should jump directly to step 4');
useNetworkStore.getState().closeTour();

// Verify Learning Guide modal open/close actions
assert(useNetworkStore.getState().isLearningGuideOpen === false, 'Learning guide should initially be closed');
useNetworkStore.getState().openLearningGuide();
assert(useNetworkStore.getState().isLearningGuideOpen === true, 'Learning guide should open');
useNetworkStore.getState().closeLearningGuide();
assert(useNetworkStore.getState().isLearningGuideOpen === false, 'Learning guide should close');

// Verify selectPreset cleanly cancels any active tour
useNetworkStore.getState().startTour(0);
assert(useNetworkStore.getState().isTourOpen === true, 'Tour should be active');
useNetworkStore.getState().selectPreset('signal_debugger');
assert(useNetworkStore.getState().isTourOpen === false, 'Selecting preset should cleanly cancel active tour');
assert(useNetworkStore.getState().spotlightTarget === null, 'Selecting preset should clear spotlight target');
assert(useNetworkStore.getState().secondarySpotlightTarget === null, 'Selecting preset should clear secondary spotlight target');

console.log('✓ Interactive Guided Tour navigation & dual spotlighting passed.');

// Test 2: Custom Dataset Drawing Pad (2D Classifier Preset)
console.log('[Test 2] Verifying Custom Dataset Drawing Pad...');
useNetworkStore.getState().selectPreset('2d_classifier');
assert(useNetworkStore.getState().currentPresetId === '2d_classifier', 'Should be in 2d_classifier preset');

// Clear dataset
useNetworkStore.getState().clearCustomDataset();
assert(useNetworkStore.getState().currentDataset.length === 0, 'Dataset should be cleared');

// Add Class 0 (Cyan) point at [0.5, 0.5]
useNetworkStore.getState().addCustomPoint(0.5, 0.5, 0);
let dataset = useNetworkStore.getState().currentDataset;
assert(dataset.length === 1, 'Should have 1 point');
assert(dataset[0].inputs[0] === 0.5 && dataset[0].inputs[1] === 0.5, 'Coords should match');
assert(dataset[0].targets[1] === 1, 'Class 0 (Cyan) should map to target[1]=1 (Cyan probability)');

// Add Class 1 (Amber) point at [-0.5, -0.5]
useNetworkStore.getState().addCustomPoint(-0.5, -0.5, 1);
dataset = useNetworkStore.getState().currentDataset;
assert(dataset.length === 2, 'Should have 2 points');
assert(dataset[1].targets[0] === 1, 'Class 1 (Amber) should map to target[0]=1 (Amber probability)');

// Test rapid drag drawing of both classes (positive quadrant for Cyan, negative for Amber)
for (let i = 1; i <= 8; i++) {
  useNetworkStore.getState().addCustomPoint(0.1 * i, 0.1 * i, 0);
  useNetworkStore.getState().addCustomPoint(-0.1 * i, -0.1 * i, 1);
}
assert(useNetworkStore.getState().currentDataset.length === 18, 'Should have 18 points after drag drawing');

// Train network on these custom points and verify real-time boundary adaptation
const engine = useNetworkStore.getState().engine;
for (let i = 0; i < 60; i++) {
  engine.trainStep(useNetworkStore.getState().currentDataset, 4);
}

// Predict at Class 0 point [0.5, 0.5]
const predCyan = engine.predict([0.5, 0.5]);
// In our 2-class setup, out[1] represents Cyan
assert(predCyan[1] > predCyan[0], `Prediction at [0.5, 0.5] should favor Cyan (out[1]=${predCyan[1]} > out[0]=${predCyan[0]})`);

// Predict at Class 1 point [-0.5, -0.5]
const predAmber = engine.predict([-0.5, -0.5]);
// out[0] represents Amber
assert(predAmber[0] > predAmber[1], `Prediction at [-0.5, -0.5] should favor Amber (out[0]=${predAmber[0]} > out[1]=${predAmber[1]})`);

// Reset dataset back to preset spirals
useNetworkStore.getState().resetDatasetToPreset();
dataset = useNetworkStore.getState().currentDataset;
assert(dataset.length === 120, `Preset dataset should have 120 points (got ${dataset.length})`);
console.log('✓ Custom Dataset Drawing Pad passed.');

// Test 3: Web Audio Synth API
console.log('[Test 3] Verifying Web Audio Synth Muting, NaN Resilience & Audio Calls...');
assert(audioSynth.getIsMuted() === true, 'Audio synth should be muted by default');
assert(useNetworkStore.getState().isAudioMuted === true, 'Store audio state should be muted by default');

// Toggle audio via store
useNetworkStore.getState().toggleAudio();
assert(useNetworkStore.getState().isAudioMuted === false, 'Store audio should be unmuted after toggle');
assert(audioSynth.getIsMuted() === false, 'Audio synth should be unmuted');

// Test metrics update without crashing
audioSynth.updateMetrics(0.85, 45, 0.22, 0, true);
audioSynth.updateMetrics(0.02, 99, 0.005, 0, true);
audioSynth.updateMetrics(0.4, 60, 0.0, 4, true); // Dying ReLU necrotic state
audioSynth.updateMetrics(0.1, 80, 0.05, 0, false); // Paused state

// Test NaN and non-finite resilience (must NOT throw)
audioSynth.updateMetrics(NaN, NaN, NaN, NaN, true);
audioSynth.updateMetrics(Infinity, -Infinity, NaN, 0, true);

// Test audio pulse triggers without crashing
audioSynth.triggerPulse('forward');
audioSynth.triggerPulse('backward');
audioSynth.triggerTrainingPulse(true, 0.5);
audioSynth.triggerNeuronKill();
audioSynth.triggerRevival();

// Toggle audio back to muted
useNetworkStore.getState().toggleAudio();
assert(useNetworkStore.getState().isAudioMuted === true, 'Store audio should be muted again');
assert(audioSynth.getIsMuted() === true, 'Audio synth should be muted');
console.log('✓ Web Audio API Sonification passed.');

// Test 4: Neuron Kill & Self-Healing Interventions
console.log('[Test 4] Verifying Neuron Killing & Revival...');
useNetworkStore.getState().selectPreset('signal_debugger');
const testEngine = useNetworkStore.getState().engine;
const wasDisabled = testEngine.layers[1].neurons[0].disabled;
assert(wasDisabled === false, 'Neuron should start enabled');

// Kill neuron L1-N0
useNetworkStore.getState().toggleNeuronDisabled(1, 0);
assert(testEngine.layers[1].neurons[0].disabled === true, 'Neuron should now be disabled');

// Re-enable neuron
useNetworkStore.getState().toggleNeuronDisabled(1, 0);
assert(testEngine.layers[1].neurons[0].disabled === false, 'Neuron should now be re-enabled');
console.log('✓ Neuron Kill & Self-Healing passed.');

// Test 5: Verifying Preset Selection & Scenario Metadata Integrity
console.log('[Test 5] Verifying Preset Scenarios & Dropdown Model Integrity...');
import('../lib/nn-engine').then(({ PRESET_SCENARIOS }) => {
  assert(PRESET_SCENARIOS.length === 5, 'Should define exactly 5 preset scenarios');
  for (const p of PRESET_SCENARIOS) {
    assert(typeof p.id === 'string' && p.id.length > 0, `Preset ${p.id} must have non-empty id`);
    assert(typeof p.title === 'string' && p.title.length > 0, `Preset ${p.id} must have non-empty title`);
    assert(typeof p.subtitle === 'string', `Preset ${p.id} must have subtitle`);
    assert(typeof p.badge === 'string', `Preset ${p.id} must have badge`);
    assert(typeof p.badgeColor === 'string', `Preset ${p.id} must have badgeColor`);
    assert(Array.isArray(p.topology) && p.topology.length >= 2, `Preset ${p.id} topology must have at least 2 layers`);

    // Test selection of each preset in store
    useNetworkStore.getState().selectPreset(p.id);
    assert(useNetworkStore.getState().currentPresetId === p.id, `Selected preset ID must match ${p.id}`);
  }

  // Test invalid preset handling
  const prevId = useNetworkStore.getState().currentPresetId;
  useNetworkStore.getState().selectPreset('non_existent_preset_xyz');
  assert(useNetworkStore.getState().currentPresetId === prevId, 'Invalid preset should not corrupt currentPresetId');
  console.log('✓ Preset Scenarios & Dropdown Model Integrity passed.');
  console.log('=== ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ===');
});

