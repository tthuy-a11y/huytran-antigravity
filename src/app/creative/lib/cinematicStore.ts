import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================
// DEVICE TIER DETECTION
// ============================================================
export type DeviceTier = 'low' | 'mid' | 'high';

const detectDeviceTier = (): DeviceTier => {
  if (typeof window === 'undefined') return 'mid';

  const gl = document.createElement('canvas').getContext('webgl2') ||
             document.createElement('canvas').getContext('webgl');
  if (!gl) return 'low';

  // Hardware concurrency check
  const cores = navigator.hardwareConcurrency || 4;
  // Memory check (Chrome only)
  // @ts-ignore
  const memory = (navigator as any).deviceMemory || 4;
  // Mobile check
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // GPU heuristic via UNMASKED_RENDERER (when available)
  let gpuTier = 1;
  try {
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      ) as string;
      const r = renderer.toLowerCase();
      if (r.includes('apple m') || r.includes('rtx') || r.includes('radeon pro') ||
          r.includes('rx 6') || r.includes('rx 7')) gpuTier = 3;
      else if (r.includes('gtx') || r.includes('radeon') || r.includes('iris')) gpuTier = 2;
      else gpuTier = 1;
    }
  } catch (e) {
    gpuTier = 1;
  }

  if (isMobile || cores <= 4 || memory <= 4 || gpuTier === 1) return 'low';
  if (cores >= 8 && memory >= 8 && gpuTier >= 3) return 'high';
  return 'mid';
};

// ============================================================
// PARTICLE / QUALITY BUDGETS PER TIER
// ============================================================
export interface QualityBudget {
  nebulaParticles: number;
  starCount: number;
  gridDensity: number;
  explosionParticles: number;
  debrisCount: number;
  bloomResolution: number;
  dpr: [number, number];
  shadows: boolean;
  msaa: boolean;
}

export const QUALITY_BUDGETS: Record<DeviceTier, QualityBudget> = {
  low: {
    nebulaParticles: 2500,
    starCount: 1500,
    gridDensity: 12,
    explosionParticles: 4000,
    debrisCount: 60,
    bloomResolution: 128,
    dpr: [1, 1.25],
    shadows: false,
    msaa: false,
  },
  mid: {
    nebulaParticles: 7000,
    starCount: 4000,
    gridDensity: 20,
    explosionParticles: 15000,
    debrisCount: 180,
    bloomResolution: 256,
    dpr: [1, 1.5],
    shadows: false,
    msaa: false,
  },
  high: {
    nebulaParticles: 18000,
    starCount: 10000,
    gridDensity: 32,
    explosionParticles: 45000,
    debrisCount: 400,
    bloomResolution: 512,
    dpr: [1, 2],
    shadows: true,
    msaa: true,
  },
};

// ============================================================
// SCENE DEFINITION
// ============================================================
export type SceneId = 'creation' | 'technology' | 'convergence' | 'awakening';

export interface SceneRange {
  id: SceneId;
  start: number;
  end: number;
}

export const SCENE_RANGES: SceneRange[] = [
  { id: 'creation',    start: 0.0,   end: 5.95  },
  { id: 'technology',  start: 5.95,  end: 11.05 },
  { id: 'convergence', start: 11.05, end: 22.0  },
  { id: 'awakening',   start: 22.0,  end: 30.0  },
];

export const CINEMATIC_DURATION = 30.0;
export const BIG_BANG_TIME = 16.0;

const getSceneAt = (time: number): SceneId => {
  for (const r of SCENE_RANGES) {
    if (time >= r.start && time < r.end) return r.id;
  }
  return 'awakening';
};

// ============================================================
// ZUSTAND STORE
// ============================================================
interface CinematicState {
  // Timeline
  time: number;
  isPlaying: boolean;
  isFinished: boolean;
  currentScene: SceneId;

