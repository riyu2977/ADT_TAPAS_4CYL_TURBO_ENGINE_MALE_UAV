import struct
import json
import os

glb_path = "/home/riyu2907/Projects/SIH_054_ADT/sih_054_draft1/public/models/2dot2L_4cylinder_inline_turbocharged_engine_model__magic3d.glb"

if os.path.exists(glb_path):
    with open(glb_path, "rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
        print(f"=== GLB File Loaded: {os.path.basename(glb_path)} ===")
        print(f"Magic: {magic}, Version: {version}, Total Length: {length} bytes")

        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        if chunk_type == 0x4E4F534A: # 'JSON'
            json_bytes = f.read(chunk_length)
            data = json.loads(json_bytes.decode("utf-8"))
            print(f"Asset Generator: {data.get('asset')}")
            print(f"Nodes: {data.get('nodes')}")
            print(f"Meshes: {data.get('meshes')}")
            print(f"Materials: {data.get('materials')}")
            print(f"Scenes: {data.get('scenes')}")
        else:
            print(f"First chunk type is not JSON: {hex(chunk_type)}")
