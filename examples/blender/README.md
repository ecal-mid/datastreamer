# SimData + Blender 3D Integration Guide

This guide explains how to drive 3D animations, procedural Geometry Nodes, materials, and digital avatars in **Blender (3.x / 4.x)** using **SimData** telemetry.

Unlike video compositing software, Blender includes an embedded **Python 3 (`bpy`) environment**, allowing both:
1. **Live Real-Time Streaming**: Stream telemetry live into the 3D viewport at 30 Hz via OSC UDP.
2. **Offline Data-Driven Keyframing**: Bake exported CSV recordings directly into F-Curves for photorealistic **Cycles** and **EEVEE** rendering.

---

## 1. Quick Comparison of Workflows

| Mode | Protocol / Format | Typical Use Cases |
| :--- | :--- | :--- |
| **Live Viewport Streaming** | OSC via UDP (`127.0.0.1:9000`) | Interactive 3D installations, digital avatars, live responsive visuals, prototyping |
| **Offline Keyframe Baking** | CSV Export (`simdata_session.csv`) | High-end cinematic rendering, Physics & Geometry Nodes simulations, Graph Editor tweaking |

---

## 2. Live Real-Time Streaming via OSC

SimData broadcasts an Open Sound Control (OSC 1.0) UDP packet tree at **`127.0.0.1:9000`** at 30 Hz.

### Steps to Run:
1. Start SimData (`npm start` or the standalone desktop app).
2. Open Blender.
3. Switch to the **Scripting** workspace and create a new script.
4. Open or paste [`live_osc_listener.py`](./live_osc_listener.py).
5. Select the 3D object you want to animate (e.g. an organic sphere, light, or camera).
6. Click **Run Script** (or `Alt+P`).
7. **Result**: Your selected 3D object responds dynamically in real time as you adjust respiration, heart rate, or emotional presets in SimData!
8. Press **`ESC`** in the 3D viewport at any time to stop the listener.

---

## 3. Offline Data-Driven Keyframe Baking (F-Curves)

When preparing a final Cycles or EEVEE render:
1. In SimData, click the **`CSV`** button in the header to save `simdata_session_<timestamp>.csv`.
2. In Blender, set your scene frame rate to **`30 fps`** (Properties > Output Properties > Format > Frame Rate).
3. Select your target 3D object.
4. In Blender's Scripting workspace, open [`import_simdata_csv.py`](./import_simdata_csv.py).
5. Update `CSV_PATH` to point to your exported file and click **Run Script**.
6. **Result**: Full keyframes are baked across the timeline. You can now:
   - Fine-tune curves with **Bezier handles** in the **Graph Editor**.
   - Apply **F-Curve Modifiers** (Cycles, Noise, Stepped interpolation).
   - Render offline with motion blur and depth of field.

---

## 4. Driving Advanced Blender Features

### Geometry Nodes
In your Geometry Node tree, add a Group Input parameter of type `Float` (named, for example, `Breath` or `Arousal`).
Drive it via Python:
```python
obj.modifiers["GeometryNodes"]["Socket_2"] = resp_val
```

### Shader Nodes & Lighting (Emission & Subsurface Scattering)
Create a Custom Property on your object or an Empty controller:
```python
obj["calm_index"] = calm_val
```
In the **Shader Editor**:
1. Add an **Attribute** node (Type: *Object*, Name: `calm_index`).
2. Connect its *Fac* output to a **ColorRamp** (e.g., Red = Stress, Cyan = Serenity).
3. Plug the Color into your Principled BSDF **Base Color** or **Emission Color**.

### Digital Avatar Blendshapes (Shape Keys)
For character animation:
```python
mesh = obj.data
if mesh.shape_keys:
    # Drive facial relaxation or brow furrow
    mesh.shape_keys.key_blocks["BrowFurrow"].value = 1.0 - calm_val
    mesh.shape_keys.key_blocks["ChestExpansion"].value = resp_val
```
