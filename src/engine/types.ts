export type OperatingMode = 'generative' | 'preset' | 'playback';

export interface EegBands {
  delta: number;   // 0.5 - 4 Hz
  theta: number;   // 4 - 8 Hz
  alpha: number;   // 8 - 12 Hz
  smr: number;     // 12 - 15 Hz
  beta: number;    // 15 - 30 Hz
  gamma: number;   // 30 - 50 Hz
}

export interface HrvData {
  bpm: number;        // Beats Per Minute
  rmssd: number;      // Root mean square of successive differences (ms)
  coherence: number;  // 0.0 - 1.0
}

export interface RespirationData {
  phase: 'inhale' | 'exhale';
  value: number;      // -1.0 to 1.0 (or normalized)
}

export interface EdaData {
  tonic: number;      // Baseline conductance in uS (2.0 - 15.0)
  phasic: number;     // Transient spike amplitude (uS)
}

export interface StatesData {
  calm_index: number;     // 0.0 - 1.0
  focus_index: number;    // 0.0 - 1.0
  artifact_flag: boolean; // boolean
}

export interface SimDataTelemetry {
  timestamp: number;
  mode: OperatingMode;
  biometrics: {
    eeg: EegBands;
    hrv: HrvData;
    respiration: RespirationData;
    eda: EdaData;
  };
  states: StatesData;
}

// Backwards compatibility alias
export type SimBioTelemetry = SimDataTelemetry;

export type PresetArchetype = 'baseline' | 'meditation' | 'stress' | 'drowsiness';

export interface PresetConfig {
  name: string;
  description: string;
  targetBpm: number;
  respRate: number;      // Hz
  alpha: number;
  beta: number;
  theta: number;
  smr: number;
  gamma: number;
  delta: number;
  coherence: number;
  tonicEda: number;
  phasicFreq: number;    // probability per second
  calmIndex: number;
  focusIndex: number;
}

export interface ManualOverrides {
  enabled: {
    bpm?: boolean;
    respRate?: boolean;
    coherence?: boolean;
    alpha?: boolean;
    beta?: boolean;
    theta?: boolean;
    smr?: boolean;
    gamma?: boolean;
    delta?: boolean;
    tonicEda?: boolean;
  };
  values: {
    bpm: number;
    respRate: number;
    coherence: number;
    alpha: number;
    beta: number;
    theta: number;
    smr: number;
    gamma: number;
    delta: number;
    tonicEda: number;
  };
}

export type ArtifactType = 'blink' | 'clench' | 'detach' | 'none';

export interface ArtifactState {
  active: boolean;
  type: ArtifactType;
  remainingMs: number;
  totalMs: number;
}

export interface DatasetPlaybackState {
  isPlaying: boolean;
  isLooping: boolean;
  speed: number;       // 0.5, 1.0, 2.0, 5.0
  currentIndex: number;
  totalFrames: number;
  datasetName: string;
  durationSeconds: number;
}
