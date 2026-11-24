# SimData v1.2.0 Release Notes

**Release Date:** November 24, 2026  
**Build:** `v1.2.0` (macOS Apple Silicon & Universal Web)  
**Binary Downloads:** [SimData-1.2.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64.dmg) • [SimData-1.2.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64-mac.zip) • [simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)

---

## 🌟 Highlights

SimData **v1.2.0** introduces **Scenario Playlists & Biometric Sequencing Engine**, allowing interaction designers, researchers, and creative technologists to chain multiple biometric recordings into multi-stage state transitions (e.g., *Baseline 30s → Stress 45s → Recovery 60s*). With smooth physiological cubic crossfades, a dedicated visual Scenario Studio, portable `.playlist.json` export/import, and native persistence in macOS Application Support, prototyping adaptive, state-dependent interfaces in Figma, TouchDesigner, or Max/MSP has never been easier.

---

## 🚀 What's New

### 1. Scenario Playlists & Sequencing Engine
- **Multi-Stage Biometric Journeys:** Chain any sequence of recordings (factory presets, Muse, WESAD, or custom CSV/JSON sessions) into an automated timeline.
- **Configurable Stage Duration:** Override recording playback durations per stage (e.g., play only the first 15s or 45s of a 5-minute dataset) non-destructively.
- **Physiological Cubic Crossfading:** Seamlessly blend between disparate recordings using 3-second cubic smoothstep interpolation (`t * t * (3 - 2 * t)`), eliminating sudden metric cliffs across respiration, ECG vectors, and EEG band powers. Instant cut transitions are also supported.
- **Server-Side 30 Hz Execution:** Like single playback, scenarios tick directly inside the Node.js background engine (`server/bioServer.cjs`), ensuring complete immunity against Chromium background tab throttling when working actively inside Figma.

### 2. Scenario Studio & UI
- **Dual-Mode Dataset Interface:** Toggle effortlessly between **`📄 Single Recordings`** and **`🔀 Scenario Playlists`** via a high-contrast segmented control.
- **Visual Scenario Editor:**
  - Create, rename, duplicate, and delete custom scenarios.
  - Interactive stage cards with source recording dropdowns, stage labels, transition toggles, and duration steppers.
  - Reorder stages with instant Move Up / Move Down buttons.
- **Live Scenario HUD & Transport:**
  - **Dual Progress Bars:** Real-time visual feedback tracking both **Current Stage Progress** and **Overall Journey Progress**.
  - **Stage Stepper Controls:** Quick **`⏮ Prev Stage`** and **`⏭ Next Stage`** buttons to jump directly between states during live design reviews.
  - **Status Pill:** Displays active stage index, stage title, and remaining time countdown (`Stage 2 / 3: Cognitive Strain (24s remaining)`).

### 3. Portable Scenario Persistence & Sharing
- **Factory Scenarios Included:**
  - `stress_recovery_protocol.json`: 3-stage protocol (30s Baseline → 45s Stress Overload → 60s Deep Recovery).
  - `focus_to_fatigue.json`: 3-stage study (45s High Flow → 45s Cognitive Strain → 45s Drowsiness).
  - `adaptive_rapid_test.json`: 15s rapid-cycle scenario designed for iterative Figma prototype stress-testing.
- **1-Click Export & Import:** Save portable `.playlist.json` files to share with teammates, students, or project repositories.
- **Native macOS Persistence:** Custom playlists persist in `~/Library/Application Support/simdata/playlists/`, with an **Open Folder** button to reveal them in Finder.

### 4. Compact EEG Spectral Band Power Card
- Optimized vertical padding, font scales, and progress bars to provide maximum oscilloscope canvas visibility without sacrificing biometric telemetry readability.

---

## 🧪 Verification & Testing

