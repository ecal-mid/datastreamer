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

  public loadJson(name: string, jsonData: SimBioTelemetry[] | string) {
    const parsed: SimBioTelemetry[] = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    this.frames = parsed;
    this.state.datasetName = name;
    this.state.totalFrames = parsed.length;
    this.state.currentIndex = 0;
    this.state.durationSeconds = Number((parsed.length / 30).toFixed(1));
    this.state.isPlaying = false;
    this.accumulator = 0;
  }

  public loadCsv(name: string, csvContent: string) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return;
    const header = lines[0].split(',').map(h => h.trim());

    const frames: SimBioTelemetry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < header.length) continue;

      const row: Record<string, string> = {};
      header.forEach((col, idx) => {
        row[col] = parts[idx];
      });

      const frame: SimBioTelemetry = {
        timestamp: parseInt(row.timestamp, 10) || (Date.now() + i * 33),
        mode: 'playback',
        biometrics: {
          eeg: {
            alpha: parseFloat(row.alpha) || 0.5,
            beta: parseFloat(row.beta) || 0.25,
            theta: parseFloat(row.theta) || 0.35,
            smr: parseFloat(row.smr) || 0.45,
            gamma: parseFloat(row.gamma) || 0.1,
            delta: parseFloat(row.delta) || 0.25,
          },
          hrv: {
            bpm: parseFloat(row.bpm) || 70,
            rmssd: parseFloat(row.rmssd) || 50,
            coherence: parseFloat(row.coherence) || 0.5,
          },
          respiration: {
            phase: (row.respiration_phase as 'inhale' | 'exhale') || 'inhale',
            value: parseFloat(row.respiration_value) || 0.5,
          },
          eda: {
            tonic: parseFloat(row.tonic_eda) || 5.0,
            phasic: parseFloat(row.phasic_eda) || 0.0,
          }
        },
        states: {
          calm_index: parseFloat(row.calm_index) || 0.5,
          focus_index: parseFloat(row.focus_index) || 0.5,
          artifact_flag: row.artifact === '1' || row.artifact === 'true',
        }
      };
      frames.push(frame);
    }

    this.frames = frames;
    this.state.datasetName = name;
    this.state.totalFrames = frames.length;
    this.state.currentIndex = 0;
    this.state.durationSeconds = Number((frames.length / 30).toFixed(1));
    this.state.isPlaying = false;
    this.accumulator = 0;
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

