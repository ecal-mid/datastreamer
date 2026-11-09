/**
 * SimData Bridge Server
 * - WebSocket Server on ws://127.0.0.1:8080 (serves 30Hz telemetry to Figma, Web, TouchDesigner)
 * - OSC UDP Client to 127.0.0.1:9000 (serves Max/MSP, Pure Data, TouchDesigner OSC In CHOP)
 * - 30 Hz internal ticker with Generative simulation, Presets, Overrides, and Dataset Playback.
 */

const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { encodeOscMessage } = require('./oscEncoder.cjs');

// Port configurations
const WS_PORT = 8080;
const OSC_HOST = '127.0.0.1';
const OSC_PORT = 9000;
const TICK_RATE_HZ = 30;
const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ; // ~33.33ms

// 1D Perlin / Organic Noise Generator
class OrganicNoise {
  constructor(seed = 42) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x) {
    const h = hash & 15;
    const grad = 1.0 + (h & 7);
    return (h & 8) ? -grad * x : grad * x;
  }

  noise1D(x) {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);
    const g0 = this.grad(this.perm[X], x);
    const g1 = this.grad(this.perm[X + 1], x - 1);
    return this.lerp(u, g0, g1) * 0.25;
  }
}

const PRESETS = {
  baseline: {
    name: 'Baseline / Neutral',
    targetBpm: 70,
    respRate: 0.16,
    alpha: 0.50,
    beta: 0.35,
    theta: 0.30,
    smr: 0.40,
    gamma: 0.15,
    delta: 0.25,
    coherence: 0.50,
    tonicEda: 5.0,
    phasicFreq: 0.05,
    calmIndex: 0.55,
    focusIndex: 0.50,
  },
  meditation: {
    name: 'Deep Meditation / Flow',
    targetBpm: 60,
    respRate: 0.10,
    alpha: 0.85,
    beta: 0.15,
    theta: 0.60,
    smr: 0.70,
    gamma: 0.08,
    delta: 0.40,
    coherence: 0.85,
    tonicEda: 3.2,
    phasicFreq: 0.01,
    calmIndex: 0.88,
    focusIndex: 0.72,
  },
  stress: {
    name: 'Cognitive Stress / Overload',
    targetBpm: 98,
    respRate: 0.30,
    alpha: 0.15,
    beta: 0.85,
    theta: 0.20,
    smr: 0.25,
    gamma: 0.65,
    delta: 0.15,
    coherence: 0.20,
    tonicEda: 11.5,
    phasicFreq: 0.40,
    calmIndex: 0.15,
    focusIndex: 0.45,
  },
  drowsiness: {
    name: 'Drowsiness / Hypnagogia',
    targetBpm: 54,
    respRate: 0.08,
    alpha: 0.30,
    beta: 0.10,
    theta: 0.80,
    smr: 0.20,
    gamma: 0.05,
    delta: 0.65,
    coherence: 0.45,
    tonicEda: 2.1,
    phasicFreq: 0.005,
    calmIndex: 0.70,
    focusIndex: 0.18,
  }
};

