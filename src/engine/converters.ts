/**
 * SimData Biometric Dataset Importers & Converters
 * Converts external open hardware/research formats (Muse / Mind Monitor, WESAD / Empatica E4)
 * into SimData's standardized 30 Hz 17-column telemetry time-series format.
 */

export type DetectedFormat = 'simdata' | 'muse' | 'wesad' | 'unknown';

export interface ConversionResult {
  success: boolean;
  format: DetectedFormat;
  csv: string;
  frameCount: number;
  durationSeconds: number;
  message?: string;
  error?: string;
}

const SIMDATA_HEADERS = [
  'timestamp', 'bpm', 'rmssd', 'coherence', 'respiration_phase',
  'respiration_value', 'alpha', 'beta', 'theta', 'smr', 'gamma',
  'delta', 'tonic_eda', 'phasic_eda', 'calm_index', 'focus_index', 'artifact'
].join(',');

/**
 * Inspects header row to identify dataset provenance.
 */
export function detectBiometricFormat(csvContent: string): DetectedFormat {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return 'unknown';

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/["']/g, ''));

  // 1. Check for Mind Monitor / Muse format
  const isMuse = headers.some(h =>
    h.includes('alpha_tp9') ||
    h.includes('alpha_af7') ||
    h.includes('delta_tp9') ||
    h.includes('theta_af8') ||
    h.includes('elements: blink') ||
    h.includes('headbandon') ||
    h === 'raw_tp9'
  );
  if (isMuse) return 'muse';

  // 2. Check for WESAD / Empatica format
  const isWesad = headers.some(h =>
    h === 'label' ||
    h === 'condition' ||
    h.includes('resp') ||
    h.includes('chest_resp') ||
    h.includes('respi') ||
    (headers.includes('ecg') && headers.includes('eda')) ||
    (headers.includes('bvp') && headers.includes('eda'))
  ) && !headers.includes('rmssd');
  if (isWesad) return 'wesad';

  // 3. Check for SimData format
  const isSimData = headers.includes('timestamp') &&
    (headers.includes('bpm') || headers.includes('heart_rate')) &&
    (headers.includes('respiration_value') || headers.includes('respiration'));
  if (isSimData) return 'simdata';

  return 'unknown';
}

/**
 * Normalizes an array of numbers from Mind Monitor (can be logarithmic dB/Bels)
 * into a physiological 0.0 - 1.0 power scale.
 */
function normalizeMuseBand(values: number[]): number {
  const valid = values.filter(v => !isNaN(v));
  if (valid.length === 0) return 0.5;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;

  // Mind Monitor relative powers are usually 0.0 - 1.0, while absolute dB are -1.0 to 1.5
  if (avg >= 0.0 && avg <= 1.0) {
    return Math.max(0.02, Math.min(0.98, avg));
  }
  // Convert -1.0 to +1.5 dB range into 0.0 - 1.0
  const normalized = (avg + 1.0) / 2.5;
  return Math.max(0.02, Math.min(0.98, normalized));
}

/**
 * Converts Muse / Mind Monitor CSV to SimData 30Hz standardized CSV.
 * Features 4-channel averaging (TP9, AF7, AF8, TP10), blink/jaw artifact extraction,
 * neurometric calm/focus estimation, and physiological heart/breath synchronization.
 */
export function convertMuseToSimData(csvContent: string, filename: string): ConversionResult {
  try {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, format: 'muse', csv: '', frameCount: 0, durationSeconds: 0, error: 'Empty file' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const colIdx: Record<string, number> = {};
    headers.forEach((h, i) => { colIdx[h] = i; });

    // Helper to extract numeric value from row by partial column name
    const getValuesByPrefix = (rowParts: string[], prefix: string): number[] => {
      const vals: number[] = [];
      for (const [colName, idx] of Object.entries(colIdx)) {
        if (colName.startsWith(prefix) && idx < rowParts.length) {
          const v = parseFloat(rowParts[idx]);
          if (!isNaN(v)) vals.push(v);
        }
      }
      return vals;
    };

    const outLines = [SIMDATA_HEADERS];
    let baseTime = Date.now();
    let prevAlpha = 0.5;

    // Respiration phase simulation accumulator (0.15 Hz natural baseline breath)
    let respPhaseVal = 0.0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(p => p.trim().replace(/["']/g, ''));
      if (row.length < 5) continue;

      // Extract timestamp or generate 30 Hz step
      let ts = baseTime + (i - 1) * 33;
      if (colIdx['timestamp'] !== undefined && row[colIdx['timestamp']]) {
        const rawTs = row[colIdx['timestamp']];
        const parsedTs = Date.parse(rawTs);
        if (!isNaN(parsedTs)) ts = parsedTs;
        else {
          const num = parseFloat(rawTs);
          if (!isNaN(num) && num > 1000000) ts = num > 1e11 ? num : num * 1000;
        }
      }

      // Extract band powers across 4 channels (TP9, AF7, AF8, TP10)
      const alpha = normalizeMuseBand(getValuesByPrefix(row, 'alpha'));
      const beta = normalizeMuseBand(getValuesByPrefix(row, 'beta'));
      const theta = normalizeMuseBand(getValuesByPrefix(row, 'theta'));
      const delta = normalizeMuseBand(getValuesByPrefix(row, 'delta'));
      const gamma = normalizeMuseBand(getValuesByPrefix(row, 'gamma'));
      const smr = Math.max(0.02, Math.min(0.98, (alpha * 0.6 + beta * 0.4)));

      // Artifact extraction: Mind Monitor logs blinks and jaw clenches
      let artifact = 0;
      for (const [colName, idx] of Object.entries(colIdx)) {
        if (colName.includes('blink') || colName.includes('jaw') || colName.includes('elements')) {
          const val = row[idx];
          if (val && (val === '1' || val.toLowerCase().includes('blink') || val.toLowerCase().includes('jaw') || parseFloat(val) > 0)) {
            artifact = 1;
            break;
          }
        }
      }

      // Neurometric Cognitive Indices
      // Calm Index: High Alpha + Low Beta
      const calmIndex = Math.max(0.05, Math.min(0.95, 0.5 + (alpha - beta) * 0.55));
      // Focus Index: SMR & Beta / Theta
      const focusIndex = Math.max(0.05, Math.min(0.95, 0.45 + (beta + smr - theta) * 0.4));

      // Synthesize physiologically plausible coupled HRV & Respiration (since Muse is head-only)
      // Respiratory rate ~0.15 Hz to 0.22 Hz modulated by calm state
      const respFreq = 0.12 + (1.0 - calmIndex) * 0.10;
      respPhaseVal = (respPhaseVal + respFreq * (1 / 30)) % 1.0;
      const respVal = Math.sin(respPhaseVal * 2 * Math.PI) * 0.5 + 0.5;
      const respPhase = respPhaseVal < 0.5 ? 'inhale' : 'exhale';

      // Coupled BPM: RSA increases during inhale, calm drops BPM
      const baseBpm = 62 + (1.0 - calmIndex) * 22;
      const rsaOffset = respPhase === 'inhale' ? 3.0 : -2.5;
      const bpm = (baseBpm + rsaOffset).toFixed(1);
      const rmssd = (45 + calmIndex * 35).toFixed(1);
      const coherence = (0.35 + calmIndex * 0.55).toFixed(2);

      // EDA drift estimate from calm state
      const tonicEda = (3.5 + (1.0 - calmIndex) * 6.0).toFixed(2);
      const phasicEda = (artifact === 1 ? 0.45 : Math.max(0, (beta - prevAlpha) * 0.3)).toFixed(3);
      prevAlpha = alpha;

      outLines.push([
        ts,
        bpm,
        rmssd,
        coherence,
        respPhase,
        respVal.toFixed(3),
        alpha.toFixed(3),
        beta.toFixed(3),
        theta.toFixed(3),
        smr.toFixed(3),
        gamma.toFixed(3),
        delta.toFixed(3),
        tonicEda,
        phasicEda,
        calmIndex.toFixed(2),
        focusIndex.toFixed(2),
        artifact
      ].join(','));
    }

    const frameCount = outLines.length - 1;
    const durationSeconds = Number((frameCount / 30).toFixed(1));

    return {
      success: true,
      format: 'muse',
      csv: outLines.join('\n'),
      frameCount,
      durationSeconds,
      message: `Successfully imported Muse / Mind Monitor recording: ${frameCount} frames @ 30Hz (${durationSeconds}s) with 4-channel EEG & artifacts.`
    };
  } catch (err: any) {
    return {
      success: false,
      format: 'muse',
      csv: '',
      frameCount: 0,
      durationSeconds: 0,
      error: `Failed to convert Muse dataset: ${err.message}`
    };
  }
}

/**
 * Converts WESAD / Empatica E4 multi-sensor recordings into SimData 30Hz standardized CSV.
 * Maps physiological RespiBAN respiration, ECG heart rate, and Empatica EDA tonic/phasic
 * conductance alongside the validated study protocol labels (Baseline, Stress, Meditation).
 */
export function convertWesadToSimData(csvContent: string, filename: string): ConversionResult {
  try {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, format: 'wesad', csv: '', frameCount: 0, durationSeconds: 0, error: 'Empty file' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const colIdx: Record<string, number> = {};
    headers.forEach((h, i) => { colIdx[h] = i; });

    // Identify crucial columns
    const findCol = (candidates: string[]): number => {
      for (const c of candidates) {
        if (colIdx[c] !== undefined) return colIdx[c];
      }
      return -1;
    };

    const respCol = findCol(['resp', 'chest_resp', 'respiration', 'respiration_value']);
    const ecgCol = findCol(['ecg', 'hr', 'bpm', 'heart_rate', 'bvp']);
    const edaCol = findCol(['eda', 'tonic_eda', 'gsr', 'wrist_eda']);
    const labelCol = findCol(['label', 'condition', 'state', 'target']);
    const timeCol = findCol(['time', 'timestamp', 'datetime']);

    const outLines = [SIMDATA_HEADERS];
    let baseTime = Date.now();
    let prevResp = 0.5;
    let edaBaseline = 5.0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(p => p.trim().replace(/["']/g, ''));
      if (row.length < 2) continue;

      let ts = baseTime + (i - 1) * 33;
      if (timeCol !== -1 && row[timeCol]) {
        const parsed = parseFloat(row[timeCol]);
        if (!isNaN(parsed)) ts = parsed > 1e11 ? parsed : (parsed > 1e6 ? parsed * 1000 : baseTime + (parsed * 1000));
      }

      // 1. Respiration
      let respRaw = 0.5;
      if (respCol !== -1 && row[respCol]) {
        respRaw = parseFloat(row[respCol]) || 0.5;
      }
      // Normalize respiration roughly to 0..1
      const respVal = Math.max(0.01, Math.min(0.99, respRaw > 1.0 ? (respRaw % 100) / 100 : Math.abs(respRaw)));
      const respPhase = respVal >= prevResp ? 'inhale' : 'exhale';
      prevResp = respVal;

      // 2. Condition / Protocol Label in WESAD:
      // 0: transient, 1: baseline, 2: stress, 3: amusement, 4: meditation
      const label = labelCol !== -1 && row[labelCol] ? parseInt(row[labelCol], 10) : 1;

      // 3. Heart Rate (BPM) & HRV from ECG or condition
      let baseBpm = 72;
      let coherence = 0.5;
      let rmssd = 50;

      if (label === 2) {
        // Acute Stress (Trier Social Stress Test in WESAD)
        baseBpm = 94;
        coherence = 0.22;
        rmssd = 26;
      } else if (label === 4) {
        // Guided Meditation in WESAD
        baseBpm = 61;
        coherence = 0.86;
        rmssd = 82;
      } else if (label === 3) {
        // Amusement
        baseBpm = 78;
        coherence = 0.60;
        rmssd = 48;
      }

      if (ecgCol !== -1 && row[ecgCol]) {
        const val = parseFloat(row[ecgCol]);
        if (!isNaN(val) && val >= 40 && val <= 180) {
          baseBpm = val;
        }
      }

      // Add RSA breath coupling
      const bpm = (baseBpm + (respPhase === 'inhale' ? 2.5 : -2.0)).toFixed(1);

      // 4. EDA (Tonic + Phasic)
      let rawEda = label === 2 ? 11.5 : (label === 4 ? 3.0 : 5.0);
      if (edaCol !== -1 && row[edaCol]) {
        const parsed = parseFloat(row[edaCol]);
        if (!isNaN(parsed)) rawEda = Math.abs(parsed);
      }
      edaBaseline = edaBaseline * 0.98 + rawEda * 0.02;
      const tonicEda = edaBaseline.toFixed(2);
      const phasicEda = Math.max(0, rawEda - edaBaseline).toFixed(3);

      // 5. Correlated Brainwave & Cognitive States
      let calmIndex = 0.55;
      let focusIndex = 0.50;
      let alpha = 0.50;
      let beta = 0.25;
      let theta = 0.35;
      let smr = 0.45;
      let gamma = 0.10;
      let delta = 0.25;

      if (label === 2) {
        // Stress
        calmIndex = 0.16;
        focusIndex = 0.82;
        alpha = 0.18;
        beta = 0.82;
        theta = 0.20;
        smr = 0.30;
        gamma = 0.35;
      } else if (label === 4) {
        // Meditation
        calmIndex = 0.89;
        focusIndex = 0.65;
        alpha = 0.84;
        beta = 0.14;
        theta = 0.62;
        smr = 0.68;
        gamma = 0.08;
      }

      outLines.push([
        ts,
        bpm,
        rmssd.toFixed(1),
        coherence.toFixed(2),
        respPhase,
        respVal.toFixed(3),
        alpha.toFixed(3),
        beta.toFixed(3),
        theta.toFixed(3),
        smr.toFixed(3),
        gamma.toFixed(3),
        delta.toFixed(3),
        tonicEda,
        phasicEda,
        calmIndex.toFixed(2),
        focusIndex.toFixed(2),
        0 // artifact
      ].join(','));
    }

    const frameCount = outLines.length - 1;
    const durationSeconds = Number((frameCount / 30).toFixed(1));

    return {
      success: true,
      format: 'wesad',
      csv: outLines.join('\n'),
      frameCount,
      durationSeconds,
      message: `Successfully imported WESAD / Empatica recording: ${frameCount} frames @ 30Hz (${durationSeconds}s) with RespiBAN breath & Empatica EDA.`
    };
  } catch (err: any) {
    return {
      success: false,
      format: 'wesad',
      csv: '',
      frameCount: 0,
      durationSeconds: 0,
      error: `Failed to convert WESAD dataset: ${err.message}`
    };
  }
}

/**
 * Universal auto-detecting biometric CSV importer.
 * Intelligently routes incoming files to standard SimData, Muse, or WESAD pipeline.
 */
export function importBiometricCsv(csvContent: string, filename: string): ConversionResult {
  const format = detectBiometricFormat(csvContent);

  if (format === 'muse') {
    return convertMuseToSimData(csvContent, filename);
  }
  if (format === 'wesad') {
    return convertWesadToSimData(csvContent, filename);
  }
  if (format === 'simdata') {
    const lines = csvContent.trim().split(/\r?\n/);
    const frameCount = lines.length - 1;
    const durationSeconds = Number((frameCount / 30).toFixed(1));
    return {
      success: true,
      format: 'simdata',
      csv: csvContent,
      frameCount,
      durationSeconds,
      message: `Standard SimData dataset loaded: ${frameCount} frames (${durationSeconds}s).`
    };
  }

  return {
    success: false,
    format: 'unknown',
    csv: '',
    frameCount: 0,
    durationSeconds: 0,
    error: `Unrecognized format in "${filename}". Expected SimData, Muse / Mind Monitor, or WESAD CSV headers.`
  };
}
