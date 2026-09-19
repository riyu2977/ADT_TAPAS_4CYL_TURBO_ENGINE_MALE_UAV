import json
import os

gltf_path = "/home/riyu2907/Projects/SIH_054_ADT/sih_054_draft1/public/models/2dot2L_4cylinder_inline_turbocharged_engine_model__magic3d.gltf"

if os.path.exists(gltf_path):
    with open(gltf_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"=== GLTF File Loaded: {os.path.basename(gltf_path)} ===")
    print(f"Asset Info: {data.get('asset')}")
    print(f"Total Nodes: {len(data.get('nodes', []))}")
    print(f"Total Meshes: {len(data.get('meshes', []))}")
    print(f"Total Materials: {len(data.get('materials', []))}")
    print(f"Total Scenes: {len(data.get('scenes', []))}")

    print("\n--- NODES LIST ---")
    for idx, node in enumerate(data.get('nodes', [])):
        name = node.get('name', f'Node_{idx}')
        mesh_idx = node.get('mesh')
        children = node.get('children', [])
        translation = node.get('translation')
        rotation = node.get('rotation')
        scale = node.get('scale')
        print(f"Node [{idx}]: name='{name}', mesh={mesh_idx}, children={children}, pos={translation}")

    print("\n--- MESHES LIST ---")
    for idx, mesh in enumerate(data.get('meshes', [])):
        name = mesh.get('name', f'Mesh_{idx}')
        primitives = len(mesh.get('primitives', []))
        print(f"Mesh [{idx}]: name='{name}', primitives_count={primitives}")

    print("\n--- MATERIALS LIST ---")
    for idx, mat in enumerate(data.get('materials', [])):
        name = mat.get('name', f'Material_{idx}')
        pbr = mat.get('pbrMetallicRoughness', {})
        base_color = pbr.get('baseColorFactor')
        print(f"Material [{idx}]: name='{name}', baseColor={base_color}")
else:
    print(f"File not found: {gltf_path}")
