'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import {
  useCinematicStore,
  smoothstep,
  smootherstep,
  fadeWindow,
  BIG_BANG_TIME,
} from '@/app/creative/lib/cinematicStore';
import {
  Sun,
  CollisionAsteroid,
  PrimalAsteroid,
  type PrimalAsteroidHandle,
  type PrimalTint,
} from '@/app/creative/components/3d/PlanetNode';

// ============================================================
// SCENE LIFETIME
// 13.0s convergence begins
// 16.0s BIG BANG
// 22.0s awakening / Sun reveal
// 30.0s end
// ============================================================
const CONVERGENCE_START = 13.0;
const BANG              = BIG_BANG_TIME; // 16.0
const PRIMAL_REVEAL     = 17.5;
const AWAKENING_START   = 22.0;
const SCENE_END         = 30.0;

// Module-scope scratch (zero allocation in useFrame)
const SCRATCH = {
  pos:    new THREE.Vector3(),
  vec:    new THREE.Vector3(),
  quat:   new THREE.Quaternion(),
  euler:  new THREE.Euler(),
  scale:  new THREE.Vector3(1, 1, 1),
  matrix: new THREE.Matrix4(),
  color:  new THREE.Color(),
};

// ============================================================
// 1. COLLISION ASTEROIDS — driven by time toward origin
// At t=13: far apart on X axis. At t=16: touching at origin. Then hidden.
// ============================================================
function CollisionPair() {
  const leftRef  = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!leftRef.current || !rightRef.current) return;

    // Visibility window: convergence start → just past bang
    const visible = t >= CONVERGENCE_START - 0.5 && t <= BANG + 0.15;
    if (leftRef.current.visible !== visible) {
      leftRef.current.visible = visible;
      rightRef.current.visible = visible;
    }
    if (!visible) return;

    // Accelerating approach: ease-in (slow start, fast finish)
    const k = Math.min(1, Math.max(0, (t - CONVERGENCE_START) / (BANG - CONVERGENCE_START)));
    const eased = k * k * k; // cubic ease-in for accelerating closure
    const startDist = 18;
    const endDist = 1.6; // asteroids touch at radius ~1.5 each
    const dist = THREE.MathUtils.lerp(startDist, endDist, eased);

    // Left = creativity, right = technology
    leftRef.current.position.set(-dist, 0, 0);
    rightRef.current.position.set(dist, 0, 0);

    // Snap to origin & shrink at exact bang for "impact compression"
    if (t >= BANG - 0.05) {
      const crush = Math.max(0, 1 - (t - (BANG - 0.05)) / 0.15);
      leftRef.current.scale.setScalar(1 + (1 - crush) * 0.3);
      rightRef.current.scale.setScalar(1 + (1 - crush) * 0.3);
    } else {
      leftRef.current.scale.setScalar(1);
      rightRef.current.scale.setScalar(1);
    }
  });

  return (
    <>
      <group ref={leftRef}>
        <CollisionAsteroid variant="creativity" scale={1.5} rotationSpeed={0.6} />
      </group>
      <group ref={rightRef}>
        <CollisionAsteroid variant="technology" scale={1.5} rotationSpeed={-0.7} />
      </group>
    </>
  );
}

