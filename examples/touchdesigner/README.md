# SimBio TouchDesigner Integration Guide

SimBio broadcasts biosignals to TouchDesigner using either **OSC (UDP)** or **WebSockets (JSON)**.

---

## Method 1: OSC In CHOP (Recommended for Animation & Real-Time Generative Graphics)

1. Open TouchDesigner.
2. Add an **`OSC In CHOP`** (press `TAB` > CHOP > `OSC In`).
3. Set the parameters on `OSC In CHOP`:
   * **Network Port:** `9000`
   * **Local Address:** `127.0.0.1`
4. Channels will automatically appear:
   * `bio/eeg/alpha`, `bio/eeg/beta`, `bio/eeg/theta`, `bio/eeg/smr`
   * `bio/hrv/bpm`, `bio/hrv/coherence`
   * `bio/respiration` (oscillating `-1.0` to `1.0`)
   * `bio/eda/phasic`
   * `bio/state/calm`
   * `bio/artifact` (0 or 1)
5. Pipe the output of `OSC In CHOP` to a **`Select CHOP`** or **`Math CHOP`** to drive camera zoom, particle velocity, geometry scales, or TOP colors.

---

## Method 2: WebSocket DAT (Recommended for Full JSON Telemetry Parsing)

1. Add a **`WebSocket DAT`** (press `TAB` > DAT > `WebSocket`).
2. Set parameters:
   * **Network Address:** `127.0.0.1`
   * **Network Port:** `8080`
   * **Active:** `On`
3. Add a **`DAT Execute`** or edit the callback in `websocket1_callbacks`:

```python
import json

def onReceiveText(dat, rowIndex, message, peer):
    try:
        data = json.loads(message)
        if 'biometrics' in data:
            bpm = data['biometrics']['hrv']['bpm']
            coherence = data['biometrics']['hrv']['coherence']
            alpha = data['biometrics']['eeg']['alpha']
            resp = data['biometrics']['respiration']['value']
            
            # Example: store in TouchDesigner storage or update a Constant CHOP
            op('constant1').par.value0 = bpm
            op('constant1').par.value1 = coherence
            op('constant1').par.value2 = alpha
    except Exception as e:
        pass
```

---

## Remote Control from TouchDesigner
You can also send commands from TouchDesigner to SimBio via the `WebSocket DAT`:

```python
# Trigger a preset
op('websocket1').sendText(json.dumps({'type': 'SET_PRESET', 'preset': 'meditation'}))

# Trigger a blink artifact
op('websocket1').sendText(json.dumps({'type': 'TRIGGER_ARTIFACT', 'artifact': 'blink'}))
```