SimData v1.2.0 expands the automated test suite (`npm test`) to **15 comprehensive tests**:
1. Telemetry Schema & Range Conformance (30 Hz)
2. Respiratory Sinus Arrhythmia (RSA) Physiological Coupling
3. 3-Second Non-Linear Preset Transition & Interpolation
4. Motion Artifact Injection & Recovery (Blink, Clench, Detach)
5. OSC UDP 4-Byte Binary Alignment (10 Addresses)
6. Pre-bundled Dataset Recording Assets Integrity
7. Figma Plugin Manifest & Typings Compilation
8. Main Streamer Play/Pause Transport State Freeze
9. Simulation Speed Multipliers (1x, 2x, 4x)
10. 17-Column Template & REST Upload Persistence
11. Muse / Mind Monitor CSV Auto-Detection & Conversion
12. WESAD / Empatica E4 CSV Auto-Detection & Conversion
13. Server-Side Dataset Stepping, Pause Freeze & Variable Speed
14. Scenario Playlist Sequencing & Crossfade Transitions
15. Live WebSocket Telemetry Streaming in Playback Mode

---

## 📦 Distribution Packages

| File | Size | Description |
| :--- | :--- | :--- |
| **[SimData-1.2.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64.dmg)** | ~99 MB | Apple Silicon macOS Installer (Drag-and-Drop) |
| **[SimData-1.2.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64-mac.zip)** | ~95 MB | Portable Apple Silicon macOS Application Bundle |
| **[simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)** | ~6 KB | Companion Figma Plugin Bundle (Manifest + UI + Code) |

---

### ⚠️ macOS Gatekeeper Note ("App is damaged and can't be opened")
Because SimData is an open-source tool built without an Apple Developer ID paid certificate ($99/yr), macOS attaches a `com.apple.quarantine` extended attribute when downloaded from GitHub Releases.
To open the app, run this single command in **Terminal**:
```bash
xattr -cr /Applications/SimData.app
```
*(Or navigate to **System Settings > Privacy & Security**, scroll down to the Security section, and click **"Open Anyway"**).*

---

# SimData v1.1.0 Release Notes

**Release Date:** November 17, 2026  
**Build:** `v1.1.0` (macOS Apple Silicon & Universal Web)  
**Binary Downloads:** [SimData-1.1.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.1.0-arm64.dmg) • [SimData-1.1.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.1.0-arm64-mac.zip) • [simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)

---

## 🌟 Highlights

SimData **v1.1.0** introduces a **Universal Biometric Importer** supporting open research datasets (Muse / Mind Monitor and WESAD / Empatica E4), migrates dataset playback to a **background server engine** that never throttles when designing in Figma, refines oscilloscope graph styling, and enables persistent local storage in packaged macOS builds.

---

## 🚀 What's New

### 1. Universal Biometric Importer & Dropzone
- **One-Click Drag & Drop:** Easily import external biometric datasets by dragging `.csv` or `.json` files directly into the Dataset Playback tab.
- **Auto-Detection for Open Hardware:**
  - **Muse / Mind Monitor CSV:** Parses 4-channel EEG frequency bands ($\delta$, $\theta$, $\alpha$, $\beta$, $\gamma$), accelerometer activity, jaw clenches, blinks, and heart rate when available.
  - **WESAD / Empatica E4 CSV:** Ingests BVP/Heart Rate BPM, chest-strap respiration, tonic & phasic Electrodermal Activity (EDA / GSR), and skin temperature.
  - **Standard SimData Format:** Accepts full 17-column biometric recordings.
- **Built-In Sample Datasets:** Includes downloadable sample CSVs directly in the UI for rapid testing and demonstration.
- **Instant Library Integration:** Automatically converts foreign formats to normalized 30 Hz SimData schema, saves them to the active library with dedicated badges (`MUSE`, `WESAD`), and immediately starts playback.

### 2. Server-Side Dataset Playback Engine (Zero Background Throttling)
- **Native Node.js Ticker:** Dataset playback now ticks directly inside the background Node.js server (`server/bioServer.cjs`) rather than the browser renderer.
- **Figma Background Immunity:** When switching windows to Figma or minimizing SimData, Chromium's background tab throttling (which slows down browser `setInterval` from 30 Hz to 1 Hz) no longer affects telemetry. The 30 Hz WebSocket stream to Figma and OSC UDP `:9000` stream remain completely uninterrupted.
- **Auto-Play on Selection:** Clicking any dataset card in the active library instantly selects and unpauses playback with zero extra clicks.
- **Eliminated Stream Collisions:** Removed dual-ticker conflicts between synthetic simulation and dataset replay, ensuring clean, jitter-free waveforms on oscilloscopes and downstream receivers.