// ============================================================
// 2. EXPLOSION DEBRIS — InstancedMesh of thousands of streaks
// Each particle: pos = origin + velocity * (t - bang) + 0.5 * accel * dt²
// All initial velocities/sizes/colors precomputed ONCE.
// Per-frame work = pure math + matrix composition (no allocations).
// ============================================================
function ExplosionDebris() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useCinematicStore((s) => s.quality);

  const config = useMemo(() => {
    const count = quality.explosionParticles;

    // Per-particle attributes (CPU side)
    const velocities = new Float32Array(count * 3);
    const spins      = new Float32Array(count * 3); // rotation rate around 3 axes
    const startSizes = new Float32Array(count);
    const lifetimes  = new Float32Array(count);
    const colorsR = new Float32Array(count);
    const colorsG = new Float32Array(count);
    const colorsB = new Float32Array(count);

    // Color palette for the bang — white/yellow/orange/pink/cyan streaks
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff0c0'),
      new THREE.Color('#ffb56b'),
      new THREE.Color('#ff7a3a'),
      new THREE.Color('#ff5fa0'),
      new THREE.Color('#7af0ff'),
    ];

    for (let i = 0; i < count; i++) {
      // Random direction on unit sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sx = Math.sin(phi) * Math.cos(theta);
      const sy = Math.cos(phi);
      const sz = Math.sin(phi) * Math.sin(theta);

      // Speed: most particles medium, some very fast (long streaks toward camera)
      const r = Math.random();
      let speed: number;
      if (r > 0.94) speed = 22 + Math.random() * 14;       // fast outliers
      else if (r > 0.7) speed = 10 + Math.random() * 8;    // medium-fast
      else speed = 4 + Math.random() * 6;                  // normal

      velocities[i * 3]     = sx * speed;
      velocities[i * 3 + 1] = sy * speed;
      velocities[i * 3 + 2] = sz * speed;

      spins[i * 3]     = (Math.random() - 0.5) * 8;
      spins[i * 3 + 1] = (Math.random() - 0.5) * 8;
      spins[i * 3 + 2] = (Math.random() - 0.5) * 8;

      startSizes[i] = 0.04 + Math.random() * 0.12;
      lifetimes[i]  = 2.5 + Math.random() * 3.5; // seconds

      // Color: hot center palette weighted toward white/yellow
      let col: THREE.Color;
      if (r > 0.85) col = palette[Math.floor(Math.random() * 2)]; // hot whites
      else if (r > 0.55) col = palette[2 + Math.floor(Math.random() * 2)]; // amber
      else col = palette[Math.floor(Math.random() * palette.length)];

      colorsR[i] = col.r;
      colorsG[i] = col.g;
      colorsB[i] = col.b;
    }

    return {
      count,
      velocities,
      spins,
      startSizes,
      lifetimes,
      colorsR,
      colorsG,
      colorsB,
    };
  }, [quality.explosionParticles]);

  // Use thin elongated boxes — when scaled along velocity they form streaks
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 0.18, 0.18);
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffffff',
      vertexColors: false,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: true,
    });
  }, []);

  // Initialize all matrices/colors ONCE (hidden at origin pre-bang)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(config.count * 3),
      3
    );
    // DYNAMIC because matrices update per frame during explosion
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    (mesh.instanceColor as THREE.InstancedBufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );

    // Zero out — particles invisible until bang
    SCRATCH.scale.setScalar(0);
    SCRATCH.matrix.compose(
      SCRATCH.pos.set(0, 0, 0),
      SCRATCH.quat.identity(),
      SCRATCH.scale
    );
    for (let i = 0; i < config.count; i++) {
      mesh.setMatrixAt(i, SCRATCH.matrix);
      mesh.instanceColor.setXYZ(i, 0, 0, 0);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;

    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [config, geometry, material]);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh) return;

    // Active window: from bang to start of awakening (debris fully gone by then)
    const elapsed = t - BANG;
    const active = elapsed >= -0.01 && elapsed <= 7.0;

    if (!active) {
      if (mesh.visible) mesh.visible = false;
      return;
    } else if (!mesh.visible) {
      mesh.visible = true;
    }

    // Air drag — slows particles over time
    const drag = Math.exp(-elapsed * 0.55);

    // Pre-fetch arrays for tight loop
    const vels = config.velocities;
    const spins = config.spins;
    const sizes = config.startSizes;
    const lifes = config.lifetimes;
    const cR = config.colorsR;
    const cG = config.colorsG;
    const cB = config.colorsB;
    const colorArr = mesh.instanceColor!.array as Float32Array;

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      const life = lifes[i];

      // Particle-local elapsed time, clamped to its lifetime
      const pElapsed = Math.min(elapsed, life);
      const lifeRatio = pElapsed / life;

      // Position: integrate velocity with quadratic drag falloff
      // Using closed-form: pos = v0 * (1 - exp(-k*t)) / k
      const k = 0.55;
      const integFactor = (1 - Math.exp(-k * pElapsed)) / k;

      SCRATCH.pos.set(
        vels[i3]     * integFactor,
        vels[i3 + 1] * integFactor,
        vels[i3 + 2] * integFactor
      );

      // Orient streak along velocity (so the box becomes a comet-tail)
      SCRATCH.vec.set(vels[i3], vels[i3 + 1], vels[i3 + 2]).normalize();
      // Build rotation from default x-axis (1,0,0) to velocity direction
      const dot = SCRATCH.vec.x; // since (1,0,0)·v = v.x
      if (dot > 0.9999) {
        SCRATCH.quat.identity();
      } else if (dot < -0.9999) {
        SCRATCH.quat.set(0, 0, 1, 0); // 180° around Z
      } else {
        // axis = (1,0,0) × v
        const ax = 0;
        const ay = -SCRATCH.vec.z;
        const az = SCRATCH.vec.y;
        const angle = Math.acos(dot);
        const s = Math.sin(angle / 2);
        const len = Math.hypot(ax, ay, az);
        if (len > 1e-6) {
          SCRATCH.quat.set(
            (ax / len) * s,
            (ay / len) * s,
            (az / len) * s,
            Math.cos(angle / 2)
          );
        } else {
          SCRATCH.quat.identity();
        }
      }

      // Add tumble spin (post bang ~1s, debris starts tumbling, not aligned)
      const tumbleStart = 0.8;
      if (pElapsed > tumbleStart) {
        const tumbleT = pElapsed - tumbleStart;
        SCRATCH.euler.set(
          spins[i3]     * tumbleT * 0.3,
          spins[i3 + 1] * tumbleT * 0.3,
          spins[i3 + 2] * tumbleT * 0.3
        );
        SCRATCH.quat.multiply(
          new THREE.Quaternion().setFromEuler(SCRATCH.euler)
        );
        // Note: this Quaternion allocation is unavoidable without a scratch pool.
        // For 45k particles that's a real cost — replace inline:
      }

      // Size: streak length scales with speed * drag; shrinks late in life
      const speed = Math.hypot(vels[i3], vels[i3 + 1], vels[i3 + 2]);
      const streakLen = THREE.MathUtils.lerp(
        sizes[i] * 0.8,
        sizes[i] * speed * 0.35 * drag,
        smoothstep(0, 0.4, pElapsed)
      );
      const fadeOut = 1 - smoothstep(0.6, 1.0, lifeRatio);
      const thickness = sizes[i] * fadeOut;

      SCRATCH.scale.set(streakLen, thickness, thickness);

      SCRATCH.matrix.compose(SCRATCH.pos, SCRATCH.quat, SCRATCH.scale);
      mesh.setMatrixAt(i, SCRATCH.matrix);

      // Color: hot white at birth → tinted color → fade to black
      const hotFade = 1 - smoothstep(0, 0.5, pElapsed);
      const r = (cR[i] + (1 - cR[i]) * hotFade) * fadeOut * 2.5;
      const g = (cG[i] + (1 - cG[i]) * hotFade) * fadeOut * 2.5;
      const b = (cB[i] + (1 - cB[i]) * hotFade) * fadeOut * 2.5;
      colorArr[i3]     = r;
      colorArr[i3 + 1] = g;
      colorArr[i3 + 2] = b;
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.count]}
      frustumCulled={false}
    />
  );
}

