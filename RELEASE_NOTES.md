# SimData v1.2.0 Release Notes

**Release Date:** November 25, 2026  
**Build:** `v1.2.0` (Windows x64 & ARM64, macOS Apple Silicon, Universal Web)  
**Binary Downloads:**
- **Windows:** [SimData Setup 1.2.0.exe](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData%20Setup%201.2.0.exe) (Installer) • [SimData 1.2.0.exe](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData%201.2.0.exe) (Portable)
- **macOS:** [SimData-1.2.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64.dmg) (Installer) • [SimData-1.2.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64-mac.zip) (Portable)
- **Figma Plugin:** [simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)

---

## 🌟 Highlights

SimData **v1.2.0** is a major release introducing:
1. **Official Windows Builds:** Full native installer (`NSIS`) and zero-install portable executable for standard Windows 64-bit (Intel/AMD) and ARM64 machines.
2. **Scenario Playlists & Sequencing Engine:** Chain multiple biometric states into continuous multi-stage timelines with smooth cubic crossfades and live transport scrubbing.
3. **Interactive Biometrics & Interaction Guide (In-App Help):** A comprehensive 4-tab interactive reference with clear, non-jargon explanations, search filtering, physiological coupling rules, state archetypes, and native Figma prototyping recipes.
4. **Physiological Sensor Artifacts & Acute Stress Testing:** Realistic simulation of EOG eye blinks, EMG jaw clenching, and sensor detachments via `bio_artifact` alongside dedicated acute startle recordings to test error-resilient biofeedback UX.
5. **Alternative Compact Oscilloscope View:** An ultra-compact 80px high-density mini-trace canvas that keeps real-time telemetry visible without requiring scrolling while working with playlists or datasets.
6. **Optimized Layout & Window Ergonomics:** Refined header layout, persistent OSC badge across all breakpoints, wider responsive stage name inputs, and a calibrated default window size (1200x800).

---

## 🚀 What's New

### 1. Windows Desktop Distribution (x64 & ARM64)
- **Full Windows NSIS Installer:** Standard one-click installer (`SimData Setup 1.2.0.exe`) with desktop shortcuts, Start Menu integration, and clean uninstaller support.
- **Standalone Portable Executable:** Zero-install single file (`SimData 1.2.0.exe`) that runs immediately from flash drives or shared folders without requiring administrative permissions.
- **Multi-Architecture Support:** Built for both standard 64-bit Windows PCs (Intel/AMD `x64`) and ARM64 Windows laptops.
- **Zero-Config Protocol Stack:** Auto-provisions background WebSocket (`ws://127.0.0.1:8081`) and OSC UDP broadcast (`127.0.0.1:9000`) on launch.

### 2. In-App Biometrics & Interaction Guide (Help Modal)
- **Tab 1 — Terms & Dictionary:** Clear, accessible explanations of all biometric terms without dense medical jargon or confusing metaphors:
  - Electrodermal Activity: **EDA / GSR**, **Tonic EDA** (SCL baseline), **Phasic EDA** (SCR reaction spikes).
  - Cardiac & Autonomic: **Heart Rate (BPM)**, **Optical PPG & Blood Volume Pulse (BVP)**, **ECG vs. PPG Comparison**, **Heart Rate Variability (RMSSD)**, **Cardiorespiratory Harmony (Coherence Score)**.
  - Respiratory: **Breathing Phase & Depth (Respiration)**.
  - Brainwaves: **Alpha (8–12 Hz)**, **Beta (15–30 Hz)**, **Theta (4–8 Hz)**, **Delta (0.5–4 Hz)**, and **SMR Rhythm (12–15 Hz)**.
  - Metadata: **Cognitive State Name (`bio_state`)** and **Artifact Flag (`bio_artifact`)**.
  - Interactive live search to filter terms instantly.
- **Tab 2 — How Signals Connect (Physiological Coupling):**
  - **Respiratory Sinus Arrhythmia (RSA):** The breath-heart coupling (heart accelerates during inhalation, decelerates during exhalation).
  - **The Mental Stress Response:** Multi-system sympathetic cascade (elevated BPM, rapid breathing, Phasic EDA spikes, Alpha collapse, Beta surge).
  - **Resonant Breathing & Coherence:** Harmonic synchronization at ~6 breaths/min.
  - **Distinguishing Real Stress from Physical Sensor Noise:** Deep dive explaining why real stress moves all sensors harmoniously, while jaw clenching (EMG) or blinks (EOG) only corrupt isolated channels.
