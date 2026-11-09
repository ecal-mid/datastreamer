import { OrganicNoise } from './PerlinNoise';
import {
  SimBioTelemetry,
  OperatingMode,
  PresetArchetype,
  PresetConfig,
  ManualOverrides,
  ArtifactState,
  ArtifactType,
  EegBands
} from './types';

export const PRESETS: Record<PresetArchetype, PresetConfig> = {
  baseline: {
    name: 'Baseline / Neutral',
    description: 'Resting state, moderate Alpha, balanced HRV and moderate coherence.',
    targetBpm: 70,
    respRate: 0.16, // ~10 breaths/min
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
    description: 'High Alpha & SMR, elevated Theta, low Beta, high coherence & RSA coupling.',
    targetBpm: 60,
    respRate: 0.10, // 6 breaths/min (resonant)
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
    description: 'Suppressed Alpha, high Beta/Gamma, irregular breathing, high EDA bursts.',
    targetBpm: 98,
    respRate: 0.30, // ~18 breaths/min
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
    description: 'Dominant Theta, collapsing Tonic EDA, shallow and slow respiration.',
    targetBpm: 54,
    respRate: 0.08, // ~5 breaths/min
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

export class BioEngine {
  private mode: OperatingMode = 'generative';
  private tickRate: number = 30; // 30 Hz
  private timeSeconds: number = 0;
  private noise: OrganicNoise;

  // Stream Transport States (Play/Pause & Speed Multipliers)
  private isPaused: boolean = false;
  private speed: number = 1.0;
  private lastFrame: SimBioTelemetry | null = null;

  // Active parameter values (interpolated smoothly)
  private currentParams: PresetConfig;
  private targetParams: PresetConfig;
  private interpolationDuration: number = 3.0; // 3 seconds
  private interpolationElapsed: number = 3.0;

  // Respiration state
  private respPhase: number = 0;
  private prevRespSin: number = 0;

  // EDA simulation
  private phasicSpike: number = 0; // Current phasic amplitude
  private phasicRising: boolean = false;
  private phasicTimer: number = 0;
  private phasicTargetAmp: number = 0;

  // Overrides
  private overrides: ManualOverrides = {
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

  // Artifact injection
  private artifact: ArtifactState = {
    active: false,
    type: 'none',
    remainingMs: 0,
    totalMs: 0,
  };

  constructor() {
    this.noise = new OrganicNoise(1337);
    this.currentParams = { ...PRESETS.baseline };
    this.targetParams = { ...PRESETS.baseline };
  }

  public setMode(mode: OperatingMode) {
    this.mode = mode;
  }

  public getMode(): OperatingMode {
    return this.mode;
  }

  public setPreset(archetype: PresetArchetype) {
    const target = PRESETS[archetype];
    if (!target) return;
    this.mode = 'preset';
    this.targetParams = { ...target };
    this.interpolationDuration = 3.0; // 3 seconds
    this.interpolationElapsed = 0.0;
  }

  public setOverrides(overrides: Partial<ManualOverrides>) {
    if (overrides.enabled) {
      this.overrides.enabled = { ...this.overrides.enabled, ...overrides.enabled };
    }
    if (overrides.values) {
      this.overrides.values = { ...this.overrides.values, ...overrides.values };
    }
  }

  public getOverrides(): ManualOverrides {
    return this.overrides;
  }

  public triggerArtifact(type: ArtifactType) {
    if (type === 'none') {
      this.artifact = { active: false, type: 'none', remainingMs: 0, totalMs: 0 };
      return;
    }

    let durationMs = 1000;
    if (type === 'blink') durationMs = 200;      // 200ms burst
    else if (type === 'clench') durationMs = 1500; // 1.5s saturation
    else if (type === 'detach') durationMs = 5000; // 5s disconnect or persistent toggle

    this.artifact = {
      active: true,
      type,
      remainingMs: durationMs,
      totalMs: durationMs,
    };

    // Stress trigger for clench
    if (type === 'clench') {
      this.triggerPhasicSpike(1.8);
    }
  }

  public triggerPhasicSpike(amplitude?: number) {
    this.phasicTargetAmp = amplitude ?? (0.8 + Math.random() * 1.5);
    this.phasicRising = true;
    this.phasicTimer = 0;
  }

  // Stream Transport Controls
  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public togglePaused(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public setSpeed(speed: number) {
    this.speed = Math.max(0.1, Math.min(10.0, speed));
  }

  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Main step function called at 30 Hz (dt = 1/30s ~ 0.0333s)
   */
  public tick(dt: number = 1 / 30): SimBioTelemetry {
    if (this.isPaused && this.lastFrame) {
      return {
        ...this.lastFrame,
        timestamp: Date.now(),
      };
    }

    const effectiveDt = dt * this.speed;
    this.timeSeconds += effectiveDt;

    // 1. Advance preset interpolation if running
    if (this.interpolationElapsed < this.interpolationDuration) {
      this.interpolationElapsed += effectiveDt;
      const t = Math.min(1.0, this.interpolationElapsed / this.interpolationDuration);
      // Smoothstep interpolation (3t^2 - 2t^3)
      const smoothT = t * t * (3 - 2 * t);
      this.lerpParams(smoothT);
    }

    // 2. Artifact timer countdown
    if (this.artifact.active && this.artifact.type !== 'detach') {
      this.artifact.remainingMs -= effectiveDt * 1000;
      if (this.artifact.remainingMs <= 0) {
        this.artifact.active = false;
        this.artifact.type = 'none';
      }
    }

    // 3. Compute Respiration
    const respRate = this.overrides.enabled.respRate
      ? this.overrides.values.respRate
      : this.currentParams.respRate;
    
    // Sinusoidal respiration with slight organic drift
    const respDrift = this.noise.noise1D(this.timeSeconds * 0.15) * 0.08;
    this.respPhase += (respRate + respDrift) * effectiveDt * Math.PI * 2;
    const respSin = Math.sin(this.respPhase);
    
    // Inhale when rising, exhale when falling
    const phase: 'inhale' | 'exhale' = (respSin - this.prevRespSin) >= 0 ? 'inhale' : 'exhale';
    this.prevRespSin = respSin;

    // Respiration value normalized -1.0 to 1.0 (for OSC) and 0.0 to 1.0 (for JSON display)
    const respValueRaw = Math.max(-1.0, Math.min(1.0, respSin));
    const respValueNormalized = Number(((respValueRaw + 1.0) / 2.0).toFixed(3));

    // 4. Compute Coherence
    const coherenceBase = this.overrides.enabled.coherence
      ? this.overrides.values.coherence
      : this.currentParams.coherence;
    const coherenceDrift = this.noise.noise1D(this.timeSeconds * 0.05 + 10) * 0.05;
    const coherence = Math.max(0.0, Math.min(1.0, Number((coherenceBase + coherenceDrift).toFixed(3))));

    // 5. Respiratory Sinus Arrhythmia (RSA) coupling
    // BPM increases on inhale, decreases on exhale
    const baseBpm = this.overrides.enabled.bpm
      ? this.overrides.values.bpm
      : this.currentParams.targetBpm;
    
    // Coherence modulates the amplitude of RSA (higher coherence = cleaner, larger RSA swing)
    const rsaAmplitude = 4.0 + coherence * 10.0; // 4 to 14 BPM swing
    const rsaModulation = respSin * (rsaAmplitude / 2.0);
    const bpmOrganicNoise = this.noise.noise1D(this.timeSeconds * 0.2 + 20) * 1.5;
    const bpm = Number(Math.max(40, Math.min(160, baseBpm + rsaModulation + bpmOrganicNoise)).toFixed(1));

    // RMSSD approximation in ms (higher during coherence and relaxation)
    const rmssdBase = 25 + coherence * 55;
    const rmssdNoise = this.noise.noise1D(this.timeSeconds * 0.1 + 30) * 4.0;
    const rmssd = Number(Math.max(15, Math.min(120, rmssdBase + rmssdNoise)).toFixed(1));

    // 6. EEG Band power calculations with organic Perlin/Simplex drift
    const eeg = this.computeEegBands(effectiveDt);

    // 7. Electrodermal Activity (EDA)
    const eda = this.computeEda(effectiveDt);

    // 8. Derived States & Calm / Focus indices
    let calmIndex = Number(
      Math.max(0.0, Math.min(1.0, 
        0.45 * eeg.alpha + 0.30 * coherence + 0.25 * (1.0 - eeg.beta) - (eda.phasic * 0.1)
      )).toFixed(2)
    );

    let focusIndex = Number(
      Math.max(0.0, Math.min(1.0,
        0.35 * eeg.smr + 0.35 * eeg.beta + 0.15 * coherence + 0.15 * (1.0 - eeg.theta)
      )).toFixed(2)
    );

    // 9. Apply Artifacts
    let artifactFlag = false;

    if (this.artifact.active) {
      artifactFlag = true;
      if (this.artifact.type === 'blink') {
        // High amplitude spike in frontal EEG channels (Delta, Theta, Alpha)
        const progress = 1.0 - (this.artifact.remainingMs / this.artifact.totalMs);
        const spike = Math.sin(progress * Math.PI) * 0.85;
        eeg.delta = Math.min(1.0, eeg.delta + spike);
        eeg.theta = Math.min(1.0, eeg.theta + spike * 0.8);
        eeg.alpha = Math.min(1.0, eeg.alpha + spike * 0.5);
      } else if (this.artifact.type === 'clench') {
        // High-frequency saturation across Beta and Gamma
        eeg.beta = Math.min(1.0, 0.90 + Math.random() * 0.10);
        eeg.gamma = Math.min(1.0, 0.95 + Math.random() * 0.05);
        calmIndex = Math.max(0.0, calmIndex - 0.4);
      } else if (this.artifact.type === 'detach') {
        // Drop all biometrics to zero
        eeg.delta = 0;
        eeg.theta = 0;
        eeg.alpha = 0;
        eeg.smr = 0;
        eeg.beta = 0;
        eeg.gamma = 0;
        eda.tonic = 0;
        eda.phasic = 0;
      }
    }

    const frame: SimBioTelemetry = {
      timestamp: Date.now(),
      mode: this.mode,
      biometrics: {
        eeg,
        hrv: {
          bpm,
          rmssd,
          coherence,
        },
        respiration: {
          phase,
          value: respValueNormalized,
        },
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

  private lerpParams(t: number) {
    const cur = this.currentParams;
    const tgt = this.targetParams;
    const lerp = (a: number, b: number) => a + t * (b - a);

    cur.targetBpm = lerp(cur.targetBpm, tgt.targetBpm);
    cur.respRate = lerp(cur.respRate, tgt.respRate);
    cur.alpha = lerp(cur.alpha, tgt.alpha);
    cur.beta = lerp(cur.beta, tgt.beta);
    cur.theta = lerp(cur.theta, tgt.theta);
    cur.smr = lerp(cur.smr, tgt.smr);
    cur.gamma = lerp(cur.gamma, tgt.gamma);
    cur.delta = lerp(cur.delta, tgt.delta);
    cur.coherence = lerp(cur.coherence, tgt.coherence);
    cur.tonicEda = lerp(cur.tonicEda, tgt.tonicEda);
    cur.phasicFreq = lerp(cur.phasicFreq, tgt.phasicFreq);
    cur.calmIndex = lerp(cur.calmIndex, tgt.calmIndex);
    cur.focusIndex = lerp(cur.focusIndex, tgt.focusIndex);
  }

  private computeEegBands(dt: number): EegBands {
    const t = this.timeSeconds;

    const calcBand = (
      base: number,
      overrideVal: number | undefined,
      isOverridden: boolean | undefined,
      noiseOffset: number,
      driftScale: number = 0.08
    ): number => {
      if (isOverridden && overrideVal !== undefined) {
        return overrideVal;
      }
      const drift = this.noise.noise1D(t * 0.25 + noiseOffset) * driftScale;
      return Number(Math.max(0.01, Math.min(1.0, base + drift)).toFixed(3));
    };

    const ov = this.overrides;
    return {
      delta: calcBand(this.currentParams.delta, ov.values.delta, ov.enabled.delta, 50, 0.06),
      theta: calcBand(this.currentParams.theta, ov.values.theta, ov.enabled.theta, 150, 0.08),
      alpha: calcBand(this.currentParams.alpha, ov.values.alpha, ov.enabled.alpha, 250, 0.09),
      smr:   calcBand(this.currentParams.smr, ov.values.smr, ov.enabled.smr, 350, 0.07),
      beta:  calcBand(this.currentParams.beta, ov.values.beta, ov.enabled.beta, 450, 0.08),
      gamma: calcBand(this.currentParams.gamma, ov.values.gamma, ov.enabled.gamma, 550, 0.05),
    };
  }

  private computeEda(dt: number): { tonic: number; phasic: number } {
    // Tonic component: slow drift around baseline 2.0 - 15.0 uS
    const baseTonic = this.overrides.enabled.tonicEda
      ? this.overrides.values.tonicEda
      : this.currentParams.tonicEda;
    const tonicDrift = this.noise.noise1D(this.timeSeconds * 0.03 + 80) * 0.4;
    const tonic = Number(Math.max(1.0, Math.min(20.0, baseTonic + tonicDrift)).toFixed(2));

    // Spontaneous phasic bursts check based on phasicFreq
    if (!this.phasicRising && this.phasicSpike <= 0.001) {
      const probThisTick = this.currentParams.phasicFreq * dt;
      if (Math.random() < probThisTick) {
        this.triggerPhasicSpike();
      }
    }

    // Phasic curve simulation: steep rise (1.0 - 1.5s), exponential decay (3.0 - 6.0s)
    if (this.phasicRising) {
      this.phasicTimer += dt;
      const riseTime = 1.2;
      const progress = Math.min(1.0, this.phasicTimer / riseTime);
      this.phasicSpike = this.phasicTargetAmp * Math.sin((progress * Math.PI) / 2);
      if (progress >= 1.0) {
        this.phasicRising = false;
        this.phasicTimer = 0;
      }
    } else if (this.phasicSpike > 0.001) {
      // Exponential decay
      const decayRate = 0.5; // per second
      this.phasicSpike *= Math.exp(-decayRate * dt);
      if (this.phasicSpike < 0.001) this.phasicSpike = 0;
    }

    return {
      tonic,
      phasic: Number(this.phasicSpike.toFixed(3)),
    };
  }
}