  // System
  deviceTier: DeviceTier;
  quality: QualityBudget;
  isMuted: boolean;

  // Interactive (post-cinematic planetary system)
  hasEnteredSystem: boolean;
  isTransitioning: boolean;
  focusedPlanetId: string | null;

  // Actions
  setTime: (t: number) => void;
  play: () => void;
  pause: () => void;
  resetCamera: () => void;
    setTransitioning: (v: boolean) => void;
    reset: () => void;
  skip: () => void;
  toggleMute: () => void;
  enterSystem: () => void;
  focusPlanet: (id: string | null) => void;
  setQualityTier: (tier: DeviceTier) => void;
}

export const useCinematicStore = create<CinematicState>()(
  subscribeWithSelector((set, get) => {
    const tier = detectDeviceTier();
    return {
      time: 0,
      isPlaying: true,
      isFinished: false,
      currentScene: 'creation',
      deviceTier: tier,
      quality: QUALITY_BUDGETS[tier],
      isMuted: false,
      hasEnteredSystem: false,
        isTransitioning: false,
      focusedPlanetId: null,

      setTime: (t: number) => {
        const clamped = Math.max(0, Math.min(CINEMATIC_DURATION, t));
        const scene = getSceneAt(clamped);
        const finished = clamped >= CINEMATIC_DURATION - 0.001;
        const prev = get();
        // Avoid setState churn when nothing meaningful changed
        if (
          prev.time === clamped &&
          prev.currentScene === scene &&
          prev.isFinished === finished
        ) return;
        set({
          time: clamped,
          currentScene: scene,
          isFinished: finished,
          isPlaying: finished ? false : prev.isPlaying,
        });
      },

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      reset: () =>
        set({
          time: 0,
          isPlaying: true,
          isFinished: false,
          currentScene: 'creation',
        }),
      skip: () =>
        set({
          time: CINEMATIC_DURATION,
          isPlaying: false,
          isFinished: true,
          currentScene: 'awakening',
          hasEnteredSystem: true,
        }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      enterSystem: () => {
          set({ isTransitioning: true });
          setTimeout(() => set({ isTransitioning: false, hasEnteredSystem: true }), 1500);
        },
        setTransitioning: (v) => set({ isTransitioning: v }),
        resetCamera: () => set({ focusedPlanetId: null }),
      focusPlanet: (id) => set({ focusedPlanetId: id }),
      setQualityTier: (tier) =>
        set({ deviceTier: tier, quality: QUALITY_BUDGETS[tier] }),
    };
  })
);

// ============================================================
// SELECTORS (referenced via getState() inside useFrame)
// ============================================================
export const selectTime = (s: CinematicState) => s.time;
export const selectScene = (s: CinematicState) => s.currentScene;
export const selectQuality = (s: CinematicState) => s.quality;

// ============================================================
// TIMELINE UTILITIES (pure math — safe to call inside useFrame)
// ============================================================

/** Smoothstep helper */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Smoother step (Ken Perlin's) */
export const smootherstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Linear ramp clamped to [0,1] */
export const ramp = (t: number, start: number, end: number): number => {
  if (end === start) return t >= start ? 1 : 0;
  return Math.max(0, Math.min(1, (t - start) / (end - start)));
};

/** Symmetric pulse: 0 at edges, 1 at center */
export const pulse = (t: number, start: number, end: number): number => {
  const mid = (start + end) * 0.5;
  if (t < start || t > end) return 0;
  const half = (end - start) * 0.5;
  return 1 - Math.abs(t - mid) / half;
};

/** Visibility window with fade in/out */
export const fadeWindow = (
  t: number,
  start: number,
  end: number,
  fadeIn = 0.4,
  fadeOut = 0.4
): number => {
  if (t < start || t > end) return 0;
  const inA = smoothstep(start, start + fadeIn, t);
  const outA = 1 - smoothstep(end - fadeOut, end, t);
  return Math.min(inA, outA);
};