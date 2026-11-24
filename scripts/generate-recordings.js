// Script to generate physiologically accurate time-series datasets (JSON & CSV)
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'assets', 'recordings');

function generateMeditationSession() {
  const frames = [];
  const totalSeconds = 30;
  const fps = 30;
  const totalFrames = totalSeconds * fps;
  const startTime = 1773072000000;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    const progress = t / totalSeconds;
    // Resonant breathing at 0.1 Hz (6 breaths/min)
    const respSin = Math.sin(2 * Math.PI * 0.1 * t);
    const respPhase = Math.cos(2 * Math.PI * 0.1 * t) >= 0 ? 'inhale' : 'exhale';
    const respValue = Number(((respSin + 1) / 2).toFixed(3));

    // Coherence rises from 0.65 to 0.90
    const coherence = Number((0.65 + progress * 0.23 + Math.sin(t * 0.2) * 0.02).toFixed(3));

    // Heart rate coupled to respiration with RSA (swings 55 to 65 BPM)
    const rsaMod = respSin * (3.5 + coherence * 3.0);
    const bpm = Number((60 - progress * 4 + rsaMod + (Math.random() - 0.5) * 0.4).toFixed(1));

    // EEG: Alpha and Theta rise, Beta falls
    const alpha = Number((0.60 + progress * 0.28 + Math.sin(t * 0.5) * 0.03).toFixed(3));
    const theta = Number((0.40 + progress * 0.22 + Math.cos(t * 0.3) * 0.02).toFixed(3));
    const smr = Number((0.55 + progress * 0.18 + Math.sin(t * 0.4) * 0.02).toFixed(3));
    const beta = Number((0.35 - progress * 0.22 + Math.random() * 0.02).toFixed(3));
    const gamma = Number((0.15 - progress * 0.07).toFixed(3));
    const delta = Number((0.30 + progress * 0.12).toFixed(3));

    // EDA: Tonic slowly decreases from 4.5 to 2.8 uS, almost zero phasic
    const tonic = Number((4.5 - progress * 1.7 + Math.sin(t * 0.05) * 0.1).toFixed(2));
    const phasic = 0.01;

    const calm = Number((0.65 + progress * 0.28).toFixed(2));
    const focus = Number((0.60 + progress * 0.18).toFixed(2));

    frames.push({
      timestamp: startTime + Math.round(t * 1000),
      mode: 'playback',
      biometrics: {
        eeg: { alpha, beta, theta, smr, gamma, delta },
        hrv: { bpm, rmssd: Number((50 + coherence * 40).toFixed(1)), coherence },
        respiration: { phase: respPhase, value: respValue },
        eda: { tonic, phasic }
      },
      states: {
        calm_index: calm,
        focus_index: focus,
        artifact_flag: false
      }
    });
  }

  fs.writeFileSync(path.join(targetDir, 'meditation_deep_flow.json'), JSON.stringify(frames, null, 2));
  console.log('Generated meditation_deep_flow.json');
}

