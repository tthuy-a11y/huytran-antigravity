'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Preload, Stats, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

import { useCinematicStore, smoothstep } from '@/app/creative/lib/cinematicStore';

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
import CinematicPlanets from '@/app/creative/scenes/CinematicPlanets';
import { InteractiveSystem } from '@/app/creative/components/3d/InteractiveSystem';
import { InteractiveUI } from '@/app/creative/components/InteractiveUI';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import { MasterClock } from '@/app/creative/components/MasterClock';
import { BootSequence } from '@/app/creative/components/BootSequence';
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
    if (t < 3.5) targetFog.current.setStyle('#0a0218');           // creation — purple void
    else if (t < 5.5) targetFog.current.setStyle('#050815');      // cosmic dust — deep blue/purple bridge
    else if (t < 8) targetFog.current.setStyle('#02101e');        // technology — tech cyan
    else if (t < 13) targetFog.current.setStyle('#1a0508');       // convergence — impact red
    else if (t < 17) targetFog.current.setStyle('#180a02');       // hot debris
    else targetFog.current.setStyle('#100802');                   // awakening — warm amber

    // Dynamic fog density for cosmic dust transition (t=4.0 to 5.5s)
    // We push density extremely high to create a "Wipe" effect between scenes
    let density = 0.012; // base density
    if (t >= 4.0 && t < 6.0) {
      // Ramp up density to 0.22 (opaque) at 4.5s, then back down
      const dustRamp = smoothstep(4.0, 4.5, t) * (1 - smoothstep(4.8, 6.0, t));
      density = THREE.MathUtils.lerp(0.012, 0.22, dustRamp);
    }
    
    currentFog.current.lerp(targetFog.current, 0.04);
    if (scene.fog && (scene.fog as THREE.FogExp2).color) {
      (scene.fog as THREE.FogExp2).color.copy(currentFog.current);
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        (scene.fog as THREE.FogExp2).density,
        density,
        0.05
      );
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
    uReveal:     { value: 0 },
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
    uniform float uReveal;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float falloff = pow(1.0 - d * 2.0, 3.0);
      gl_FragColor = vec4(vec3(1.2) * vTwinkle, falloff * vTwinkle * uReveal);
    }
  `;

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.current.uTime.value += delta;
    
    // Smooth reveal from 1.5s to 2.5s (starts as pitch black)
    uniforms.current.uReveal.value = smoothstep(1.5, 2.5, t);

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
      <CinematicPlanets />
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
  const isPlaying        = useCinematicStore((s) => s.isPlaying);
  const time             = useCinematicStore((s) => s.time);
  const hasBootCompleted = useCinematicStore((s) => s.hasBootCompleted);
  const play             = useCinematicStore((s) => s.play);

  // Cinematic timer only starts AFTER BootSequence finishes its 2s overlay
  // (BootSequence calls completeBoot() which sets isPlaying=true + hasBootCompleted=true).
  // This hook is now a safety-net no-op for the boot path, but still kicks
  // a play() if for any reason boot already completed yet timer is paused at 0.
  useEffect(() => {
    if (isPlaying || time > 0 || !hasBootCompleted) return;
    const id = window.setTimeout(() => play(), 50);
    return () => window.clearTimeout(id);
  }, [isPlaying, time, hasBootCompleted, play]);
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
          const rampSec = scene === 'creation' ? 4.0 : 1.5;
          audioEngine.setSceneMix(scene, rampSec);
        });
      }
    );
    return unsub;
  }, []);
  
  return null;
}

// ============================================================
// MAIN DIRECTOR COMPONENT
// ============================================================
export interface CinematicDirectorProps {
  /** Called once when t reaches 30s naturally OR Skip is pressed */
  onComplete?: () => void;
  /** Show FPS overlay (dev) */
  showStats?: boolean;
}

// BootSequence removed: The user requested the cinematic intro to run immediately without artificial delay.
// ============================================================
// AUDIO PROMPT — appears if user hasn't interacted, prompting for audio init
// ============================================================
function AudioPrompt({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/70 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_40px_rgba(0,242,254,0.25)]"
    >
      <motion.div
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ repeat: Infinity, duration: 1.1 }}
        className="text-cyan-300"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </motion.div>
      <span className="text-cyan-100 text-sm font-mono tracking-widest">TRẢI NGHIỆM TỐT NHẤT VỚI ÂM THANH</span>
      <button
        onClick={onEnable}
        className="ml-2 px-4 py-1.5 rounded-xl bg-cyan-400 text-black font-bold text-xs tracking-widest uppercase hover:bg-cyan-300 transition-colors"
      >
        BẬT
      </button>
      <button
        onClick={onDismiss}
        className="px-2 py-1.5 rounded-xl text-white/40 hover:text-white text-xs"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}

export function CinematicDirector({
  onComplete,
  showStats = false,
}: CinematicDirectorProps) {
  const quality = useCinematicStore((s) => s.quality);
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const isTransitioning = useCinematicStore((s) => s.isTransitioning);
  const enterSystem = useCinematicStore((s) => s.enterSystem);

  const [audioPromptVisible, setAudioPromptVisible] = useState(true);

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

  const handleEnableAudio = () => {
    audioEngine.init?.();
    setAudioPromptVisible(false);
  };

  const showStatsOverlay =
    showStats ||
    (process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      window.location.search.includes('stats'));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000004',
        overflow: 'hidden',
      }}
    >
      <AudioInit />

      {/* ═══ OWN 3D CANVAS (creative is isolated from global Canvas) ═══ */}
      <Canvas
        gl={{
          antialias: quality.msaa,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        }}
        dpr={quality.dpr}
        camera={{ position: [0, 0, 200], fov: 30, near: 0.1, far: 500 }}
        shadows={quality.shadows}
        frameloop="always"
        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>
          {!hasEnteredSystem && <MasterClock onFinished={() => {}} />}
          {!hasEnteredSystem && <CameraRig />}
          <SceneBackdrop />
          {!hasEnteredSystem && <CinematicScenes />}
          {hasEnteredSystem && <InteractiveSystem />}
          <DynamicPostFx />
          <Preload all />
        </Suspense>
        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />
        <PerformanceMonitor />
        {showStatsOverlay && <Stats />}
      </Canvas>

      {/* ═══ Audio enable prompt (autoplay policy workaround) ═══ */}
      <AnimatePresence>
        {audioPromptVisible && !hasEnteredSystem && (
          <AudioPrompt
            key="audio-prompt"
            onEnable={handleEnableAudio}
            onDismiss={() => setAudioPromptVisible(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══ 2D overlay (dialogue, controls, progress) ═══ */}
      <AnimatePresence mode="wait">
        {!hasEnteredSystem && !isTransitioning && (
          <motion.div
            key="cinematic-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <CinematicUI />
          </motion.div>
        )}

        {hasEnteredSystem && (
          <motion.div
            key="interactive-ui"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <InteractiveUI />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransitioning && <TransitionSkeleton key="skeleton" />}
      </AnimatePresence>

      {/* ═══ BOOT SEQUENCE (DOM overlay z=60 — covers everything until t≈2s) ═══ */}
      {!hasEnteredSystem && <BootSequence />}
    </motion.div>
  );
}

