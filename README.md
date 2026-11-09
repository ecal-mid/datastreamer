# SimData — Biofeedback & Neurofeedback Simulator & Bridge

**SimData** is a lightweight, zero-configuration desktop application and companion Figma plugin designed for interaction design students, creative technologists, and researchers prototyping adaptive biofeedback and neurofeedback interfaces without physical biometric sensors.

Built with **shadcn/ui** and Tailwind CSS, SimData generates and broadcasts physiologically plausible real-time biosignals at **30 Hz** simultaneously across two network protocols:
1. **WebSocket (`ws://127.0.0.1:8080`)** — Structured JSON stream for web prototypes, Figma, and TouchDesigner `WebSocket DAT`.
2. **Open Sound Control via UDP (`127.0.0.1:9000`)** — Semantic OSC message tree for Max/MSP, Pure Data, SuperCollider, and TouchDesigner `OSC In CHOP`.
3. **Dedicated Figma Plugin (`/figma-plugin`)** — Auto-provisions native Figma Variables in a `BioData` collection and updates them via a **10 Hz throttled link** to prevent Figma canvas freezes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       SIMDATA CORE                          │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Synthetic Generator   │       │ Dataset Playback      │  │
│  │ (RSA, Perlin, Presets)│       │ (CSV/JSON Parser)     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              └───────────────┬───────────────┘              │
│                              ▼                              │
│                 State Engine (Ticker @ 30Hz)                │
│                              │                              │
│        ┌─────────────────────┴─────────────────────┐        │
│        ▼                                           ▼        │
│  WebSocket Server (:8080)                 OSC UDP Client (:9000)
│  (JSON Payloads)                          (Semantic Address Tree)
└────────┬───────────────────────────────────────────┬────────┘
         │                                           │
         ├──────────────────────────┐                │
         ▼                          ▼                ▼
   Figma Plugin (10Hz)       TouchDesigner / Web   Max/MSP / TD
```

---

## Quick Start

### 1. Install & Build
```bash
# Install dependencies
npm install

# Run the automated verification test suite
npm test

# Build production bundle and Figma plugin
npm run build
```

### 2. Launch SimData Bridge (Web & CLI)
```bash
# Starts the background 30Hz simulation engine, WebSocket server (:8080), OSC UDP (:9000), and Web UI
npm start
```
Open **`http://127.0.0.1:8080`** in any web browser, or run in development mode:
```bash
npm run dev
```

### 3. Desktop Electron Application (Run, Test & Package)

#### A. Run the Desktop App (Development)
```bash
# Run the built app in Electron window with background BioBridge (:8080 & :9000)
npm run electron

# Or run with live Vite HMR (Hot Module Replacement)
npm run electron:dev
```

#### B. Build Standalone macOS App Bundle (`.app`)
```bash
# Packages the standalone native app into release/mac-arm64/SimData.app
npm run dist:dir

# Open the packaged desktop app directly on macOS
open release/mac-arm64/SimData.app
```

#### C. Build Distributable Installers (`.dmg` / `.zip` on macOS, `.exe` on Windows)
```bash
# Build macOS .dmg installer and zip archive
npm run dist:mac

# Build Windows installer (NSIS / Portable)
npm run dist:win
```

---

## UI Built with shadcn/ui
SimData's user interface is crafted with **shadcn/ui** design patterns and Radix UI primitives:
* **Global Transport Controls:** DAW-style header transport featuring one-click **Play/Pause** (`LIVE` / `PAUSED` indicators) and instant simulation rate multipliers (**`1x`**, **`2x`**, **`4x`**) that synchronize across WebSocket, OSC, and local simulation loops.
* **Cards & Layout:** High-contrast dark telemetry theme (`Card`, `CardHeader`, `CardTitle`, `CardContent`).
* **Multi-Trace Oscilloscope:** Canvas 2D engine with real-time respiration curves (CH1), realistic P-Q-R-S-T ECG cardiac vector pulses (CH2), and live status badges (`STREAM PAUSED`, `2x SPEED`, `4x SPEED`).
* **Mode Navigation:** Accessible `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`) for Generative Presets, Manual Puppeteer, and Dataset Playback.
* **Controls:** Radix-powered `Slider`, `Progress`, `Switch`, and `Button` components.
* **Badges & Modals:** Live telemetry status `Badge` indicators and `Dialog` modals for Figma setup and JSON payload inspection.

---

## Operating Modes

### Mode A: Generative Mathematical Simulation
Physiologically coupled bio-signals computed without flat white noise:
* **Respiration & Heart Rate (RSA):** Sinusoidal breathing with configurable frequency ($0.05\text{–}0.4\text{ Hz} = 3\text{–}24\text{ breaths/min}$). Heart rate ($BPM$) accelerates during inhalation and decelerates during exhalation via Respiratory Sinus Arrhythmia.
* **Coherence Score ($0.0\text{–}1.0$):** Measures phase locking, respiratory smoothness, and autonomic balance.
* **EEG Spectral Band Powers:** 1D Perlin/Simplex organic drift for `delta`, `theta`, `alpha`, `smr`, `beta`, `gamma` ($0.0\text{–}1.0$).
* **Electrodermal Activity (EDA / GSR):** Tonic baseline drift ($2.0\text{–}15.0\ \mu\text{S}$) + spontaneous or triggered Phasic bursts (steep $1.2\text{s}$ rise, exponential $3\text{–}6\text{s}$ decay).

