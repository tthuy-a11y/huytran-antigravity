'use client';

import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFleetStore } from '@/store/useFleetStore';
import { FleetShip } from './FleetShip';
import { SpaceStationDock } from './SpaceStationDock';

// =============================================================================
// POST-PROCESSING — warp distortion + bloom
// =============================================================================
function SpacetimeDistortion() {
  const phase = useFleetStore((state) => state.flightPhase);
  const chromaRef = useRef<any>(null);

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    if (phase === 'warping') {
      cam.fov = THREE.MathUtils.lerp(cam.fov, 142, 6.5 * delta);
      if (chromaRef.current?.offset) {
        chromaRef.current.offset.x = THREE.MathUtils.lerp(chromaRef.current.offset.x, 0.047, 6.5 * delta);
        chromaRef.current.offset.y = THREE.MathUtils.lerp(chromaRef.current.offset.y, 0.047, 6.5 * delta);
      }
    } else {
      cam.fov = THREE.MathUtils.lerp(cam.fov, 75, 4.5 * delta);
      if (chromaRef.current?.offset) {
        chromaRef.current.offset.x = 0;
        chromaRef.current.offset.y = 0;
      }
    }
    cam.updateProjectionMatrix();
  });

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom luminanceThreshold={0.16} mipmapBlur intensity={phase === 'warping' ? 5.1 : 1.75} />
      <ChromaticAberration
        ref={chromaRef}
        blendFunction={BlendFunction.NORMAL}
        offset={[0, 0] as any}
      />
    </EffectComposer>
  );
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
      <Stars radius={135} depth={68} count={7800} factor={4.9} saturation={0} fade speed={1} />
    </group>
  );
}

// =============================================================================
// FLEET SCENE FRAGMENT — rendered by the global Canvas when no scene is injected
// =============================================================================
export default function GlobalWarpScene() {
  return (
    <>
      <color attach="background" args={['#010204']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[14, 11, 7]} intensity={2.9} color="#00ffff" />
      <Suspense fallback={null}>
        <SpaceStationDock />
        <WarpStarfield />
        <FleetShip />
        <SpacetimeDistortion />
      </Suspense>
    </>
  );
}
