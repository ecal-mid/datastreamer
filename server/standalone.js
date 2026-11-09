#!/usr/bin/env node
/**
 * SimData Standalone Server Runner
 * Zero-config entry point: launches the WebSocket, OSC, and Web UI server.
 */

const { startSimDataServer } = require('./bioServer.cjs');

console.log('=====================================================');
console.log('  SIMDATA — Biofeedback & Neurofeedback Simulator    ');
console.log('=====================================================');

const bridge = startSimDataServer({
  wsPort: 8080,
  oscPort: 9000,
  oscHost: '127.0.0.1'
});

console.log('🌐 Web UI & WebSocket:  http://127.0.0.1:8080');
console.log('📡 OSC Output (UDP):    127.0.0.1:9000');
console.log('🎨 Figma Plugin:        ./figma-plugin/manifest.json');
console.log('⏱️  Tick Rate:           30 Hz internal ticker');
console.log('Press Ctrl+C to terminate.');

process.on('SIGINT', () => {
  console.log('\n[SimData] Shutting down gracefully...');
  bridge.stop();
  process.exit(0);
});
