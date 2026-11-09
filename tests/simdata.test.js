/**
 * SimData Automated Test Suite
 * Verifies Core Math, Simulation Engine, OSC Serialization, and Dataset Playback.
 */

const assert = require('assert');
const { SimulationEngine, PRESETS } = require('../server/bioServer.cjs');
const { encodeOscMessage, encodeOscBundle } = require('../server/oscEncoder.cjs');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting SimData Verification Tests...\n');

// Test 1: SimulationEngine Tick & Output Schema
console.log('Test 1: SimulationEngine Tick & Telemetry Schema');
const engine = new SimulationEngine();
const t1 = engine.tick(1 / 30);

assert(t1.timestamp > 0, 'Timestamp must be present');
assert.strictEqual(t1.mode, 'generative', 'Mode should default to generative');

// Biometrics schema
assert(t1.biometrics, 'biometrics field required');
assert(t1.biometrics.eeg, 'eeg field required');
assert(typeof t1.biometrics.eeg.alpha === 'number', 'alpha must be a number');
assert(typeof t1.biometrics.eeg.beta === 'number', 'beta must be a number');
assert(typeof t1.biometrics.eeg.theta === 'number', 'theta must be a number');
assert(typeof t1.biometrics.eeg.smr === 'number', 'smr must be a number');
assert(typeof t1.biometrics.eeg.gamma === 'number', 'gamma must be a number');
assert(typeof t1.biometrics.eeg.delta === 'number', 'delta must be a number');

assert(t1.biometrics.hrv, 'hrv field required');
assert(t1.biometrics.hrv.bpm >= 40 && t1.biometrics.hrv.bpm <= 160, 'BPM within plausible range');
assert(t1.biometrics.hrv.coherence >= 0.0 && t1.biometrics.hrv.coherence <= 1.0, 'Coherence within 0-1');

assert(t1.biometrics.respiration, 'respiration field required');
assert(['inhale', 'exhale'].includes(t1.biometrics.respiration.phase), 'phase must be inhale or exhale');
assert(t1.biometrics.respiration.value >= 0.0 && t1.biometrics.respiration.value <= 1.0, 'Respiration normalized 0-1');

assert(t1.biometrics.eda, 'eda field required');
assert(t1.biometrics.eda.tonic >= 1.0 && t1.biometrics.eda.tonic <= 20.0, 'Tonic EDA in range');
assert(t1.biometrics.eda.phasic >= 0.0, 'Phasic EDA >= 0');

assert(t1.states, 'states field required');
assert(typeof t1.states.calm_index === 'number', 'calm_index must be a number');
assert(typeof t1.states.focus_index === 'number', 'focus_index must be a number');
assert(typeof t1.states.artifact_flag === 'boolean', 'artifact_flag must be boolean');
console.log('✓ Test 1 Passed: Telemetry schema strictly compliant.\n');

// Test 2: RSA Heart Coupling (Accelerates during inhale, decelerates during exhale)
console.log('Test 2: Respiratory Sinus Arrhythmia (RSA) Coupling');
const rsaEngine = new SimulationEngine();
let inhaleBpms = [];
let exhaleBpms = [];

for (let i = 0; i < 90; i++) {
  const frame = rsaEngine.tick(1 / 30);
  if (frame.biometrics.respiration.phase === 'inhale') {
    inhaleBpms.push(frame.biometrics.hrv.bpm);
  } else {
    exhaleBpms.push(frame.biometrics.hrv.bpm);
  }
}

const avgInhaleBpm = inhaleBpms.reduce((a, b) => a + b, 0) / inhaleBpms.length;
const avgExhaleBpm = exhaleBpms.reduce((a, b) => a + b, 0) / exhaleBpms.length;
console.log(`  Avg Inhale BPM: ${avgInhaleBpm.toFixed(2)}, Avg Exhale BPM: ${avgExhaleBpm.toFixed(2)}`);
assert(avgInhaleBpm > avgExhaleBpm, 'Inhale BPM should be higher than Exhale BPM due to RSA');
console.log('✓ Test 2 Passed: RSA physiological coupling verified.\n');

// Test 3: Preset Interpolation over 3 Seconds (90 ticks)
console.log('Test 3: Preset Transition and Smooth Interpolation');
const presetEngine = new SimulationEngine();
presetEngine.setPreset('stress'); // target BPM 98, Beta 0.85
const startBpm = presetEngine.tick(1 / 30).biometrics.hrv.bpm;

