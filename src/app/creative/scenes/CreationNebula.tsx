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
// SCENE LIFETIME
// Visible:  0s (fade in) → 7.2s (cross-dissolve to tech)
// Peak:     ~2.5s–5s (compressed 15%)
// ============================================================
const SCENE_START = 0.0;
const SCENE_FADE_IN_END = 1.3;
const SCENE_FADE_OUT_START = 5.95;
const SCENE_END = 7.2;

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
  
  useSafeDispose([groupRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    if (!matRef.current || !groupRef.current) return;

    uniforms.uTime.value += delta;

    // Growth & opacity ramps
    // Pre-bloom (0–2s): seed visible, growing
    // 2–5s: blooms outward (grows scale + fades core)
    // 5s+: dissolved into nebula
    const growth = smoothstep(1.5, 5.0, t);
    const opacity =
      smoothstep(SCENE_START, 1.2, t) * (1 - smoothstep(4.5, 5.5, t));

    uniforms.uGrowth.value = growth;
    uniforms.uOpacity.value = opacity;

    // Scale grows from 0.6 → 3.5 as it dissolves into nebula
    const scale = THREE.MathUtils.lerp(0.6, 3.5, growth);
    groupRef.current.scale.setScalar(scale);

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
      <pointLight color={'#ff7adf'} intensity={3.0} distance={20} decay={2} />
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
    // Reveal fade + radial fade against distance from origin
    float radial = 1.0 - smoothstep(2.5, 6.0, length(pos));
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

    for (let i = 0; i < count; i++) {
      // Sample inside ellipsoid with denser core (cube-root for radial bias)
      const r = Math.pow(Math.random(), 0.55) * 4.5;
      const theta = Math.random() * Math.PI * 2;
      // Flattened on Y axis for disc-like form
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      const y = r * Math.cos(phi) * 0.5;
      const z = r * Math.sin(phi) * Math.sin(theta) * 1.4;

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color by radial distance: hot inner → cool outer
      const distNorm = Math.min(1, r / 4.5);
      let col: THREE.Color;
      if (distNorm < 0.3) col = palette[2]; // orange center
      else if (distNorm < 0.55) col = palette[1]; // pink mid
      else if (distNorm < 0.85) col = palette[0]; // purple
      else col = palette[3]; // deep violet edges

      // Add color jitter
      const jitter = palette[Math.floor(Math.random() * palette.length)];
      const mix = Math.random() * 0.35;
      const cr = col.r * (1 - mix) + jitter.r * mix;
      const cg = col.g * (1 - mix) + jitter.g * mix;
      const cb = col.b * (1 - mix) + jitter.b * mix;

      colors[i * 3]     = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;

      // Size: small majority, occasional bright "embers"
      const isEmber = Math.random() > 0.96;
      sizes[i] = isEmber
        ? 8 + Math.random() * 14
        : 1.5 + Math.random() * 3.5;

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

    // Reveal: cross-fade window
    const reveal =
      smoothstep(SCENE_START, SCENE_FADE_IN_END + 1.0, t) *
      (1 - smoothstep(SCENE_FADE_OUT_START, SCENE_END, t));
    uniforms.uReveal.value = reveal;

    // Spread: 0.15 → 1.0 over 2s to 5s (the "bloom outward" motion)
    uniforms.uSpread.value = THREE.MathUtils.lerp(
      0.15,
      1.0,
      smoothstep(2.0, 5.5, t)
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
    uniforms.uOpacity.value =
      fadeWindow(t, 2.8, SCENE_END, 1.5, 1.0) * 0.85;

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
// 4. AMBIENT SPARKLE PARTICLES — Light dots from far away moving closer
// User requested: "phông nền là các đốm sáng từ xa chuyển lại gần và to hơn, sáng hơn, 1/4 màn hình"
// ============================================================
function AmbientSparkles() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useCinematicStore((s) => s.quality);

  const { geometry, uniforms } = useMemo(() => {
    // Increased particle count for the tunnel effect
    const count = Math.floor(quality.nebulaParticles * 0.25);
    const positions = new Float32Array(count * 3);
    const phases    = new Float32Array(count);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // x and y spread for the 1/4 screen cone, z is initial phase (0..1)
      positions[i * 3]     = (Math.random() - 0.5) * 8.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
      positions[i * 3 + 2] = Math.random(); // used as phase in shader

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 3.0 + Math.random() * 6.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    // Large bounding sphere so it doesn't get culled easily
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
    return { geometry: geo, uniforms: unis };
  }, [quality.nebulaParticles]);

  const vertex = /* glsl */ `
    attribute float aPhase;
    attribute float aSize;
    varying float vTwinkle;
    uniform float uTime;
    uniform float uPixelRatio;

    void main() {
      vec3 pos = position;
      
      // Move from far (z = -10) to near and past the camera (z = 35)
      // Camera is between z=22 and z=9, so z=35 goes way past the camera
      float speed = 0.4;
      float travel = fract(pos.z + uTime * speed);
      float zPos = -10.0 + travel * 45.0; 
      pos.z = zPos;

      // Cone shape: narrow at far, wider at near (makes them spread outward as they approach)
      float zNorm = travel; // 0 to 1
      pos.x *= 0.5 + zNorm * 4.0;
      pos.y *= 0.5 + zNorm * 4.0;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      
      // Size grows exponentially as they get very close to the camera
      // pow(zNorm, 3.0) makes them suddenly huge right before passing the screen
      float sizeGrowth = 1.0 + pow(zNorm, 4.0) * 40.0;
      
      // Avoid division by zero or negative size when passing camera
      float dist = max(1.0, -mvPos.z);
      gl_PointSize = aSize * sizeGrowth * uPixelRatio * (300.0 / dist);
      
      gl_Position = projectionMatrix * mvPos;

      // Brightness increases as it gets closer
      vTwinkle = 0.6 + 0.4 * sin(uTime * 4.0 + aPhase * 6.28);
      
      // Fade in from far, stay bright, then fade out just as they pass the camera
      float alpha = smoothstep(0.0, 0.2, zNorm) * (1.0 - smoothstep(0.9, 1.0, zNorm));
      vTwinkle *= alpha;
    }
  `;
  const fragment = /* glsl */ `
    precision highp float;
    varying float vTwinkle;
    uniform float uReveal;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float falloff = pow(1.0 - d * 2.0, 2.0);
      // Bright white/cyan dots
      vec3 col = vec3(0.9, 0.95, 1.0) * vTwinkle;
      gl_FragColor = vec4(col * 2.5, falloff * vTwinkle * uReveal);
    }
  `;

  useSafeDispose([pointsRef.current, matRef.current, geometry]);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    uniforms.uTime.value += delta;
    // Fade in/out with the scene
    uniforms.uReveal.value =
      smoothstep(0.0, 1.5, t) *
      (1 - smoothstep(5.95, 7.2, t)); // Scaled timings by 0.85 approx
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
      <AmbientSparkles />

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