### Mode B: Preset State Machine
One-click scenarios with **3-second smooth interpolation** toward target archetypes:
1. `Baseline / Neutral`: Moderate Alpha ($0.5$), balanced HRV ($BPM \approx 70$), moderate Coherence ($0.5$).
2. `Deep Meditation / Flow`: High Alpha ($0.85$), high SMR ($0.7$), elevated Theta ($0.6$), low Beta ($0.15$), high Coherence ($0.85$).
3. `Cognitive Stress / Overload`: Suppressed Alpha ($0.15$), high Beta ($0.85$), irregular respiration, low Coherence ($0.2$), frequent phasic EDA bursts.
4. `Drowsiness / Hypnagogia`: High Theta ($0.8$), slow shallow breathing, collapsing tonic EDA.

### Mode C: Dataset Playback Engine
Load pre-bundled session recordings from `assets/recordings/`:
* `meditation_deep_flow.json` (30s 30Hz JSON recording)
* `cognitive_stress_overload.json` (30s 30Hz JSON recording)
* `respiratory_coherence_training.csv` (CSV time-series)
* `drowsiness_hypnagogia.csv` (CSV time-series)
* Transport controls: **Play**, **Pause**, **Loop Toggle**, **Scrubber Timeline Bar**, and **Speed Multipliers** (`0.5x`, `1.0x`, `2.0x`, `4.0x`).

### Manual Overrides & Artifact Injection (Puppeteer Panel)
* Force any parameter ($0.0\text{–}1.0$) with individual lock toggles or release all.
* **Instant Artifact Buttons:**
  * `Blink Spike`: 200ms frontal EEG saturation burst.
  * `Jaw Clench / EMG`: 1.5s high-frequency saturation across Beta & Gamma + Phasic EDA surge.
  * `Sensor Detach`: Drops output to zero and flags `artifact_flag: true`.
  * `Normalize Signals`: Resets artifacts to clean signal.

---

## Network Protocols & Payloads

### WebSocket Output (`ws://127.0.0.1:8080`)
Broadcasts at **30 Hz** as stringified JSON:
```json
{
  "timestamp": 1773072000123,
  "mode": "generative",
  "biometrics": {
    "eeg": {
      "alpha": 0.72,
      "beta": 0.24,
      "theta": 0.35,
      "smr": 0.61,
      "gamma": 0.12,
      "delta": 0.30
    },
    "hrv": {
      "bpm": 64.5,
      "rmssd": 68.2,
      "coherence": 0.81
    },
    "respiration": {
      "phase": "inhale",
      "value": 0.68
    },
    "eda": {
      "tonic": 4.8,
      "phasic": 0.02
    }
  },
  "states": {
    "calm_index": 0.78,
    "focus_index": 0.65,
    "artifact_flag": false
  }
}
```

### Open Sound Control Output (UDP `127.0.0.1:9000`)
Broadcasts matching semantic addresses:
* `/bio/eeg/alpha` `[float 0.0 - 1.0]`
* `/bio/eeg/beta` `[float 0.0 - 1.0]`
* `/bio/eeg/theta` `[float 0.0 - 1.0]`
* `/bio/eeg/smr` `[float 0.0 - 1.0]`
* `/bio/hrv/bpm` `[float]`
* `/bio/hrv/coherence` `[float 0.0 - 1.0]`
* `/bio/respiration` `[float -1.0 to 1.0]`
* `/bio/eda/phasic` `[float]`
* `/bio/state/calm` `[float 0.0 - 1.0]`
* `/bio/artifact` `[int 0 or 1]`

---

## Companion Figma Plugin (`/figma-plugin`)

The companion Figma plugin binds live biometric telemetry directly into native Figma Variables.

### Installation in Figma Desktop:
1. Open any Figma design file.
2. In the menu, navigate to: **Plugins &gt; Development &gt; Import plugin from manifest...**
3. Select `figma-plugin/manifest.json` from this repository.
4. Run **SimData Bridge** in Figma.
5. Click **"Setup Bio Variables"**.

### Variables Provisioned in the `BioData` Collection:
| Variable Name | Type | Description |
|---|---|---|
| `bio_alpha` | `FLOAT` | Normalized Alpha power ($0.0 - 1.0$) |
| `bio_beta` | `FLOAT` | Normalized Beta power ($0.0 - 1.0$) |
| `bio_coherence` | `FLOAT` | Heart rate variability coherence ($0.0 - 1.0$) |
| `bio_bpm` | `FLOAT` | Instantaneous heart rate ($45 - 130\text{ BPM}$) |
| `bio_respiration` | `FLOAT` | Normalized respiration amplitude ($0.0 - 1.0$) |
| `bio_artifact` | `BOOLEAN` | Artifact trigger indicator (`true` / `false`) |

> **Throttling Engine:** The plugin receives WebSocket telemetry at 30 Hz and throttles updates to Figma's sandbox to **10 Hz (every 100ms)** to ensure buttery-smooth performance with zero canvas lag.

> **Prototyping Guide:** See [Figma Biofeedback Prototyping Guide](examples/figma/BINDING_GUIDE.md) for step-by-step instructions on creating an Adaptive Breathing Pacer, live BPM text layers, Flow State Aura glow, and Artifact Alert banners.

---

## Creative Coding Integrations

### TouchDesigner
* **WebSocket DAT**: Set Network address to `ws://127.0.0.1:8080`. Parse JSON with a simple DAT execute script.
* **OSC In CHOP**: Set Network Port to `9000`. Channels `/bio/eeg/*`, `/bio/hrv/*`, `/bio/respiration` appear instantly.

### Max/MSP & Pure Data
```
[udpreceive 9000]
|
[OSC-route /bio]
|
[OSC-route /eeg /hrv /respiration /state /artifact]
```

---

## License
MIT. Created for interaction design education and biosignal prototyping.
