/**
 * SimData Biometric Dataset Importers & Converters (CommonJS)
 * Converts Muse / Mind Monitor and WESAD / Empatica E4 CSVs into SimData 30Hz standardized CSV.
 */

const SIMDATA_HEADERS = [
  'timestamp', 'bpm', 'rmssd', 'coherence', 'respiration_phase',
  'respiration_value', 'alpha', 'beta', 'theta', 'smr', 'gamma',
  'delta', 'tonic_eda', 'phasic_eda', 'calm_index', 'focus_index', 'artifact'
].join(',');

function detectBiometricFormat(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return 'unknown';

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/["']/g, ''));

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

  const isWesad = headers.some(h =>
    h === 'label' ||
    h === 'condition' ||
    h.includes('resp') ||
    h.includes('chest_resp') ||
    h.includes('respi') ||
    (headers.includes('ecg') && headers.includes('eda')) ||
    (headers.includes('bvp') && headers.includes('eda')) ||
    (headers.includes('ppg') && headers.includes('eda'))
  ) && !headers.includes('rmssd');
  if (isWesad) return 'wesad';

  const isSimData = headers.includes('timestamp') &&
    (headers.includes('bpm') || headers.includes('heart_rate')) &&
    (headers.includes('respiration_value') || headers.includes('respiration'));
  if (isSimData) return 'simdata';

  return 'unknown';
}

function normalizeMuseBand(values) {
  const valid = values.filter(v => !isNaN(v));
  if (valid.length === 0) return 0.5;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (avg >= 0.0 && avg <= 1.0) {
    return Math.max(0.02, Math.min(0.98, avg));
  }
  const normalized = (avg + 1.0) / 2.5;
  return Math.max(0.02, Math.min(0.98, normalized));
}

function convertMuseToSimData(csvContent, filename) {
  try {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, format: 'muse', csv: '', frameCount: 0, durationSeconds: 0, error: 'Empty file' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const colIdx = {};
    headers.forEach((h, i) => { colIdx[h] = i; });

    const getValuesByPrefix = (rowParts, prefix) => {
      const vals = [];
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
    let respPhaseVal = 0.0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(p => p.trim().replace(/["']/g, ''));
      if (row.length < 5) continue;

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

      const alpha = normalizeMuseBand(getValuesByPrefix(row, 'alpha'));
      const beta = normalizeMuseBand(getValuesByPrefix(row, 'beta'));
      const theta = normalizeMuseBand(getValuesByPrefix(row, 'theta'));
      const delta = normalizeMuseBand(getValuesByPrefix(row, 'delta'));
      const gamma = normalizeMuseBand(getValuesByPrefix(row, 'gamma'));
      const smr = Math.max(0.02, Math.min(0.98, (alpha * 0.6 + beta * 0.4)));

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

      const calmIndex = Math.max(0.05, Math.min(0.95, 0.5 + (alpha - beta) * 0.55));
      const focusIndex = Math.max(0.05, Math.min(0.95, 0.45 + (beta + smr - theta) * 0.4));

      const respFreq = 0.12 + (1.0 - calmIndex) * 0.10;
      respPhaseVal = (respPhaseVal + respFreq * (1 / 30)) % 1.0;
      const respVal = Math.sin(respPhaseVal * 2 * Math.PI) * 0.5 + 0.5;
      const respPhase = respPhaseVal < 0.5 ? 'inhale' : 'exhale';

      const baseBpm = 62 + (1.0 - calmIndex) * 22;
      const rsaOffset = respPhase === 'inhale' ? 3.0 : -2.5;
      const bpm = (baseBpm + rsaOffset).toFixed(1);
      const rmssd = (45 + calmIndex * 35).toFixed(1);
      const coherence = (0.35 + calmIndex * 0.55).toFixed(2);

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
  } catch (err) {
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

function convertWesadToSimData(csvContent, filename) {
  try {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, format: 'wesad', csv: '', frameCount: 0, durationSeconds: 0, error: 'Empty file' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const colIdx = {};
    headers.forEach((h, i) => { colIdx[h] = i; });

    const findCol = (candidates) => {
      for (const c of candidates) {
        if (colIdx[c] !== undefined) return colIdx[c];
      }
      return -1;
    };

    const respCol = findCol(['resp', 'chest_resp', 'respiration', 'respiration_value']);
    const ecgCol = findCol(['ppg', 'bvp', 'ecg', 'hr', 'bpm', 'heart_rate']);
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

      let respRaw = 0.5;
      if (respCol !== -1 && row[respCol]) {
        respRaw = parseFloat(row[respCol]) || 0.5;
      }
      const respVal = Math.max(0.01, Math.min(0.99, respRaw > 1.0 ? (respRaw % 100) / 100 : Math.abs(respRaw)));
      const respPhase = respVal >= prevResp ? 'inhale' : 'exhale';
      prevResp = respVal;

      const label = labelCol !== -1 && row[labelCol] ? parseInt(row[labelCol], 10) : 1;

      let baseBpm = 72;
      let coherence = 0.5;
      let rmssd = 50;

      if (label === 2) {
        baseBpm = 94;
        coherence = 0.22;
        rmssd = 26;
      } else if (label === 4) {
        baseBpm = 61;
        coherence = 0.86;
        rmssd = 82;
      } else if (label === 3) {
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

      const bpm = (baseBpm + (respPhase === 'inhale' ? 2.5 : -2.0)).toFixed(1);

      let rawEda = label === 2 ? 11.5 : (label === 4 ? 3.0 : 5.0);
      if (edaCol !== -1 && row[edaCol]) {
        const parsed = parseFloat(row[edaCol]);
        if (!isNaN(parsed)) rawEda = Math.abs(parsed);
      }
      edaBaseline = edaBaseline * 0.98 + rawEda * 0.02;
      const tonicEda = edaBaseline.toFixed(2);
      const phasicEda = Math.max(0, rawEda - edaBaseline).toFixed(3);

      let calmIndex = 0.55;
      let focusIndex = 0.50;
      let alpha = 0.50;
      let beta = 0.25;
      let theta = 0.35;
      let smr = 0.45;
      let gamma = 0.10;
      let delta = 0.25;

      if (label === 2) {
        calmIndex = 0.16;
        focusIndex = 0.82;
        alpha = 0.18;
        beta = 0.82;
        theta = 0.20;
        smr = 0.30;
        gamma = 0.35;
      } else if (label === 4) {
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
        0
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
  } catch (err) {
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

function importBiometricCsv(csvContent, filename) {
  const format = detectBiometricFormat(csvContent);
  if (format === 'muse') return convertMuseToSimData(csvContent, filename);
  if (format === 'wesad') return convertWesadToSimData(csvContent, filename);
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

module.exports = {
  detectBiometricFormat,
  convertMuseToSimData,
  convertWesadToSimData,
  importBiometricCsv,
};

