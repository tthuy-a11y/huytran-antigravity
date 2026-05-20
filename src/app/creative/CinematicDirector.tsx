'use client';

import { useEffect, useRef, Suspense, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Preload, Stats, PerformanceMonitor } from '@react-three/drei';
import { useCanvasStore } from '@/store/useCanvasStore';
import * as THREE from 'three';

import {
  useCinematicStore,
  CINEMATIC_DURATION,
  BIG_BANG_TIME,
} from '@/app/creative/lib/cinematicStore';

// Side-effect import: registers <plasmaSunMaterialImpl> + <coronaMaterialImpl>
import '@/app/creative/shaders/PlasmaSunMaterial';

import { CameraRig } from '@/app/creative/components/3d/CameraRig';
import { DynamicPostFx } from '@/app/creative/components/3d/DynamicPostFx';
import { CinematicUI } from '@/app/creative/components/CinematicUI';
import { setupAudioBridge, audioEngine } from '@/app/creative/lib/audioEngine';
import { AnimatePresence, motion } from 'framer-motion';
import { TransitionSkeleton } from '@/app/creative/components/TransitionSkeleton';

import { CreationNebula } from '@/app/creative/scenes/CreationNebula';
import { TechGrid } from '@/app/creative/scenes/TechGrid';
import { BigBangClash } from '@/app/creative/scenes/BigBangClash';
import { InteractiveSystem } from '@/app/creative/components/3d/InteractiveSystem';
import { InteractiveUI } from '@/app/creative/components/InteractiveUI';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import { MasterClock } from '@/app/creative/components/MasterClock';
import { getStarfieldGeometry, disposeAllCachedGeometries } from '@/app/creative/lib/geometryCache';



// ============================================================
// SCENE BACKDROP — deep space gradient + static distant stars
// Always present, slightly tinted per scene via lerped fog color.
// ============================================================
function SceneBackdrop() {
  const { scene } = useThree();
  const quality = useCinematicStore((s) => s.quality);

  // Persistent fog colors per scene — interpolated each frame
  const targetFog = useRef(new THREE.Color('#01010a'));
  const currentFog = useRef(new THREE.Color('#01010a'));

  useEffect(() => {
    scene.background = new THREE.Color('#000004');
    scene.fog = new THREE.FogExp2('#01010a', 0.012);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    // Scene-tinted fog
    if (t < 7) targetFog.current.setStyle('#0a0218');         // purple void
    else if (t < 13) targetFog.current.setStyle('#02101e');   // tech cyan
    else if (t < 16.5) targetFog.current.setStyle('#1a0508'); // convergence red
    else if (t < 20) targetFog.current.setStyle('#180a02');   // hot debris
    else targetFog.current.setStyle('#100802');               // warm awakening

    currentFog.current.lerp(targetFog.current, 0.04);
    if (scene.fog && (scene.fog as THREE.FogExp2).color) {
      (scene.fog as THREE.FogExp2).color.copy(currentFog.current);
    }
    if (scene.background && (scene.background as THREE.Color).copy) {
      (scene.background as THREE.Color).copy(currentFog.current).multiplyScalar(0.3);
    }
  });

  // Distant starfield — built once, never updated except for slow rotation
  return <DistantStarfield count={quality.starCount} />;
}

