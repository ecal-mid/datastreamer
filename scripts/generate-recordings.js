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

generateMeditationSession();
generateStressSession();
generateCsvRecordings();
