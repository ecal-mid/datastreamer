# SimBio Max/MSP & Pure Data Guide

SimBio transmits native Open Sound Control (OSC 1.0) packets over UDP to `127.0.0.1:9000`.

## Quick Start
1. Open [`simbio_receiver.maxpat`](./simbio_receiver.maxpat) in Max/MSP.
2. Ensure SimBio is running (`npm start`).
3. You will see numbers updating in real-time in the `flonum` boxes:
   * **Alpha:** `0.0` to `1.0`
   * **BPM:** `45.0` to `120.0`
   * **Respiration:** `-1.0` to `1.0`

## Pure Data (Pd) Setup
In Pure Data:
```
[netreceive -u -b 9000]
|
[oscparse]
|
[route bio]
|
[route eeg hrv respiration]
```