function DistantStarfield({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useRef<THREE.BufferGeometry | null>(null);
  if (!geometry.current) {
    geometry.current = getStarfieldGeometry(count);
  }

  const uniforms = useRef({
    uTime:       { value: 0 },
    uPixelRatio: {
      value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
    },
  });

  useSafeDispose([pointsRef.current, matRef.current, geometry.current]);

  const vertex = /* glsl */ `
    attribute float aSize;
    attribute vec3  aColor;
    varying vec3 vColor;
    varying float vTwinkle;
    uniform float uTime;
    uniform float uPixelRatio;
    void main() {
      vColor = aColor;
      // Per-star twinkle: hash by position
      float seed = position.x * 0.1 + position.y * 0.07 + position.z * 0.13;
      vTwinkle = 0.6 + 0.4 * sin(uTime * 1.5 + seed);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPos.z);
      gl_Position = projectionMatrix * mvPos;
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float falloff = pow(1.0 - d * 2.0, 3.0);
      gl_FragColor = vec4(vColor * vTwinkle * 1.5, falloff * vTwinkle);
    }
  `;

  useFrame((_, delta) => {
    uniforms.current.uTime.value += delta;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry.current!}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms.current}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================
// CINEMATIC SCENES CONTAINER
// All four scenes live inside one group. Visibility is controlled
// per-scene internally via time-based show/hide. Nothing mounts or
// unmounts during the cinematic — only `.visible` flips.
// ============================================================
function CinematicScenes() {
  return (
    <>
      <CreationNebula />
      <TechGrid />
      <BigBangClash />
    </>
  );
}

// ============================================================
// KEYBOARD CONTROLS — Space=play/pause, Esc=skip, M=mute
// ============================================================
function useKeyboardControls() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useCinematicStore.getState();
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (state.isFinished) state.reset();
          else if (state.isPlaying) state.pause();
          else state.play();
          break;
        case 'Escape':
          state.skip();
          break;
        case 'm':
        case 'M':
          state.toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

// ============================================================
// AUTO-START — kick the cinematic on first user interaction
// (avoids autoplay-suspended audio + ensures gestures are captured)
// ============================================================
function useAutoStart() {
  const isPlaying = useCinematicStore((s) => s.isPlaying);
  const time = useCinematicStore((s) => s.time);
  const play = useCinematicStore((s) => s.play);

  useEffect(() => {
    if (isPlaying || time > 0) return;
    // Start immediately on mount — no user gesture required for visuals
    const id = window.setTimeout(() => play(), 100);
    return () => window.clearTimeout(id);
  }, [isPlaying, time, play]);
}

// ============================================================
// AUDIO INIT — listen for first user gesture to unlock audio
// ============================================================
function AudioInit() {
  useEffect(() => {
    return setupAudioBridge({
      onSceneChange: () => {}, // Handled directly in engine or store
      getMuted: () => useCinematicStore.getState().isMuted,
      getVolume: () => 0.7, // Fallback since new store doesn't manage volume
      getScene: () => useCinematicStore.getState().currentScene,
    });
  }, []);
  
  // Sync engine scene mix to store changes
  useEffect(() => {
    const unsub = useCinematicStore.subscribe(
      (s) => s.currentScene,
      (scene) => {
        import('@/app/creative/lib/audioEngine').then(({ audioEngine }) => {
          audioEngine.setSceneMix(scene);
        });
      }
    );
    return unsub;
  }, []);
  
  return null;
}

// ============================================================
// CINEMATIC SCENE 3D — injected into the global Canvas via useCanvasStore
// Self-contained: reads all state from useCinematicStore directly.
// ============================================================
const CinematicScene3D = memo(function CinematicScene3D() {
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const quality = useCinematicStore((s) => s.quality);
  const showStats =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    window.location.search.includes('stats');

  return (
    <Suspense fallback={null}>
      {!hasEnteredSystem && <MasterClock onFinished={() => {}} />}
      {!hasEnteredSystem && <CameraRig />}
      <SceneBackdrop />
      {!hasEnteredSystem && <CinematicScenes />}
      {hasEnteredSystem && <InteractiveSystem />}
      <DynamicPostFx />
      <Preload all />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <PerformanceMonitor />
      {showStats && <Stats />}
    </Suspense>
  );
});

// ============================================================
// MAIN DIRECTOR COMPONENT
// ============================================================
export interface CinematicDirectorProps {
  /** Called once when t reaches 30s naturally OR Skip is pressed */
  onComplete?: () => void;
  /** Show FPS overlay (dev) */
  showStats?: boolean;
}

export function CinematicDirector({
  onComplete,
  showStats = false,
}: CinematicDirectorProps) {
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const isTransitioning = useCinematicStore((s) => s.isTransitioning);
  const enterSystem = useCinematicStore((s) => s.enterSystem);
  const setScene = useCanvasStore((s) => s.setScene);

  // Inject cinematic scene into the global Canvas; eject on unmount
  useEffect(() => {
    setScene(CinematicScene3D, { position: [0, 0, 22], fov: 55, near: 0.1, far: 500 });
    return () => setScene(null);
  }, [setScene]);

  useEffect(() => {
    return () => disposeAllCachedGeometries();
  }, []);

  useKeyboardControls();
  useAutoStart();

  // Subscribe to finish events
  useEffect(() => {
    const unsub = useCinematicStore.subscribe(
      (s) => s.isFinished,
      (finished) => {
        if (finished && !hasEnteredSystem) {
          enterSystem();
          onComplete?.();
        }
      }
    );
    return unsub;
  }, [hasEnteredSystem, enterSystem, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <AudioInit />

      {/* 2D HTML overlay — dialogue, skip button, mute, progress */}
      <div style={{ pointerEvents: 'auto' }}>
        <AnimatePresence mode="wait">
          {!hasEnteredSystem && !isTransitioning && (
            <motion.div
              key="cinematic-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <CinematicUI />
            </motion.div>
          )}

          {hasEnteredSystem && (
            <motion.div
              key="interactive-ui"
              initial={{ opacity: 0, filter: "blur(12px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <InteractiveUI />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isTransitioning && <TransitionSkeleton key="skeleton" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