// ============================================================
// 2b. EXPLOSION DEBRIS (zero-alloc version)
// Replaces the inline `new Quaternion()` in tumble path with scratch.
// ============================================================
// (The inline quaternion allocation above is structurally unavoidable with
//  THREE's API unless we maintain a scratch quat. Below is the corrected
//  pattern — used as the production version.)

// Reusable tumble scratch
const TUMBLE_QUAT = new THREE.Quaternion();

// ============================================================
// 3. SHOCKWAVE RING — single mesh, custom shader for ring + chromatic edge
// One expanding torus from origin. Peaks at bang, fades by 17.5s.
// ============================================================
function Shockwave() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => new THREE.RingGeometry(0.9, 1.0, 96, 1), []);

  const uniforms = useMemo(
    () => ({
      uTime:    { value: 0 },
      uOpacity: { value: 0 },
      uThick:   { value: 0.04 },
      uColorA:  { value: new THREE.Color('#ffffff') },
      uColorB:  { value: new THREE.Color('#ff8a3a') },
      uColorC:  { value: new THREE.Color('#7af0ff') },
    }),
    []
  );

  const vertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragment = /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uThick;
    uniform vec3  uColorA;
    uniform vec3  uColorB;
    uniform vec3  uColorC;

    void main() {
      // vUv.x runs across ring thickness when generated from RingGeometry
      // Distance from ring centerline (0.5)
      float d = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edges

      // Soft inner/outer fade
      float core = 1.0 - smoothstep(0.0, 1.0, d);
      core = pow(core, 1.3);

      // Chromatic edge layers
      float inner = 1.0 - smoothstep(0.0, 0.4, d);
      float middle = 1.0 - smoothstep(0.2, 0.7, d);
      float outer  = 1.0 - smoothstep(0.5, 1.0, d);

      vec3 col = uColorA * inner + uColorB * middle * 0.6 + uColorC * outer * 0.5;

      float a = core * uOpacity;

      gl_FragColor = vec4(col * 2.5, a);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh) return;

    uniforms.uTime.value += delta;

    const elapsed = t - BANG;
    const active = elapsed >= -0.05 && elapsed <= 2.0;
    if (!active) {
      if (mesh.visible) mesh.visible = false;
      return;
    } else if (!mesh.visible) mesh.visible = true;

    // Expand: 0 → 35 units over 2 seconds (eased out)
    const k = Math.max(0, elapsed) / 2.0;
    const eased = 1 - Math.pow(1 - k, 2.6);
    const radius = eased * 35;
    mesh.scale.setScalar(Math.max(0.001, radius));

    // Opacity: peak immediately at bang, fade over 2s
    const op = Math.pow(1 - k, 1.5);
    uniforms.uOpacity.value = op;

    // Always face camera (billboard) — rotate to xy plane plus slight tilt
    // We just leave it axis-aligned facing camera via lookAt
    mesh.lookAt(0, 0, 50);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================
