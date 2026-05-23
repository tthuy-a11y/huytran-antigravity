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
  // ── PHASE 1: DENSE SPARKLING VOID (0.0s - 1.8s) ──────────────────
  // Starts inside a wide, beautiful field of sparkling white stars (FOV=35, Z=320)
  { t: 0.0,  pos: new THREE.Vector3(  0.0,   2.0, 320), target: new THREE.Vector3(0, 0,  0), fov:  35, roll:  0.00 },
  { t: 1.0,  pos: new THREE.Vector3(  0.0,   2.2, 300), target: new THREE.Vector3(0, 0,  0), fov:  35, roll:  0.02 },

  // ── PHASE 2: ACCELERATION / WARP SPEED RUSH (1.8s - 3.0s) ──────────────────
  { t: 2.2,  pos: new THREE.Vector3(  0.0,   3.5, 260), target: new THREE.Vector3(0, 0,  0), fov:  28, roll:  0.06 },

  // ── PHASE 3: MAJESTIC GALAXY REVEAL & APPROACH (3.0s - 4.8s) ──────────────────
  // Volumetric neon spiral galaxy looms large, camera zooms close into the colorful star arms
  { t: 3.5,  pos: new THREE.Vector3(-25.0,  12.0, 160), target: new THREE.Vector3(0, 0,  0), fov:  52, roll:  0.18 },
  { t: 4.8,  pos: new THREE.Vector3( 22.0,  10.0,  80), target: new THREE.Vector3(0, 0, -2), fov:  46, roll: -0.15 },

  // ── PHASE 4: TECHNOLOGY GRID SECTOR (4.8s - 8.0s) ──────────────────
  // TechGrid transition phase (planets hidden, storyline progresses through code matrix)
  { t: 5.8,  pos: new THREE.Vector3( -5.0,   1.5,  14), target: new THREE.Vector3(0, 0, -6), fov:  56, roll:  0.18 },
  { t: 7.0,  pos: new THREE.Vector3(  0.0,   0.5,   8), target: new THREE.Vector3(0, 0,  0), fov:  72, roll: -0.05 },
  { t: 8.0,  pos: new THREE.Vector3(  0.0,   0.0,   2), target: new THREE.Vector3(0, 0,  0), fov: 130, roll:  0.00 }, // Big Bang Climax!

  // ── PHASE 5: POST-BANG RECOIL & DEBRIS SETTLING (8.0s - 17.0s) ──────────────────
  { t: 8.7,  pos: new THREE.Vector3(  4.0,   4.0,  30), target: new THREE.Vector3(0, 0,  0), fov:  62, roll:  0.15 },
  { t: 11.0, pos: new THREE.Vector3( -6.0,   5.0,  42), target: new THREE.Vector3(0, 0,  0), fov:  55, roll: -0.10 },
  { t: 14.0, pos: new THREE.Vector3(  5.0,   6.0,  48), target: new THREE.Vector3(0, 0,  0), fov:  50, roll:  0.08 },

  // ── PHASE 6: AWAKENING - SOLAR SYSTEM BIRTH & SINGLE FLYBY (17.0s - 28.25s) ──────────────────
  // System born! The camera sweeps the neon planets orbiting the sun ONE SINGLE time and lands perfectly
  { t: 17.0, pos: new THREE.Vector3(  0.0,   8.0,  55), target: new THREE.Vector3(0, 0,  0), fov:  45, roll:  0.00 },
  { t: 19.5, pos: new THREE.Vector3( 15.0,   6.0,  32), target: new THREE.Vector3(0, 0, -2), fov:  42, roll: -0.08 },
  { t: 22.0, pos: new THREE.Vector3(-12.0,   4.0,  24), target: new THREE.Vector3(0, 0, -4), fov:  40, roll:  0.10 },
  { t: 24.5, pos: new THREE.Vector3(  0.0,   2.0,  18), target: new THREE.Vector3(0, 0,  0), fov:  45, roll:  0.00 }, // Welcome Card TH2003
  { t: 27.0, pos: new THREE.Vector3(  0.0,   1.0,  14), target: new THREE.Vector3(0, 0, -5), fov:  52, roll: -0.15 },
  { t: 27.75,pos: new THREE.Vector3(  0.0,   0.0,   1), target: new THREE.Vector3(0, 0,-200), fov: 130, roll:  0.35 },
  { t: 28.25,pos: new THREE.Vector3(  0.0,   0.0,-300), target: new THREE.Vector3(0, 0,-600), fov: 160, roll:  0.00 },
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

