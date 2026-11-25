# SimData — Biofeedback & Neurofeedback Simulator & Bridge

[![Version](https://img.shields.io/badge/version-1.2.0-06b6d4?style=flat-square)](https://github.com/ecal-mid/datastreamer)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](https://opensource.org/licenses/MIT)
[![Stream: 30Hz](https://img.shields.io/badge/stream-30Hz-purple?style=flat-square)](https://github.com/ecal-mid/datastreamer)

**SimData** (v1.2.0) is a lightweight, zero-configuration desktop application and companion Figma plugin designed for interaction design students, creative technologists, and researchers prototyping adaptive biofeedback and neurofeedback interfaces without physical biometric sensors.

Built with **shadcn/ui** and Tailwind CSS, SimData generates and broadcasts physiologically plausible real-time biosignals at **30 Hz** simultaneously across two network protocols:
1. **WebSocket (`ws://127.0.0.1:8081` / `:8080`)** — Structured JSON stream for web prototypes, Figma, and TouchDesigner `WebSocket DAT`.
2. **Open Sound Control via UDP (`127.0.0.1:9000`)** — Semantic OSC message tree for Max/MSP, Pure Data, SuperCollider, and TouchDesigner `OSC In CHOP`.
3. **Dedicated Figma Plugin (`/figma-plugin`)** — Auto-provisions native Figma Variables in a `BioData` collection and updates them via a **10 Hz throttled link** to prevent Figma canvas freezes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SIMDATA CORE                               │
│                                                                         │
│  ┌────────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │  Synthetic Generator   │  │ Single Recordings │  │ Scenario Engine│  │
│  │ (RSA, Perlin, Presets) │  │ (CSV/JSON Parser) │  │  (Playlists)   │  │
│  └───────────┬────────────┘  └─────────┬─────────┘  └───────┬────────┘  │
│              └─────────────────────────┼────────────────────┘           │
│                                        ▼                                │
│                           State Engine (Ticker @ 30Hz)                  │
│                                        │                                │
│        ┌───────────────────────────────┴───────────────────────┐        │
│        ▼                                                       ▼        │
│  WebSocket Server (:8081/:8080)                       OSC UDP Client (:9000)
│  (JSON Payloads)                                      (Semantic Address Tree)
└────────┬───────────────────────────────────────────────────────┬────────┘
         │                                                       │
         ├──────────────────────────┐                            │
         ▼                          ▼                            ▼
   Figma Plugin (10Hz)       TouchDesigner / Web               Max/MSP / TD
```

---

## Download & Installation

Pre-built binaries for Windows and macOS are available on [GitHub Releases](https://github.com/ecal-mid/datastreamer/releases) and in the local [`release/`](release/) directory:

### Windows (x64 & ARM64)
- **Installer:** Download **`SimData Setup 1.2.0.exe`** and run the setup wizard to install with desktop shortcuts and uninstaller.
- **Portable:** Download **`SimData 1.2.0.exe`** to run immediately without installation.

### macOS (Apple Silicon)
1. Download **`SimData-1.2.0-arm64.dmg`** and drag **SimData.app** into your `/Applications` folder (or extract **`SimData-1.2.0-arm64-mac.zip`**).
2. **First Launch (macOS Gatekeeper Note):**  
   If macOS displays *"SimData is damaged and can't be opened"*, open **Terminal** and run:
   ```bash
   xattr -cr /Applications/SimData.app
   ```
   > **Why?** When any open-source app without a paid Apple Developer certificate is downloaded through a browser, macOS Gatekeeper attaches an extended quarantine flag (`com.apple.quarantine`). Running `xattr -cr` strips this tag and lets SimData open immediately.

---

## Quick Start (Building from Source)

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
# Starts the background 30Hz simulation engine, WebSocket server (:8081), OSC UDP (:9000), and Web UI
npm start
```
Open **`http://127.0.0.1:8081`** in any web browser, or run in development mode:
```bash
npm run dev
```

### 3. Desktop Electron Application (Run, Test & Package)

#### A. Run the Desktop App (Development)
```bash
# Run the built app in Electron window with background BioBridge (:8081 & :9000)
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

> [!NOTE]
> **macOS Gatekeeper ("App is damaged and can't be opened"):**
> Because SimData is an open-source tool without an expensive commercial Apple Developer ID certificate, macOS attaches a quarantine flag (`com.apple.quarantine`) to files downloaded from web browsers (GitHub Releases).
> If macOS shows *"SimData is damaged and can't be opened"*, simply open Terminal and run:
> ```bash
> xattr -cr /Applications/SimData.app
> ```
> Or open **System Settings > Privacy & Security**, scroll down and click **"Open Anyway"**.

---

## UI Built with shadcn/ui
SimData's user interface is crafted with **shadcn/ui** design patterns and Radix UI primitives:
* **Global Transport Controls:** DAW-style header transport featuring one-click **Play/Pause** (`LIVE` / `PAUSED` indicators) and instant simulation rate multipliers (**`1x`**, **`2x`**, **`4x`**) that synchronize across WebSocket, OSC, and local simulation loops.
* **Cards & Layout:** High-contrast dark telemetry theme (`Card`, `CardHeader`, `CardTitle`, `CardContent`).
* **Multi-Trace Oscilloscope:** Canvas 2D engine with real-time respiration curves (CH1), realistic optical Photoplethysmography / Blood Volume Pulse (PPG / BVP dicrotic wave) with optional ECG electrical toggle (CH2), synthetic EEG brainwave trace (CH3: Delta, Theta, Alpha, Beta, Gamma blend), and live status badges (`STREAM PAUSED`, `2x SPEED`, `4x SPEED`).
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

### Mode C: Dataset Playback Engine & Universal Biometric Importer
Load, convert, and manage session recordings in `assets/recordings/`:
* **Pre-bundled Recordings**:
  * `meditation_deep_flow.json` (30s 30Hz JSON recording)
  * `cognitive_stress_overload.json` (30s 30Hz JSON recording)
  * `respiratory_coherence_training.csv` (CSV time-series)
  * `drowsiness_hypnagogia.csv` (CSV time-series)
* **Universal Biometric Importer & Dropzone**:
  * Drop native **Muse / Mind Monitor** CSV files (4-channel `alpha_tp9`, `af7`, `af8`, `tp10` EEG recordings) or **WESAD / Empatica E4** CSV files (`resp`, `ecg`, `eda`, condition `label`).
  * **Automatic Format Auto-Detection**: SimData inspects the header structure and converts external formats client-side into the standardized 30 Hz 17-column SimData format in real time.
  * **Physiological Cross-Synthesis**: Missing channels are automatically coupled (e.g. synthesizing respiration & HRV for Muse files; mapping WESAD stress/meditation condition labels into EEG band powers & calmness indices).
  * **Instant Playback & Persistence**: Imported recordings start playing immediately and are saved to `assets/recordings/` prefixed with `imported_muse_` or `imported_wesad_` for persistent access.
* **Test Sample Downloads**: One-click **[🧠 Sample Muse CSV]** and **[💓 Sample WESAD CSV]** buttons right in the Dataset tab to test import without needing your own hardware.
* **Direct File Download & Templates**: Click the download icon next to any recording card to save raw `.csv` or `.json` files, or click **Blank CSV Template** for a blank 17-column header template.
* **Desktop "Open Folder"**: Click **Open Folder** in the desktop app to reveal `assets/recordings/` natively in macOS Finder.
* **Transport Controls**: **Play**, **Pause**, **Loop Toggle**, **Scrubber Timeline Bar**, and **Speed Multipliers** (`0.5x`, `1.0x`, `2.0x`, `4.0x`).

### Mode D: Scenario Playlists & Sequencing Engine
Chain multiple recordings into automated multi-stage physiological journeys (e.g., Baseline 30s → Stress 45s → Recovery 60s):
* **Dual-Mode Dataset Interface**: Easily toggle between **`📄 Single Recordings`** and **`🔀 Scenario Playlists`** via the top segmented control.
* **Non-Destructive Stage Sequencing**:
  * Chain any number of pre-bundled, imported Muse, WESAD, or custom CSV/JSON recordings.
  * Configure custom stage durations (e.g. 15s, 30s, 60s, or full file length) without modifying underlying recordings.
  * Smooth physiological transitions: Choose between seamless **3-second cubic smoothstep crossfades** (`blendFrames`) or **instant cuts** between stages.
* **Live Journey HUD & Dynamic Transport**:
  * **Dual Progress Trackers**: Displays real-time progress for the **Current Stage** and the **Overall Journey**.
  * **Stage Navigation**: Instant **`⏮ Prev Stage`** and **`⏭ Next Stage`** jump buttons, stage index countdown (`Stage 2 / 3`), and stage name chip.
  * **Continuous Loop**: Toggle scenario looping for hands-free exhibition kiosks or long design testing sessions.
* **Scenario Studio & Native Persistence**:
  * **Visual Stage Cards**: Reorder, duplicate, add stages, and select source recordings with instant dropdown selectors.
  * **Save & Manage Scenarios**: Save scenarios locally to `~/Library/Application Support/simdata/playlists/` with instant one-click folder reveal in macOS Finder.
  * **Export & Import**: Share portable `.playlist.json` scenario files across your team or design classroom with 1-click **Export** and **Import** buttons.
* **Pre-bundled Factory Scenarios**:
  * `Stress-Recovery Protocol`: 3-stage protocol (30s Baseline → 45s Stress Overload → 60s Deep Recovery).
  * `Focus to Fatigue Transition`: 3-stage study (45s High Flow → 45s Cognitive Strain → 45s Drowsiness).
  * `Adaptive Rapid Test (15s cycles)`: Fast 15s rapid-cycle scenario designed for iterative Figma prototype stress-testing.
* **Server-Side Background Execution**: The playlist sequencer ticks inside the Node.js server engine (`server/bioServer.cjs`) at **30 Hz**, ensuring zero throttling from Figma or macOS background tab prioritization.

### Manual Overrides & Artifact Injection (Puppeteer Panel)
* Force any parameter ($0.0\text{–}1.0$) with individual lock toggles or release all.
* **Instant Artifact Buttons:**
  * `Blink Spike`: 200ms frontal EEG saturation burst.
  * `Jaw Clench / EMG`: 1.5s high-frequency saturation across Beta & Gamma + Phasic EDA surge.
  * `Sensor Detach`: Drops output to zero and flags `artifact_flag: true`.
  * `Normalize Signals`: Resets artifacts to clean signal.

---

## Network Protocols & Payloads

### WebSocket Output (`ws://127.0.0.1:8081` or `:8080`)
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
    "state_name": "Deep Meditation / Flow",
    "stage_name": "Generative Live",
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
* `/bio/state/name` `[string]` (e.g. `"Deep Meditation / Flow"`)
* `/bio/stage/name` `[string]` (e.g. `"Stage 1: Baseline"`)
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
| `bio_state` | `STRING` | Active affective/cognitive state name (e.g. `"Deep Meditation / Flow"`) |
| `bio_stage` | `STRING` | Scenario stage title or protocol step (e.g. `"Stage 2: Stress Challenge"`) |

> **Throttling Engine:** The plugin receives WebSocket telemetry at 30 Hz and throttles updates to Figma's sandbox to **10 Hz (every 100ms)** to ensure buttery-smooth performance with zero canvas lag.

> **Prototyping Guide:** See [Figma Biofeedback Prototyping Guide](examples/figma/BINDING_GUIDE.md) for step-by-step instructions on creating an Adaptive Breathing Pacer, live BPM text layers, Flow State Aura glow, and Artifact Alert banners.

---

## Creative Coding & Motion Design Integrations

### Adobe After Effects (Motion Graphics & UI Case Studies)
* **Data-Driven Animation**: Export a session as CSV via the top header **`CSV`** button.
* **1:1 Frame Sync**: Set your After Effects composition to **`30 fps`** to match SimData's 30 Hz tick rate.
* **Native Expressions & ExtendScript Baker**: See [After Effects Integration Guide](examples/after-effects/README.md) for ready-to-use expression recipes (respiration scale, BPM counter, calm color shifts) and a keyframe baking script.

### Blender 3D (Procedural Mesh, Geometry Nodes & Shaders)
* **Real-Time Viewport Streaming**: Listen to live 30 Hz OSC UDP packets on port `9000` via a non-blocking Python modal operator.
* **Offline F-Curve Baking**: Import exported CSV files directly into keyframes on any 3D object, light, or shape key at 30 fps.
* **Python Scripts & Guide**: See [Blender Integration Guide](examples/blender/README.md) for complete setup instructions, live listener, and keyframe baker scripts.

### TouchDesigner
* **WebSocket DAT**: Set Network address to `ws://127.0.0.1:8081` (or `:8080`). Parse JSON with a simple DAT execute script.
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