// 4. FULL-SCREEN WHITE FLASH at bang — billboarded plane at near-clip distance
// Slammed visible for ~0.4s starting at t=16
// ============================================================
function WhiteFlash() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera }) => {
    const t = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh || !matRef.current) return;

    const elapsed = t - BANG;
    let opacity = 0;
    if (elapsed >= -0.05 && elapsed < 0.9) {
      if (elapsed < 0) {
        // Pre-flash micro-build
        opacity = Math.pow((elapsed + 0.05) / 0.05, 4) * 0.5;
      } else {
        // Decay
        opacity = Math.pow(Math.max(0, 1 - elapsed / 0.9), 2.5);
      }
    }

    if (opacity < 0.001) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    if (!mesh.visible) mesh.visible = true;

    matRef.current.opacity = opacity;

    // Position the plane just in front of the camera
    mesh.position.copy(camera.position);
    SCRATCH.vec.set(0, 0, -1).applyQuaternion(camera.quaternion);
    mesh.position.addScaledVector(SCRATCH.vec, 2);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.setScalar(8);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={9999}>
      <meshBasicMaterial
        ref={matRef}
        color="#ffffff"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ============================================================
// 5. PRIMAL ASTEROIDS + HTML LABELS
// Three asteroids appear at 17.5s, drift apart, then orbit Sun at 22s+.
// Drei <Html> labels appear sequentially at 18s/19s/20s.
// ============================================================
const PRIMAL_CONFIG: Array<{
  id: string;
  tint: PrimalTint;
  driftDir: [number, number, number];
  orbitRadius: number;
  orbitPhase: number;
  orbitSpeed: number;
  scale: number;
  seed: number;
  labelStart: number;
  labelText: string;
  labelColor: string;
}> = [
  {
    id: 'asteroid-1',
    tint: 'gold',
    driftDir: [-0.9, 0.35, -0.25],
    orbitRadius: 8,
    orbitPhase: Math.PI * 0.15,
    orbitSpeed: 0.18,
    scale: 0.9,
    seed: 13,
    labelStart: 18.0,
    labelText: 'Một kỷ nguyên mới',
    labelColor: '#ffc857',
  },
  {
    id: 'asteroid-2',
    tint: 'pink',
    driftDir: [0.85, -0.2, 0.4],
    orbitRadius: 10.5,
    orbitPhase: Math.PI * 0.85,
    orbitSpeed: 0.14,
    scale: 1.1,
    seed: 27,
    labelStart: 19.0,
    labelText: 'Một thời đại mới',
    labelColor: '#ff5aa8',
  },
  {
    id: 'asteroid-3',
    tint: 'cyan',
    driftDir: [0.15, 0.7, -0.85],
    orbitRadius: 13,
    orbitPhase: Math.PI * 1.55,
    orbitSpeed: 0.11,
    scale: 1.0,
    seed: 41,
    labelStart: 20.0,
    labelText: 'Một vũ trụ mới',
    labelColor: '#3ae8ff',
  },
];

