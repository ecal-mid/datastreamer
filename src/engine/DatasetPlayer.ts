import { SimBioTelemetry, DatasetPlaybackState } from './types';

export class DatasetPlayer {
  private frames: SimBioTelemetry[] = [];
  private state: DatasetPlaybackState = {
    isPlaying: false,
    isLooping: true,
    speed: 1.0,
    currentIndex: 0,
    totalFrames: 0,
    datasetName: '',
    durationSeconds: 0,
  };

  private accumulator: number = 0; // Fractional frame accumulator for variable speeds

  public loadJson(name: string, jsonData: SimBioTelemetry[] | string): { success: boolean; frameCount: number; error?: string } {
    try {
      const parsed: SimBioTelemetry[] = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, frameCount: 0, error: 'JSON dataset must be a non-empty array of telemetry frames' };
      }
      this.frames = parsed;
      this.state.datasetName = name;
      this.state.totalFrames = parsed.length;
      this.state.currentIndex = 0;
      this.state.durationSeconds = Number((parsed.length / 30).toFixed(1));
      this.state.isPlaying = false;
      this.accumulator = 0;
      return { success: true, frameCount: parsed.length };
    } catch (e: any) {
      return { success: false, frameCount: 0, error: e.message || 'Failed to parse JSON' };
    }
  }

  public loadCsv(name: string, csvContent: string): { success: boolean; frameCount: number; error?: string } {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, frameCount: 0, error: 'CSV file contains no data rows' };
      }

      // Normalize headers to lowercase and trimmed
      const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());
      const frames: SimBioTelemetry[] = [];

      const getNum = (row: Record<string, string>, keys: string[], fallback: number): number => {
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

        const row: Record<string, string> = {};
        rawHeaders.forEach((col, idx) => {
          if (idx < parts.length) row[col] = parts[idx];
        });

        const bpm = getNum(row, ['bpm', 'heart_rate', 'heartrate', 'hr', 'pulse'], 70);
        const rmssd = getNum(row, ['rmssd', 'hrv'], 50);
        const coherence = getNum(row, ['coherence', 'coh', 'rsa_coherence'], 0.5);

        const respVal = getNum(row, ['respiration_value', 'respiration', 'resp', 'breath', 'breathing'], 0.5);
        const respPhaseRaw = (row['respiration_phase'] || row['phase'] || '').toLowerCase();
        const respPhase: 'inhale' | 'exhale' = respPhaseRaw === 'exhale' ? 'exhale' : 'inhale';

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

        const frame: SimBioTelemetry = {
          timestamp: parseInt(row['timestamp'], 10) || (Date.now() + i * 33),
          mode: 'playback',
          biometrics: {
            eeg: { alpha, beta, theta, smr, gamma, delta },
            hrv: { bpm, rmssd, coherence },
            respiration: { phase: respPhase, value: respVal },
            eda: { tonic: tonicEda, phasic: phasicEda }
          },
          states: {
            calm_index: calmIndex,
            focus_index: focusIndex,
            artifact_flag: isArtifact
          }
        };
        frames.push(frame);
      }

      if (frames.length === 0) {
        return { success: false, frameCount: 0, error: 'Could not parse any valid telemetry frames from CSV' };
      }

      this.frames = frames;
      this.state.datasetName = name;
      this.state.totalFrames = frames.length;
      this.state.currentIndex = 0;
      this.state.durationSeconds = Number((frames.length / 30).toFixed(1));
      this.state.isPlaying = false;
      this.accumulator = 0;
      return { success: true, frameCount: frames.length };
    } catch (e: any) {
      return { success: false, frameCount: 0, error: e.message || 'Failed to parse CSV' };
    }
  }

  public play() {
    this.state.isPlaying = true;
  }

  public pause() {
    this.state.isPlaying = false;
  }

  public togglePlay() {
    this.state.isPlaying = !this.state.isPlaying;
  }

  public toggleLoop() {
    this.state.isLooping = !this.state.isLooping;
  }

  public setSpeed(speed: number) {
    this.state.speed = speed;
  }

  public seek(index: number) {
    const clamped = Math.max(0, Math.min(this.state.totalFrames - 1, Math.round(index)));
    this.state.currentIndex = clamped;
    this.accumulator = 0;
  }

  public seekNormalized(progress: number) {
    const target = Math.round(progress * (this.state.totalFrames - 1));
    this.seek(target);
  }

  public getState(): DatasetPlaybackState {
    return { ...this.state };
  }

  public getCurrentFrame(): SimBioTelemetry | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.state.currentIndex] || null;
  }

  /**
   * Advances the player state by one tick (at 30Hz)
   */
  public tick(): SimBioTelemetry | null {
    if (this.frames.length === 0) return null;

    if (this.state.isPlaying) {
      this.accumulator += this.state.speed;
      const step = Math.floor(this.accumulator);
      if (step >= 1) {
        this.accumulator -= step;
        let nextIndex = this.state.currentIndex + step;

        if (nextIndex >= this.state.totalFrames) {
          if (this.state.isLooping) {
            nextIndex = nextIndex % this.state.totalFrames;
          } else {
            nextIndex = this.state.totalFrames - 1;
            this.state.isPlaying = false;
          }
        }
        this.state.currentIndex = nextIndex;
      }
    }

    const frame = this.frames[this.state.currentIndex];
    if (!frame) return null;

    // Overwrite the timestamp to current wall-clock time so streaming consumers receive real-time timestamps
    return {
      ...frame,
      timestamp: Date.now(),
    };
  }
}

