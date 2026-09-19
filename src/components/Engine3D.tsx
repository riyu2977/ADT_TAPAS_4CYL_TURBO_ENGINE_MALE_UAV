import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH =
  '/models/2dot2L_4cylinder_inline_turbocharged_engine_model__magic3d.glb';

function EngineModel() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    // Discover the real GLTF scene hierarchy at runtime.
    cloned.traverse((object) => {
      if (object.name) {
        console.debug('[ATDT 3D NODE]', object.name, object.type);
      }

      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material instanceof THREE.Material) {
          mesh.material.needsUpdate = true;
        }
      }
    });

    // Automatically center and normalize the actual imported model.
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDimension = Math.max(size.x, size.y, size.z);

    if (maxDimension > 0) {
      const scale = 3.2 / maxDimension;
      cloned.scale.setScalar(scale);
    }

    cloned.position.sub(center.multiplyScalar(
      cloned.scale.x
    ));

    return cloned;
  }, [scene]);

  useEffect(() => {
    if (!group.current) return;

    // Slight aerospace-cockpit viewing angle.
    group.current.rotation.y = -0.35;
    group.current.rotation.x = 0.08;
  }, []);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.2, 0.7, 0.5]} />
      <meshStandardMaterial
        color="#303030"
        wireframe
      />
    </mesh>
  );
}

function ErrorFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.2, 0.7, 0.5]} />
      <meshStandardMaterial
        color="#551111"
        wireframe
      />
    </mesh>
  );
}

export function Engine3D() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{
          position: [0, 0.6, 4.8],
          fov: 42,
          near: 0.01,
          far: 100,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1.8} />

        <directionalLight
          position={[4, 5, 6]}
          intensity={3}
        />

        <directionalLight
          position={[-4, 2, -3]}
          intensity={1.5}
        />

        <pointLight
          position={[0, 2, 3]}
          intensity={1}
        />

        <Suspense fallback={<LoadingFallback />}>
          <EngineModel />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
