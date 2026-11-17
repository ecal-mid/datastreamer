"""
SimData Live Real-Time OSC Stream Listener for Blender 3.x / 4.x
----------------------------------------------------------------
Connects Blender's 3D viewport live to SimData's 30 Hz OSC stream on UDP port 9000.
Animates the selected object in real time with zero external pip dependencies.

Instructions:
1. Start SimData (standalone or web) broadcasting on port 9000.
2. Select any 3D object in Blender (e.g. Cube, Sphere, Light, or Empty).
3. Open this script in Blender's Scripting workspace and click 'Run Script' (Alt+P).
4. Watch the object react to live breathing, heart rate, and mental states.
5. Press ESC in the 3D Viewport to stop the live stream listener.
"""

import bpy
import socket
import struct

OSC_HOST = "127.0.0.1"
OSC_PORT = 9000

class SIMDATA_OT_LiveListener(bpy.types.Operator):
    bl_idname = "wm.simdata_live_listener"
    bl_label = "SimData Live OSC Listener"
    bl_description = "Listens to real-time biometric OSC stream from SimData"

    _timer = None
    _sock = None

    def modal(self, context, event):
        # Stop listening when user hits ESC
        if event.type == 'ESC':
            self.cancel(context)
            self.report({'INFO'}, "SimData Live Listener stopped.")
            return {'CANCELLED'}

        if event.type == 'TIMER':
            self.poll_osc_stream(context)

        return {'PASS_THROUGH'}

    def poll_osc_stream(self, context):
        if not self._sock:
            return

        obj = context.active_object
        if not obj:
            return

        # Drain and process incoming packets
        try:
            while True:
                data, _ = self._sock.recvfrom(4096)
                self.process_packet(data, obj)
        except BlockingIOError:
            pass
        except Exception as e:
            print(f"[SimData Live] Socket error: {e}")

    def process_packet(self, data, obj):
        """Simple, fast binary parser for SimData OSC 1.0 messages."""
        # 1. Respiration (/bio/respiration) -> Modulate Scale
        if b"/bio/respiration" in data:
            val = self.extract_float(data, b"/bio/respiration")
            if val is not None:
                # Map -1..1 or 0..1 to scale
                s = 1.0 + (val * 0.35)
                obj.scale = (s, s, s)

        # 2. Calm Index (/bio/state/calm) -> Custom Property & Z-Offset
        if b"/bio/state/calm" in data:
            calm = self.extract_float(data, b"/bio/state/calm")
            if calm is not None:
                obj["calm_index"] = calm
                obj.location.z = (calm - 0.5) * 1.5

        # 3. Heart Rate (/bio/hrv/bpm) -> Custom Property
        if b"/bio/hrv/bpm" in data:
            bpm = self.extract_float(data, b"/bio/hrv/bpm")
            if bpm is not None:
                obj["bio_bpm"] = bpm

        # 4. EEG Alpha (/bio/eeg/alpha) -> Custom Property
        if b"/bio/eeg/alpha" in data:
            alpha = self.extract_float(data, b"/bio/eeg/alpha")
            if alpha is not None:
                obj["bio_alpha"] = alpha

    def extract_float(self, data, address):
        """Extracts a 32-bit big-endian float following an OSC address and tag."""
        try:
            pos = data.find(address)
            if pos == -1:
                return None
            # Look for the ',f' type tag after address
            tag_pos = data.find(b",f", pos)
            if tag_pos != -1:
                # 4-byte float begins at tag_pos + 4
                float_bytes = data[tag_pos + 4 : tag_pos + 8]
                if len(float_bytes) == 4:
                    return struct.unpack(">f", float_bytes)[0]
        except Exception:
            pass
        return None

    def execute(self, context):
        try:
            self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            # Allow multiple local listeners if needed
            self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self._sock.bind((OSC_HOST, OSC_PORT))
            self._sock.setblocking(False)
        except Exception as e:
            self.report({'ERROR'}, f"Failed to bind to UDP {OSC_HOST}:{OSC_PORT} - {e}")
            return {'CANCELLED'}

        # Timer ticks at ~30 Hz (0.033s interval)
        wm = context.window_manager
        self._timer = wm.event_timer_add(1.0 / 30.0, window=context.window)
        wm.modal_handler_add(self)

        self.report({'INFO'}, f"SimData Live Listener active on UDP {OSC_PORT}! Press ESC to cancel.")
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        wm = context.window_manager
        if self._timer:
            wm.event_timer_remove(self._timer)
            self._timer = None
        if self._sock:
            self._sock.close()
            self._sock = None

def register():
    bpy.utils.register_class(SIMDATA_OT_LiveListener)

def unregister():
    bpy.utils.unregister_class(SIMDATA_OT_LiveListener)

if __name__ == "__main__":
    register()
    bpy.ops.wm.simdata_live_listener()

