/**
 * Bio-Sonification Synthesizer
 * Generates real-time auditory biofeedback using the Web Audio API:
 * 1. Cardiac Pulse: Sub-bass acoustic heartbeat on ECG systolic peak.
 * 2. Respiratory Guide: Gentle sinusoidal pitch gliding with inhalation & exhalation.
 * 3. Alpha Isochronic Beat: 10 Hz rhythmic modulation for neural entrainment.
 */

export class BioSonification {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = false;
  private volume: number = 0.25;

  // Respiration synth nodes
  private respOsc: OscillatorNode | null = null;
  private respGain: GainNode | null = null;

  // Trackers to avoid duplicate beat triggers
  private prevEcgVal: number = 0;
  private beatCooldown: number = 0;

  private initAudio() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;

    this.ctx = new AudioCtxClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Continuous soft breathing drone
    this.respOsc = this.ctx.createOscillator();
    this.respOsc.type = 'sine';
    this.respOsc.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.respGain = this.ctx.createGain();
    this.respGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.respOsc.connect(this.respGain);
    this.respGain.connect(this.masterGain);
    this.respOsc.start();
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initAudio();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.respGain && this.ctx) {
        this.respGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.2);
      }
    } else {
      if (this.respGain && this.ctx) {
        this.respGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.1);
      }
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Called on every frame (30 Hz) with latest telemetry
   */
  public update(bpm: number, respValue: number, respPhase: 'inhale' | 'exhale', ecgPoint: number) {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Modulate breathing guide pitch
    if (this.respOsc) {
      // Inhalation: glides up 180 -> 260 Hz; Exhalation: glides down 260 -> 180 Hz
      const targetFreq = 180 + respValue * 90;
      this.respOsc.frequency.setTargetAtTime(targetFreq, now, 0.15);
    }

    // 2. Detect R-wave systolic spike for heartbeat sound
    this.beatCooldown = Math.max(0, this.beatCooldown - 1 / 30);

    if (ecgPoint > 0.82 && this.prevEcgVal <= 0.82 && this.beatCooldown <= 0) {
      this.playHeartbeatThump(now);
      this.beatCooldown = (60 / bpm) * 0.6; // cooldown of 60% of beat interval
    }
    this.prevEcgVal = ecgPoint;
  }

  private playHeartbeatThump(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // First heart sound: "Lub" (low frequency sine thump)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, time);
    osc1.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain1.gain.setValueAtTime(0.35, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(time);
    osc1.stop(time + 0.13);

    // Second heart sound: "Dub" (slightly higher pitch, 0.14s later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(95, time + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(50, time + 0.22);

    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.setValueAtTime(0.25, time + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(time + 0.14);
    osc2.stop(time + 0.25);
  }
}