### 3. Streamlined Dataset UI
- **Cleaner Interface:** Removed redundant scrubber controls from the Dataset tab; transport is now cleanly unified with the global header's **LIVE / PAUSED** button and speed selectors (`1x`, `2x`, `4x`).
- **Live Status Badges:** Active dataset cards now display a glowing `PLAYING` badge alongside format chips (`JSON`, `CSV`, `MUSE`, `WESAD`).
- **One-Click Finder Access:** Added an **Open Folder** shortcut to jump directly to the local recordings folder in macOS Finder.
- **Blank CSV Template:** One-click download of a standardized 17-column biometric template ready for custom spreadsheet data entry.

### 4. Waveform Visualization Refinements
- **Calibrated EEG Trace:** Adjusted EEG waveform canvas drawing parameters to ensure visual weight and stroke consistency match the ECG and Respiration channels across high-DPI and Retina displays.
- **Header Badge:** Updated the top branding bar with the official `v1.1.0` release tag.

### 5. Persistent Local Storage in Packaged App
- **Writable User Directory:** In packaged macOS Electron builds (`.dmg` / `.app`), custom recordings and converted datasets are automatically stored in:
  `~/Library/Application Support/simdata/recordings/`
- Solves read-only file write errors previously caused by macOS code-signed `app.asar` sandboxing.
- Factory presets and recordings are safely pre-seeded on first launch.

---

## 🛠️ Bug Fixes & Stability

- **Fixed WebSocket Stalling in Playback Mode:** Resolved an issue where playback mode returned early on the server, halting data transmission to the Figma plugin.
- **Fixed Tab Crash (`Sparkles is not defined`):** Corrected missing icon imports in `DatasetTab.tsx` that caused a black screen on tab switch.
- **Fixed Playback Paused-on-Load:** Datasets now start streaming immediately upon selection without requiring multiple toggles of the Live button.
- **Preserved Standalone Offline Mode:** If SimData is opened in a standalone web browser without the backend server running, it gracefully falls back to local client-side 30 Hz simulation.

---

## 🧪 Automated Testing

SimData v1.1.0 includes an expanded automated test suite (`npm test`) covering **14 verification tests**:
1. Telemetry Schema & Range Conformance (30 Hz)
2. Respiratory Sinus Arrhythmia (RSA) Physiological Coupling
3. 3-Second Non-Linear Preset Transition & Interpolation
4. Motion Artifact Injection & Recovery (Blink, Clench, Detach)
5. OSC UDP 4-Byte Binary Alignment (10 Addresses)
6. Pre-bundled Dataset Recording Assets Integrity
7. Figma Plugin Manifest & Typings Compilation
8. Main Streamer Play/Pause Transport State Freeze
9. Simulation Speed Multipliers (1x, 2x, 4x)
10. 17-Column Template & REST Upload Persistence
11. Muse / Mind Monitor CSV Auto-Detection & Conversion
12. WESAD / Empatica E4 CSV Auto-Detection & Conversion
13. Server-Side Dataset Stepping, Pause Freeze & Variable Speed
14. Live WebSocket Telemetry Streaming in Playback Mode

---

## 📦 Distribution Packages

| File | Size | Description |
| :--- | :--- | :--- |
| **[SimData-1.1.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.1.0-arm64.dmg)** | ~99 MB | Apple Silicon macOS Installer (Drag-and-Drop) |
| **[SimData-1.1.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.1.0-arm64-mac.zip)** | ~95 MB | Portable Apple Silicon macOS Application Bundle |
| **[simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)** | ~6 KB | Companion Figma Plugin Bundle (Manifest + UI + Code) |

---

### ⚠️ macOS Gatekeeper Note ("App is damaged and can't be opened")
Because SimData is an open-source tool built without an Apple Developer ID paid certificate ($99/yr), macOS attaches a `com.apple.quarantine` extended attribute when downloaded from the internet (GitHub Releases). On modern macOS versions (Ventura, Sonoma, Sequoia), Gatekeeper displays a misleading *"SimData is damaged and can't be opened"* warning.

To open the app, run this single command in **Terminal**:
```bash
xattr -cr /Applications/SimData.app
```
*(Or navigate to **System Settings > Privacy & Security**, scroll down to the Security section, and click **"Open Anyway"**).*


