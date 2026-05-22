'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import {
  useCinematicStore,
  smoothstep,
  smootherstep,
  fadeWindow,
  ramp,
} from '@/app/creative/lib/cinematicStore';
import { NOISE_GLSL } from '@/app/creative/shaders/PlasmaSunMaterial';

// ============================================================
// SCENE LIFETIME — 31s timeline, creation phase 0→4s
// Visible: 0s (fade in) → 4.8s (cross-dissolve to tech)
// Peak:    ~1.5s–3s (compressed)
// ============================================================
const SCENE_START = 0.0;
const SCENE_FADE_IN_END = 0.9;
const SCENE_FADE_OUT_START = 4.5;
const SCENE_END = 6.0;

// ============================================================
// 1. ENERGY SEED — small glowing sphere that blooms into the nebula
// Custom shader: pulsing core + animated fresnel + size growth via uniform
// ============================================================
const seedVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  uniform float uTime;
  uniform float uGrowth;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);

    // Breathing displacement so the seed looks alive
    float breathe = 1.0 + 0.06 * sin(uTime * 2.4);
    vec3 displaced = position * breathe;

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const seedFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGrowth;     // 0..1 — bloom progression
  uniform float uOpacity;
  uniform vec3  uColorCore;
  uniform vec3  uColorEdge;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  ${NOISE_GLSL}

  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.5);

    // Inner plasma swirl
    vec3 p = normalize(vPos) * 3.0 + vec3(0.0, uTime * 0.4, 0.0);
    float n = fbm(p, 4, 2.0, 0.55);
    float core = smoothstep(0.0, 0.5, 0.7 + n * 0.6);

    vec3 col = mix(uColorEdge, uColorCore, core);
    col += uColorCore * fres * 1.2;

    // As seed grows into nebula, dim the hard core so it dissolves outward
    float dissolve = 1.0 - smoothstep(0.5, 1.0, uGrowth);

    float a = (core * 0.7 + fres * 0.6) * uOpacity * dissolve;

    gl_FragColor = vec4(col * 2.2, clamp(a, 0.0, 1.0));

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function EnergySeed() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGrowth: { value: 0 },
      uOpacity: { value: 0 },
      uColorCore: { value: new THREE.Color('#fff0fa') },
      uColorEdge: { value: new THREE.Color('#c850ff') },
    }),
    []
  );

  // Geometry built once
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.35, 4), []);
  
  const lightRef = useRef<THREE.PointLight>(null);

  useSafeDispose([groupRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    if (!matRef.current || !groupRef.current) return;

    uniforms.uTime.value += delta;

    // Growth & opacity ramps
    let scale = 0.0;
    let opacity = 0.0;
    const growth = smoothstep(2.0, 3.5, t);

    if (t >= 0.3 && t < 0.8) {
      scale = 0.15;
      opacity = smoothstep(0.3, 0.8, t) * (0.6 + 0.4 * Math.sin((t - 0.3) * 35.0)); // suspense heartbeat pulse
    } else if (t >= 0.8 && t < 2.0) {
      const progress = (t - 0.8) / 1.2;
      scale = THREE.MathUtils.lerp(0.15, 4.5, Math.pow(progress, 2.5));
      opacity = 1.0;
    } else if (t >= 2.0 && t < 3.0) {
      const dissolve = smoothstep(2.0, 3.0, t);
      scale = THREE.MathUtils.lerp(4.5, 5.5, dissolve);
      opacity = 1.0 - smoothstep(2.0, 3.0, t); // dissolve seamlessly into the Sun
    }

    uniforms.uGrowth.value = growth;
    uniforms.uOpacity.value = opacity;
    groupRef.current.scale.setScalar(scale);

    if (lightRef.current) {
      lightRef.current.intensity = opacity * 3.0;
    }

    // Gentle wobble
    groupRef.current.rotation.x += delta * 0.15;
    groupRef.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={seedVertex}
          fragmentShader={seedFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Local light bath — sells "this is the source of everything" */}
      <pointLight ref={lightRef} color={'#ff7adf'} intensity={3.0} distance={20} decay={2} />
    </group>
  );
}