function generateStressSession() {
  const frames = [];
  const totalSeconds = 30;
  const fps = 30;
  const totalFrames = totalSeconds * fps;
  const startTime = 1773072000000;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    const progress = t / totalSeconds;
    // Irregular rapid respiration ~0.35 Hz
    const respSin = Math.sin(2 * Math.PI * 0.35 * t + Math.sin(t * 1.2));
    const respPhase = respSin >= 0 ? 'inhale' : 'exhale';
    const respValue = Number(((respSin + 1) / 2).toFixed(3));

    // Low coherence (0.15 - 0.25)
    const coherence = Number((0.25 - progress * 0.10 + Math.random() * 0.05).toFixed(3));

    // High, erratic BPM (90 - 110)
    const bpm = Number((92 + progress * 10 + (Math.random() - 0.5) * 5.0).toFixed(1));

    // EEG: High Beta & Gamma, suppressed Alpha
    let beta = Number((0.75 + progress * 0.15 + (Math.random() - 0.5) * 0.08).toFixed(3));
    let gamma = Number((0.55 + progress * 0.20 + (Math.random() - 0.5) * 0.06).toFixed(3));
    let alpha = Number((0.25 - progress * 0.15 + (Math.random() - 0.5) * 0.03).toFixed(3));
    let theta = Number((0.20 + (Math.random() - 0.5) * 0.04).toFixed(3));
    let smr = Number((0.22 - progress * 0.08).toFixed(3));
    let delta = Number((0.18 + (Math.random() - 0.5) * 0.03).toFixed(3));

    // High tonic EDA + frequent phasic bursts
    let tonic = Number((9.5 + progress * 4.0).toFixed(2));
    let phasic = Number((Math.sin(t * 0.8) > 0.6 ? 1.2 + Math.random() * 0.8 : 0.05).toFixed(3));

    let artifact_flag = false;
    // Jaw Clench artifact around 15s - 16.5s
    if (t >= 14.5 && t <= 16.0) {
      artifact_flag = true;
      beta = 0.98;
      gamma = 0.99;
    }

    const calm = Number(Math.max(0.05, 0.25 - progress * 0.15).toFixed(2));
    const focus = Number((0.40 - progress * 0.10).toFixed(2));

    frames.push({
      timestamp: startTime + Math.round(t * 1000),
      mode: 'playback',
      biometrics: {
        eeg: { alpha, beta, theta, smr, gamma, delta },
        hrv: { bpm, rmssd: 22.4, coherence },
        respiration: { phase: respPhase, value: respValue },
        eda: { tonic, phasic }
      },
      states: {
        calm_index: calm,
        focus_index: focus,
        artifact_flag
      }
    });
  }

  fs.writeFileSync(path.join(targetDir, 'cognitive_stress_overload.json'), JSON.stringify(frames, null, 2));
  console.log('Generated cognitive_stress_overload.json');
}

function generateCsvRecordings() {
  const generateCsv = (filename, numSeconds, type) => {
    const fps = 30;
    const totalFrames = numSeconds * fps;
    const lines = [
      'timestamp,bpm,rmssd,respiration_phase,respiration_value,coherence,alpha,beta,theta,smr,gamma,delta,tonic_eda,phasic_eda,calm_index,focus_index,artifact'
    ];
    const startTime = 1773072000000;

    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      const ts = startTime + Math.round(t * 1000);

      if (type === 'coherence') {
        const respSin = Math.sin(2 * Math.PI * 0.1 * t);
        const respPhase = respSin >= 0 ? 'inhale' : 'exhale';
        const respVal = ((respSin + 1) / 2).toFixed(3);
        const coherence = Math.min(1.0, 0.5 + (t / numSeconds) * 0.45).toFixed(3);
        const bpm = (65 + respSin * 6).toFixed(1);
        const rmssd = (45 + 30 * parseFloat(coherence)).toFixed(1);
        const alpha = (0.55 + 0.3 * (t / numSeconds)).toFixed(3);
        const beta = (0.35 - 0.2 * (t / numSeconds)).toFixed(3);
        const theta = '0.450';
        const smr = '0.620';
        const gamma = '0.080';
        const delta = '0.280';
        const tonic = (4.0 - 1.2 * (t / numSeconds)).toFixed(2);
        const phasic = '0.010';
        const calm = (0.6 + 0.35 * (t / numSeconds)).toFixed(2);
        const focus = '0.70';
        const artifact = '0';
        lines.push(`${ts},${bpm},${rmssd},${respPhase},${respVal},${coherence},${alpha},${beta},${theta},${smr},${gamma},${delta},${tonic},${phasic},${calm},${focus},${artifact}`);
      } else {
        // Drowsiness
        const respSin = Math.sin(2 * Math.PI * 0.08 * t);
        const respPhase = respSin >= 0 ? 'inhale' : 'exhale';
        const respVal = ((respSin + 1) / 2).toFixed(3);
        const coherence = '0.420';
        const bpm = (58 - 6 * (t / numSeconds) + Math.sin(t) * 1.5).toFixed(1);
        const rmssd = '60.0';
        const alpha = (0.45 - 0.25 * (t / numSeconds)).toFixed(3);
        const beta = (0.20 - 0.12 * (t / numSeconds)).toFixed(3);
        const theta = (0.55 + 0.35 * (t / numSeconds)).toFixed(3);
        const smr = '0.250';
        const gamma = '0.040';
        const delta = (0.40 + 0.35 * (t / numSeconds)).toFixed(3);
        const tonic = (3.5 - 2.0 * (t / numSeconds)).toFixed(2);
        const phasic = '0.005';
        const calm = '0.78';
        const focus = '0.15';
        const artifact = '0';
        lines.push(`${ts},${bpm},${rmssd},${respPhase},${respVal},${coherence},${alpha},${beta},${theta},${smr},${gamma},${delta},${tonic},${phasic},${calm},${focus},${artifact}`);
      }
    }

    fs.writeFileSync(path.join(targetDir, filename), lines.join('\n'));
    console.log(`Generated ${filename}`);
  };

  generateCsv('respiratory_coherence_training.csv', 30, 'coherence');
  generateCsv('drowsiness_hypnagogia.csv', 30, 'drowsiness');
}

