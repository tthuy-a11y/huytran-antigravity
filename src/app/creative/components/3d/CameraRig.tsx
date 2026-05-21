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
  // ── PLANETARY FLYTHROUGH 0 → 4.5s (deep zoom from a distant star) ───────────
  // Planet orbits: 9, 12, 15, 19, 23, 28
  { t: 0.0,  pos: new THREE.Vector3(  0.0,   5.0, 180), target: new THREE.Vector3(0, 0,  0), fov:  15, roll:  0.00 }, // Far away, small dot
  { t: 0.8,  pos: new THREE.Vector3( 18.0,  12.0,  75), target: new THREE.Vector3(0, 0,  0), fov:  40, roll:  0.45 }, // Rapid approach, banking right
  { t: 1.8,  pos: new THREE.Vector3(-14.0,   6.0,  35), target: new THREE.Vector3(0,-1, -5), fov:  55, roll: -0.25 }, // Slicing through outer orbits
  { t: 2.8,  pos: new THREE.Vector3( 10.0,   3.0,  18), target: new THREE.Vector3(-2, 0, -2), fov:  58, roll:  0.18 }, // Inner planets
  { t: 3.6,  pos: new THREE.Vector3( -5.0,   2.0,  10), target: new THREE.Vector3(1,  0, -1), fov:  54, roll: -0.08 }, // Reaching the sun
  { t: 4.2,  pos: new THREE.Vector3( -2.0,   1.5,   7), target: new THREE.Vector3(0,  0, -4), fov:  56, roll:  0.05 }, // Smooth handoff to TechGrid

  // ── TECHNOLOGY 4.5 → 8s ────────────────────────────────────────
  { t: 5.2,  pos: new THREE.Vector3( -8.0,  1.5,  16), target: new THREE.Vector3(0, 0, -4), fov:  56, roll:  0.22 },
  { t: 6.2,  pos: new THREE.Vector3( -3.0,  2.0,  10), target: new THREE.Vector3(0, 0, -8), fov:  62, roll: -0.18 },
  { t: 7.1,  pos: new THREE.Vector3(  4.0,  1.5,   6), target: new THREE.Vector3(0, 0, -6), fov:  68, roll:  0.12 },

  // ── PRE-BANG / BANG 7.5 → 8 ──────────────────────────────────
  { t: 7.6,  pos: new THREE.Vector3(  0.0,  0.5,   8), target: new THREE.Vector3(0, 0,  0), fov:  82, roll:  0.05 },
  { t: 7.9,  pos: new THREE.Vector3(  0.0,  0.0,   4), target: new THREE.Vector3(0, 0,  0), fov: 110, roll:  0.00 },
  { t: 8.0,  pos: new THREE.Vector3(  0.0,  0.0,   2), target: new THREE.Vector3(0, 0,  0), fov: 140, roll:  0.00 },

  // ── POST-BANG RECOIL 8 → 12s ─────────────────────────────────
  { t: 8.7,  pos: new THREE.Vector3(  2.0,  2.0,  22), target: new THREE.Vector3(0, 0,  0), fov:  62, roll: -0.15 },
  { t: 10.5, pos: new THREE.Vector3( -5.0,  3.0,  30), target: new THREE.Vector3(0, 0,  0), fov:  55, roll:  0.10 },
  { t: 12.0, pos: new THREE.Vector3(  3.0,  4.0,  36), target: new THREE.Vector3(0, 0,  0), fov:  52, roll: -0.08 },

  // ── CIVILIZATION / PILLARS 12 → 17s ──────────────────────────
  { t: 14.0, pos: new THREE.Vector3( -4.0,  3.0,  32), target: new THREE.Vector3(0, 0,  0), fov:  50, roll:  0.06 },
  { t: 17.0, pos: new THREE.Vector3(  0.0,  6.0,  40), target: new THREE.Vector3(0, 0,  0), fov:  48, roll:  0.00 },

  // ── AWAKENING / OUTRO 17 → 31s ───────────────────────────────
  { t: 20.0, pos: new THREE.Vector3(  2.0,  4.0,  32), target: new THREE.Vector3(0, 0,  0), fov:  46, roll: -0.04 },
  { t: 23.0, pos: new THREE.Vector3(  1.0,  2.0,  24), target: new THREE.Vector3(0, 0,  0), fov:  44, roll:  0.00 },
  { t: 25.5, pos: new THREE.Vector3(  0.0,  2.0,  18), target: new THREE.Vector3(0, 0,  0), fov:  46, roll:  0.12 },
  { t: 28.5, pos: new THREE.Vector3(  0.0,  0.5,  12), target: new THREE.Vector3(0, 0, -5), fov:  55, roll: -0.25 },

  // ── FINAL WARP PULL 30.5 → 31s ───────────────────────────────
  { t: 30.5, pos: new THREE.Vector3(  0.0,  0.0,   1), target: new THREE.Vector3(0, 0,-200), fov: 130, roll:  0.40 },
  { t: 31.0, pos: new THREE.Vector3(  0.0,  0.0,-300), target: new THREE.Vector3(0, 0,-600), fov: 160, roll:  0.00 },
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

// Shake peaks at BIG_BANG_TIME (8.0), builds from 6.5s, decays by 11s
export function shakeEnvelope(t: number): number {
  const BANG = BIG_BANG_TIME;
  if (t < BANG - 1.5 || t > BANG + 3.0) return 0;
  if (t < BANG) {
    const k = (t - (BANG - 1.5)) / 1.5;
    return Math.pow(k, 2.5) * 1.8; // explosive build
  }
  const k = 1 - (t - BANG) / 3.0;
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
    let eased = smootherstep(0, 1, k);

    // Dynamic easing for the initial warp jump (t <= 4.2s)
    // expo.out provides an extreme initial velocity dropoff (Warp Jump feel)
    // passing through z=180 -> z=7 seamlessly without disjoint keyframes.
    if (b.t <= 4.2 && k > 0) {
      eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k); 
    }

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
