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

  const cores  = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  let gpuTier = 1;
  try {
    const dbg = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const r = ((gl as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string).toLowerCase();
      if (r.includes('apple m') || r.includes('rtx') || r.includes('radeon pro') ||
          r.includes('rx 6') || r.includes('rx 7')) gpuTier = 3;
      else if (r.includes('gtx') || r.includes('radeon') || r.includes('iris')) gpuTier = 2;
    }
  } catch { /* ignore */ }

  if (isMobile || cores <= 4 || memory <= 4 || gpuTier === 1) return 'low';
  if (cores >= 8 && memory >= 8 && gpuTier >= 3) return 'high';
  return 'mid';
};

// ============================================================
// QUALITY BUDGETS
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
    nebulaParticles: 2500, starCount: 1500, gridDensity: 12,
    explosionParticles: 4000, debrisCount: 60,
    bloomResolution: 128, dpr: [1, 1.25], shadows: false, msaa: false,
  },
  mid: {
    nebulaParticles: 7000, starCount: 4000, gridDensity: 20,
    explosionParticles: 15000, debrisCount: 180,
    bloomResolution: 256, dpr: [1, 1.5], shadows: false, msaa: false,
  },
  high: {
    nebulaParticles: 18000, starCount: 10000, gridDensity: 32,
    explosionParticles: 45000, debrisCount: 400,
    bloomResolution: 512, dpr: [1, 2], shadows: true, msaa: true,
  },
};

// ============================================================
// TIMELINE — front-loaded 42s, Big Bang at 9.5s
// ============================================================
export type SceneId = 'creation' | 'technology' | 'convergence' | 'awakening';

export interface SceneRange {
  id: SceneId;
  start: number;
  end: number;
}

export const SCENE_RANGES: SceneRange[] = [
  { id: 'creation',    start: 0.0,  end: 4.0  },
  { id: 'technology',  start: 4.0,  end: 8.0  },
  { id: 'convergence', start: 8.0,  end: 17.0 },
  { id: 'awakening',   start: 17.0, end: 31.0 },
];

export const CINEMATIC_DURATION = 31.0;   // ← rút gọn từ 42s
export const BIG_BANG_TIME      = 8.0;    // ← bang ở giây 8

const getSceneAt = (t: number): SceneId => {
  for (const r of SCENE_RANGES) if (t >= r.start && t < r.end) return r.id;
  return 'awakening';
};

// ============================================================
// STORE
// ============================================================
interface CinematicState {
  time: number;
  isPlaying: boolean;
  isFinished: boolean;
  hasBootCompleted: boolean;
  currentScene: SceneId;
  deviceTier: DeviceTier;
  quality: QualityBudget;
  isMuted: boolean;
  hasEnteredSystem: boolean;
  isTransitioning: boolean;
  focusedPlanetId: string | null;

  setTime: (t: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  completeBoot: () => void;
  toggleMute: () => void;
  enterSystem: () => void;
  setTransitioning: (v: boolean) => void;
  resetCamera: () => void;
  focusPlanet: (id: string | null) => void;
  setQualityTier: (tier: DeviceTier) => void;
}

export const useCinematicStore = create<CinematicState>()(
  subscribeWithSelector((set, get) => {
    const tier = detectDeviceTier();
    return {
      time: 0,
      isPlaying: false,           // gated by boot sequence
      isFinished: false,
      hasBootCompleted: false,    // becomes true when BootSequence finishes
      currentScene: 'creation',
      deviceTier: tier,
      quality: QUALITY_BUDGETS[tier],
      isMuted: false,
      hasEnteredSystem: false,
      isTransitioning: false,
      focusedPlanetId: null,

      setTime: (t: number) => {
        const clamped  = Math.max(0, Math.min(CINEMATIC_DURATION, t));
        const scene    = getSceneAt(clamped);
        const finished = clamped >= CINEMATIC_DURATION - 0.001;
        const prev     = get();
        if (prev.time === clamped && prev.currentScene === scene && prev.isFinished === finished) return;
        set({ time: clamped, currentScene: scene, isFinished: finished,
              isPlaying: finished ? false : prev.isPlaying });
      },

      play:  () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      reset: () => set({ time: 0, isPlaying: true, isFinished: false, hasBootCompleted: true, currentScene: 'creation' }),
      skip:  () => set({ time: CINEMATIC_DURATION, isPlaying: false, isFinished: true, hasBootCompleted: true,
                         currentScene: 'awakening', hasEnteredSystem: true }),
      completeBoot: () => set({ hasBootCompleted: true, isPlaying: true }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      enterSystem: () => {
        set({ isTransitioning: true });
        setTimeout(() => set({ isTransitioning: false, hasEnteredSystem: true }), 1500);
      },
      setTransitioning: (v) => set({ isTransitioning: v }),
      resetCamera:      ()  => set({ focusedPlanetId: null }),
      focusPlanet:      (id) => set({ focusedPlanetId: id }),
      setQualityTier:   (t)  => set({ deviceTier: t, quality: QUALITY_BUDGETS[t] }),
    };
  })
);

// ============================================================
// SELECTORS
// ============================================================
export const selectTime    = (s: CinematicState) => s.time;
export const selectScene   = (s: CinematicState) => s.currentScene;
export const selectQuality = (s: CinematicState) => s.quality;

// ============================================================
// MATH UTILITIES
// ============================================================
export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export const smootherstep = (e0: number, e1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const ramp = (t: number, start: number, end: number): number =>
  Math.max(0, Math.min(1, (t - start) / (end - start)));

export const pulse = (t: number, start: number, end: number): number => {
  if (t < start || t > end) return 0;
  const mid = (start + end) * 0.5;
  return 1 - Math.abs(t - mid) / ((end - start) * 0.5);
};

export const fadeWindow = (
  t: number, start: number, end: number, fadeIn = 0.4, fadeOut = 0.4
): number => {
  if (t < start || t > end) return 0;
  return Math.min(
    smoothstep(start, start + fadeIn, t),
    1 - smoothstep(end - fadeOut, end, t)
  );
};
