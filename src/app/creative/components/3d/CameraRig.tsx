'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useCinematicStore,
  BIG_BANG_TIME,
  smoothstep,
  smootherstep,
} from '@/app/creative/lib/cinematicStore';

// ============================================================
// CINEMATIC KEYFRAMES
// Each keyframe = camera position + look-at target at a given time.
// Interpolation between keys uses smootherstep for buttery easing.
// ============================================================
interface CameraKey {
  t: number;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const KEYS: CameraKey[] = [
  // SCENE 1 — CREATION (compressed 15%: 0 → 5.95s)
  { t: 0.0,  pos: new THREE.Vector3( 0,  0, 22), target: new THREE.Vector3(0, 0, 0), fov: 55 },
  { t: 2.55, pos: new THREE.Vector3( 0.4, 0.2, 14), target: new THREE.Vector3(0, 0, 0), fov: 52 },
  { t: 5.95, pos: new THREE.Vector3(-1.5, 0.6, 9),  target: new THREE.Vector3(0, 0, 0), fov: 50 },

  // SCENE 2 — TECHNOLOGY (compressed 15%: 5.95 → 11.05s)
  // 4 keyframes for smooth acceleration — second half moves faster
  { t: 7.0,  pos: new THREE.Vector3(-7,  1.0, 10), target: new THREE.Vector3(0, 0, -4),  fov: 55 },
  { t: 8.8,  pos: new THREE.Vector3(-2,  1.8,  7), target: new THREE.Vector3(0, 0, -8),  fov: 58 },
  { t: 10.0, pos: new THREE.Vector3( 3,  2.0,  5), target: new THREE.Vector3(0, 0, -10), fov: 60 },
  { t: 11.05,pos: new THREE.Vector3( 6,  1.5,  4), target: new THREE.Vector3(0, 0, -6),  fov: 58 },

  // Bridge to SCENE 3 — smooth transition (11.05 → 14.0)
  { t: 12.5, pos: new THREE.Vector3( 2,  2, 16), target: new THREE.Vector3(0, 0, 0), fov: 58 },

  // SCENE 3 — CONVERGENCE
  // Wide neutral framing for incoming asteroids, then collision close-up at 16
  { t: 14.0, pos: new THREE.Vector3( 0,  3, 22), target: new THREE.Vector3(0, 0, 0), fov: 60 },
  { t: 15.8, pos: new THREE.Vector3( 0,  1, 14), target: new THREE.Vector3(0, 0, 0), fov: 65 },
  { t: 16.0, pos: new THREE.Vector3( 0,  0,  9), target: new THREE.Vector3(0, 0, 0), fov: 72 }, // BANG
  { t: 16.6, pos: new THREE.Vector3( 1.2, 1.0, 18), target: new THREE.Vector3(0, 0, 0), fov: 60 },
  { t: 18.0, pos: new THREE.Vector3( 3,  2, 28), target: new THREE.Vector3(0, 0, 0), fov: 55 },
  { t: 20.0, pos: new THREE.Vector3(-4,  3, 32), target: new THREE.Vector3(0, 0, 0), fov: 52 },
  { t: 22.0, pos: new THREE.Vector3( 0,  6, 38), target: new THREE.Vector3(0, 0, 0), fov: 50 },

  // SCENE 4 — AWAKENING (slow majestic dolly toward Sun)
  { t: 24.0, pos: new THREE.Vector3( 2,  4, 30), target: new THREE.Vector3(0, 0, 0), fov: 48 },
  { t: 27.0, pos: new THREE.Vector3( 1,  2, 22), target: new THREE.Vector3(0, 0, 0), fov: 46 },
  { t: 30.0, pos: new THREE.Vector3( 0,  1, 18), target: new THREE.Vector3(0, 0, 0), fov: 44 },
];

// Pre-sort just in case
KEYS.sort((a, b) => a.t - b.t);

// ============================================================
// HELPERS — pure math, safe to run inside useFrame
// ============================================================

/** Find the two keyframes bracketing time `t` and return interpolation factor. */
function findKeyframeSegment(t: number): {
  a: CameraKey;
  b: CameraKey;
  k: number;
} {
  if (t <= KEYS[0].t) return { a: KEYS[0], b: KEYS[0], k: 0 };
  const last = KEYS[KEYS.length - 1];
  if (t >= last.t) return { a: last, b: last, k: 0 };

  let lo = 0;
  let hi = KEYS.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (KEYS[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = KEYS[lo];
  const b = KEYS[hi];
  const span = b.t - a.t;
  const k = span > 1e-6 ? (t - a.t) / span : 0;
  return { a, b, k };
}

/** Cheap deterministic 1D pseudo-noise for shake (NOT THREE.MathUtils.seededRandom). */
function hash11(x: number): number {
  // sine-hash, [-1, 1]
  return Math.sin(x * 127.1) * 43758.5453 % 1;
}
function smoothNoise1D(x: number): number {
  const xi = Math.floor(x);
  const xf = x - xi;
  const u = xf * xf * (3 - 2 * xf);
  const a = hash11(xi);
  const b = hash11(xi + 1);
  return a + (b - a) * u; // approx [-1, 1]
}

/** Composite multi-octave shake noise — like Perlin fbm but cheap. */
function shakeNoise(time: number, seed: number): number {
  return (
    smoothNoise1D(time * 23.0 + seed) * 0.5 +
    smoothNoise1D(time * 47.0 + seed * 1.3) * 0.3 +
    smoothNoise1D(time * 91.0 + seed * 2.7) * 0.2
  );
}

/**
 * Camera-shake envelope around the Big Bang (t=16).
 * Gradual build-up from 13.5s, peak at 16.0, decay to 18.5s.
 */
function shakeEnvelope(t: number): number {
  if (t < 13.5 || t > 18.5) return 0;
  if (t < 16.0) {
    // ramp 13.5 → 16.0 (exponential build)
    const k = (t - 13.5) / (16.0 - 13.5);
    return Math.pow(k, 2.2);
  } else {
    // decay 16.0 → 18.5
    const k = 1 - (t - 16.0) / (18.5 - 16.0);
    return Math.pow(Math.max(0, k), 1.6);
  }
}

// ============================================================
// COMPONENT
// ============================================================
export function CameraRig() {
  const { camera, size } = useThree();

  // Reusable scratch objects — avoid GC inside useFrame
  const tmpPos        = useRef(new THREE.Vector3());
  const tmpTarget     = useRef(new THREE.Vector3());
  const tmpShake      = useRef(new THREE.Vector3());
  const currentPos    = useRef(new THREE.Vector3().copy(KEYS[0].pos));
  const currentTarget = useRef(new THREE.Vector3().copy(KEYS[0].target));
  const currentFov    = useRef(KEYS[0].fov);

  // Mouse parallax (subtle, scaled down during shake / explosion)
  const mouse = useRef({ x: 0, y: 0 });
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Initialize camera state
  useMemo(() => {
    camera.position.copy(KEYS[0].pos);
    camera.lookAt(KEYS[0].target);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = KEYS[0].fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera]);

  useFrame((_state, delta) => {
    // READ from store — never write inside useFrame
    const t = useCinematicStore.getState().time;

    // --- 1. Keyframe interpolation ---
    const { a, b, k } = findKeyframeSegment(t);
    const eased = smootherstep(0, 1, k);

    tmpPos.current.lerpVectors(a.pos, b.pos, eased);
    tmpTarget.current.lerpVectors(a.target, b.target, eased);
    const targetFov = a.fov + (b.fov - a.fov) * eased;

    // --- 2. Mouse parallax (dampened near big bang) ---
    const parallaxStrength = 0.6 * (1 - shakeEnvelope(t) * 0.7);
    tmpPos.current.x += mouse.current.x * parallaxStrength;
    tmpPos.current.y += mouse.current.y * parallaxStrength;

    // --- 3. Camera shake (Perlin-style noise, peak at 16.0s) ---
    const shakeAmt = shakeEnvelope(t);
    if (shakeAmt > 0.001) {
      // Big Bang peak: ~1.8 units. Pre-bang buildup: <0.6 units.
      const peak = 1.8;
      const nx = shakeNoise(t, 1.1);
      const ny = shakeNoise(t, 7.7);
      const nz = shakeNoise(t, 13.3);
      tmpShake.current.set(nx, ny, nz).multiplyScalar(shakeAmt * peak);
      tmpPos.current.add(tmpShake.current);

      // Target jitter (smaller) — keeps eyes near origin but adds chaos
      tmpTarget.current.x += nx * shakeAmt * 0.4;
      tmpTarget.current.y += ny * shakeAmt * 0.4;
    }

    // --- 4. Critical-damped smoothing toward target ---
    // Stronger lambda right around the Bang so the snap feels punchy.
    const baseLambda = 6.0;
    const shakeLambda = 14.0;
    const lambda = baseLambda + (shakeLambda - baseLambda) * shakeAmt;

    // Approximation of maath/damp using exponential smoothing
    const alpha = 1 - Math.exp(-lambda * delta);

    currentPos.current.lerp(tmpPos.current, alpha);
    currentTarget.current.lerp(tmpTarget.current, alpha);
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, alpha);

    // --- 5. Apply to actual camera ---
    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      // Big Bang FOV punch — extra 8° jolt that decays fast
      const punch =
        t >= BIG_BANG_TIME && t < BIG_BANG_TIME + 0.6
          ? (1 - (t - BIG_BANG_TIME) / 0.6) * 8.0
          : 0;
      const finalFov = currentFov.current + punch;

      if (Math.abs(persp.fov - finalFov) > 0.01) {
        persp.fov = finalFov;
        persp.updateProjectionMatrix();
      }

      // Maintain aspect on resize without writing to store
      const aspect = size.width / size.height;
      if (Math.abs(persp.aspect - aspect) > 0.001) {
        persp.aspect = aspect;
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}

// Export shake utilities so DynamicPostFx and BigBangClash can sync to them
export { shakeEnvelope, shakeNoise };
