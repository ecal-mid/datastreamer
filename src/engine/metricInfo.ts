export type MetricKey =
  | 'respiration' | 'cardiac' | 'eeg' | 'eegBands' | 'coherence'
  | 'eda' | 'state' | 'calm' | 'focus';

export interface MetricInfo {
  title: string;
  summary: string;
  formula?: string;
  details: string[];
  note?: string;
  /** Optional titled sections, rendered after the details. */
  sections?: { heading: string; body: string[] }[];
  source?: string;
}

const SIM_NOTE = 'Simulated signal: it is generated from the preset, not measured from a real sensor.';

export const METRIC_INFO: Record<MetricKey, MetricInfo> = {
  respiration: {
    title: 'Respiration',
    summary: 'A sine wave at the preset breathing rate, with a slight organic drift.',
    formula: 'phase += (respRate + drift) · dt · 2π\nvalue = sin(phase)   → displayed as (value+1)/2',
    details: [
      'respRate (Hz) comes from the preset, or from the manual override.',
      'drift = Perlin noise × 0.08, so the rhythm is not perfectly regular.',
      'Inhale when the sine is rising, exhale when it is falling.',
    ],
    note: SIM_NOTE,
    source: 'BioEngine.ts, step 3',
  },
  cardiac: {
    title: 'Heart rate (BPM) / HRV',
    summary: 'Base BPM of the preset, modulated by respiration (RSA).',
    formula:
      'rsaAmp = 4 + coherence · 10\nBPM = baseBpm + sin(resp) · rsaAmp/2 + noise(±1.5)\nRMSSD = 25 + coherence · 55 + noise(±4)  (ms)',
    details: [
      'RSA: BPM goes up on inhale and down on exhale.',
      'The higher the coherence, the larger the RSA swing and the higher the RMSSD.',
      'BPM is clamped to 40–160, RMSSD to 15–120 ms.',
    ],
    note: SIM_NOTE + ' Coherence is an input here, not a result.',
    source: 'BioEngine.ts, steps 5–6',
  },
  coherence: {
    title: 'Cardiac coherence',
    summary: 'How regular and synchronised your heartbeat is with your breathing.',
    details: [
      'Your heart never beats like a metronome: it speeds up when you breathe in and slows down when you breathe out. This is called heart rate variability (HRV).',
      'When you breathe slowly and calmly (about 6 breaths per minute), this rise and fall becomes smooth and regular, like a wave. The heart and the breathing are "in phase": this is cardiac coherence.',
      'High coherence = the nervous system is balanced, with the calming (parasympathetic) branch well engaged. The person is relaxed, steady and recovering well. Typical of slow breathing, meditation and relaxation.',
      'Low coherence = the heart rhythm is irregular and choppy. It often goes with stress, anxiety, mental overload or fatigue.',
    ],
    sections: [
      {
        heading: 'How it is normally computed (real sensors)',
        body: [
          '1. Record the heartbeat (ECG chest strap or PPG optical sensor) and detect each beat.',
          '2. Measure the time between two beats (RR intervals), which gives the heart rate variability curve.',
          '3. Analyse the frequencies of this curve (FFT) over a window of about 64 seconds.',
          '4. Find the highest peak around 0.1 Hz (0.04–0.26 Hz): the slow "wave" caused by breathing at ~6 breaths/min.',
          '5. Coherence = power around this peak divided by the total power. A tall, narrow peak gives a high score; a flat, noisy spectrum gives a low score.',
        ],
      },
    ],
  },
  eeg: {
    title: 'EEG',
    summary: 'Brainwave activity, summarised by its dominant rhythm.',
    details: [
      'Dominant rhythm = the highest of Alpha, Beta and Theta.',
      'Each band is a normalised power from 0 to 1 (see the band bars).',
    ],
    note: SIM_NOTE,
    source: 'Oscilloscope.tsx / BioEngine.ts',
  },
  eegBands: {
    title: 'EEG band power',
    summary: 'How strong each brain rhythm is. Each band is a range of frequencies of the electrical activity of the brain.',
    details: [
      'Delta (0.5–4 Hz): deep sleep. Theta (4–8 Hz): drowsiness, deep relaxation, memory. Alpha (8–12 Hz): calm, relaxed wakefulness. SMR (12–15 Hz): calm body, steady attention. Beta (15–30 Hz): active thinking, alertness, stress. Gamma (30–50 Hz): intense processing, integration.',
    ],
    sections: [
      {
        heading: 'How it is normally computed (real sensors)',
        body: [
          '1. Record the raw EEG voltage (microvolts) from scalp electrodes, typically 256 samples per second.',
          '2. Clean it: band-pass filter (about 1–45 Hz), 50/60 Hz notch filter, and reject blinks and muscle artifacts.',
          '3. Cut the signal into short windows (1–2 seconds, overlapping).',
          '4. Apply a Fourier transform (FFT or Welch method) to get the power at each frequency.',
          '5. Add up the power inside each band (e.g. 8–12 Hz for alpha).',
          '6. Normalise: divide by the total power (relative power) and/or compare to the person\'s own baseline, often on a log scale. This gives a value comparable over time.',
        ],
      },
      {
        heading: 'Example: meditation',
        body: [
          'Alpha (8–12 Hz): increases when you relax with eyes closed and stop processing the outside world. Best seen over the back of the head (occipital and parietal lobes, e.g. electrodes O1/O2, Pz).',
          'Frontal-midline theta (4–8 Hz): appears during focused-attention meditation. It comes from the front of the brain: the prefrontal cortex and the anterior cingulate cortex (electrode Fz, or Fp1/Fp2/AF7/AF8 on a headband like Muse). These areas handle attention and self-control.',
          'Beta decreases: less worry, less mental chatter.',
          'Gamma (30–50 Hz): reported to increase in very experienced meditators.',
          'A typical meditation indicator is therefore: alpha and theta going up, beta going down.',
        ],
      },
      {
        heading: 'Example: tinnitus',
        body: [
          'Tinnitus is a sound perceived without any external source. Research links it to abnormal activity of the auditory cortex, in the temporal lobes (electrodes T7/T8, TP9/TP10 on the sides, near the ears).',
          'Typical findings: lower alpha (the area is less "calmed") and higher delta/theta, together with increased gamma (30–50 Hz), which is associated with the conscious perception of the sound.',
          'Neurofeedback for tinnitus tries to increase alpha and reduce delta and gamma over the temporal areas, so that the brain gets used to ignoring the sound.',
          'These are research findings on groups of people. They vary a lot between individuals and are not a diagnosis.',
        ],
      },
    ],
  },
  eda: {
    title: 'EDA / GSR',
    summary: 'Electrodermal activity: how well the skin conducts electricity, measured in microsiemens (µS).',
    details: [
      'When the nervous system is aroused (stress, surprise, effort, emotion), the sweat glands activate a little. Sweat makes the skin more conductive, so the value goes up. The person does not need to feel sweaty.',
      'Tonic (ton): the slow baseline level, which changes over minutes. A high level means a generally more activated or stressed state; a low level means a calmer one.',
      'Phasic (pha): quick peaks that appear 1–3 seconds after a stimulus (a sound, a thought, an emotion). Many peaks mean strong reactivity.',
      'EDA only measures activation (arousal), not whether the emotion is positive or negative.',
    ],
  },
  calm: {
    title: 'Calm index',
    summary: 'Weighted mix of Alpha, coherence and low Beta, reduced by EDA bursts.',
    formula: 'calm = 0.45·alpha + 0.30·coherence + 0.25·(1 − beta) − 0.1·eda.phasic\n(clamped to 0–1)',
    details: [
      'More Alpha, more coherence, less Beta = calmer.',
      'The "clench" artifact subtracts 0.4.',
      'Heart rate, RMSSD and respiration are not used.',
    ],
    note: 'In dataset playback, the value is read from the file (calm / relaxation / valence column) when present.',
    source: 'BioEngine.ts, step 8',
  },
  focus: {
    title: 'Focus index',
    summary: 'Weighted mix of SMR, Beta, coherence and low Theta.',
    formula: 'focus = 0.35·smr + 0.35·beta + 0.15·coherence + 0.15·(1 − theta)\n(clamped to 0–1)',
    details: [
      'More SMR and Beta, less Theta = more focused.',
      'Heart rate, RMSSD and respiration are not used.',
    ],
    note: 'In dataset playback, the value is read from the file (focus / attention / engagement column) when present.',
    source: 'BioEngine.ts, step 8',
  },
  state: {
    title: 'State',
    summary: 'Name of the current state.',
    formula:
      'β>0.60 & coh<0.40 → Cognitive Stress / Overload\nα>0.65 & coh>0.65 → Deep Meditation / Flow\nθ>0.60 & β<0.25 → Drowsiness / Hypnagogia\ncoh>0.75 → Cardiorespiratory Coherence\nβ>0.50 → Active Focus / Processing\notherwise → Baseline / Neutral',
    details: [
      'In preset mode, it is simply the name of the preset.',
      'In generative mode, the rules are evaluated in this order; the first match wins.',
      'Only alpha, beta, theta and coherence are used.',
    ],
    source: 'BioEngine.ts, deriveStateName',
  },
};
