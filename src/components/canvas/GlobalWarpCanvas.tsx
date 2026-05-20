'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import React, { useRef, Suspense, Component } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { FleetShip } from './FleetShip';
import { SpaceStationDock } from './SpaceStationDock';

// =============================================================================
// ERROR BOUNDARY — prevents R3F errors from crashing the entire app
// Next.js Error Overlay tries to JSON.stringify the React tree on error,
// but Three.js objects contain circular refs (parent <-> children).
// This boundary catches errors BEFORE they reach Next.js, returning null.
// =============================================================================
class R3FErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[R3F ErrorBoundary] Caught:', error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// =============================================================================
// POST-PROCESSING EFFECTS
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
// MAIN CANVAS — wrapped in ErrorBoundary
// =============================================================================
export default function GlobalWarpCanvas() {
  return (
    <R3FErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ powerPreference: 'high-performance', antialias: true, alpha: true }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <color attach="background" args={['#010204']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[14, 11, 7]} intensity={2.9} color="#00ffff" />

        <Suspense fallback={null}>
          <SpaceStationDock />
          <WarpStarfield />
          <FleetShip />
          <SpacetimeDistortion />
        </Suspense>
      </Canvas>
    </R3FErrorBoundary>
  );
}