// ============================================================
// 2. VOLUMETRIC NEBULA — GPU points with custom GLSL
// Density-driven point cloud sampled inside a soft ellipsoid.
// Each point has: position, color, base size, phase offset.
// Renders as additive sprites with internal radial falloff.
// ============================================================
const nebulaVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3  aColor;
  attribute vec3  aSeed;

  varying vec3  vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uReveal;       // 0..1 fade in
  uniform float uPixelRatio;
  uniform float uSpread;       // bloom outward growth

  ${NOISE_GLSL}

  void main() {
    vec3 pos = position;

    // Spread outward as the nebula blooms
    pos *= mix(0.15, 1.0, uSpread);

    // Slow turbulent drift using simplex noise
    float t = uTime * 0.15 + aPhase;
    vec3 drift = vec3(
      snoise(aSeed + vec3(t * 0.3, 0.0, 0.0)),
      snoise(aSeed + vec3(0.0, t * 0.27, 0.0)),
      snoise(aSeed + vec3(0.0, 0.0, t * 0.31))
    ) * 0.6;
    pos += drift;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // Distance-based size attenuation, plus per-particle pulse
    float pulse = 0.75 + 0.25 * sin(uTime * 1.8 + aPhase * 6.28);
    gl_PointSize = aSize * pulse * uPixelRatio * (260.0 / -mvPos.z);

    gl_Position = projectionMatrix * mvPos;

    vColor = aColor;
    // Reveal fade + radial fade against distance from origin (scaled for massive spiral galaxy)
    float radial = 1.0 - smoothstep(12.0, 68.0, length(pos));
    vAlpha = uReveal * radial;
  }
