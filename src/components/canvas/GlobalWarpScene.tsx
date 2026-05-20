'use client';

import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFleetStore } from '@/store/useFleetStore';
import { FleetShip } from './FleetShip';

// =============================================================================
// WARP-ONLY POST-PROCESSING — render only during warp/power-up to avoid
// EffectComposer overhead (and byteLength=null buffer issues) when idle.
// =============================================================================
function WarpPostFx() {
  const phase = useFleetStore((s) => s.flightPhase);
  if (phase === 'idle' || phase === 'arrival') return null;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom luminanceThreshold={0.2} mipmapBlur intensity={phase === 'warping' ? 4.6 : 1.5} />
    </EffectComposer>
  );
}

// =============================================================================
// CAMERA FOV STRETCH during warp
// =============================================================================
function WarpFov() {
  const phase = useFleetStore((s) => s.flightPhase);
  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    if (phase === 'warping') {
      cam.fov = THREE.MathUtils.lerp(cam.fov, 142, 6.5 * delta);
    } else {
      cam.fov = THREE.MathUtils.lerp(cam.fov, 75, 4.5 * delta);
    }
    cam.updateProjectionMatrix();
  });
  return null;
}

// =============================================================================
// WARP STARFIELD
// =============================================================================
function WarpStarfield() {
  const phase = useFleetStore((state) => state.flightPhase);
  const starsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!starsRef.current) return;
    const speed = phase === 'warping' ? 128 : phase === 'power-up' ? 3.8 : 0.48;
    starsRef.current.position.z += speed * delta;
    if (starsRef.current.position.z > 68) starsRef.current.position.z = -68;
    if (phase === 'warping') starsRef.current.rotation.z += delta * 2.9;
  });

  return (
    <group ref={starsRef}>
      <Stars radius={135} depth={68} count={4500} factor={4.5} saturation={0} fade speed={1} />
    </group>
  );
}

// =============================================================================
// FLEET SCENE FRAGMENT — rendered by the global Canvas when no scene is injected
// =============================================================================
export default function GlobalWarpScene() {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#010204']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[14, 11, 7]} intensity={2.5} color="#00ffff" />
      <WarpFov />
      <WarpStarfield />
      <FleetShip />
      <WarpPostFx />
    </Suspense>
  );
}