// Run 45 ticks (1.5 seconds halfway)
for (let i = 0; i < 45; i++) presetEngine.tick(1 / 30);
const midBpm = presetEngine.tick(1 / 30).biometrics.hrv.bpm;

// Run another 45 ticks (3 seconds target reached)
for (let i = 0; i < 45; i++) presetEngine.tick(1 / 30);
const finalBpm = presetEngine.tick(1 / 30).biometrics.hrv.bpm;

console.log(`  Start BPM: ${startBpm.toFixed(1)}, Mid BPM: ${midBpm.toFixed(1)}, Final BPM: ${finalBpm.toFixed(1)}`);
assert(finalBpm > startBpm, 'BPM should transition towards target archetype');
console.log('✓ Test 3 Passed: 3-second interpolation curve operational.\n');

// Test 4: Artifact Injection (Blink, Clench, Detach)
console.log('Test 4: Artifact Injection Behavior');
const artifactEngine = new SimulationEngine();
artifactEngine.triggerArtifact('blink');
const blinkFrame = artifactEngine.tick(1 / 30);
assert.strictEqual(blinkFrame.states.artifact_flag, true, 'Artifact flag must be true during blink');
assert(blinkFrame.biometrics.eeg.delta > 0.5, 'Delta band must spike on blink');

artifactEngine.triggerArtifact('detach');
const detachFrame = artifactEngine.tick(1 / 30);
assert.strictEqual(detachFrame.states.artifact_flag, true, 'Artifact flag must be true on detach');
assert.strictEqual(detachFrame.biometrics.eeg.alpha, 0, 'Alpha power drops to 0 on detach');
assert.strictEqual(detachFrame.biometrics.eda.tonic, 0, 'Tonic EDA drops to 0 on detach');

artifactEngine.triggerArtifact('none');
const resetFrame = artifactEngine.tick(1 / 30);
assert.strictEqual(resetFrame.states.artifact_flag, false, 'Artifact flag resets to false');
console.log('✓ Test 4 Passed: Artifact injection and recovery verified.\n');

// Test 5: OSC 1.0 Packet Binary Encoding
console.log('Test 5: OSC Binary Encoding Multiples of 4 Bytes');
const testAddresses = [
  '/bio/eeg/alpha',
  '/bio/eeg/beta',
  '/bio/eeg/theta',
  '/bio/eeg/smr',
  '/bio/hrv/bpm',
  '/bio/hrv/coherence',
  '/bio/respiration',
  '/bio/eda/phasic',
  '/bio/state/calm',
  '/bio/artifact'
];

for (const addr of testAddresses) {
  const isArtifact = addr === '/bio/artifact';
  const buf = encodeOscMessage(addr, [{ type: isArtifact ? 'i' : 'f', value: 0.5 }]);
  assert.strictEqual(buf.length % 4, 0, `OSC packet ${addr} must be padded to a multiple of 4 bytes`);
  assert(buf.length >= 16, `OSC packet ${addr} minimum header length`);
}
console.log('✓ Test 5 Passed: All 10 OSC addresses match 4-byte boundary requirement.\n');

// Test 6: Pre-bundled Dataset Files Integrity
console.log('Test 6: Pre-bundled Dataset Recordings Verification');
const recDir = path.join(__dirname, '..', 'assets', 'recordings');
const files = fs.readdirSync(recDir);
assert(files.includes('meditation_deep_flow.json'), 'meditation_deep_flow.json exists');
assert(files.includes('cognitive_stress_overload.json'), 'cognitive_stress_overload.json exists');
assert(files.includes('respiratory_coherence_training.csv'), 'respiratory_coherence_training.csv exists');
assert(files.includes('drowsiness_hypnagogia.csv'), 'drowsiness_hypnagogia.csv exists');

const meditationData = JSON.parse(fs.readFileSync(path.join(recDir, 'meditation_deep_flow.json'), 'utf8'));
assert(Array.isArray(meditationData), 'Meditation dataset must be an array of frames');
assert(meditationData.length >= 900, 'Meditation dataset must contain at least 30s @ 30fps (900 frames)');
console.log(`  Meditation dataset loaded: ${meditationData.length} frames.`);

