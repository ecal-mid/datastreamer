# Figma Biofeedback Prototyping Guide (SimData)

This guide walks through interactive biofeedback and neurofeedback design patterns you can build in Figma using **SimData** native variables.

---

## 1. Quick Setup: Provisioning Variables

1. Make sure the SimData server or desktop app is running:
   ```bash
   npm start
   ```
2. In Figma Desktop, open any project file.
3. Open **Plugins > Development > SimData Bridge** (or install from `figma-plugin/simdata-figma-plugin.zip`).
4. Click **"Setup Bio Variables"**.
5. Open your Figma local variables panel (**Local variables** in the right design sidebar). You will see the **`BioData`** collection with **8 native variables**:
   * `bio_state` (**String**): The user's active cognitive state name (`"Baseline / Neutral"`, `"Deep Meditation / Flow"`, `"Cognitive Stress"`, `"Acute Stress Trigger"`, `"Sensor Detached / Noise"`).
   * `bio_stage` (**String**): The active stage title from scenario playlists (e.g. `"1. Baseline Calm Onboarding"`, `"2. Sudden Error / Startle"`).
   * `bio_respiration` (**Float** $0.0 - 1.0$): Continuous respiratory depth ($0.0$ empty lungs to $1.0$ full lungs).
   * `bio_bpm` (**Float** $45 - 130$): Heart rate from optical PPG / BVP or ECG.
   * `bio_coherence` (**Float** $0.0 - 1.0$): Cardiorespiratory harmony score.
   * `bio_alpha` (**Float** $0.0 - 1.0$): Relaxed, mindful Alpha brainwave rhythm ($8 - 12\text{ Hz}$).
   * `bio_beta` (**Float** $0.0 - 1.0$): Analytical problem-solving Beta brainwave rhythm ($15 - 30\text{ Hz}$).
   * `bio_artifact` (**Boolean**): `true` when physical motion, eye blinks, jaw clenches, or sensor dropouts occur.

---

## Prototype Pattern 1: Automatic UI Mode Swapping with `bio_state`

Swap complete screen layouts, color schemes, or component variants automatically as the user moves between cognitive states:

1. Create a Figma Component with a Variant property named **`State`**.
2. Name the component variants to match SimData's state names:
   * **`Baseline / Neutral`** (Standard everyday interface)
   * **`Deep Meditation / Flow`** (Zen, minimal interface with soft colors)
   * **`Cognitive Stress`** (Focused dashboard with dimmed secondary panels)
   * **`Acute Stress Trigger`** (Emergency calm-down modal with breathing prompt)
3. In the right-hand design sidebar, select the component instance.
4. Click the **Variable icon** next to the **`State`** property and bind it directly to <code style="color: #06b6d4">bio_state</code>.
5. In SimData, change presets or run a scenario playlist. Your Figma prototype will switch variants on canvas in real time!

---

## Prototype Pattern 2: Scenario Playlist Stage HUD with `bio_stage`

Display the active scenario title and step name during user journey testing:

1. Create a Text layer (`T`) in your prototype header (e.g. `"1. Baseline Calm Onboarding"`).
2. In the right sidebar under **Text**, click the **Variable icon** next to the text contents.
3. Select `bio_stage`.
4. In SimData, load and play the scenario playlist **`UX Testing: Stress Trigger & Sensor Dropout`**.
5. The text layer automatically updates as each stage crossfades into the next!

---

## Prototype Pattern 3: The Adaptive Breathing Pacer with `bio_respiration`

Create an organic breathing orb that smoothly expands during inhalation and contracts during exhalation:

1. Draw an Ellipse (`O`) on your canvas (e.g. $120 \times 120\text{ px}$) with a soothing gradient.
2. In the right-hand **Design** panel, hover over the **Width (`W`)** field.
3. Click the **Variable icon** (the hexagonal badge).
4. Select `bio_respiration`.
5. Hover over the **Height (`H`)** field and bind `bio_respiration` as well.
6. *Optional:* Bind `bio_respiration` to **Layer Opacity** ($30\% - 100\%$) or **Corner Radius** of an inner card.
7. Watch the circle physically breathe in sync with SimData's 30 Hz stream!

---

## Prototype Pattern 4: Live Heart Rate Telemetry with `bio_bpm`

Bind numeric biometric telemetry directly into text counters:

1. Create a Text layer (`T`) with the text `72`.
2. Select the text layer.
3. In the right sidebar under **Text**, click the **Variable icon** next to the text contents.
4. Select `bio_bpm`.
5. The text layer now dynamically reflects the simulated heart rate in real time at 10 Hz!

---

## Prototype Pattern 5: Cognitive Flow & Coherence Aura with `bio_coherence`

Create an ambient background gradient whose intensity reflects cardiorespiratory coherence:

1. Draw a Frame or Rectangle for your application background.
2. Add a soft circular blur effect or radial gradient fill in the center.
3. In the right sidebar under **Layer**, hover over **Layer Opacity** ($100\%$).
4. Click the **Variable icon** and select `bio_coherence` (or `bio_alpha`).
5. When the user enters a resonant calm state, the aura smoothly transitions to full brightness ($0.85 - 0.95$); during stress, it gently dims.

---

## Prototype Pattern 6: Sensor Artifact Alert & Graceful Error Handling with `bio_artifact`

Design an error-resilient interface that handles sensor disconnections and motion artifacts gracefully:

1. Design an alert banner: an amber or red pill with the text: `⚠️ SENSOR LOOSE — ADJUST HEADBAND`.
2. Select the banner layer.
3. Right-click the **Eye icon** (Layer Visibility) in the right sidebar under **Layer**.
4. Select `bio_artifact`.
5. Select your main interface or visualization container and bind its layer opacity to a formula or variant: when `bio_artifact` is true, reduce opacity to $40\%$ to indicate paused tracking.
6. In SimData, click **"Blink Spike"**, **"Jaw Clench"**, or play the **`UX Testing: Stress Trigger & Sensor Dropout`** playlist:
   * The warning banner pops into view when the sensor is detached.
   * When contact is restored, the banner automatically vanishes and the visual recovers smoothly!

---

## Prototyping Best Practices

* **Canvas Performance & Rate Limiting:** The SimData Figma plugin automatically throttles incoming 30 Hz telemetry to **10 Hz (every 100 ms)**. This prevents Figma's canvas from lagging or freezing while keeping transitions visually fluid.
* **Never Penalize Artifacts:** When `bio_artifact` is true, your prototype should never display "You are stressed!". Real optical PPG and EEG sensors pick up muscle noise and light leaks; always use `bio_artifact` to prompt sensor adjustment rather than emotional feedback.
* **Test with Scenario Playlists:** Use SimData's pre-bundled playlists (`stress_recovery_protocol.json`, `ux_stress_and_artifact_test.json`) to test multi-stage journeys end-to-end without manual adjustments.
