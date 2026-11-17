# SimData + Adobe After Effects Integration Guide

This guide explains how to drive data-driven animations in **Adobe After Effects (CC 2018 / v15+)** using biometric telemetry exported from **SimData**.

Because SimData generates samples at a steady **30 Hz**, setting your After Effects composition to **30 frames per second (fps)** creates a **perfect 1:1 frame-to-sample sync** (Frame 0 = Row 0, Frame 30 = exactly 1 second of simulation time).

---

## 1. Quick Start

1. In the SimData Web UI or Desktop App, run your simulation scenario or dataset.
2. Click the **`CSV`** button in the top-right header to export `simdata_session_<timestamp>.csv`.
3. In After Effects, open or create a composition with frame rate set to **`30 fps`**.
4. Drag your exported `.csv` into the After Effects **Project** panel (File > Import > File).
5. Drag the `.csv` file into your composition layer stack.

---

## 2. CSV Column Mapping

The exported CSV file contains 17 columns indexed `0` to `16`:

| Index | Column Name | Range | Description |
| :---: | :--- | :---: | :--- |
| `0` | `timestamp` | ms | Unix epoch timestamp in milliseconds |
| `1` | `bpm` | 40 – 180 | Heart rate in beats per minute |
| `2` | `rmssd` | 10 – 150 | Heart Rate Variability metric (parasympathetic tone) |
| `3` | `coherence` | 0.0 – 1.0 | HRV/respiration phase synchronization score |
| `4` | `respiration_phase` | inhale / exhale | Discrete respiratory phase |
| `5` | `respiration_value` | 0.0 – 1.0 | Continuous breath volume (0 = empty, 1 = full) |
| `6` | `alpha` | 0.0 – 1.0 | EEG 8–12 Hz power (relaxed focus) |
| `7` | `beta` | 0.0 – 1.0 | EEG 13–30 Hz power (alertness, cognitive effort) |
| `8` | `theta` | 0.0 – 1.0 | EEG 4–8 Hz power (deep relaxation, hypnagogia) |
| `9` | `smr` | 0.0 – 1.0 | EEG 12–15 Hz power (stillness, body regulation) |
| `10` | `gamma` | 0.0 – 1.0 | EEG 30–50 Hz power (heightened cognitive processing) |
| `11` | `delta` | 0.0 – 1.0 | EEG 0.5–4 Hz power (deep restorative rest) |
| `12` | `tonic_eda` | 1.0 – 20.0 | Electrodermal activity baseline skin conductance (µS) |
| `13` | `phasic_eda` | 0.0 – 2.0 | Fast sympathetic skin arousal spikes (SCR) |
| `14` | `calm_index` | 0.0 – 1.0 | High-level calm state (0 = stressed, 1 = serene) |
| `15` | `focus_index` | 0.0 – 1.0 | High-level focus state (0 = scattered, 1 = laser focused) |
| `16` | `artifact` | 0 or 1 | Blink or muscle noise indicator flag |

---

## 3. Ready-to-Use Expression Recipes

To apply an expression in After Effects:
- Hold **Alt** (Windows) or **Option** (macOS) and click the stopwatch next to any property.
- Paste the corresponding expression snippet below.

### A. Respiration Breathing Orb (Scale)
*Property: Transform > Scale of a circle shape layer*
```javascript
// Connect to imported CSV
const data = footage("simdata_session.csv");
const f = clamp(timeToFrames(time), 0, data.dataRowCount - 1);

// Column 5 is respiration_value (0.0 to 1.0)
const resp = parseFloat(data.dataValue([5, f]));

// Scale from 80% on empty lung to 140% on full inhale
const s = linear(resp, 0, 1, 80, 140);
[s, s];
```

### B. Live Heart Rate Counter (Source Text)
*Property: Text > Source Text of a Text layer*
```javascript
const data = footage("simdata_session.csv");
const f = clamp(timeToFrames(time), 0, data.dataRowCount - 1);

// Column 1 is bpm
const bpm = parseFloat(data.dataValue([1, f]));

Math.round(bpm) + " BPM";
```

### C. Calm / Stress State Color Shift (Fill Color)
*Property: Contents > Fill > Color (or Generate > Fill effect)*
```javascript
const data = footage("simdata_session.csv");
const f = clamp(timeToFrames(time), 0, data.dataRowCount - 1);

// Column 14 is calm_index (0.0 = high stress, 1.0 = deep calm)
const calm = parseFloat(data.dataValue([14, f]));

// Colors formatted as [R, G, B, Alpha] from 0 to 1
const stressColor = [0.95, 0.25, 0.25, 1]; // Coral red
const calmColor   = [0.06, 0.73, 0.51, 1]; // Emerald green

linear(calm, 0, 1, stressColor, calmColor);
```

### D. EEG Brainwave Aura / Glow Intensity
*Property: Stylize > Glow > Glow Intensity (or Opacity)*
```javascript
const data = footage("simdata_session.csv");
const f = clamp(timeToFrames(time), 0, data.dataRowCount - 1);

// Column 6 is alpha power (0.0 to 1.0)
const alpha = parseFloat(data.dataValue([6, f]));

// Modulate glow intensity between 0.2 and 2.5
linear(alpha, 0, 1, 0.2, 2.5);
```

### E. Artifact Glitch / Alert (Opacity)
*Property: Transform > Opacity of an alert banner or glitch layer*
```javascript
const data = footage("simdata_session.csv");
const f = clamp(timeToFrames(time), 0, data.dataRowCount - 1);

// Column 16 is artifact flag (1 for glitch, 0 for normal)
const isArtifact = parseFloat(data.dataValue([16, f]));

isArtifact === 1 ? 100 : 0;
```

---

## 4. Method 2: Baking Keyframes via ExtendScript

If you want actual keyframe points on your timeline (to manipulate handles in the **Graph Editor**, apply **Easy Ease (`F9`)**, or delete specific outliers), use the included helper script:

1. In After Effects, select the layer and property you want to animate (e.g. `Scale` or a `Slider Control`).
2. Go to **File > Scripts > Run Script File...**
3. Select `examples/after-effects/bake_simdata_to_keyframes.jsx`.
4. Pick your exported CSV file and choose which metric column to bake.
5. The script automatically places keyframes spaced at 30 fps across the active work area.