- **Tab 3 — States & Scenarios Matrix:**
  - Standard archetypes: *Baseline / Neutral*, *Deep Meditation / Flow*, *Cognitive Stress / Overload*, *Drowsiness / Hypnagogia*.
  - Added new scenarios: *Acute Stress Trigger / Startle* and *Sensor Detached / Hardware Artifact*.
- **Tab 4 — Figma Design Recipes:**
  - Recipe 1: Switch UI Layouts Automatically with `bio_state`.
  - Recipe 2: Dynamic Breathing Pacer with `bio_respiration`.
  - Recipe 3: Sensor Disconnect Alert & Graceful Degradation with `bio_artifact`.
  - Recipe 4: Responding to Acute Stress Triggers with `bio_phasic` & `bio_bpm`.

### 3. Sensor Artifact Simulation & Dedicated Testing Datasets
- **Realistic Artifact Modeling:**
  - **Eye Blinks & Saccades (EOG):** Simulates the eyeball electrical dipole generating brief 200–400 ms frontal voltage deflections.
  - **Jaw Clench & Facial Tension (EMG):** High-amplitude 20–100+ Hz electrical bursts that mimic muscle contraction noise.
  - **Sensor Detachment & Contact Loss:** Flatlined readouts, zero BPM, or 50/60 Hz electrical grid noise with `bio_artifact = true`.
- **Pre-Bundled Artifact & Stress Recordings:**
  - `acute_stress_trigger.json` (30s): Simulates an immediate shock event with an instantaneous Phasic EDA surge and BPM jump.
  - `sensor_artifact_dropout.json` (30s): Simulates loose hardware contact and total sensor detachment.
- **Pre-Bundled Testing Playlist:**
  - `ux_stress_and_artifact_test.json`: 4-stage automated protocol (*Baseline Onboarding → Sudden Error Startle → Sensor Disconnection → Guided Resonant Recovery*) designed to test error states and calm-down interactions in Figma prototypes.

### 4. Scenario Playlists & Sequencing Engine
- **Multi-Stage Biometric Journeys:** Chain any sequence of recordings (factory presets, Muse, WESAD, or custom CSV/JSON sessions) into an automated timeline.
- **Configurable Stage Duration:** Override recording playback durations per stage non-destructively.
- **Physiological Cubic Crossfading:** Seamlessly blend between disparate recordings using 3-second cubic smoothstep interpolation (`t * t * (3 - 2 * t)`), eliminating sudden metric cliffs across respiration, ECG vectors, and EEG band powers. Instant cut transitions are also supported.
- **Server-Side 30 Hz Execution:** Like single playback, scenarios tick directly inside the Node.js background engine (`server/bioServer.cjs`), ensuring complete immunity against Chromium background tab throttling when working actively inside Figma.
- **Visual Scenario Editor:**
  - Create, rename, duplicate, and delete custom scenarios.
  - Interactive stage cards with source recording dropdowns, stage labels, transition toggles, and duration steppers.
  - Reorder stages with instant Move Up / Move Down buttons.
- **Live Scenario HUD & Transport:**
  - Dual progress bars (Current Stage & Total Journey Progress).
  - Quick `⏮ Prev Stage` and `⏭ Next Stage` buttons for live design presentations.
  - Loop toggle and stage countdown telemetry.
- **Portable Persistence:** Save and share `.playlist.json` files with 1-click export/import and native persistence in `~/Library/Application Support/simdata/playlists/`.

### 5. Photoplethysmography (PPG / BVP) & Dual Cardiac Modality
- **Authentic Optical Waveform (PPG / BVP):** Synthesizes the organic blood volume pulse curve used by modern consumer wearables (Apple Watch, Oura Ring, Whoop, Garmin, Empatica E4, and earclips). Features the classic dicrotic wave with rapid systolic upstroke, systolic peak, dicrotic notch (aortic valve closure), and gentle diastolic runoff.
- **1-Click PPG / ECG Toggle:** Added dedicated channel toggle buttons allowing designers to switch between **PPG (Optical Blood Volume Pulse)** and **ECG (Electrical Vector)** in both full and compact views.
- **Realistic Optical Artifact Modeling:** When motion occurs (`bio_artifact: true`), PPG mode introduces characteristic ambient light-leakage noise and baseline drift.
- **Persistent Modality Selection:** The chosen cardiac modality is remembered across sessions via `localStorage` (`simdata_cardiac_mode`).