export function shakeEnvelope(t: number): number {
  const BANG = BIG_BANG_TIME;
  let rumble = 0;
  
  // 1. Warp acceleration rumble (t = 0.5s to 2.5s)
  if (t > 0.5 && t < 2.5) {
    rumble += THREE.MathUtils.smoothstep(t, 0.5, 1.0) * (1 - THREE.MathUtils.smoothstep(t, 1.5, 2.5)) * 0.05;
  }
  
  // 2. Cosmic dust entry rumble (t = 4.0s to 5.5s)
  if (t > 4.0 && t < 5.5) {
    rumble += THREE.MathUtils.smoothstep(t, 4.0, 4.5) * (1 - THREE.MathUtils.smoothstep(t, 5.0, 5.5)) * 0.08;
  }

  // 3. Big Bang explosive shake
  if (t < BANG - 1.5 || t > BANG + 3.0) return rumble;
  
  if (t < BANG) {
    const k = (t - (BANG - 1.5)) / 1.5;
    return rumble + Math.pow(k, 2.5) * 1.8; // explosive build
  }
  const k = 1 - (t - BANG) / 3.0;
  return rumble + Math.pow(Math.max(0, k), 1.5) * 1.8;
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

    // Dynamic easing for the deep zoom flythrough (t <= 5.5s)
    // Phase 1-3 (t<=1.8): cubic ease-in to allow a very slow initial creep of the camera
    // Phase 4-6 (t<=5.5): smootherstep for beautiful, controlled flyby pacing
    if (b.t <= 1.8 && k > 0) {
      eased = Math.pow(k, 2.5); // Smooth ease-in
    } else if (b.t <= 5.5 && k > 0) {
      eased = smootherstep(0, 1, k);
    }

    // 1. Keyframe interpolation
    tmpPos.current.lerpVectors(a.pos, b.pos, eased);
    tmpTarget.current.lerpVectors(a.target, b.target, eased);
    const targetFov  = a.fov  + (b.fov  - a.fov)  * eased;
    const targetRoll = a.roll + (b.roll - a.roll) * eased;

    // 2. Mouse parallax & interactive camera panning
    const shakeAmt = shakeEnvelope(t);
    // Base parallax reduced near big bang
    const baseParallax = 1.0 * (1 - shakeAmt * 0.8);
    
    // Dynamic parallax: stronger when far away (deep space), tighter when close
    const depthScale = Math.max(1, tmpPos.current.z * 0.05); 
    const parallaxX = mouse.current.x * baseParallax * depthScale;
    const parallaxY = mouse.current.y * baseParallax * depthScale * 0.7;

    // Apply positional shift
    tmpPos.current.x += parallaxX;
    tmpPos.current.y += parallaxY;

    // Apply look-target panning (camera "looks" slightly towards the mouse)
    tmpTarget.current.x += mouse.current.x * 2.0;
    tmpTarget.current.y += mouse.current.y * 1.5;

    // Interactive banking: tilt the camera slightly when moving mouse horizontally
    // This gives a strong "flying a spaceship" feeling
    const targetRollWithMouse = targetRoll - mouse.current.x * 0.15;

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
    curRoll.current = THREE.MathUtils.lerp(curRoll.current, targetRollWithMouse, alpha);

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
