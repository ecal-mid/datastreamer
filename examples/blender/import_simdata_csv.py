"""
SimData CSV Keyframe Importer for Blender 3.x / 4.x
--------------------------------------------------
Bakes SimData biometric session recordings into F-Curves on the active 3D object.

Instructions:
1. Set Blender Scene frame rate to 30 fps (Output Properties > Frame Rate).
2. Select the target object, light, or camera in the 3D Viewport.
3. Update CSV_PATH below with the absolute path to your exported SimData CSV.
4. Click 'Run Script' in Blender's Text Editor.
"""

import bpy
import csv
import os

# Set this to your exported SimData CSV file path
CSV_PATH = os.path.expanduser("~/Downloads/simdata_session.csv")

def bake_simdata_to_object(csv_path):
    if not os.path.exists(csv_path):
        print(f"[SimData] Error: File not found: {csv_path}")
        return

    obj = bpy.context.active_object
    if not obj:
        print("[SimData] Error: Please select an active object in Blender first.")
        return

    # Ensure 30 fps for 1:1 timeline synchronization with SimData's 30 Hz engine
    bpy.context.scene.render.fps = 30

    print(f"[SimData] Reading {csv_path} and baking keyframes to '{obj.name}'...")

    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        total_frames = 0

        for frame_idx, row in enumerate(reader):
            frame = frame_idx + 1

            # 1. Respiration -> 3D Scale (0.8x to 1.4x expansion)
            if 'respiration_value' in row:
                resp = float(row['respiration_value'])
                s = 0.8 + (resp * 0.6)
                obj.scale = (s, s, s)
                obj.keyframe_insert(data_path="scale", frame=frame)

            # 2. Heart Rate (BPM) -> Z-Location or Custom Property
            if 'bpm' in row:
                bpm = float(row['bpm'])
                obj["bio_bpm"] = bpm
                obj.keyframe_insert(data_path='["bio_bpm"]', frame=frame)

            # 3. Calm Index -> Custom Property for Shaders / Geometry Nodes
            if 'calm_index' in row:
                calm = float(row['calm_index'])
                obj["calm_index"] = calm
                obj.keyframe_insert(data_path='["calm_index"]', frame=frame)

            # 4. EEG Alpha -> Custom Property
            if 'alpha' in row:
                alpha = float(row['alpha'])
                obj["bio_alpha"] = alpha
                obj.keyframe_insert(data_path='["bio_alpha"]', frame=frame)

            total_frames = frame

    # Update timeline preview range to fit the dataset
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = total_frames
    bpy.context.scene.frame_set(1)

    print(f"[SimData] Successfully baked {total_frames} frames (0 - {total_frames / 30.0:.2f}s) onto '{obj.name}'!")

if __name__ == "__main__":
    bake_simdata_to_object(CSV_PATH)