class SimulationEngine {
  constructor() {
    this.mode = 'generative';
    this.timeSeconds = 0;
    this.noise = new OrganicNoise(1337);

    this.currentParams = { ...PRESETS.baseline };
    this.targetParams = { ...PRESETS.baseline };
    this.interpolationDuration = 3.0;
    this.interpolationElapsed = 3.0;

    this.respPhase = 0;
    this.prevRespSin = 0;

    this.phasicSpike = 0;
    this.phasicRising = false;
    this.phasicTimer = 0;
    this.phasicTargetAmp = 0;

    this.overrides = {
      enabled: {},
      values: {
        bpm: 72,
        respRate: 0.1,
        coherence: 0.65,
        alpha: 0.5,
        beta: 0.3,
        theta: 0.3,
        smr: 0.4,
        gamma: 0.15,
        delta: 0.2,
        tonicEda: 5.0,
      }
    };

    this.artifact = {
      active: false,
      type: 'none',
      remainingMs: 0,
      totalMs: 0,
    };

    // Stream Transport States
    this.isPaused = false;
    this.speed = 1.0;
    this.lastFrame = null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  setPaused(paused) {
    this.isPaused = Boolean(paused);
  }

  getPaused() {
    return this.isPaused;
  }

  togglePaused() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(10.0, Number(speed) || 1.0));
  }

  getSpeed() {
    return this.speed;
  }

  setPreset(archetype) {
    const target = PRESETS[archetype];
    if (!target) return;
    this.mode = 'preset';
    this.targetParams = { ...target };
    this.interpolationDuration = 3.0; // 3 second transition
    this.interpolationElapsed = 0.0;
  }

  setOverrides(overrides) {
    if (overrides.enabled) Object.assign(this.overrides.enabled, overrides.enabled);
    if (overrides.values) Object.assign(this.overrides.values, overrides.values);
  }

  triggerArtifact(type) {
    if (type === 'none') {
      this.artifact = { active: false, type: 'none', remainingMs: 0, totalMs: 0 };
      return;
    }
    let durationMs = 1000;
    if (type === 'blink') durationMs = 200;
    else if (type === 'clench') durationMs = 1500;
    else if (type === 'detach') durationMs = 5000;

    this.artifact = {
      active: true,
      type,
      remainingMs: durationMs,
      totalMs: durationMs,
    };

    if (type === 'clench') this.triggerPhasicSpike(1.8);
  }

  triggerPhasicSpike(amp) {
    this.phasicTargetAmp = amp || (0.8 + Math.random() * 1.5);
    this.phasicRising = true;
    this.phasicTimer = 0;
  }

  tick(dt = 1 / 30) {
    if (this.isPaused && this.lastFrame) {
      return {
        ...this.lastFrame,
        timestamp: Date.now(),
      };
    }

    const effectiveDt = dt * this.speed;
    this.timeSeconds += effectiveDt;

    if (this.interpolationElapsed < this.interpolationDuration) {
      this.interpolationElapsed += effectiveDt;
      const t = Math.min(1.0, this.interpolationElapsed / this.interpolationDuration);
      const smoothT = t * t * (3 - 2 * t);
      const cur = this.currentParams;
      const tgt = this.targetParams;
      const lerp = (a, b) => a + smoothT * (b - a);
      for (const k of Object.keys(tgt)) {
        if (typeof tgt[k] === 'number') cur[k] = lerp(cur[k], tgt[k]);
      }
    }

    if (this.artifact.active && this.artifact.type !== 'detach') {
      this.artifact.remainingMs -= effectiveDt * 1000;
      if (this.artifact.remainingMs <= 0) {
        this.artifact.active = false;
        this.artifact.type = 'none';
      }
    }

    // Respiration
    const respRate = this.overrides.enabled.respRate
      ? this.overrides.values.respRate
      : this.currentParams.respRate;
    const respDrift = this.noise.noise1D(this.timeSeconds * 0.15) * 0.08;
    this.respPhase += (respRate + respDrift) * effectiveDt * Math.PI * 2;
    const respSin = Math.sin(this.respPhase);
    const phase = (respSin - this.prevRespSin) >= 0 ? 'inhale' : 'exhale';
    this.prevRespSin = respSin;
    const respValueRaw = Math.max(-1.0, Math.min(1.0, respSin));
    const respValueNormalized = Number(((respValueRaw + 1.0) / 2.0).toFixed(3));

    // Coherence
    const coherenceBase = this.overrides.enabled.coherence
      ? this.overrides.values.coherence
      : this.currentParams.coherence;
    const coherenceDrift = this.noise.noise1D(this.timeSeconds * 0.05 + 10) * 0.05;
    const coherence = Math.max(0.0, Math.min(1.0, Number((coherenceBase + coherenceDrift).toFixed(3))));

    // Heart Rate & RSA coupling
    const baseBpm = this.overrides.enabled.bpm
      ? this.overrides.values.bpm
      : this.currentParams.targetBpm;
    const rsaAmplitude = 4.0 + coherence * 10.0;
    const rsaModulation = respSin * (rsaAmplitude / 2.0);
    const bpmOrganicNoise = this.noise.noise1D(this.timeSeconds * 0.2 + 20) * 1.5;
    const bpm = Number(Math.max(40, Math.min(160, baseBpm + rsaModulation + bpmOrganicNoise)).toFixed(1));
    const rmssd = Number(Math.max(15, Math.min(120, 25 + coherence * 55)).toFixed(1));

    // EEG Bands
    const t = this.timeSeconds;
    const calcBand = (base, ovVal, isOv, offset, driftScale = 0.08) => {
      if (isOv && ovVal !== undefined) return ovVal;
      const drift = this.noise.noise1D(t * 0.25 + offset) * driftScale;
      return Number(Math.max(0.01, Math.min(1.0, base + drift)).toFixed(3));
    };

    const ov = this.overrides;
    const eeg = {
      delta: calcBand(this.currentParams.delta, ov.values.delta, ov.enabled.delta, 50, 0.06),
      theta: calcBand(this.currentParams.theta, ov.values.theta, ov.enabled.theta, 150, 0.08),
      alpha: calcBand(this.currentParams.alpha, ov.values.alpha, ov.enabled.alpha, 250, 0.09),
      smr:   calcBand(this.currentParams.smr, ov.values.smr, ov.enabled.smr, 350, 0.07),
      beta:  calcBand(this.currentParams.beta, ov.values.beta, ov.enabled.beta, 450, 0.08),
      gamma: calcBand(this.currentParams.gamma, ov.values.gamma, ov.enabled.gamma, 550, 0.05),
    };

    // EDA
    const baseTonic = this.overrides.enabled.tonicEda ? this.overrides.values.tonicEda : this.currentParams.tonicEda;
    const tonic = Number(Math.max(1.0, Math.min(20.0, baseTonic + this.noise.noise1D(t * 0.03 + 80) * 0.4)).toFixed(2));

    if (!this.phasicRising && this.phasicSpike <= 0.001) {
      if (Math.random() < this.currentParams.phasicFreq * effectiveDt) this.triggerPhasicSpike();
    }
    if (this.phasicRising) {
      this.phasicTimer += effectiveDt;
      const progress = Math.min(1.0, this.phasicTimer / 1.2);
      this.phasicSpike = this.phasicTargetAmp * Math.sin((progress * Math.PI) / 2);
      if (progress >= 1.0) {
        this.phasicRising = false;
        this.phasicTimer = 0;
      }
    } else if (this.phasicSpike > 0.001) {
      this.phasicSpike *= Math.exp(-0.5 * effectiveDt);
      if (this.phasicSpike < 0.001) this.phasicSpike = 0;
    }
    const eda = { tonic, phasic: Number(this.phasicSpike.toFixed(3)) };

    // Derived states
    let calmIndex = Number(Math.max(0.0, Math.min(1.0, 0.45 * eeg.alpha + 0.30 * coherence + 0.25 * (1.0 - eeg.beta) - (eda.phasic * 0.1))).toFixed(2));
    let focusIndex = Number(Math.max(0.0, Math.min(1.0, 0.35 * eeg.smr + 0.35 * eeg.beta + 0.15 * coherence + 0.15 * (1.0 - eeg.theta))).toFixed(2));

    let artifactFlag = false;
    if (this.artifact.active) {
      artifactFlag = true;
      if (this.artifact.type === 'blink') {
        const progress = 1.0 - (this.artifact.remainingMs / this.artifact.totalMs);
        const spike = Math.sin(progress * Math.PI) * 0.85;
        eeg.delta = Math.min(1.0, eeg.delta + spike);
        eeg.theta = Math.min(1.0, eeg.theta + spike * 0.8);
        eeg.alpha = Math.min(1.0, eeg.alpha + spike * 0.5);
      } else if (this.artifact.type === 'clench') {
        eeg.beta = Math.min(1.0, 0.90 + Math.random() * 0.10);
        eeg.gamma = Math.min(1.0, 0.95 + Math.random() * 0.05);
        calmIndex = Math.max(0.0, calmIndex - 0.4);
      } else if (this.artifact.type === 'detach') {
        eeg.delta = 0; eeg.theta = 0; eeg.alpha = 0; eeg.smr = 0; eeg.beta = 0; eeg.gamma = 0;
        eda.tonic = 0; eda.phasic = 0;
      }
    }

    const frame = {
      timestamp: Date.now(),
      mode: this.mode,
      biometrics: {
        eeg,
        hrv: { bpm, rmssd, coherence },
        respiration: { phase, value: respValueNormalized, rawSin: respValueRaw },
        eda,
      },
      states: {
        calm_index: calmIndex,
        focus_index: focusIndex,
        artifact_flag: artifactFlag,
      }
    };

    this.lastFrame = frame;
    return frame;
  }
}

