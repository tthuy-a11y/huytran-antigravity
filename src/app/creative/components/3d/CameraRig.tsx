'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore, BIG_BANG_TIME, smootherstep } from '@/app/creative/lib/cinematicStore';

// ============================================================
// KEYFRAMES — 42s timeline, Big Bang at 9.5s
// roll = camera tilt (radians) for dramatic banking shots
// ============================================================
interface CameraKey {
  t:      number;
  pos:    THREE.Vector3;
  target: THREE.Vector3;
  fov:    number;
  roll:   number;   // radians around look axis
}

const KEYS: CameraKey[] = [
  // ── BOOT / CREATION 0 → 5s ──────────────────────────────────
  // Start close for drama; fast pull-back as nebula blooms
  { t: 0.0,  pos: new THREE.Vector3(  0.0,  0.0,  14), target: new THREE.Vector3(0, 0, 0), fov: 60,  roll:  0.00 },
  { t: 1.8,  pos: new THREE.Vector3(  0.4,  0.3,  18), target: new THREE.Vector3(0, 0, 0), fov: 54,  roll:  0.08 },
  { t: 4.0,  pos: new THREE.Vector3( -1.2,  0.6,  22), target: new THREE.Vector3(0, 0, 0), fov: 50,  roll: -0.06 },

  // ── TECHNOLOGY 5 → 9.5s ─────────────────────────────────────
  // Sweep sideways across tech grid — aggressive roll
  { t: 5.0,  pos: new THREE.Vector3( -8.0,  1.5,  16), target: new THREE.Vector3(0, 0,-4),  fov: 56,  roll:  0.22 },
  { t: 7.0,  pos: new THREE.Vector3( -3.0,  2.0,  10), target: new THREE.Vector3(0, 0,-8),  fov: 62,  roll: -0.18 },
  { t: 8.5,  pos: new THREE.Vector3(  4.0,  1.5,   6), target: new THREE.Vector3(0, 0,-6),  fov: 68,  roll:  0.12 },

  // ── CONVERGENCE / PRE-BANG 9 → 9.5s ─────────────────────────
  // Race toward impact — FOV explodes at 9.5
  { t: 9.0,  pos: new THREE.Vector3(  0.0,  0.5,   8), target: new THREE.Vector3(0, 0, 0),  fov: 82,  roll:  0.05 },
  { t: 9.4,  pos: new THREE.Vector3(  0.0,  0.0,   4), target: new THREE.Vector3(0, 0, 0),  fov: 110, roll:  0.00 },
  // BANG — extreme FOV punch (camera is "inside" the explosion)
  { t: 9.5,  pos: new THREE.Vector3(  0.0,  0.0,   2), target: new THREE.Vector3(0, 0, 0),  fov: 140, roll:  0.00 },

  // ── POST-BANG RECOIL 9.5 → 15s ──────────────────────────────
  { t: 10.5, pos: new THREE.Vector3(  2.0,  2.0,  22), target: new THREE.Vector3(0, 0, 0),  fov: 62,  roll: -0.15 },
  { t: 13.0, pos: new THREE.Vector3( -5.0,  3.0,  30), target: new THREE.Vector3(0, 0, 0),  fov: 55,  roll:  0.10 },
  { t: 15.0, pos: new THREE.Vector3(  3.0,  4.0,  36), target: new THREE.Vector3(0, 0, 0),  fov: 52,  roll: -0.08 },

  // ── PILLARS 15 → 32s ─────────────────────────────────────────
  { t: 18.0, pos: new THREE.Vector3( -4.0,  3.0,  32), target: new THREE.Vector3(0, 0, 0),  fov: 50,  roll:  0.06 },
  { t: 22.0, pos: new THREE.Vector3(  0.0,  6.0,  40), target: new THREE.Vector3(0, 0, 0),  fov: 48,  roll:  0.00 },
  { t: 26.0, pos: new THREE.Vector3(  2.0,  4.0,  32), target: new THREE.Vector3(0, 0, 0),  fov: 46,  roll: -0.04 },
  { t: 30.0, pos: new THREE.Vector3(  1.0,  2.0,  24), target: new THREE.Vector3(0, 0, 0),  fov: 44,  roll:  0.00 },

  // ── AWAKENING / OUTRO 32 → 42s ───────────────────────────────
  // Slow majestic push toward Sun
  { t: 34.0, pos: new THREE.Vector3(  0.0,  2.0,  18), target: new THREE.Vector3(0, 0, 0),  fov: 46,  roll:  0.12 },
  { t: 38.0, pos: new THREE.Vector3(  0.0,  0.5,  12), target: new THREE.Vector3(0, 0,-5),  fov: 55,  roll: -0.25 },
  // Final warp-pull to Sun core
  { t: 41.0, pos: new THREE.Vector3(  0.0,  0.0,   1), target: new THREE.Vector3(0, 0,-200), fov: 130, roll:  0.40 },
  { t: 42.0, pos: new THREE.Vector3(  0.0,  0.0,-300), target: new THREE.Vector3(0, 0,-600), fov: 160, roll:  0.00 },
];
KEYS.sort((a, b) => a.t - b.t);