`;

const nebulaFragment = /* glsl */ `
  precision highp float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Radial falloff inside each point sprite
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 2.2);

    vec3 col = vColor * (1.0 + falloff * 0.4);
    gl_FragColor = vec4(col, falloff * vAlpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function VolumetricNebula() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useCinematicStore((s) => s.quality);

  // Geometry built ONCE
  const { geometry, uniforms } = useMemo(() => {
    const count = quality.nebulaParticles;

    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const phases    = new Float32Array(count);
    const seeds     = new Float32Array(count * 3);

    // Nebula palette: purple → pink → orange embers
    const palette = [
      new THREE.Color('#b045ff'), // purple
      new THREE.Color('#ff5fb4'), // pink
      new THREE.Color('#ff8a3a'), // orange
      new THREE.Color('#7a30ff'), // deep violet
      new THREE.Color('#ffd0e8'), // pink-white
    ];

    const arms = 3;
    for (let i = 0; i < count; i++) {
      // 35% of particles are in the dense core, 65% in the spiral arms
      const isCore = Math.random() < 0.35;
      
      let x = 0, y = 0, z = 0;
      let r = 0;
      let distNorm = 0;
      
      if (isCore) {
        // Dense core: spheroid of radius up to 6.0
        r = Math.pow(Math.random(), 1.5) * 6.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta) * 1.5;
        y = r * Math.cos(phi) * 0.6;
        z = r * Math.sin(phi) * Math.sin(theta) * 1.5;
        distNorm = r / 6.0;
      } else {
        // Spiral arms: logarithmic arms extending out to 58.0 units
        r = 6.0 + Math.pow(Math.random(), 1.2) * 52.0;
        const armIndex = i % arms;
        
        // Logarithmic spiral math: angle increases with radius
        const theta = (armIndex / arms) * Math.PI * 2 + (r * 0.08) + (Math.random() - 0.5) * 0.38;
        
        x = Math.cos(theta) * r;
        y = (Math.random() - 0.5) * (4.0 * (1.0 - r / 58.0)); // thinner at outer edges
        z = Math.sin(theta) * r;
        distNorm = r / 58.0;
      }

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color based on radial normalized distance (warm core, cool neon outer arms)
      let col: THREE.Color;
      if (isCore) {
        if (distNorm < 0.3) col = palette[2]; // hot orange center
        else if (distNorm < 0.6) col = palette[4]; // pink-white glow
        else col = palette[1]; // pink edge of core
      } else {
        if (distNorm < 0.3) col = palette[1]; // pink arm start
        else if (distNorm < 0.75) col = palette[0]; // purple mid arm
        else col = palette[3]; // deep violet outer tips
      }

      // Add color jitter
      const jitter = palette[Math.floor(Math.random() * palette.length)];
      const mix = Math.random() * 0.35;
      const cr = col.r * (1 - mix) + jitter.r * mix;
      const cg = col.g * (1 - mix) + jitter.g * mix;
      const cb = col.b * (1 - mix) + jitter.b * mix;

      colors[i * 3]     = cr * 1.5; // Boost colors for dramatic pop
      colors[i * 3 + 1] = cg * 1.5;
      colors[i * 3 + 2] = cb * 1.5;

      // Size: larger in the core, delicate in the outer arms
      const isEmber = Math.random() > 0.95;
      sizes[i] = isEmber
        ? (isCore ? 10 + Math.random() * 15 : 6 + Math.random() * 10)
        : (isCore ? 2.5 + Math.random() * 4.0 : 1.5 + Math.random() * 2.5);

      phases[i] = Math.random();

      seeds[i * 3]     = (Math.random() - 0.5) * 10;
      seeds[i * 3 + 1] = (Math.random() - 0.5) * 10;
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 3));
    // Bounding sphere for frustum culling
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
      uSpread:     { value: 0.15 },
    };

    return { geometry: geo, uniforms: unis };
  }, [quality.nebulaParticles]);

  useSafeDispose([pointsRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.uTime.value += delta;

    // Volumetric nebula fades in beautifully between 1.2s and 2.5s
    const reveal =
      smoothstep(1.2, 2.5, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
    // Cosmic dust boost: ramps up from 3.5s, peaks at 4.5s, then fades with the scene
    const dustBoost = smoothstep(3.5, 4.5, t) * (1 - smoothstep(5.0, 6.0, t));
    uniforms.uReveal.value = reveal * THREE.MathUtils.lerp(0.35, 0.65, dustBoost);

    // Spread: 0.15 → 1.0 over 1.2s to 3.8s (the "bloom outward" motion — compressed)
    uniforms.uSpread.value = THREE.MathUtils.lerp(
      0.15,
      1.0,
      smoothstep(1.2, 3.8, t)
    );

    // Slow rotation
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
      pointsRef.current.rotation.z += delta * 0.008;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================
// 3. SILK RIBBONS — TubeGeometry orbits forming energy streams
// Built once via CatmullRomCurve3 → tube. Animation = rotation only.
// ============================================================
function SilkRibbon({
  seed,
  color,
  radius,
  tilt,
  speed,
  pulseColor,
}: {
  seed: number;
  color: string;
  radius: number;
  tilt: [number, number, number];
  speed: number;
  pulseColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Build a closed-loop curve once
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 1;
    const segments = 64;
    const wobble = 0.6;

    // Pseudo-random based on seed
    let s = seed * 1000;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (let i = 0; i < segments; i++) {
      const u = (i / segments) * Math.PI * 2 * turns;
      const r = radius * (1 + (rand() - 0.5) * 0.15);
      const x = Math.cos(u) * r;
      const z = Math.sin(u) * r;
      const y = Math.sin(u * 3 + seed) * wobble +
                (rand() - 0.5) * 0.3;
      pts.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
    return new THREE.TubeGeometry(curve, 320, 0.025, 8, true);
  }, [seed, radius]);

  const uniforms = useMemo(
    () => ({
      uTime:       { value: 0 },
      uOpacity:    { value: 0 },
      uColor:      { value: new THREE.Color(color) },
      uPulseColor: { value: new THREE.Color(pulseColor) },
      uPulseSpeed: { value: speed },
    }),
    [color, pulseColor, speed]
  );

  const vertex = /* glsl */ `
    varying float vU;
    void main() {
      // Use UV.x as longitudinal coordinate (TubeGeometry sets uv.x along length)
      vU = uv.x;
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPos;
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying float vU;
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3  uColor;
    uniform vec3  uPulseColor;
    uniform float uPulseSpeed;

    void main() {
      // Energy pulse traveling along ribbon
      float pulse = fract(vU - uTime * uPulseSpeed);
      float head = pow(1.0 - pulse, 16.0);

      // Secondary slow pulse for shimmer
      float shimmer = 0.5 + 0.5 * sin(vU * 30.0 - uTime * 2.0);

      vec3 col = uColor * (0.6 + shimmer * 0.4) + uPulseColor * head * 3.0;

      gl_FragColor = vec4(col * 1.8, uOpacity);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  useSafeDispose([groupRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.uTime.value += delta;
    // SilkRibbons delayed to t=2.0 to avoid cluttering the dark start
    uniforms.uOpacity.value = fadeWindow(t, 2.0, 4.5, 0.5, 1.5) * 0.6;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed * 0.3;
      groupRef.current.rotation.x += delta * speed * 0.08;
    }
  });

  return (
    <group ref={groupRef} rotation={tilt}>
      <mesh geometry={geometry}>
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
    </group>
  );
}

// ============================================================
// 4. COSMIC DUST BACKGROUND — Faint volumetric cosmic gas clouds phông nền
// User requested: "Hãy tạo thêm cảnh, phông nền"
// ============================================================
function CosmicDustBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const phases    = new Float32Array(count);
    const sizes     = new Float32Array(count);

    // Gorgeous cosmic gas cloud palette
    const palette = [
      new THREE.Color('#10002b'), // Very deep purple
      new THREE.Color('#240046'), // Deep violet
      new THREE.Color('#3c004a'), // Dark magenta
      new THREE.Color('#03001e'), // Midnight blue
      new THREE.Color('#00203f'), // Deep forest-teal
    ];

    for (let i = 0; i < count; i++) {
      // Widespread coordinates in deep space surrounding the camera's Z path
      positions[i * 3]     = (Math.random() - 0.5) * 280.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200.0;
      positions[i * 3 + 2] = -100.0 + Math.random() * 550.0; // Spans -100 to 450

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 50.0 + Math.random() * 85.0; // Extremely large soft shapes
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 175), 350);

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
    return { geometry: geo, uniforms: unis };
  }, []);

  const vertex = /* glsl */ `
    attribute float aPhase;
    attribute float aSize;
    attribute vec3  aColor;
    varying vec3  vColor;
    varying float vAlpha;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uReveal;

    void main() {
      vec3 pos = position;
      
      // Extremely slow drift so the cosmic clouds look alive
      pos.y += sin(uTime * 0.12 + aPhase) * 1.5;
      pos.x += cos(uTime * 0.10 + aPhase) * 1.5;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      float dist = max(1.0, -mvPos.z);

      // Scale and cap the gas clouds sizes so they blend smoothly
      gl_PointSize = clamp(aSize * uPixelRatio * (340.0 / dist), 10.0, 380.0);
      gl_Position = projectionMatrix * mvPos;

      vColor = aColor;
      
      // Smooth lens near-clip to dissolve gaseous dust clouds before hitting the camera
      float nearClip = smoothstep(5.0, 22.0, dist);
      vAlpha = uReveal * nearClip;
    }
  `;

  const fragment = /* glsl */ `
    precision highp float;
    varying vec3  vColor;
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      
      // Soft falloff mimicking beautiful galactic fog dust
      float falloff = pow(1.0 - d * 2.0, 3.2);
      
      gl_FragColor = vec4(vColor * (1.1 + falloff * 0.4), falloff * vAlpha * 0.18);
    }
  `;

  useSafeDispose([pointsRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.uTime.value += delta;
    
    // Cosmic dust starts immediately at 0.02s to pre-populate the space, fading with the scene
    uniforms.uReveal.value =
      smoothstep(0.02, 0.9, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
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
// 5. AMBIENT SPARKLE PARTICLES — Deep 3D Z-Axis Starfield (twinkling spots growing larger)
// User requested: "đoạn đầu thấy những đốm sáng to dần và cảm giác người xem đang được dịch chuyển"
// ============================================================
function AmbientSparkles() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useCinematicStore((s) => s.quality);

  const { geometry, uniforms } = useMemo(() => {
    // 35% of overall particles is around 3,500 on High tier
    const count = Math.floor(quality.nebulaParticles * 0.35);
    const positions = new Float32Array(count * 3);
    const phases    = new Float32Array(count);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      
      // 45% of stars are placed near the camera's Z path to create dramatic close flybys
      // 55% are placed at a distance to populate the starry background
      const isClose = Math.random() < 0.45;
      const r = isClose
        ? 1.2 + Math.random() * 7.5
        : 10.0 + Math.random() * 90.0;

      positions[i * 3]     = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r;
      positions[i * 3 + 2] = -100.0 + Math.random() * 550.0; // Spans from -100 up to 450

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = isClose
        ? 3.5 + Math.random() * 6.5   // Close-up stars are slightly larger to pop
        : 1.5 + Math.random() * 4.5;  // Distant stars are fine, delicate points
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 175), 350);

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
    return { geometry: geo, uniforms: unis };
  }, [quality.nebulaParticles]);

  const vertex = /* glsl */ `
    attribute float aPhase;
    attribute float aSize;
    varying float vTwinkle;
    varying float vAlpha;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uReveal;

    void main() {
      vec3 pos = position;
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      
      float dist = max(0.1, -mvPos.z);
      
      // Math to make stars physically grow larger as we get closer (1/dist relation)
      // Capped at 110.0 to avoid huge blocky pixels on the lens
      gl_PointSize = clamp(aSize * uPixelRatio * (280.0 / dist), 1.0, 110.0);
      
      gl_Position = projectionMatrix * mvPos;

      // Twinkle glow using sine wave offset by particle's randomized phase
      float twinkle = 0.4 + 0.6 * sin(uTime * 3.5 + aPhase * 6.28);
      
      // Lens near-clip: smoothly fade out close stars so they don't clip harshly
      float nearClip = smoothstep(1.5, 8.0, dist);
      
      vTwinkle = twinkle;
      vAlpha = uReveal * nearClip;
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying float vTwinkle;
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float falloff = pow(1.0 - d * 2.0, 2.2);
      
      // Super bright white/cyan star core
      vec3 col = vec3(0.92, 0.96, 1.0) * vTwinkle;
      gl_FragColor = vec4(col * 2.8, falloff * vAlpha);
    }
  `;

  useSafeDispose([pointsRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.uTime.value += delta;
    
    // Twinkling stars fade in immediately from t = 0.0s to 0.8s
    uniforms.uReveal.value =
      smoothstep(0.0, 0.8, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
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
// 5. WARP SPEED LINES — Streaks of light simulating hyperspace
// ============================================================
function WarpSpeedLines() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { geometry, uniforms } = useMemo(() => {
    const count = 280;                              // denser warp tunnel
    const positions = new Float32Array(count * 2 * 3);
    const alphas = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      // Random position in a cylinder around the camera path
      const angle = Math.random() * Math.PI * 2;
      // Wider distribution — some streaks near camera axis, some far edge
      const radius = 2 + Math.random() * 22;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const zOffset = Math.random() * 220;
      const length = 20 + Math.random() * 60;       // much longer streaks for hyper-speed
      
      // Start point (tail)
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = zOffset;
      alphas[i * 2 + 0] = 0.0; 
      
      // End point (head)
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = zOffset + length;
      alphas[i * 2 + 1] = 1.0; 
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    
    return {
      geometry: geo,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
      }
    };
  }, []);

  useSafeDispose([linesRef.current, matRef.current, geometry]);

  const vertexShader = /* glsl */ `
    attribute float aAlpha;
    varying float vAlpha;
    uniform float uTime;
    void main() {
      vec3 pos = position;
      // Fly towards camera incredibly fast (positive Z direction)
      pos.z += uTime * 450.0; 
      // Wrap around seamlessly over the camera's travel path (-50 to 250)
      pos.z = mod(pos.z, 300.0) - 50.0;
      
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      
      vAlpha = aAlpha;
    }
  `;

  const fragmentShader = /* glsl */ `
    varying float vAlpha;
    uniform float uIntensity;
    void main() {
      // Cyan/White hyper-lines
      gl_FragColor = vec4(0.8, 0.95, 1.0, vAlpha * uIntensity);
    }
  `;

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    // Tăng tốc độ bay theo t để giả lập gia tốc Warp
    const speedMult = t > 2.0 ? 1.8 : 1.0;
    uniforms.uTime.value += delta * speedMult;

    // Warp lines: delay start to 1.5s (after galaxy reveal), tapers off by 5.5s
    let intensity = smoothstep(1.5, 2.2, t) * (1.0 - smoothstep(4.5, 5.5, t));
    
    // Cường điệu hóa độ sáng và dày lúc đâm xuyên hệ hành tinh (2.0s -> 4.5s)
    if (t > 1.5 && t < 4.8) {
      intensity *= 2.5;
    }
    
    uniforms.uIntensity.value = intensity;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial 
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ============================================================
// SCENE ROOT
// ============================================================
export function CreationNebula() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;
    // Hide entirely outside scene window — saves draw calls
    const visible = t >= -0.2 && t <= SCENE_END + 0.5;
    if (groupRef.current.visible !== visible) {
      groupRef.current.visible = visible;
    }
  });

  return (
    <group ref={groupRef}>
      <EnergySeed />
      <VolumetricNebula />
      <CosmicDustBackground />
      <AmbientSparkles />
      <WarpSpeedLines />

      {/* Three orbiting silk ribbons at varied tilts */}
      <SilkRibbon
        seed={1.0}
        color="#a040ff"
        pulseColor="#ffa0e8"
        radius={1.6}
        tilt={[0.2, 0, 0.4]}
        speed={0.5}
      />
      <SilkRibbon
        seed={2.7}
        color="#ff6ad0"
        pulseColor="#ffd0a0"
        radius={2.2}
        tilt={[1.1, 0.3, -0.2]}
        speed={0.35}
      />
      <SilkRibbon
        seed={4.3}
        color="#ff9050"
        pulseColor="#fff0c0"
        radius={2.8}
        tilt={[-0.4, 1.2, 0.1]}
        speed={0.28}
      />
    </group>
  );
}