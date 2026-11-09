# Figma Biofeedback Prototyping Guide (SimData)

This guide walks through four interactive biofeedback design patterns you can build in Figma in under 5 minutes using **SimData** variables.

---

## 1. Quick Setup: Provisioning Variables

1. Make sure the SimData server is running:
   ```bash
   npm start
   ```
2. In Figma Desktop, open any project file.
3. Open **Plugins > Development > SimData Bridge**.
4. Click **"Setup Bio Variables"**.
5. Open your local variables panel (**Local variables** in the right sidebar of Figma). You will see a new collection named **`BioData`** with 6 variables:
   * `bio_alpha` (Float $0.0 - 1.0$)
   * `bio_beta` (Float $0.0 - 1.0$)
   * `bio_coherence` (Float $0.0 - 1.0$)
   * `bio_bpm` (Float $45 - 130$)
   * `bio_respiration` (Float $0.0 - 1.0$)
   * `bio_artifact` (Boolean)

---

## Prototype 1: The Adaptive Breathing Pacer

Create a circle that smoothly expands during inhalation and contracts during exhalation.

1. Draw an Ellipse (`O`) on your canvas (e.g. $100 \times 100\text{ px}$).
2. In the right-hand **Design** panel, hover over the **Width (`W`)** field.
3. Click the **Variable icon** (a hexagonal badge next to the input).
4. Select `bio_respiration`.
5. Hover over the **Height (`H`)** field and bind `bio_respiration` as well.
6. *Optional:* Set up a formula or an Auto-layout container with `bio_respiration` bound to padding or corner radius.
7. As you run SimData or adjust the respiration rate slider in the web app, watch the circle physically breathe in sync!

---

## Prototype 2: Live Heart Rate Display (BPM)

Bind numeric biometric telemetry directly into text layers.

1. Create a Text layer (`T`) with the text `70`.
2. Select the text layer.
3. In the right sidebar under the **Text** section, click the **Variable icon** next to the text contents.
4. Select `bio_bpm`.
5. The text layer will now dynamically reflect the simulated instantaneous heart rate in real time at 10 Hz!

---

## Prototype 3: Cognitive Flow State / Meditation Aura

Create an ambient gradient background whose opacity and softness reflect user calm and coherence.

1. Draw a Frame or Rectangle for your app's background.
2. Add a soft circular blur effect or gradient fill in the center.
3. Select the blurred aura layer.
4. In the **Layer** section of the right sidebar, hover over the **Layer Opacity** ($100\%$).
5. Click the **Variable icon** and select `bio_coherence` or `bio_alpha`.
6. When the user switches to the `Deep Meditation / Flow` preset in SimData, the aura smoothly transitions to full intensity ($0.85$); when under `Cognitive Stress`, it dims and recedes.

---

## Prototype 4: Sensor Artifact Alert Banner

Show or hide an emergency alert banner using the Boolean artifact flag.

1. Design an alert banner: a red pill or frame with the text: `⚠️ SENSOR DISCONNECTED / ARTIFACT DETECTED`.
2. Select the banner layer.
3. Right-click the **Eye icon** (Layer Visibility) in the right sidebar under **Layer**.
4. Select `bio_artifact`.
5. Now in the SimData web dashboard, click **"Blink Spike"**, **"Jaw Clench / EMG"**, or **"Sensor Detach"**:
   * The alert banner instantly pops into view in Figma when the artifact occurs.
   * When normal signal resumes, the banner automatically vanishes!

---

## Prototyping Tips

* **Rate Limiting:** The SimData Figma plugin automatically throttles incoming 30 Hz telemetry to 10 Hz (every 100ms) to ensure butter-smooth frame rates without freezing Figma's canvas.
* **Component Variants:** You can bind variables to component variant properties to swap states (e.g., swapping from a `Neutral` card variant to a `Focus` card variant based on values).