// ============================================================
// HELPERS
// ============================================================
function findSegment(t: number) {
  if (t <= KEYS[0].t)                         return { a: KEYS[0],              b: KEYS[0],              k: 0 };
  const last = KEYS[KEYS.length - 1];
  if (t >= last.t)                             return { a: last,                 b: last,                 k: 0 };
  let lo = 0, hi = KEYS.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (KEYS[m].t <= t) lo = m; else hi = m; }
  const a = KEYS[lo], b = KEYS[hi];
  return { a, b, k: b.t > a.t ? (t - a.t) / (b.t - a.t) : 0 };
}

function hash11(x: number)  { return Math.sin(x * 127.1) * 43758.5453 % 1; }
function smoothNoise(x: number) {
  const xi = Math.floor(x), xf = x - xi, u = xf * xf * (3 - 2 * xf);
  return hash11(xi) + (hash11(xi + 1) - hash11(xi)) * u;
}
function fbmNoise(x: number, seed: number) {
  return (
    smoothNoise(x * 23.0 + seed) * 0.50 +
    smoothNoise(x * 47.0 + seed * 1.3) * 0.30 +
    smoothNoise(x * 91.0 + seed * 2.7) * 0.20
  );
}

// Shake peaks at BIG_BANG_TIME (9.5), builds from 7.5s, decays by 13.5s
export function shakeEnvelope(t: number): number {
  const BANG = BIG_BANG_TIME;
  if (t < BANG - 2.0 || t > BANG + 4.0) return 0;
  if (t < BANG) {
    const k = (t - (BANG - 2.0)) / 2.0;
    return Math.pow(k, 2.5) * 1.8; // explosive build
  }
  const k = 1 - (t - BANG) / 4.0;
  return Math.pow(Math.max(0, k), 1.5) * 1.8;
}

export { fbmNoise as shakeNoise };

// ============================================================
// COMPONENT
// ============================================================
export function CameraRig() {
  const { camera, size } = useThree();

  const tmpPos     = useRef(new THREE.Vector3());
  const tmpTarget  = useRef(new THREE.Vector3());
  const tmpShake   = useRef(new THREE.Vector3());
  const curPos     = useRef(new THREE.Vector3().copy(KEYS[0].pos));
  const curTarget  = useRef(new THREE.Vector3().copy(KEYS[0].target));
  const curFov     = useRef(KEYS[0].fov);
  const curRoll    = useRef(KEYS[0].roll);
  const mouse      = useRef({ x: 0, y: 0 });

  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useMemo(() => {
    camera.position.copy(KEYS[0].pos);
    camera.lookAt(KEYS[0].target);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = KEYS[0].fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    const { a, b, k } = findSegment(t);
    const eased = smootherstep(0, 1, k);

    // 1. Keyframe interpolation
    tmpPos.current.lerpVectors(a.pos, b.pos, eased);
    tmpTarget.current.lerpVectors(a.target, b.target, eased);
    const targetFov  = a.fov  + (b.fov  - a.fov)  * eased;
    const targetRoll = a.roll + (b.roll - a.roll) * eased;

    // 2. Mouse parallax (dampened near big bang)
    const shakeAmt = shakeEnvelope(t);
    const parallax = 0.55 * (1 - shakeAmt * 0.8);
    tmpPos.current.x += mouse.current.x * parallax;
    tmpPos.current.y += mouse.current.y * parallax * 0.7;

    // 3. Multi-octave shake (strongest at bang)
    if (shakeAmt > 0.001) {
      const nx = fbmNoise(t, 1.1);
      const ny = fbmNoise(t, 7.7);
      const nz = fbmNoise(t, 13.3) * 0.3;
      tmpShake.current.set(nx, ny, nz).multiplyScalar(shakeAmt);
      tmpPos.current.add(tmpShake.current);
      tmpTarget.current.x += nx * shakeAmt * 0.35;
      tmpTarget.current.y += ny * shakeAmt * 0.35;
    }

    // 4. Critically-damped smoothing (snappier near bang)
    const lambda = 6.0 + 14.0 * shakeAmt;
    const alpha  = 1 - Math.exp(-lambda * Math.min(delta, 1 / 30));

    curPos.current.lerp(tmpPos.current, alpha);
    curTarget.current.lerp(tmpTarget.current, alpha);
    curFov.current  = THREE.MathUtils.lerp(curFov.current,  targetFov,  alpha);
    curRoll.current = THREE.MathUtils.lerp(curRoll.current, targetRoll, alpha);

    // 5. Apply camera
    camera.position.copy(curPos.current);

    // Roll: tilt camera's "up" vector
    const roll = curRoll.current;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(curTarget.current);

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;

      // FOV punch — extra +18° spike that spikes at exact bang and decays in 0.7s
      const bangElapsed = t - BIG_BANG_TIME;
      const punch = (bangElapsed >= 0 && bangElapsed < 0.7)
        ? (1 - bangElapsed / 0.7) * 18.0
        : 0;
      const finalFov = curFov.current + punch;

      if (Math.abs(persp.fov - finalFov) > 0.01) {
        persp.fov = finalFov;
        persp.updateProjectionMatrix();
      }
      const aspect = size.width / size.height;
      if (Math.abs(persp.aspect - aspect) > 0.001) {
        persp.aspect = aspect;
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}