// Server Lifecycle and Setup
function startSimDataServer(options = {}) {
  const wsPort = options.wsPort || WS_PORT;
  const oscPort = options.oscPort || OSC_PORT;
  const oscHost = options.oscHost || OSC_HOST;

  const engine = new SimulationEngine();

  // UDP OSC Socket
  const oscSocket = dgram.createSocket('udp4');
  let oscPacketCount = 0;

  // HTTP & WebSocket Server
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        wsPort,
        oscHost,
        oscPort,
        oscPacketCount,
        clientsCount: wss.clients.size,
        fps: TICK_RATE_HZ,
        isPaused: engine.getPaused(),
        speed: engine.getSpeed(),
      }));
      return;
    }

    if (req.url === '/api/download-figma-plugin') {
      const zipPath = path.join(__dirname, '..', 'figma-plugin', 'simdata-figma-plugin.zip');
      if (fs.existsSync(zipPath)) {
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="simdata-figma-plugin.zip"'
        });
        fs.createReadStream(zipPath).pipe(res);
        return;
      }
    }

    if (req.url === '/api/recordings') {
      const recDir = path.join(__dirname, '..', 'assets', 'recordings');
      let files = [];
      try {
        files = fs.readdirSync(recDir).filter(f => f.endsWith('.json') || f.endsWith('.csv'));
      } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
      return;
    }

    // Serve recordings content
    if (req.url.startsWith('/api/recordings/')) {
      const fileName = path.basename(req.url.replace('/api/recordings/', ''));
      const filePath = path.join(__dirname, '..', 'assets', 'recordings', fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, {
          'Content-Type': fileName.endsWith('.json') ? 'application/json' : 'text/csv'
        });
        res.end(content);
        return;
      }
    }

    // Serve built UI from dist/
    const distDir = path.join(__dirname, '..', 'dist');
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Fallback for SPA routing
    const indexHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexHtml).pipe(res);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>SimData Bridge Server Running</h1><p>WebSocket on ws://127.0.0.1:8080, OSC on 127.0.0.1:9000</p>');
  });

  const wss = new WebSocketServer({ server });

  function broadcastControlState() {
    const ctrlPayload = JSON.stringify({
      type: 'CONTROL_STATE',
      isPaused: engine.getPaused(),
      speed: engine.getSpeed(),
    });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(ctrlPayload);
      }
    }
  }

  wss.on('connection', (ws) => {
    // Send immediate initial status
    ws.send(JSON.stringify({
      type: 'SIMDATA_INIT',
      status: 'connected',
      ports: { ws: wsPort, osc: oscPort },
      isPaused: engine.getPaused(),
      speed: engine.getSpeed(),
    }));

    ws.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'SET_MODE') {
          engine.setMode(payload.mode);
        } else if (payload.type === 'SET_PRESET') {
          engine.setPreset(payload.preset);
        } else if (payload.type === 'SET_OVERRIDES') {
          engine.setOverrides(payload.overrides);
        } else if (payload.type === 'TRIGGER_ARTIFACT') {
          engine.triggerArtifact(payload.artifact);
        } else if (payload.type === 'SET_PAUSED') {
          engine.setPaused(payload.paused);
          broadcastControlState();
        } else if (payload.type === 'TOGGLE_PLAY') {
          engine.togglePaused();
          broadcastControlState();
        } else if (payload.type === 'SET_SPEED') {
          engine.setSpeed(payload.speed);
          broadcastControlState();
        }
      } catch (err) {
        // Ignore malformed messages
      }
    });
  });

  // 30 Hz Simulation Loop
  const timer = setInterval(() => {
    const telemetry = engine.tick(1 / TICK_RATE_HZ);

    // 1. Prepare JSON payload matching specification:
    // Notice respiration.value in JSON is 0.0 - 1.0, while rawSin is -1.0 to 1.0 for OSC
    const respSin = telemetry.biometrics.respiration.rawSin ?? 0;
    const jsonPayload = {
      timestamp: telemetry.timestamp,
      mode: telemetry.mode,
      biometrics: {
        eeg: {
          alpha: telemetry.biometrics.eeg.alpha,
          beta: telemetry.biometrics.eeg.beta,
          theta: telemetry.biometrics.eeg.theta,
          smr: telemetry.biometrics.eeg.smr,
          gamma: telemetry.biometrics.eeg.gamma,
        },
        hrv: {
          bpm: telemetry.biometrics.hrv.bpm,
          rmssd: telemetry.biometrics.hrv.rmssd,
          coherence: telemetry.biometrics.hrv.coherence,
        },
        respiration: {
          phase: telemetry.biometrics.respiration.phase,
          value: telemetry.biometrics.respiration.value,
        },
        eda: {
          tonic: telemetry.biometrics.eda.tonic,
          phasic: telemetry.biometrics.eda.phasic,
        }
      },
      states: {
        calm_index: telemetry.states.calm_index,
        focus_index: telemetry.states.focus_index,
        artifact_flag: telemetry.states.artifact_flag,
      }
    };

    const strJson = JSON.stringify(jsonPayload);

    // Broadcast to all active WebSocket clients
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(strJson);
      }
    }

    // 2. Transmit OSC UDP packets to 127.0.0.1:9000
    // Semantic Address Tree:
    // /bio/eeg/alpha [float 0.0 - 1.0]
    // /bio/eeg/beta [float 0.0 - 1.0]
    // /bio/eeg/theta [float 0.0 - 1.0]
    // /bio/eeg/smr [float 0.0 - 1.0]
    // /bio/hrv/bpm [float]
    // /bio/hrv/coherence [float 0.0 - 1.0]
    // /bio/respiration [float -1.0 to 1.0]
    // /bio/eda/phasic [float]
    // /bio/state/calm [float 0.0 - 1.0]
    // /bio/artifact [int 0 or 1]
    const oscMessages = [
      encodeOscMessage('/bio/eeg/alpha', [{ type: 'f', value: telemetry.biometrics.eeg.alpha }]),
      encodeOscMessage('/bio/eeg/beta', [{ type: 'f', value: telemetry.biometrics.eeg.beta }]),
      encodeOscMessage('/bio/eeg/theta', [{ type: 'f', value: telemetry.biometrics.eeg.theta }]),
      encodeOscMessage('/bio/eeg/smr', [{ type: 'f', value: telemetry.biometrics.eeg.smr }]),
      encodeOscMessage('/bio/hrv/bpm', [{ type: 'f', value: telemetry.biometrics.hrv.bpm }]),
      encodeOscMessage('/bio/hrv/coherence', [{ type: 'f', value: telemetry.biometrics.hrv.coherence }]),
      encodeOscMessage('/bio/respiration', [{ type: 'f', value: respSin }]),
      encodeOscMessage('/bio/eda/phasic', [{ type: 'f', value: telemetry.biometrics.eda.phasic }]),
      encodeOscMessage('/bio/state/calm', [{ type: 'f', value: telemetry.states.calm_index }]),
      encodeOscMessage('/bio/artifact', [{ type: 'i', value: telemetry.states.artifact_flag ? 1 : 0 }]),
    ];

    for (const msgBuf of oscMessages) {
      oscSocket.send(msgBuf, 0, msgBuf.length, oscPort, oscHost, (err) => {
        if (!err) oscPacketCount++;
      });
    }
  }, TICK_INTERVAL_MS);

  server.listen(wsPort, () => {
    console.log(`[SimData] WebSocket server listening on port ${wsPort} (IPv4 & IPv6 dual-stack)`);
    console.log(`[SimData] OSC streaming UDP packets to ${oscHost}:${oscPort}`);
  });

  return {
    server,
    wss,
    oscSocket,
    stop: () => {
      clearInterval(timer);
      wss.close();
      server.close();
      oscSocket.close();
    }
  };
}

module.exports = {
  startSimDataServer,
  startSimBioServer: startSimDataServer, // backwards compatibility alias
  SimulationEngine,
  PRESETS,
};

if (require.main === module) {
  startSimDataServer();
}