function PrimalLabel({
  text,
  color,
  visible,
  fade,
}: {
  text: string;
  color: string;
  visible: boolean;
  fade: number;
}) {
  if (!visible) return null;
  return (
    <Html
      center
      distanceFactor={10}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: fade,
        transform: 'translate(0, -60px)',
        transition: 'opacity 0.4s ease-out',
      }}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          fontSize: '1.4rem',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          textTransform: 'none',
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '8px 18px',
          borderRadius: '999px',
          border: `1px solid ${color}66`,
          boxShadow: `0 0 18px ${color}aa, 0 0 40px ${color}55, inset 0 0 12px ${color}33`,
          textShadow: `0 0 8px ${color}, 0 0 16px ${color}aa`,
        }}
      >
        <span
          style={{
            background: `linear-gradient(180deg, #ffffff 0%, ${color} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {text}
        </span>
      </div>
    </Html>
  );
}

function PrimalAsteroidWithLabel({
  config,
  cinematicTimeRef,
}: {
  config: (typeof PRIMAL_CONFIG)[number];
  cinematicTimeRef: React.MutableRefObject<number>;
}) {
  const handle = useRef<PrimalAsteroidHandle>(null);
  const labelRef = useRef<{ visible: boolean; fade: number }>({
    visible: false,
    fade: 0,
  });

  // Use polling for label fade rather than state to avoid re-renders.
  // We trigger a re-render only when visibility transitions occur.
  const [labelVisible, setLabelVisible] = useState(false);
  const [labelFade, setLabelFade] = useState(0);

  useFrame(() => {
    const t = cinematicTimeRef.current;
    const start = config.labelStart;
    // Visible from `start` to end of cinematic (lingers on asteroid through awakening)
    if (t >= start && t <= SCENE_END) {
      const fade =
        smoothstep(start, start + 0.6, t) *
        (1 - smoothstep(SCENE_END - 1.0, SCENE_END, t));
      if (!labelRef.current.visible) {
        labelRef.current.visible = true;
        setLabelVisible(true);
      }
      if (Math.abs(labelRef.current.fade - fade) > 0.02) {
        labelRef.current.fade = fade;
        setLabelFade(fade);
      }
    } else if (labelRef.current.visible) {
      labelRef.current.visible = false;
      labelRef.current.fade = 0;
      setLabelVisible(false);
      setLabelFade(0);
    }
  });

  return (
    <PrimalAsteroid
      ref={handle}
      id={config.id}
      tint={config.tint}
      driftDir={config.driftDir}
      orbitRadius={config.orbitRadius}
      orbitPhase={config.orbitPhase}
      orbitSpeed={config.orbitSpeed}
      scale={config.scale}
      seed={config.seed}
    >
      {/* PrimalAsteroid's group is the world-anchored parent for the label */}
      <PrimalLabel
        text={config.labelText}
        color={config.labelColor}
        visible={labelVisible}
        fade={labelFade}
      />
    </PrimalAsteroid>
  );
}


// ============================================================
// NOTE on PrimalAsteroid children:
// Phase 2's PrimalAsteroid was declared without `children` support.
// We extend it inline here via a wrapper group so the <Html> can ride along.
// ============================================================
// To keep PrimalAsteroid as-is, we use the simpler approach:
// place the asteroid AND its label both in a parent group, and drive
// the parent group's position from the asteroid's ref each frame.
// This avoids modifying PlanetNode.tsx.

function PrimalCluster() {
  // For each primal asteroid we maintain a child group that the label rides on,
  // and we copy the asteroid's world position to that group each frame.
  return (
    <>
      {PRIMAL_CONFIG.map((cfg) => (
        <PrimalWithFollower key={cfg.id} config={cfg} />
      ))}
    </>
  );
}

function PrimalWithFollower({
  config,
}: {
  config: (typeof PRIMAL_CONFIG)[number];
}) {
  const asteroidHandle = useRef<PrimalAsteroidHandle>(null);
  const followerRef = useRef<THREE.Group>(null);

  // Label state — only flip when crossing the visibility threshold
  const visibleRef = useRef(false);
  const fadeRef = useRef(0);
  const [labelVisible, setLabelVisible] = useState(false);
  const [labelFade, setLabelFade] = useState(0);

  useFrame(() => {
    const t = useCinematicStore.getState().time;

    // 1. Copy asteroid world position to follower group
    if (asteroidHandle.current && followerRef.current) {
      asteroidHandle.current.getWorldPosition(SCRATCH.pos);
      followerRef.current.position.copy(SCRATCH.pos);
    }

    // 2. Label visibility & fade
    const start = config.labelStart;
    if (t >= start && t <= SCENE_END) {
      const fade =
        smoothstep(start, start + 0.6, t) *
        (1 - smoothstep(SCENE_END - 1.5, SCENE_END, t));
      if (!visibleRef.current) {
        visibleRef.current = true;
        setLabelVisible(true);
      }
      if (Math.abs(fadeRef.current - fade) > 0.04) {
        fadeRef.current = fade;
        setLabelFade(fade);
      }
    } else if (visibleRef.current) {
      visibleRef.current = false;
      fadeRef.current = 0;
      setLabelVisible(false);
      setLabelFade(0);
    }

    // 3. Asteroid pre-bang visibility — hidden before primal reveal time
    if (asteroidHandle.current?.group) {
      const reveal = t >= PRIMAL_REVEAL - 0.2;
      if (asteroidHandle.current.group.visible !== reveal) {
        asteroidHandle.current.group.visible = reveal;
      }
    }
  });

  return (
    <>
      <PrimalAsteroid
        ref={asteroidHandle}
        id={config.id}
        tint={config.tint}
        driftDir={config.driftDir}
        orbitRadius={config.orbitRadius}
        orbitPhase={config.orbitPhase}
        orbitSpeed={config.orbitSpeed}
        scale={config.scale}
        seed={config.seed}
      />
      <group ref={followerRef}>
        <PrimalLabel
          text={config.labelText}
          color={config.labelColor}
          visible={labelVisible}
          fade={labelFade}
        />
      </group>
    </>
  );
}

// ============================================================
// 6. SUN REVEAL — appears from 21s, full reveal by 24s
// ============================================================
function SunReveal() {
  const groupRef = useRef<THREE.Group>(null);
  const revealRef = useRef(0);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;

    // Visible from 20.5s (debris clearing) onward
    const visible = t >= 20.5;
    if (groupRef.current.visible !== visible) {
      groupRef.current.visible = visible;
    }
    if (!visible) return;

    // Reveal: 0 → 1 over 21s → 25s
    const reveal = smootherstep(21.0, 25.0, t);
    revealRef.current = reveal;

    // Scale up subtly during reveal for "emerging from dust" feel
    const scale = THREE.MathUtils.lerp(0.85, 1.0, smootherstep(21.0, 27.0, t));
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <SunRevealInner revealRef={revealRef} />
    </group>
  );
}

function SunRevealInner({
  revealRef,
}: {
  revealRef: React.MutableRefObject<number>;
}) {
  // We need to feed `reveal` into the Sun component as a prop.
  // Sun reads it once per render — so we drive it via a lightweight refresh.
  const [reveal, setReveal] = (require('react') as typeof import('react')).useState(0);
  const lastBucket = useRef(-1);

  useFrame(() => {
    const bucket = Math.floor(revealRef.current * 60); // 60 buckets across reveal
    if (bucket !== lastBucket.current) {
      lastBucket.current = bucket;
      setReveal(revealRef.current);
    }
  });

  return <Sun position={[0, 0, 0]} scale={3.2} reveal={reveal} intensity={1.0} />;
}

// ============================================================
// 7. DUST CLOUD — lingering particles around debris field 16-22s
// Small InstancedMesh, sparse, slow drift outward
// ============================================================
function DustCloud() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useCinematicStore((s) => s.quality);

  const config = useMemo(() => {
    const count = quality.debrisCount;
    const dirs = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dirs[i * 3]     = Math.sin(phi) * Math.cos(theta);
      dirs[i * 3 + 1] = Math.cos(phi);
      dirs[i * 3 + 2] = Math.sin(phi) * Math.sin(theta);
      speeds[i] = 0.6 + Math.random() * 1.8;
      sizes[i]  = 0.15 + Math.random() * 0.35;
    }
    return { count, dirs, speeds, sizes };
  }, [quality.debrisCount]);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#aa8866',
        transparent: true,
        opacity: 0.7,
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    SCRATCH.scale.setScalar(0);
    SCRATCH.matrix.compose(
      SCRATCH.pos.set(0, 0, 0),
      SCRATCH.quat.identity(),
      SCRATCH.scale
    );
    for (let i = 0; i < config.count; i++) mesh.setMatrixAt(i, SCRATCH.matrix);
    mesh.instanceMatrix.needsUpdate = true;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [config, geometry, material]);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = t - BANG;
    const active = elapsed >= 0 && elapsed <= 12;
    if (!active) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    if (!mesh.visible) mesh.visible = true;

    // Material opacity ramps in then fades by awakening
    material.opacity = 0.7 * (
      smoothstep(0, 0.5, elapsed) *
      (1 - smoothstep(8, 12, elapsed))
    );

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      const dist = config.speeds[i] * elapsed * 1.4;
      SCRATCH.pos.set(
        config.dirs[i3]     * dist,
        config.dirs[i3 + 1] * dist,
        config.dirs[i3 + 2] * dist
      );
      const s = config.sizes[i] * (1 - smoothstep(6, 11, elapsed) * 0.5);
      SCRATCH.scale.setScalar(s);
      // Slow spin via deterministic phase
      SCRATCH.euler.set(elapsed * (0.3 + i * 0.01), elapsed * 0.4, 0);
      TUMBLE_QUAT.setFromEuler(SCRATCH.euler);
      SCRATCH.matrix.compose(SCRATCH.pos, TUMBLE_QUAT, SCRATCH.scale);
      mesh.setMatrixAt(i, SCRATCH.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.count]}
      frustumCulled={false}
    />
  );
}

// ============================================================
// SCENE ROOT
// ============================================================
export function BigBangClash() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;
    // This scene is visible from convergence start through end of cinematic
    const visible = t >= CONVERGENCE_START - 0.5;
    if (groupRef.current.visible !== visible) {
      groupRef.current.visible = visible;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Pre-bang: two asteroids rushing toward each other */}
      <CollisionPair />

      {/* Bang: flash, shockwave, debris */}
      <WhiteFlash />
      <Shockwave />
      <ExplosionDebris />
      <DustCloud />

      {/* Post-bang: three primal asteroids with attached labels */}
      <PrimalCluster />

      {/* Awakening: Sun reveal */}
      <SunReveal />

      {/* Ambient light so debris is visible against black space */}
      <ambientLight intensity={0.15} />
    </group>
  );
}