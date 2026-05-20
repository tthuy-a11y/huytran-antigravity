'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import {
  useCinematicStore,
  smoothstep,
  fadeWindow,
} from '@/app/creative/lib/cinematicStore';

// ============================================================
// SCENE LIFETIME (compressed 15% — synced with camera & dialogue)
// 5.5s pre-roll fade in (overlap with Creation)
// 11.9s scene ends
// ============================================================
const SCENE_START = 5.5;
const SCENE_FADE_IN_END = 7.65;
const SCENE_FADE_OUT_START = 10.6;
const SCENE_END = 11.9;

// ============================================================
// SHARED SCRATCH OBJECTS — declared at module scope so they never
// allocate inside useFrame. Reused across all components.
// ============================================================
const SCRATCH = {
  matrix: new THREE.Matrix4(),
  pos:    new THREE.Vector3(),
  scale:  new THREE.Vector3(1, 1, 1),
  quat:   new THREE.Quaternion(),
  color:  new THREE.Color(),
};

// ============================================================
// 1. GRID NODES — InstancedMesh of glowing intersection points
// Geometry built ONCE. useFrame only updates instanceMatrix.needsUpdate
// when something changes, and only writes to existing buffers.
// ============================================================
function GridNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useCinematicStore((s) => s.quality);

  // Grid density depends on tier — low/mid/high resolved at mount time
  // and never changes afterward. This is the canonical "build once" pattern.
  const config = useMemo(() => {
    const density = quality.gridDensity;
    const spacing = 1.4;
    const count = density * density * density;
    const half = (density - 1) * 0.5;

    // Pre-compute each instance's lattice position + per-instance phase/intensity
    const offsets = new Float32Array(count * 3);   // base lattice position
    const phases  = new Float32Array(count);       // pulse phase
    const intensities = new Float32Array(count);   // per-node max brightness
    const distances = new Float32Array(count);     // distance from origin (cached)

    let idx = 0;
    for (let x = 0; x < density; x++) {
      for (let y = 0; y < density; y++) {
        for (let z = 0; z < density; z++) {
          const px = (x - half) * spacing;
          const py = (y - half) * spacing;
          const pz = (z - half) * spacing;
          offsets[idx * 3]     = px;
          offsets[idx * 3 + 1] = py;
          offsets[idx * 3 + 2] = pz;
          phases[idx] = Math.random() * Math.PI * 2;
          intensities[idx] = 0.6 + Math.random() * 0.4;
          distances[idx] = Math.sqrt(px * px + py * py + pz * pz);
          idx++;
        }
      }
    }

    return { count, offsets, phases, intensities, distances, spacing, half };
  }, [quality.gridDensity]);

  // Geometry & material built ONCE
  const geometry = useMemo(
    () => new THREE.OctahedronGeometry(0.08, 0),
    []
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: '#26e6ff',
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return mat;
  }, []);

  // Per-instance color buffer for the wave pulse highlight
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    // Allocate color attribute ONCE
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(config.count * 3),
      3
    );
    // Set initial matrices ONCE — these positions don't move
    for (let i = 0; i < config.count; i++) {
      SCRATCH.pos.set(
        config.offsets[i * 3],
        config.offsets[i * 3 + 1],
        config.offsets[i * 3 + 2]
      );
      SCRATCH.scale.setScalar(config.intensities[i]);
      SCRATCH.matrix.compose(SCRATCH.pos, SCRATCH.quat, SCRATCH.scale);
      mesh.setMatrixAt(i, SCRATCH.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // instanceMatrix never changes again — mark static
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    return () => {
      // cleanup color attribute
      if (mesh.instanceColor) {
        (mesh.instanceColor as any).array = null;
      }
    };
  }, [config]);

  // useFrame ONLY updates the dynamic color buffer — no matrix work, no allocations
  useFrame(() => {
    const t = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;

    const reveal =
      smoothstep(SCENE_START, SCENE_FADE_IN_END, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));

    if (reveal < 0.001) {
      // Skip the whole loop when scene invisible
      if (mesh.visible) mesh.visible = false;
      return;
    } else if (!mesh.visible) {
      mesh.visible = true;
    }

    // Expanding spherical wave: radius grows with time, brightens nodes near it
    // Wave starts at center at t=5.95, expands to grid edge by t=9.8
    const waveRadius = THREE.MathUtils.lerp(
      0,
      config.half * config.spacing * 1.8,
      smoothstep(5.95, 9.8, t)
    );
    const waveWidth = 1.6;

    // Base hologram colors — read from a fixed palette
    const baseR = 0.05;
    const baseG = 0.55;
    const baseB = 1.0;
    const hotR  = 0.85;
    const hotG  = 1.0;
    const hotB  = 1.0;

    const colorArr = mesh.instanceColor.array as Float32Array;

    for (let i = 0; i < config.count; i++) {
      // Per-node pulse — slow shimmer
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + config.phases[i]);

      // Wave proximity highlight
      const dist = config.distances[i];
      const waveDist = Math.abs(dist - waveRadius);
      const waveHit = Math.max(0, 1 - waveDist / waveWidth);
      const waveBoost = waveHit * waveHit * 2.5;

      const brightness =
        (0.25 + pulse * 0.35 + waveBoost) *
        config.intensities[i] *
        reveal;

      // Blend base → hot based on wave hit
      const blend = Math.min(1, waveBoost * 0.5);
      const r = (baseR + (hotR - baseR) * blend) * brightness;
      const g = (baseG + (hotG - baseG) * blend) * brightness;
      const b = (baseB + (hotB - baseB) * blend) * brightness;

      colorArr[i * 3]     = r;
      colorArr[i * 3 + 1] = g;
      colorArr[i * 3 + 2] = b;
    }
    mesh.instanceColor.needsUpdate = true;
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
// 2. GRID LINES — Connecting beams between adjacent nodes
// Built as a SINGLE BufferGeometry of GL.LINES (one giant draw call).
// Cheaper than instancing thin cylinders.
// ============================================================
function GridLines() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const quality = useCinematicStore((s) => s.quality);

  const { geometry, uniforms } = useMemo(() => {
    const density = quality.gridDensity;
    const spacing = 1.4;
    const half = (density - 1) * 0.5;

    // Three axes of connections — only forward neighbors to avoid duplicates
    // Total edges = 3 * density^2 * (density - 1)
    const edgeCount = 3 * density * density * (density - 1);
    const positions = new Float32Array(edgeCount * 2 * 3);
    const distances = new Float32Array(edgeCount * 2);     // per-vertex distance from origin

    let v = 0;
    let d = 0;
    const writeSegment = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number
    ) => {
      positions[v++] = x1; positions[v++] = y1; positions[v++] = z1;
      positions[v++] = x2; positions[v++] = y2; positions[v++] = z2;
      const d1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
      const d2 = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2);
      distances[d++] = d1;
      distances[d++] = d2;
    };

    for (let x = 0; x < density; x++) {
      for (let y = 0; y < density; y++) {
        for (let z = 0; z < density; z++) {
          const px = (x - half) * spacing;
          const py = (y - half) * spacing;
          const pz = (z - half) * spacing;
          if (x < density - 1) {
            writeSegment(px, py, pz, px + spacing, py, pz);
          }
          if (y < density - 1) {
            writeSegment(px, py, pz, px, py + spacing, pz);
          }
          if (z < density - 1) {
            writeSegment(px, py, pz, px, py, pz + spacing);
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aDist',    new THREE.BufferAttribute(distances, 1));
    geo.computeBoundingSphere();

    const unis = {
      uTime:       { value: 0 },
      uReveal:     { value: 0 },
      uWaveRadius: { value: 0 },
      uWaveWidth:  { value: 1.6 },
      uMaxDist:    { value: half * spacing * 1.8 },
      uBaseColor:  { value: new THREE.Color('#0a4a88') },
      uHotColor:   { value: new THREE.Color('#7df5ff') },
    };

    return { geometry: geo, uniforms: unis };
  }, [quality.gridDensity]);

  const vertex = /* glsl */ `
    attribute float aDist;
    varying float vDist;
    void main() {
      vDist = aDist;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying float vDist;
    uniform float uTime;
    uniform float uReveal;
    uniform float uWaveRadius;
    uniform float uWaveWidth;
    uniform float uMaxDist;
    uniform vec3  uBaseColor;
    uniform vec3  uHotColor;

    void main() {
      float waveDist = abs(vDist - uWaveRadius);
      float waveHit = max(0.0, 1.0 - waveDist / uWaveWidth);
      float boost = waveHit * waveHit * 2.5;

      // Distance fade — lines further out are dimmer
      float distFade = 1.0 - smoothstep(uMaxDist * 0.7, uMaxDist * 1.1, vDist);

      vec3 col = mix(uBaseColor, uHotColor, min(1.0, boost));
      float bright = (0.18 + boost) * distFade * uReveal;

      gl_FragColor = vec4(col * bright * 2.0, bright);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  useSafeDispose([linesRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    if (!linesRef.current) return;

    uniforms.uTime.value += delta;
    const reveal =
      smoothstep(SCENE_START, SCENE_FADE_IN_END, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
    uniforms.uReveal.value = reveal;

    // Sync wave radius with GridNodes (compressed timeline)
    uniforms.uWaveRadius.value = THREE.MathUtils.lerp(
      0,
      uniforms.uMaxDist.value,
      smoothstep(5.95, 9.8, t)
    );

    const visible = reveal > 0.001;
    if (linesRef.current.visible !== visible) {
      linesRef.current.visible = visible;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry} frustumCulled>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ============================================================
// 3. DATA STREAMS — high-speed cyan particles flowing along grid axes
// Each particle has a position + axis-aligned velocity.
// Positions stored in a single Float32Array, updated in-place.
// Uses GPU `Points` with per-vertex velocity attribute — CPU only
// updates positions, no allocations.
// ============================================================
function DataStreams() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useCinematicStore((s) => s.quality);

  const config = useMemo(() => {
    // Scale stream count with quality
    const count = Math.floor(quality.gridDensity * quality.gridDensity * 8);
    const positions  = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes  = new Float32Array(count);
    const phases     = new Float32Array(count);
    const sizes      = new Float32Array(count);

    const half = (quality.gridDensity - 1) * 0.5 * 1.4;

    for (let i = 0; i < count; i++) {
      // Pick a random axis (0=x, 1=y, 2=z), then a random plane intersection
      const axis = Math.floor(Math.random() * 3);

      // Place on a random grid line — snap perpendicular coords to spacing
      const spacing = 1.4;
      const halfCount = (quality.gridDensity - 1) * 0.5;
      const a = (Math.floor(Math.random() * quality.gridDensity) - halfCount) * spacing;
      const b = (Math.floor(Math.random() * quality.gridDensity) - halfCount) * spacing;
      const c = (Math.random() - 0.5) * 2 * half; // free coord along axis

      if (axis === 0) {
        positions[i * 3] = c;
        positions[i * 3 + 1] = a;
        positions[i * 3 + 2] = b;
        velocities[i * 3] = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
      } else if (axis === 1) {
        positions[i * 3] = a;
        positions[i * 3 + 1] = c;
        positions[i * 3 + 2] = b;
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
        velocities[i * 3 + 2] = 0;
      } else {
        positions[i * 3] = a;
        positions[i * 3 + 1] = b;
        positions[i * 3 + 2] = c;
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
      }

      lifetimes[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 6 + Math.random() * 10;
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSize',  new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aLife',  new THREE.BufferAttribute(lifetimes, 1));
    geo.computeBoundingSphere();

    const unis = {
      uTime:       { value: 0 },
      uReveal:     { value: 0 },
      uPixelRatio: {
        value:
          typeof window !== 'undefined'
            ? Math.min(window.devicePixelRatio, 2)
            : 1,
      },
    };

    return { geometry: geo, uniforms: unis, count, velocities, half };
  }, [quality.gridDensity]);

  useEffect(() => {
    return () => config.geometry.dispose();
  }, [config.geometry]);

  const vertex = /* glsl */ `
    attribute float aPhase;
    attribute float aSize;
    attribute float aLife;
    varying float vGlow;
    uniform float uTime;
    uniform float uPixelRatio;

    void main() {
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPixelRatio * (240.0 / -mvPos.z);
      gl_Position = projectionMatrix * mvPos;
      vGlow = 0.6 + 0.4 * sin(uTime * 4.0 + aPhase * 6.28);
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying float vGlow;
    uniform float uReveal;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      // Sharp head + trailing soft glow
      float core = pow(1.0 - d * 2.0, 6.0);
      float halo = pow(1.0 - d * 2.0, 1.6) * 0.3;
      vec3 col = vec3(0.5, 0.95, 1.0) * vGlow;
      float a = (core + halo) * vGlow * uReveal;
      gl_FragColor = vec4(col * 2.0, a);
    }
  `;

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    const points = pointsRef.current;
    if (!points) return;

    config.uniforms.uTime.value += delta;
    const reveal =
      smoothstep(SCENE_START, SCENE_FADE_IN_END, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
    config.uniforms.uReveal.value = reveal;

    const visible = reveal > 0.001;
    if (points.visible !== visible) points.visible = visible;
    if (!visible) return;

    // Update positions in-place — no allocation
    const posAttr = config.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const v = config.velocities;
    const limit = config.half + 1.0;
    const dt = Math.min(delta, 0.05); // clamp dt to avoid jumps after tab blur

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      arr[i3]     += v[i3]     * dt;
      arr[i3 + 1] += v[i3 + 1] * dt;
      arr[i3 + 2] += v[i3 + 2] * dt;

      // Wrap-around along travel axis (whichever has nonzero velocity)
      if (v[i3] !== 0 && Math.abs(arr[i3]) > limit) {
        arr[i3] = -Math.sign(v[i3]) * limit;
      }
      if (v[i3 + 1] !== 0 && Math.abs(arr[i3 + 1]) > limit) {
        arr[i3 + 1] = -Math.sign(v[i3 + 1]) * limit;
      }
      if (v[i3 + 2] !== 0 && Math.abs(arr[i3 + 2]) > limit) {
        arr[i3 + 2] = -Math.sign(v[i3 + 2]) * limit;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={config.geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={config.uniforms}
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
// 4. SCAN LINE OVERLAY — large flat plane sweeping through space
// Adds the "scanning the hologram" feel. Single quad, single uniform update.
// ============================================================
function HoloScanPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(40, 40), []);

  const uniforms = useMemo(
    () => ({
      uTime:    { value: 0 },
      uReveal:  { value: 0 },
      uYPos:    { value: -8 },
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
    uniform float uReveal;

    void main() {
      vec2 c = vUv - 0.5;
      float d = length(c);
      // Soft circular gradient
      float ring = smoothstep(0.5, 0.0, d);
      // Animated scan lines
      float lines = sin(vUv.y * 200.0 - uTime * 8.0) * 0.5 + 0.5;
      lines = pow(lines, 6.0);
      vec3 col = vec3(0.15, 0.85, 1.0);
      float a = ring * (0.04 + lines * 0.18) * uReveal;
      gl_FragColor = vec4(col * 1.4, a);
    }
  `;

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    if (!meshRef.current) return;
    uniforms.uTime.value += delta;

    const reveal =
      smoothstep(SCENE_START, SCENE_FADE_IN_END, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
    uniforms.uReveal.value = reveal;

    // Sweep up & down through the cube
    const sweepT = (t - SCENE_START) / (SCENE_END - SCENE_START);
    meshRef.current.position.y = THREE.MathUtils.lerp(-7, 7, (Math.sin(sweepT * Math.PI * 2) + 1) * 0.5);
    meshRef.current.rotation.x = -Math.PI / 2;

    const visible = reveal > 0.001;
    if (meshRef.current.visible !== visible) meshRef.current.visible = visible;
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
// SCENE ROOT
// ============================================================
export function TechGrid() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;
    const visible = t >= SCENE_START - 0.3 && t <= SCENE_END + 0.3;
    if (groupRef.current.visible !== visible) {
      groupRef.current.visible = visible;
    }
  });

  return (
    <group ref={groupRef}>
      <GridNodes />
      <GridLines />
      <DataStreams />
      <HoloScanPlane />
    </group>
  );
}

