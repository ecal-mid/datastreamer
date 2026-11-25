# Web Biofeedback Prototype Starter & Vibe Coding Guide

A zero-dependency, standalone starter template and prompt library for students, researchers, and interaction designers prototyping bio-responsive web interfaces with **SimData**.

---

## 1. Quickstart

1. Start SimData on your machine (runs WebSocket streaming on ports `8081` and `8080`):
   ```bash
   npm start
   ```
2. Open [`index.html`](file:///Users/abookm1/Documents/GitHub/datastreamer/examples/web-client/index.html):
   * **Direct File:** Double-click `index.html` in your file explorer to open it directly in Chrome, Firefox, Safari, or Edge.
   * **Local Server (recommended for Three.js/Audio):** Run `python3 -m http.server 3000` or use VS Code *Live Server*.
3. The client connects automatically, showing real-time breathing dynamics, cardiac pulse rings, cognitive states, and playlist stages.

---

## 2. WebSocket Telemetry Schema (30 Hz)

The SimData engine streams JSON frames at **30 Hz** over `ws://127.0.0.1:8081` (fallback `8080`).

### Full JSON Frame Structure:

```json
{
  "timestamp": 1732517892.412,
  "signals": {
    "ppg": 0.68,          // Normalized Photoplethysmography / BVP waveform (0.0 - 1.0)
    "ecg": 0.12,          // Electrocardiogram raw signal (-0.5 to 1.5 mV)
    "eda": 2.45,          // Electrodermal activity / galvanic skin response (µS)
    "respiration": 0.82,  // Lungs expansion curve (0.0 = empty, 1.0 = full)
    "eeg_alpha": 0.74,    // Relaxed, open focus rhythm 8-12 Hz (0.0 - 1.0)
    "eeg_beta": 0.21,     // Cognitive processing & alertness 15-30 Hz (0.0 - 1.0)
    "eeg_theta": 0.35,    // Deep introspection / drowsiness 4-8 Hz (0.0 - 1.0)
    "eeg_gamma": 0.08     // High-order cognitive synthesis 30-50 Hz (0.0 - 1.0)
  },
  "metrics": {
    "heart_rate_bpm": 68.4,    // Current calculated heart rate (BPM)
    "coherence_score": 0.88,   // Cardiorespiratory phase coherence (0.0 - 1.0)
    "calm_score": 0.81,        // Sympathovagal relaxation index (0.0 - 1.0)
    "stress_score": 0.19,      // Sympathetic activation index (0.0 - 1.0)
    "focus_score": 0.72        // Beta/Theta cognitive alertness index (0.0 - 1.0)
  },
  "states": {
    "state_name": "Deep Meditation / Flow", // Active simulation state
    "stage_name": "1. Baseline Calm Onboarding", // Scenario playlist stage name
    "artifact_flag": false,                 // True if motion/clench/blink artifact is occurring
    "artifact_type": "none"                 // "none" | "blink" | "clench" | "motion" | "dropout"
  }
}
```

---

## 3. Minimal Vanilla JavaScript Snippet

Copy-paste this into any HTML page or script tag to connect your prototype:

```html
<script>
  const ws = new WebSocket("ws://127.0.0.1:8081");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const { signals, metrics, states } = data;

    // 1. Direct CSS variable binding for zero-lag styling:
    document.documentElement.style.setProperty("--resp", signals.respiration);
    document.documentElement.style.setProperty("--coherence", metrics.coherence_score);
    document.documentElement.style.setProperty("--bpm", metrics.heart_rate_bpm);

    // 2. React to cognitive state changes:
    console.log(`Current State: ${states.state_name} | Stage: ${states.stage_name}`);

    // 3. Graceful degradation when artifacts happen:
    if (states.artifact_flag) {
      document.body.classList.add("sensor-paused");
    } else {
      document.body.classList.remove("sensor-paused");
    }
  };
</script>
```

---

## 4. "Vibe Coding" AI Prompts (Copy-Paste)

If you are building your prototype with an AI coding assistant (Cursor, Claude Code, GitHub Copilot, or ChatGPT), copy and paste any of these recipes into your chat prompt:

### Recipe A: Master Setup (Single-File Modern Biofeedback App)
> "Act as a senior creative technologist. I want to build a single-file bio-responsive web app in HTML, CSS, and vanilla JS that connects to a local WebSocket stream at `ws://127.0.0.1:8081`. The stream sends 30 Hz JSON packets containing `signals.respiration` (0-1), `signals.ppg` (0-1), `metrics.heart_rate_bpm`, `metrics.coherence_score` (0-1), `states.state_name`, `states.stage_name`, and `states.artifact_flag`.
>
> Create an elegant, dark-mode dashboard with:
> 1. An organic breathing circle whose size and glow expands smoothly with `signals.respiration`.
> 2. A cardiac rhythm pulse ring expanding on every PPG heartbeat peak.
> 3. Dynamic color theme crossfading according to `states.state_name` (e.g. calm cyan for Meditation, amber/red for Stress).
> 4. An artifact pause banner that softly blurs the interface when `states.artifact_flag` is true.
> Ensure performance is butter-smooth using `requestAnimationFrame` and CSS variables."

---

### Recipe B: Generative Three.js / WebGL Visualizer
> "I am prototyping an immersive biofeedback visualizer in Three.js. I have a WebSocket stream at `ws://127.0.0.1:8081` sending biometric data at 30 Hz.
>
> Write a standalone HTML page with Three.js via CDN:
> 1. Render an organic, deformed 3D sphere / particle wave field.
> 2. Modulate the sphere's scale and vertex noise using `signals.respiration` ($0.0 - 1.0$).
> 3. Map particle turbulence and color hue to `metrics.coherence_score` (high coherence = harmonic gold/cyan; low coherence = turbulent violet).
> 4. Use linear interpolation (`lerp`) inside the `requestAnimationFrame` render loop so that raw 30 Hz network values transition silky-smooth at 60-120 fps.
> 5. Handle WebSocket reconnection automatically if the server restarts."

---

### Recipe C: Web Audio API Generative Soundscapes
> "Create a biofeedback sound generator using vanilla Web Audio API in an HTML page. Connect to `ws://127.0.0.1:8081`.
>
> Requirements:
> 1. Add an initial 'Start Audio' button to unlock the browser AudioContext.
> 2. Create a calming ambient drone with two low-frequency sine oscillators and a biquad lowpass filter.
> 3. Map `signals.respiration` to modulate the filter cutoff frequency ($200\text{ Hz} - 1200\text{ Hz}$) so the sound breathes with the user.
> 4. Map `metrics.calm_score` to chord harmony (transitioning from dissonance to a pure pentatonic major chord as calm rises).
> 5. When `states.artifact_flag` is true, smoothly fade audio gain down to $20\%$ to prevent jarring auditory spikes during movement."

---

### Recipe D: Defensive UX & Multi-Stage Journey Testing
> "Help me design an error-resilient user journey prototype in Tailwind CSS and vanilla JS for a biometric meditation app. It connects to `ws://127.0.0.1:8081`.
>
> Specifically implement:
> 1. A scenario HUD showing `states.stage_name` (e.g. '1. Baseline Calm Onboarding', '2. Sudden Error / Startle').
> 2. Never accuse the user of being stressed when `states.artifact_flag` is true; instead, display a friendly non-judgmental prompt: 'Adjust your sensor headband' with an illustration.
> 3. Implement a 3-second recovery buffer: when an artifact ends, smoothly fade the visualization back in without jumping."

---

## 5. Interaction Design Best Practices for Biosignals

* **Always Smooth Telemetry (`lerp`):** Telemetry arrives at 30 Hz. Never jump elements directly to new positions. Use linear interpolation `current += (target - current) * 0.1` inside your render loop or CSS `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
* **Separate Artifacts from Cognitive Stress:** Real biosensors (optical PPG clips, EEG headbands) pick up muscle movement, jaw clenches, and ambient light leaks. Never trigger a "You are stressed" warning during an artifact. Always freeze the previous reading or show a neutral "Sensor Re-aligning" indicator.
* **Keep CSS Custom Properties on `:root`:** Writing high-frequency telemetry to CSS variables (`document.documentElement.style.setProperty('--resp', val)`) allows GPU-accelerated CSS transforms and animations without incurring React or DOM reconciliation overhead.