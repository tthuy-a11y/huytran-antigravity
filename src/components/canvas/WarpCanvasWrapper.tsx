'use client';

import React, { Component, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';
import { useCanvasStore } from '@/store/useCanvasStore';
import GlobalWarpScene from './GlobalWarpScene';

// Routes that mount their own R3F Canvas — disable the global one to avoid dual WebGL context
const ROUTES_WITH_OWN_CANVAS = ['/system'];

// =============================================================================
// ERROR BOUNDARY — prevents R3F errors from crashing the app
// Three.js objects contain circular refs; this catches before Next.js serializes.
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
  componentDidCatch(error: Error) {
    console.warn('[R3F ErrorBoundary] Caught:', error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// =============================================================================
// CAMERA SYNC — applies override from useCanvasStore when a scene is injected
// Resets to fleet defaults when injection is cleared.
// =============================================================================
function CameraSync() {
  const cameraOverride = useCanvasStore((s) => s.cameraOverride);
  const { camera } = useThree();

  useEffect(() => {
    if (cameraOverride) {
      if (cameraOverride.position) camera.position.set(...cameraOverride.position);
      if (camera instanceof THREE.PerspectiveCamera) {
        if (cameraOverride.fov !== undefined) camera.fov = cameraOverride.fov;
        if (cameraOverride.near !== undefined) camera.near = cameraOverride.near;
        if (cameraOverride.far !== undefined) camera.far = cameraOverride.far;
        camera.updateProjectionMatrix();
      }
    } else {
      camera.position.set(0, 0, 10);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 75;
        camera.near = 0.1;
        camera.far = 1000;
        camera.updateProjectionMatrix();
      }
    }
  }, [cameraOverride, camera]);

  return null;
}

// =============================================================================
// SCENE ROUTER — switches between injected scene and fleet default
// =============================================================================
function SceneRouter() {
  const InjectedScene = useCanvasStore((s) => s.scene);
  if (InjectedScene) return <InjectedScene />;
  return <GlobalWarpScene />;
}

// =============================================================================
// MASTER CANVAS — single WebGL context for the entire app
// /creative injects its cinematic scene; all other routes get the fleet scene.
// =============================================================================
export function WarpCanvasWrapper() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (ROUTES_WITH_OWN_CANVAS.some((r) => pathname.startsWith(r))) return null;

  return (
    <R3FErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75, near: 0.1, far: 1000 }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <CameraSync />
        <Suspense fallback={null}>
          <SceneRouter />
        </Suspense>
      </Canvas>
    </R3FErrorBoundary>
  );
}