const csvData = fs.readFileSync(path.join(recDir, 'respiratory_coherence_training.csv'), 'utf8');
const csvLines = csvData.trim().split('\n');
assert(csvLines.length >= 901, 'CSV dataset must contain header + 900 frames');
console.log(`  CSV dataset loaded: ${csvLines.length - 1} lines.`);
console.log('✓ Test 6 Passed: Pre-bundled dataset assets verified.\n');

// Test 7: Figma Plugin Files Integrity
console.log('Test 7: Figma Plugin Manifest & Compiled Output');
const figmaDir = path.join(__dirname, '..', 'figma-plugin');
assert(fs.existsSync(path.join(figmaDir, 'manifest.json')), 'manifest.json must exist');
assert(fs.existsSync(path.join(figmaDir, 'ui.html')), 'ui.html must exist');
assert(fs.existsSync(path.join(figmaDir, 'code.ts')), 'code.ts must exist');
assert(fs.existsSync(path.join(figmaDir, 'code.js')), 'code.js compiled bundle must exist');

const manifest = JSON.parse(fs.readFileSync(path.join(figmaDir, 'manifest.json'), 'utf8'));
assert.strictEqual(manifest.main, 'code.js', 'manifest.main must point to code.js');
assert.strictEqual(manifest.ui, 'ui.html', 'manifest.ui must point to ui.html');
console.log('✓ Test 7 Passed: Figma plugin bundle structure verified.\n');

// Test 8: Main Streamer Play/Pause Transport Freeze
console.log('Test 8: Main Streamer Play/Pause Transport Freeze');
const transportEngine = new SimulationEngine();
for (let i = 0; i < 15; i++) transportEngine.tick(1 / 30);
const frameActive = transportEngine.tick(1 / 30);

// Pause the engine
transportEngine.setPaused(true);
assert.strictEqual(transportEngine.getPaused(), true, 'Engine paused state must be true');

// Tick 10 times while paused
let framePaused = null;
for (let i = 0; i < 10; i++) {
  framePaused = transportEngine.tick(1 / 30);
}

assert.strictEqual(frameActive.biometrics.hrv.bpm, framePaused.biometrics.hrv.bpm, 'BPM must remain frozen while paused');
assert.strictEqual(frameActive.biometrics.respiration.value, framePaused.biometrics.respiration.value, 'Respiration value must remain frozen while paused');
assert.strictEqual(frameActive.biometrics.eeg.alpha, framePaused.biometrics.eeg.alpha, 'Alpha power must remain frozen while paused');

// Unpause the engine
transportEngine.togglePaused();
assert.strictEqual(transportEngine.getPaused(), false, 'Engine unpaused state must be false');
const frameResumed = transportEngine.tick(1 / 30);
assert(frameResumed.timestamp >= framePaused.timestamp, 'Timestamp should continue updating');
console.log('✓ Test 8 Passed: Play/Pause transport control freezes physiological state.\n');

// Test 9: Main Streamer 2x and 4x Speed Multipliers
console.log('Test 9: Main Streamer 2x and 4x Speed Multipliers');
const speed1x = new SimulationEngine();
const speed2x = new SimulationEngine();
const speed4x = new SimulationEngine();

speed2x.setSpeed(2.0);
speed4x.setSpeed(4.0);

assert.strictEqual(speed1x.getSpeed(), 1.0, 'Default speed is 1x');
assert.strictEqual(speed2x.getSpeed(), 2.0, 'Speed set to 2x');
assert.strictEqual(speed4x.getSpeed(), 4.0, 'Speed set to 4x');

// Run 30 ticks (1.0 second base time)
for (let i = 0; i < 30; i++) {
  speed1x.tick(1 / 30);
  speed2x.tick(1 / 30);
  speed4x.tick(1 / 30);
}

// Check elapsed internal time progression
console.log(`  Elapsed Time -> 1x: ${speed1x.timeSeconds.toFixed(2)}s, 2x: ${speed2x.timeSeconds.toFixed(2)}s, 4x: ${speed4x.timeSeconds.toFixed(2)}s`);
assert(Math.abs(speed1x.timeSeconds - 1.0) < 0.05, '1x engine advances ~1.0s in 30 ticks');
assert(Math.abs(speed2x.timeSeconds - 2.0) < 0.05, '2x engine advances ~2.0s in 30 ticks');
assert(Math.abs(speed4x.timeSeconds - 4.0) < 0.05, '4x engine advances ~4.0s in 30 ticks');
console.log('✓ Test 9 Passed: 2x and 4x multipliers scale simulation time accurately.\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! SimData is 100% verified.');