function generateAcuteStressTrigger() {
  const frames = [];
  const totalSeconds = 30;
  const fps = 30;
  const totalFrames = totalSeconds * fps;
  const startTime = 1773072000000;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    let bpm, rmssd, coherence, respPhase, respValue, alpha, beta, theta, smr, gamma, delta, tonic, phasic, calm, focus, artifact_flag, state_name;

    if (t < 5.0) {
      // Phase 1: Calm Baseline (0-5s)
      const respSin = Math.sin(2 * Math.PI * 0.12 * t);
      respPhase = respSin >= 0 ? 'inhale' : 'exhale';
      respValue = Number(((respSin + 1) / 2).toFixed(3));
      coherence = Number((0.72 + Math.sin(t) * 0.04).toFixed(3));
      bpm = Number((68.0 + respSin * 3.5).toFixed(1));
      rmssd = 55.0;
      alpha = 0.68;
      beta = 0.28;
      theta = 0.35;
      smr = 0.50;
      gamma = 0.10;
      delta = 0.25;
      tonic = 3.6;
      phasic = 0.01;
      calm = 0.75;
      focus = 0.65;
      artifact_flag = false;
      state_name = 'Baseline Rest';
    } else if (t < 16.0) {
      // Phase 2: Acute Stress / Startle Reaction (5s-16s)
      const dt = t - 5.0; // 0 to 11s

      // Sudden Phasic EDA surge: sharp spike peaking around dt=1.5s (+1.85 uS), then exponential decay
      const spikeProfile = dt < 1.5
        ? Math.sin((dt / 1.5) * (Math.PI / 2)) * 1.85
        : 1.85 * Math.exp(-(dt - 1.5) / 3.8);
      phasic = Number(Math.max(0.02, spikeProfile).toFixed(3));
      tonic = Number((3.6 + Math.min(2.5, dt * 0.3)).toFixed(2));

      // Cardiac response: rapid surge to 105+ BPM, then elevated
      const bpmSurge = dt < 2.5
        ? (dt / 2.5) * 38.0
        : 38.0 * Math.exp(-(dt - 2.5) / 8.0);
      bpm = Number((68.0 + bpmSurge + (Math.random() - 0.5) * 2.5).toFixed(1));
      rmssd = Number(Math.max(16.0, 55.0 - (bpmSurge / 38.0) * 36.0).toFixed(1));
      coherence = Number(Math.max(0.12, 0.72 - (bpmSurge / 38.0) * 0.55).toFixed(3));

      // Respiration: sharp gasp / hold at dt < 1.5s, then rapid shallow breathing (0.36 Hz)
      if (dt < 1.5) {
        respPhase = 'inhale';
        respValue = Number((0.85 + (dt / 1.5) * 0.12).toFixed(3));
      } else {
        const rapidSin = Math.sin(2 * Math.PI * 0.36 * (t - 6.5));
        respPhase = rapidSin >= 0 ? 'inhale' : 'exhale';
        respValue = Number(((rapidSin + 1) / 2).toFixed(3));
      }

      // Brainwaves: Alpha collapse, Beta surge
      const betaBoost = dt < 1.5 ? (dt / 1.5) * 0.55 : 0.55 * Math.exp(-(dt - 1.5) / 10.0);
      alpha = Number(Math.max(0.12, 0.68 - betaBoost * 0.9).toFixed(3));
      beta = Number(Math.min(0.92, 0.28 + betaBoost).toFixed(3));
      theta = 0.20;
      smr = 0.22;
      gamma = Number(Math.min(0.60, 0.10 + betaBoost * 0.6).toFixed(3));
      delta = 0.18;

      calm = Number(Math.max(0.10, 0.75 - betaBoost * 1.1).toFixed(2));
      focus = 0.40;
      artifact_flag = false;
      state_name = 'Acute Stress Trigger';
    } else {
      // Phase 3: Post-Stress Recovery (16s-30s)
      const p = (t - 16.0) / 14.0;
      const respSin = Math.sin(2 * Math.PI * 0.15 * t);
      respPhase = respSin >= 0 ? 'inhale' : 'exhale';
      respValue = Number(((respSin + 1) / 2).toFixed(3));

      bpm = Number((82.0 - p * 12.0 + respSin * 3.0).toFixed(1));
      rmssd = Number((28.0 + p * 22.0).toFixed(1));
      coherence = Number((0.35 + p * 0.32).toFixed(3));

      alpha = Number((0.28 + p * 0.32).toFixed(3));
      beta = Number((0.52 - p * 0.20).toFixed(3));
      theta = 0.32;
      smr = 0.42;
      gamma = 0.15;
      delta = 0.24;

      tonic = Number((5.5 - p * 1.5).toFixed(2));
      phasic = Number((0.15 * (1 - p) + 0.01).toFixed(3));
      calm = Number((0.35 + p * 0.35).toFixed(2));
      focus = Number((0.45 + p * 0.18).toFixed(2));
      artifact_flag = false;
      state_name = 'Stress Recovery';
    }

    frames.push({
      timestamp: startTime + Math.round(t * 1000),
      mode: 'playback',
      biometrics: {
        eeg: { alpha, beta, theta, smr, gamma, delta },
        hrv: { bpm, rmssd, coherence },
        respiration: { phase: respPhase, value: respValue },
        eda: { tonic, phasic }
      },
      states: {
        calm_index: calm,
        focus_index: focus,
        artifact_flag,
        state_name
      }
    });
  }

  fs.writeFileSync(path.join(targetDir, 'acute_stress_trigger.json'), JSON.stringify(frames, null, 2));
  console.log('Generated acute_stress_trigger.json');
}

