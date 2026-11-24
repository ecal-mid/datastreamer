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
const WS_PORT = Number(process.env.PORT || process.env.WS_PORT) || 8081;
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
    this.currentPresetName = 'Baseline / Neutral';

    // Dataset Playback State
    this.datasetFrames = [];
    this.datasetIndex = 0;
    this.datasetAccumulator = 0;
    this.datasetName = '';

    // Playlist / Scenario State
    this.playlist = null;
    this.playlistStepIndex = 0;
    this.playlistStepElapsed = 0;
    this.playlistTotalElapsed = 0;
    this.isTransitioning = false;
    this.transitionElapsed = 0;
    this.transitionFromFrame = null;
    this.recordingsResolver = null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  classifyBiometricState(eeg, hrv) {
    const beta = eeg?.beta ?? 0.3;
    const alpha = eeg?.alpha ?? 0.5;
    const theta = eeg?.theta ?? 0.3;
    const coherence = hrv?.coherence ?? 0.5;

    if (beta > 0.60 && coherence < 0.40) return 'Cognitive Stress / Overload';
    if (alpha > 0.65 && coherence > 0.65) return 'Deep Meditation / Flow';
    if (theta > 0.60 && beta < 0.25) return 'Drowsiness / Hypnagogia';
    if (coherence > 0.75) return 'Cardiorespiratory Coherence';
    if (beta > 0.50) return 'Active Focus / Processing';
    return 'Baseline / Neutral';
  }

  deriveStateName(telemetry) {
    if (this.mode === 'preset') {
      return this.currentPresetName || this.targetParams?.name || 'Baseline / Neutral';
    }
    if (this.mode === 'playlist') {
      const step = this.playlist?.steps?.[this.playlistStepIndex];
      if (step?.name) {
        return step.name;
      }
      if (step?.recordingFile) {
        const lower = step.recordingFile.toLowerCase();
        if (lower.includes('meditation') || lower.includes('flow')) return 'Deep Meditation / Flow';
        if (lower.includes('stress') || lower.includes('overload')) return 'Cognitive Stress / Overload';
        if (lower.includes('coherence')) return 'Cardiorespiratory Coherence';
        if (lower.includes('drowsiness') || lower.includes('hypnagogia')) return 'Drowsiness / Hypnagogia';
      }
    }
    if (this.mode === 'playback') {
      const name = this.datasetName || '';
      const lower = name.toLowerCase();
      if (lower.includes('meditation') || lower.includes('flow')) return 'Deep Meditation / Flow';
      if (lower.includes('stress') || lower.includes('overload')) return 'Cognitive Stress / Overload';
      if (lower.includes('coherence')) return 'Cardiorespiratory Coherence';
      if (lower.includes('drowsiness') || lower.includes('hypnagogia')) return 'Drowsiness / Hypnagogia';
      if (lower.includes('muse')) return 'Muse EEG Session';
      if (lower.includes('wesad')) return 'WESAD Biometric Session';
    }
    return this.classifyBiometricState(telemetry?.biometrics?.eeg, telemetry?.biometrics?.hrv);
  }

  deriveStageName(telemetry) {
    if (this.mode === 'playlist') {
      const step = this.playlist?.steps?.[this.playlistStepIndex];
      const stepNum = this.playlistStepIndex + 1;
      const totalSteps = this.playlist?.steps?.length || 1;
      return step?.name ? `Stage ${stepNum}/${totalSteps}: ${step.name}` : `Stage ${stepNum}/${totalSteps}`;
    }
    if (this.mode === 'playback') {
      return this.datasetName ? `Playback: ${this.datasetName}` : 'Dataset Playback';
    }
    if (this.mode === 'preset') {
      return `Preset: ${this.currentPresetName || 'Baseline'}`;
    }
    return 'Generative Live';
  }

  loadDataset(name, contentOrParsed) {
    try {
      let frames = [];
      if (typeof contentOrParsed === 'string') {
        if (name.endsWith('.json')) {
          frames = JSON.parse(contentOrParsed);
        } else {
          frames = this.parseCsvFrames(contentOrParsed);
        }
      } else if (Array.isArray(contentOrParsed)) {
        frames = contentOrParsed;
      }
      if (Array.isArray(frames) && frames.length > 0) {
        this.datasetFrames = frames;
        this.datasetName = name;
        this.datasetIndex = 0;
        this.datasetAccumulator = 0;
        this.lastFrame = {
          ...frames[0],
          mode: 'playback',
          timestamp: Date.now(),
        };
        return { success: true, frameCount: frames.length };
      }
    } catch (e) {
      console.error('[SimulationEngine] Error loading dataset:', e);
    }
    return { success: false };
  }

  parseCsvFrames(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const frames = [];

    const getNum = (row, keys, fallback) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') {
          const v = parseFloat(row[k]);
          if (!isNaN(v)) return v;
        }
      }
      return fallback;
    };

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) continue;
      const row = {};
      headers.forEach((col, idx) => {
        if (idx < parts.length) row[col] = parts[idx];
      });

      const bpm = getNum(row, ['bpm', 'heart_rate', 'heartrate', 'hr', 'pulse'], 70);
      const rmssd = getNum(row, ['rmssd', 'hrv'], 50);
      const coherence = getNum(row, ['coherence', 'coh', 'rsa_coherence'], 0.5);
      const respVal = getNum(row, ['respiration_value', 'respiration', 'resp', 'breath', 'breathing'], 0.5);
      const respPhaseRaw = (row['respiration_phase'] || row['phase'] || '').toLowerCase();
      const respPhase = respPhaseRaw === 'exhale' ? 'exhale' : 'inhale';

      const alpha = getNum(row, ['alpha', 'eeg_alpha'], 0.5);
      const beta = getNum(row, ['beta', 'eeg_beta'], 0.25);
      const theta = getNum(row, ['theta', 'eeg_theta'], 0.35);
      const smr = getNum(row, ['smr', 'eeg_smr'], 0.45);
      const gamma = getNum(row, ['gamma', 'eeg_gamma'], 0.1);
      const delta = getNum(row, ['delta', 'eeg_delta'], 0.25);

      const tonicEda = getNum(row, ['tonic_eda', 'tonic', 'eda', 'gsr'], 5.0);
      const phasicEda = getNum(row, ['phasic_eda', 'phasic', 'scr'], 0.0);

      const calmIndex = getNum(row, ['calm_index', 'calm', 'relaxation', 'valence'], 0.5);
      const focusIndex = getNum(row, ['focus_index', 'focus', 'attention', 'engagement'], 0.5);
      const artifactRaw = row['artifact'] || row['artifact_flag'] || row['noise'] || '0';
      const isArtifact = artifactRaw === '1' || artifactRaw === 'true';
      const rowState = row['state_name'] || row['condition'] || row['label'] || '';

      frames.push({
        timestamp: Date.now() + i * 33,
        mode: 'playback',
        biometrics: {
          eeg: { alpha, beta, theta, smr, gamma, delta },
          hrv: { bpm, rmssd, coherence },
          respiration: { phase: respPhase, value: respVal, rawSin: (respVal * 2) - 1 },
          eda: { tonic: tonicEda, phasic: phasicEda },
        },
        states: {
          state_name: rowState || this.classifyBiometricState({ alpha, beta, theta }, { coherence }),
          stage_name: this.datasetName || 'Dataset Playback',
          calm_index: calmIndex,
          focus_index: focusIndex,
          artifact_flag: isArtifact,
        }
      });
    }
    return frames;
  }

  blendFrames(frameA, frameB, t) {
    if (!frameA) return frameB;
    if (!frameB) return frameA;
    const smoothT = t * t * (3 - 2 * t);
    const lerp = (a, b) => (typeof a === 'number' && typeof b === 'number') ? a + smoothT * (b - a) : (b !== undefined ? b : a);

    return {
      timestamp: Date.now(),
      mode: 'playlist',
      biometrics: {
        eeg: {
          alpha: Number(lerp(frameA.biometrics?.eeg?.alpha, frameB.biometrics?.eeg?.alpha).toFixed(3)),
          beta:  Number(lerp(frameA.biometrics?.eeg?.beta,  frameB.biometrics?.eeg?.beta).toFixed(3)),
          theta: Number(lerp(frameA.biometrics?.eeg?.theta, frameB.biometrics?.eeg?.theta).toFixed(3)),
          smr:   Number(lerp(frameA.biometrics?.eeg?.smr,   frameB.biometrics?.eeg?.smr).toFixed(3)),
          gamma: Number(lerp(frameA.biometrics?.eeg?.gamma, frameB.biometrics?.eeg?.gamma).toFixed(3)),
          delta: Number(lerp(frameA.biometrics?.eeg?.delta, frameB.biometrics?.eeg?.delta).toFixed(3)),
        },
        hrv: {
          bpm: Number(lerp(frameA.biometrics?.hrv?.bpm, frameB.biometrics?.hrv?.bpm).toFixed(1)),
          rmssd: Number(lerp(frameA.biometrics?.hrv?.rmssd, frameB.biometrics?.hrv?.rmssd).toFixed(1)),
          coherence: Number(lerp(frameA.biometrics?.hrv?.coherence, frameB.biometrics?.hrv?.coherence).toFixed(3)),
        },
        respiration: {
          phase: t < 0.5 ? (frameA.biometrics?.respiration?.phase || 'inhale') : (frameB.biometrics?.respiration?.phase || 'inhale'),
          value: Number(lerp(frameA.biometrics?.respiration?.value, frameB.biometrics?.respiration?.value).toFixed(3)),
        },
        eda: {
          tonic: Number(lerp(frameA.biometrics?.eda?.tonic, frameB.biometrics?.eda?.tonic).toFixed(2)),
          phasic: Number(lerp(frameA.biometrics?.eda?.phasic, frameB.biometrics?.eda?.phasic).toFixed(3)),
        }
      },
      states: {
        state_name: t < 0.5 ? (frameA.states?.state_name || 'Stage Transition') : (frameB.states?.state_name || 'Stage Transition'),
        stage_name: t < 0.5 ? (frameA.states?.stage_name || 'Transition') : (frameB.states?.stage_name || 'Transition'),
        calm_index: Number(lerp(frameA.states?.calm_index, frameB.states?.calm_index).toFixed(2)),
        focus_index: Number(lerp(frameA.states?.focus_index, frameB.states?.focus_index).toFixed(2)),
        artifact_flag: t > 0.5 ? Boolean(frameB.states?.artifact_flag) : Boolean(frameA.states?.artifact_flag),
      }
    };
  }

  setPlaylist(playlist, resolver = null) {
    this.playlist = playlist;
    this.mode = 'playlist';
    this.playlistStepIndex = 0;
    this.playlistStepElapsed = 0;
    this.playlistTotalElapsed = 0;
    this.isTransitioning = false;
    this.transitionElapsed = 0;
    this.transitionFromFrame = null;
    if (resolver) this.recordingsResolver = resolver;
    this.loadCurrentPlaylistStep();
  }

  loadCurrentPlaylistStep() {
    if (!this.playlist || !this.playlist.steps || this.playlist.steps.length === 0) return;
    const step = this.playlist.steps[this.playlistStepIndex];
    if (!step) return;

    if (this.recordingsResolver) {
      const content = this.recordingsResolver(step.recordingFile);
      if (content) {
        this.loadDataset(step.recordingFile, content);
      }
    }
  }

  nextPlaylistStep(resolver = null) {
    if (resolver) this.recordingsResolver = resolver;
    if (!this.playlist || !this.playlist.steps || this.playlist.steps.length === 0) return;
    const nextIdx = (this.playlistStepIndex + 1) % this.playlist.steps.length;
    this.seekPlaylistStep(nextIdx);
  }

  prevPlaylistStep(resolver = null) {
    if (resolver) this.recordingsResolver = resolver;
    if (!this.playlist || !this.playlist.steps || this.playlist.steps.length === 0) return;
    let prevIdx = this.playlistStepIndex - 1;
    if (prevIdx < 0) prevIdx = this.playlist.steps.length - 1;
    this.seekPlaylistStep(prevIdx);
  }

  seekPlaylistStep(index, resolver = null) {
    if (resolver) this.recordingsResolver = resolver;
    if (!this.playlist || !this.playlist.steps || this.playlist.steps.length === 0) return;
    const clamped = Math.max(0, Math.min(this.playlist.steps.length - 1, index));
    this.transitionFromFrame = this.lastFrame;
    this.playlistStepIndex = clamped;
    this.playlistStepElapsed = 0;
    this.loadCurrentPlaylistStep();

    if (this.playlist.transitionType === 'smooth' && (this.playlist.transitionDuration || 3.0) > 0) {
      this.isTransitioning = true;
      this.transitionElapsed = 0;
    } else {
      this.isTransitioning = false;
    }
  }

  setPlaybackFrame(frame) {
    this.mode = 'playback';
    this.lastFrame = frame;
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
    this.currentPresetName = target.name;
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

    if (this.mode === 'playback') {
      if (this.datasetFrames.length > 0) {
        this.datasetAccumulator += this.speed;
        const step = Math.floor(this.datasetAccumulator);
        if (step >= 1) {
          this.datasetAccumulator -= step;
          this.datasetIndex = (this.datasetIndex + step) % this.datasetFrames.length;
        }
        const raw = this.datasetFrames[this.datasetIndex];
        const frame = {
          ...raw,
          mode: 'playback',
          timestamp: Date.now(),
          states: {
            ...raw.states,
            state_name: raw.states?.state_name || this.deriveStateName(raw),
            stage_name: raw.states?.stage_name || this.deriveStageName(raw),
            calm_index: raw.states?.calm_index ?? 0.5,
            focus_index: raw.states?.focus_index ?? 0.5,
            artifact_flag: Boolean(raw.states?.artifact_flag),
          }
        };
        this.lastFrame = frame;
        return frame;
      } else if (this.lastFrame) {
        return {
          ...this.lastFrame,
          mode: 'playback',
          timestamp: Date.now(),
        };
      }
    }

    if (this.mode === 'playlist' && this.playlist && this.playlist.steps && this.playlist.steps.length > 0) {
      const effectiveDt = dt * this.speed;
      this.playlistStepElapsed += effectiveDt;
      this.playlistTotalElapsed += effectiveDt;

      const currentStep = this.playlist.steps[this.playlistStepIndex];
      const stepDuration = (currentStep && currentStep.durationSeconds > 0) ? currentStep.durationSeconds : 30;

      // Check if current step has finished
      if (this.playlistStepElapsed >= stepDuration) {
        const hasNext = (this.playlistStepIndex + 1 < this.playlist.steps.length) || this.playlist.loop;
        if (hasNext) {
          const nextIdx = (this.playlistStepIndex + 1) % this.playlist.steps.length;
          this.transitionFromFrame = this.lastFrame;
          this.playlistStepIndex = nextIdx;
          this.playlistStepElapsed = 0;
          this.loadCurrentPlaylistStep();

          if (this.playlist.transitionType === 'smooth' && (this.playlist.transitionDuration || 3.0) > 0) {
            this.isTransitioning = true;
            this.transitionElapsed = 0;
          }
        }
      }

      // Step frame from datasetFrames
      let stepFrame = null;
      if (this.datasetFrames.length > 0) {
        this.datasetAccumulator += this.speed;
        const step = Math.floor(this.datasetAccumulator);
        if (step >= 1) {
          this.datasetAccumulator -= step;
          this.datasetIndex = (this.datasetIndex + step) % this.datasetFrames.length;
        }
        stepFrame = this.datasetFrames[this.datasetIndex];
      }

      let frame = stepFrame ? { ...stepFrame, mode: 'playlist', timestamp: Date.now() } : (this.lastFrame ? { ...this.lastFrame, mode: 'playlist', timestamp: Date.now() } : null);

      // Crossfade transition blending
      const transitionDuration = this.playlist.transitionDuration || 3.0;
      if (this.isTransitioning && this.transitionFromFrame && frame) {
        this.transitionElapsed += effectiveDt;
        const t = Math.min(1.0, this.transitionElapsed / transitionDuration);
        frame = this.blendFrames(this.transitionFromFrame, frame, t);
        if (t >= 1.0) {
          this.isTransitioning = false;
        }
      }

      if (frame) {
        frame.states = {
          ...frame.states,
          state_name: frame.states?.state_name || this.deriveStateName(frame),
          stage_name: this.deriveStageName(frame),
        };
        const totalPlaylistSeconds = this.playlist.steps.reduce((acc, s) => acc + (s.durationSeconds || 30), 0);
        frame.playlist_state = {
          isActive: true,
          playlistId: this.playlist.id || '',
          playlistName: this.playlist.name || '',
          currentStepIndex: this.playlistStepIndex,
          totalSteps: this.playlist.steps.length,
          currentStepName: currentStep?.name || `Stage ${this.playlistStepIndex + 1}`,
          recordingFile: currentStep?.recordingFile || '',
          stepElapsedSeconds: Number(this.playlistStepElapsed.toFixed(1)),
          stepDurationSeconds: stepDuration,
          playlistElapsedSeconds: Number(this.playlistTotalElapsed.toFixed(1)),
          totalPlaylistSeconds,
          isTransitioning: this.isTransitioning,
          transitionProgress: this.isTransitioning ? Number((this.transitionElapsed / transitionDuration).toFixed(2)) : 0.0,
        };

        this.lastFrame = frame;
        return frame;
      }
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
        state_name: this.deriveStateName({ biometrics: { eeg, hrv: { bpm, rmssd, coherence } } }),
        stage_name: this.deriveStageName(),
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

  const bundledRecordingsDir = path.join(__dirname, '..', 'assets', 'recordings');
  const recordingsDir = options.recordingsDir || process.env.SIMDATA_RECORDINGS_DIR || bundledRecordingsDir;

  const bundledPlaylistsDir = path.join(__dirname, '..', 'assets', 'playlists');
  const playlistsDir = options.playlistsDir || process.env.SIMDATA_PLAYLISTS_DIR || bundledPlaylistsDir;

  const resolveRecordingContent = (filename) => {
    let p = path.join(recordingsDir, filename);
    if (!fs.existsSync(p) && recordingsDir !== bundledRecordingsDir) {
      p = path.join(bundledRecordingsDir, filename);
    }
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch (e) {}
    }
    return null;
  };

  const engine = new SimulationEngine();

  // Preload default dataset so engine is instantly ready for playback
  const defaultDatasetFile = 'meditation_deep_flow.json';
  let defaultDatasetPath = path.join(recordingsDir, defaultDatasetFile);
  if (!fs.existsSync(defaultDatasetPath) && recordingsDir !== bundledRecordingsDir) {
    defaultDatasetPath = path.join(bundledRecordingsDir, defaultDatasetFile);
  }
  if (fs.existsSync(defaultDatasetPath)) {
    try {
      const content = fs.readFileSync(defaultDatasetPath, 'utf8');
      engine.loadDataset(defaultDatasetFile, content);
    } catch (e) {
      console.warn('[SimData] Could not preload default dataset:', e.message);
    }
  }

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

    if (req.url === '/api/recordings' && req.method === 'GET') {
      const fileSet = new Set();
      if (fs.existsSync(recordingsDir)) {
        try {
          fs.readdirSync(recordingsDir)
            .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
            .forEach(f => fileSet.add(f));
        } catch (e) {}
      }
      if (recordingsDir !== bundledRecordingsDir && fs.existsSync(bundledRecordingsDir)) {
        try {
          fs.readdirSync(bundledRecordingsDir)
            .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
            .forEach(f => fileSet.add(f));
        } catch (e) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files: Array.from(fileSet) }));
      return;
    }

    // Upload a custom recording file (JSON or CSV)
    if (req.url === '/api/recordings' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 25 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large (max 25MB)' }));
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          let rawName = parsed.filename || `custom_recording_${Date.now()}.csv`;
          const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
          if (!safeName.endsWith('.json') && !safeName.endsWith('.csv')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File must have .json or .csv extension' }));
            return;
          }
          if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
          }
          const destPath = path.join(recordingsDir, safeName);
          fs.writeFileSync(destPath, parsed.content, 'utf8');

          const fileSet = new Set();
          if (fs.existsSync(recordingsDir)) {
            fs.readdirSync(recordingsDir)
              .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
              .forEach(f => fileSet.add(f));
          }
          if (recordingsDir !== bundledRecordingsDir && fs.existsSync(bundledRecordingsDir)) {
            fs.readdirSync(bundledRecordingsDir)
              .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
              .forEach(f => fileSet.add(f));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, filename: safeName, files: Array.from(fileSet) }));
        } catch (err) {
          console.error('[SimData] Error writing recording file:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write recording file: ' + err.message }));
        }
      });
      return;
    }

    // Playlists API: List all available scenarios
    if (req.url === '/api/playlists' && req.method === 'GET') {
      const playlistMap = new Map();
      const loadFromDir = (dir) => {
        if (fs.existsSync(dir)) {
          try {
            fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
              try {
                const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                if (data && data.steps && Array.isArray(data.steps)) {
                  playlistMap.set(data.id || f.replace('.json', ''), data);
                }
              } catch (e) {}
            });
          } catch (e) {}
        }
      };
      loadFromDir(bundledPlaylistsDir);
      loadFromDir(playlistsDir);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ playlists: Array.from(playlistMap.values()) }));
      return;
    }

    // Playlists API: Save custom scenario
    if (req.url === '/api/playlists' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const playlist = parsed.playlist || parsed;
          if (!playlist || !Array.isArray(playlist.steps)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid playlist object' }));
            return;
          }
          const id = (playlist.id || playlist.name || `playlist_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
          playlist.id = id;
          if (!fs.existsSync(playlistsDir)) {
            fs.mkdirSync(playlistsDir, { recursive: true });
          }
          const filePath = path.join(playlistsDir, `${id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(playlist, null, 2), 'utf8');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, playlist }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Download standardized blank CSV template
    if (req.url === '/api/recordings/template.csv') {
      const templateContent = [
        'timestamp,bpm,rmssd,coherence,respiration_phase,respiration_value,alpha,beta,theta,smr,gamma,delta,tonic_eda,phasic_eda,calm_index,focus_index,artifact',
        '1773072000000,72.0,55.0,0.65,inhale,0.50,0.50,0.25,0.30,0.40,0.15,0.20,5.00,0.01,0.60,0.50,0',
        '1773072000033,72.2,55.1,0.65,inhale,0.55,0.51,0.25,0.30,0.40,0.15,0.20,5.00,0.01,0.60,0.51,0',
        '1773072000067,72.5,55.2,0.66,inhale,0.60,0.52,0.24,0.30,0.40,0.15,0.20,4.99,0.01,0.61,0.51,0'
      ].join('\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="simdata_template.csv"'
      });
      res.end(templateContent);
      return;
    }

    // Serve recordings content
    if (req.url.startsWith('/api/recordings/')) {
      const fileName = path.basename(req.url.replace('/api/recordings/', ''));
      let filePath = path.join(recordingsDir, fileName);
      if (!fs.existsSync(filePath) && recordingsDir !== bundledRecordingsDir) {
        filePath = path.join(bundledRecordingsDir, fileName);
      }
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, {
          'Content-Type': fileName.endsWith('.json') ? 'application/json' : 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
        });
        res.end(content);
        return;
      }
    }

    // Serve sample datasets for testing importers (Muse & WESAD)
    if (req.url.startsWith('/api/samples/')) {
      const fileName = path.basename(req.url.replace('/api/samples/', ''));
      const filePath = path.join(__dirname, '..', 'assets', 'samples', fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
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
      mode: engine.mode,
      datasetName: engine.datasetName,
    }));

    ws.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'SET_MODE') {
          engine.setMode(payload.mode);
        } else if (payload.type === 'SET_DATASET') {
          const name = payload.name;
          if (payload.content) {
            engine.loadDataset(name, payload.content);
          } else if (name) {
            let filePath = path.join(recordingsDir, name);
            if (!fs.existsSync(filePath) && recordingsDir !== bundledRecordingsDir) {
              filePath = path.join(bundledRecordingsDir, name);
            }
            if (fs.existsSync(filePath)) {
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                engine.loadDataset(name, content);
              } catch (e) {
                console.error(`[SimData] Error loading dataset "${name}":`, e.message);
              }
            }
          }
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
        } else if (payload.type === 'SET_PLAYLIST') {
          if (payload.playlist) {
            engine.setPlaylist(payload.playlist, resolveRecordingContent);
          }
        } else if (payload.type === 'PLAYLIST_NEXT') {
          engine.nextPlaylistStep(resolveRecordingContent);
        } else if (payload.type === 'PLAYLIST_PREV') {
          engine.prevPlaylistStep(resolveRecordingContent);
        } else if (payload.type === 'PLAYLIST_SEEK') {
          engine.seekPlaylistStep(payload.stepIndex, resolveRecordingContent);
        } else if (payload.type === 'PLAYBACK_FRAME' && payload.frame) {
          engine.setPlaybackFrame(payload.frame);
          broadcastTelemetry(payload.frame, ws);
        }
      } catch (err) {
        // Ignore malformed messages
      }
    });
  });

  function broadcastTelemetry(telemetry, originWs = null) {
    if (!telemetry || !telemetry.biometrics) return;

    // Respiration rawSin for OSC (-1.0 to 1.0)
    let respSin = 0;
    if (typeof telemetry.biometrics.respiration?.rawSin === 'number') {
      respSin = telemetry.biometrics.respiration.rawSin;
    } else if (typeof telemetry.biometrics.respiration?.value === 'number') {
      respSin = (telemetry.biometrics.respiration.value * 2) - 1;
    }

    const jsonPayload = {
      timestamp: telemetry.timestamp || Date.now(),
      mode: telemetry.mode || engine.mode,
      biometrics: {
        eeg: {
          alpha: telemetry.biometrics.eeg?.alpha ?? 0.5,
          beta: telemetry.biometrics.eeg?.beta ?? 0.3,
          theta: telemetry.biometrics.eeg?.theta ?? 0.35,
          smr: telemetry.biometrics.eeg?.smr ?? 0.45,
          gamma: telemetry.biometrics.eeg?.gamma ?? 0.1,
          delta: telemetry.biometrics.eeg?.delta ?? 0.25,
        },
        hrv: {
          bpm: telemetry.biometrics.hrv?.bpm ?? 70,
          rmssd: telemetry.biometrics.hrv?.rmssd ?? 50,
          coherence: telemetry.biometrics.hrv?.coherence ?? 0.5,
        },
        respiration: {
          phase: telemetry.biometrics.respiration?.phase ?? 'inhale',
          value: telemetry.biometrics.respiration?.value ?? 0.5,
        },
        eda: {
          tonic: telemetry.biometrics.eda?.tonic ?? 5.0,
          phasic: telemetry.biometrics.eda?.phasic ?? 0.0,
        }
      },
      states: {
        state_name: telemetry.states?.state_name || engine.deriveStateName(telemetry),
        stage_name: telemetry.states?.stage_name || engine.deriveStageName(telemetry),
        calm_index: telemetry.states?.calm_index ?? 0.5,
        focus_index: telemetry.states?.focus_index ?? 0.5,
        artifact_flag: Boolean(telemetry.states?.artifact_flag),
      },
      playlist_state: telemetry.playlist_state || undefined,
    };

    const strJson = JSON.stringify(jsonPayload);

    // Broadcast to all active WebSocket clients (optionally excluding the origin sender)
    for (const client of wss.clients) {
      if (client !== originWs && client.readyState === WebSocket.OPEN) {
        client.send(strJson);
      }
    }

    // Transmit OSC UDP packets to 127.0.0.1:9000
    const oscMessages = [
      encodeOscMessage('/bio/eeg/alpha', [{ type: 'f', value: jsonPayload.biometrics.eeg.alpha }]),
      encodeOscMessage('/bio/eeg/beta', [{ type: 'f', value: jsonPayload.biometrics.eeg.beta }]),
      encodeOscMessage('/bio/eeg/theta', [{ type: 'f', value: jsonPayload.biometrics.eeg.theta }]),
      encodeOscMessage('/bio/eeg/smr', [{ type: 'f', value: jsonPayload.biometrics.eeg.smr }]),
      encodeOscMessage('/bio/hrv/bpm', [{ type: 'f', value: jsonPayload.biometrics.hrv.bpm }]),
      encodeOscMessage('/bio/hrv/coherence', [{ type: 'f', value: jsonPayload.biometrics.hrv.coherence }]),
      encodeOscMessage('/bio/respiration', [{ type: 'f', value: respSin }]),
      encodeOscMessage('/bio/eda/phasic', [{ type: 'f', value: jsonPayload.biometrics.eda.phasic }]),
      encodeOscMessage('/bio/state/calm', [{ type: 'f', value: jsonPayload.states.calm_index }]),
      encodeOscMessage('/bio/state/name', [{ type: 's', value: jsonPayload.states.state_name }]),
      encodeOscMessage('/bio/stage/name', [{ type: 's', value: jsonPayload.states.stage_name }]),
      encodeOscMessage('/bio/artifact', [{ type: 'i', value: jsonPayload.states.artifact_flag ? 1 : 0 }]),
    ];

    for (const msgBuf of oscMessages) {
      oscSocket.send(msgBuf, 0, msgBuf.length, oscPort, oscHost, (err) => {
        if (!err) oscPacketCount++;
      });
    }
  }

  // 30 Hz Simulation Loop (runs generative, presets, overrides, and dataset playback)
  const timer = setInterval(() => {
    const telemetry = engine.tick(1 / TICK_RATE_HZ);
    broadcastTelemetry(telemetry);
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