### 6. Alternative Compact Oscilloscope View
- **Dual View Modes:** Toggle between **Full View** and **Compact View** via an icon button in the oscilloscope header.
- **Compact 80px Waveform Canvas:** Reduces the oscilloscope height to a streamlined 80px trace showing calibrated Respiration, Cardiac (PPG/ECG), and EEG waveforms.
- **Horizontal Telemetry Cards:** Arranges Heart Rate, Breathing, and Coherence metrics horizontally alongside the trace.
- **Zero-Scroll Interaction:** Allows designers to monitor real-time biosignals continuously while selecting recordings or configuring playlist steps below.
- **Persistent Preference:** Selected view mode is remembered in `localStorage` (`simdata_osc_view`).

### 7. Header Layout & UI Ergonomics
- **Responsive Navigation:** Shortened "Figma" button and compacted transport controls to prevent overflow on standard laptop screens.
- **Breakpoint-Stable Badges:** Ensured the `OSC :9000` status badge remains visible across mobile, tablet, and desktop viewports.
- **Eliminated Layout Shifts:** Removed erratic message counters next to status badges to maintain a fixed, jitter-free header.
- **Playlist Stage Name Spacing:** Expanded stage name input to `min-w-[200px]` with flex growth, and enabled two-row wrapping on narrow/split panes so stage titles are never truncated.
- **Electron Window Default Size:** Increased default window size to `1200x800` (min `980x640`) for an optimal out-of-the-box layout without horizontal scrollbars.

---

## 🧪 Verification & Testing

SimData v1.2.0 includes an expanded automated test suite (`npm test`) covering **15 comprehensive tests**:
1. Telemetry Schema & Range Conformance (30 Hz)
2. Respiratory Sinus Arrhythmia (RSA) Physiological Coupling
3. 3-Second Non-Linear Preset Transition & Interpolation
4. Motion Artifact Injection & Recovery (Blink, Clench, Detach)
5. OSC UDP 4-Byte Binary Alignment (12 Addresses)
6. Pre-bundled Dataset Recording Assets Integrity (including Acute Stress & Artifact Dropout)
7. Figma Plugin Manifest & Typings Compilation
8. Main Streamer Play/Pause Transport State Freeze
9. Simulation Speed Multipliers (1x, 2x, 4x)
10. 17-Column Blank Template & REST Upload Persistence
11. Muse / Mind Monitor CSV Auto-Detection & Conversion
12. WESAD / Empatica E4 CSV Auto-Detection & Conversion
13. Server-Side Dataset Stepping, Pause Freeze & Variable Speed
14. Scenario Playlist Sequencing & Crossfade Transitions
15. Live WebSocket Telemetry Streaming in Playback Mode

---

## 📦 Distribution Packages

| Platform | File | Size | Description |
| :--- | :--- | :--- | :--- |
| **Windows** | **[SimData Setup 1.2.0.exe](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData%20Setup%201.2.0.exe)** | ~86 MB | Windows x64 NSIS Installer (Desktop & Start Menu shortcuts) |
| **Windows** | **[SimData 1.2.0.exe](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData%201.2.0.exe)** | ~78 MB | Windows x64 Standalone Portable Executable (No installation required) |
| **macOS** | **[SimData-1.2.0-arm64.dmg](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64.dmg)** | ~99 MB | Apple Silicon macOS Installer (Drag-and-Drop) |
| **macOS** | **[SimData-1.2.0-arm64-mac.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/release/SimData-1.2.0-arm64-mac.zip)** | ~95 MB | Portable Apple Silicon macOS Application Bundle |
| **Figma** | **[simdata-figma-plugin.zip](file:///Users/abookm1/Documents/GitHub/datastreamer/figma-plugin/simdata-figma-plugin.zip)** | ~6 KB | Companion Figma Plugin Bundle (Manifest + UI + Code) |

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