function generateSensorArtifactDropout() {
  const frames = [];
  const totalSeconds = 30;
  const fps = 30;
  const totalFrames = totalSeconds * fps;
  const startTime = 1773072000000;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    let bpm, rmssd, coherence, respPhase, respValue, alpha, beta, theta, smr, gamma, delta, tonic, phasic, calm, focus, artifact_flag, state_name;

    if (t < 6.0) {
      // Phase 1: Clean Baseline Contact (0-6s)
      const respSin = Math.sin(2 * Math.PI * 0.12 * t);
      respPhase = respSin >= 0 ? 'inhale' : 'exhale';
      respValue = Number(((respSin + 1) / 2).toFixed(3));
      coherence = 0.65;
      bpm = Number((70.0 + respSin * 3.0).toFixed(1));
      rmssd = 48.0;
      alpha = 0.62;
      beta = 0.32;
      theta = 0.36;
      smr = 0.48;
      gamma = 0.12;
      delta = 0.22;
      tonic = 4.2;
      phasic = 0.02;
      calm = 0.68;
      focus = 0.62;
      artifact_flag = false;
      state_name = 'Baseline Rest';
    } else if (t < 16.0) {
      // Phase 2: Sensor Detachment & Heavy Noise Burst (6s-16s)
      artifact_flag = true;
      state_name = 'Sensor Detached / Noise';

      // Chaotic high EMG saturation across frequency bands
      alpha = Number((0.85 + Math.random() * 0.14).toFixed(3));
      beta = Number((0.92 + Math.random() * 0.08).toFixed(3));
      gamma = Number((0.95 + Math.random() * 0.05).toFixed(3));
      delta = Number((0.88 + Math.random() * 0.11).toFixed(3));
      theta = Number((0.82 + Math.random() * 0.15).toFixed(3));
      smr = 0.30;

      // Pulse reading drops out or is erratic
      bpm = Number((115.0 + (Math.random() - 0.5) * 20.0).toFixed(1));
      rmssd = 5.0;
      coherence = 0.02;

      respPhase = Math.random() > 0.5 ? 'inhale' : 'exhale';
      respValue = Number(Math.random().toFixed(3));

      tonic = Number((4.2 + (Math.random() - 0.5) * 3.0).toFixed(2));
      phasic = Number((Math.random() * 1.5).toFixed(3));

      calm = 0.05;
      focus = 0.05;
    } else {
      // Phase 3: Re-attachment & Signal Stabilization (16s-30s)
      const p = Math.min(1.0, (t - 16.0) / 4.0);
      artifact_flag = false;
      state_name = p < 0.6 ? 'Stabilizing Signal' : 'Baseline Rest';

      const respSin = Math.sin(2 * Math.PI * 0.12 * (t - 16.0));
      respPhase = respSin >= 0 ? 'inhale' : 'exhale';
      respValue = Number(((respSin + 1) / 2).toFixed(3));

      bpm = Number((85.0 - p * 15.0 + respSin * 3.0).toFixed(1));
      rmssd = Number((15.0 + p * 33.0).toFixed(1));
      coherence = Number((0.15 + p * 0.50).toFixed(3));

      alpha = Number((0.30 + p * 0.32).toFixed(3));
      beta = Number((0.70 - p * 0.38).toFixed(3));
      gamma = Number((0.50 - p * 0.38).toFixed(3));
      delta = Number((0.45 - p * 0.23).toFixed(3));
      theta = Number((0.40 - p * 0.04).toFixed(3));
      smr = Number((0.25 + p * 0.23).toFixed(3));

      tonic = Number((5.0 - p * 0.8).toFixed(2));
      phasic = Number((0.10 * (1 - p) + 0.01).toFixed(3));

      calm = Number((0.20 + p * 0.48).toFixed(2));
      focus = Number((0.30 + p * 0.32).toFixed(2));
    }

    frames.push({
      timestamp: startTime + Math.round(t * 1000),
      mode: 'playback',
      biometrics: {
        eeg: { alpha, beta, theta, smr, gamma, delta },
        hrv: { bpm, rmssd, coherence },
        respiration: { phase: respPhase, value: respValue },
        eda: { tonic, phasic }
      },
      states: {
        calm_index: calm,
        focus_index: focus,
        artifact_flag,
        state_name
      }
    });
  }

  fs.writeFileSync(path.join(targetDir, 'sensor_artifact_dropout.json'), JSON.stringify(frames, null, 2));
  console.log('Generated sensor_artifact_dropout.json');
}

generateMeditationSession();
generateStressSession();
generateCsvRecordings();
generateAcuteStressTrigger();
generateSensorArtifactDropout();
