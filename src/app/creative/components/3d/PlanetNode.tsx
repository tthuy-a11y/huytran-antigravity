'use client';

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import {
  PlasmaSunMaterialImpl,
  CoronaMaterialImpl,
} from '@/app/creative/shaders/PlasmaSunMaterial';
import {
  useCinematicStore,
  ramp,
  smootherstep,
  smoothstep,
} from '@/app/creative/lib/cinematicStore';
import { getPlanetGeometry, getAtmosphereGeometry } from '@/app/creative/lib/geometryCache';

// ============================================================
// SHARED GEOMETRIES (avoid duplicate allocation across instances)
// ============================================================
const SUN_GEOMETRY    = new THREE.IcosahedronGeometry(1, 64);
const CORONA_GEOMETRY = new THREE.SphereGeometry(1, 64, 64);
const ASTEROID_GEOMETRY_HI = new THREE.IcosahedronGeometry(1, 5);
const ASTEROID_GEOMETRY_MD = new THREE.IcosahedronGeometry(1, 3);
const ASTEROID_GEOMETRY_LO = new THREE.IcosahedronGeometry(1, 2);

// Deterministically displace an icosahedron into a craggy asteroid shape
function makeAsteroidGeometry(
  baseGeo: THREE.IcosahedronGeometry,
  seed: number,
  ruggedness = 0.22
): THREE.BufferGeometry {
  const geo = baseGeo.clone();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  // Simple hash-based 3D value noise (deterministic per seed)
  const hash3 = (x: number, y: number, z: number, s: number) => {
    const n =
      Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s * 4.137) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    const n =
      hash3(v.x * 2.1, v.y * 2.1, v.z * 2.1, seed) * 0.6 +
      hash3(v.x * 4.7, v.y * 4.7, v.z * 4.7, seed + 1) * 0.3 +
      hash3(v.x * 9.3, v.y * 9.3, v.z * 9.3, seed + 2) * 0.1;
    const disp = 1 + (n - 0.5) * ruggedness;
    v.normalize().multiplyScalar(len * disp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ============================================================
// SUN — TH2003 with Plasma Surface + Multi-Layered Corona
// ============================================================
interface SunProps {
  position?: [number, number, number];
  scale?: number;
  /** 0..1 reveal animation (used by awakening scene). 1 = fully visible. */
  reveal?: number;
  /** Multiplier on internal noise turbulence */
  intensity?: number;
}

export interface SunHandle {
  group: THREE.Group | null;
  setReveal: (v: number) => void;
}

export const Sun = forwardRef<SunHandle, SunProps>(function Sun(
  { position = [0, 0, 0], scale = 3.2, reveal = 1.0, intensity = 1.0 },
  ref
) {
  const groupRef    = useRef<THREE.Group>(null);
  const surfaceRef  = useRef<any>(null);
  const corona1Ref  = useRef<any>(null);
  const corona2Ref  = useRef<any>(null);
  const corona3Ref  = useRef<any>(null);
  const lightRef    = useRef<THREE.PointLight>(null);

  // Mobile detection: deviceTier 'low' maps to mobile in the tier detector
  const deviceTier  = useCinematicStore((s) => s.deviceTier);
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  // Imperative handle so director can override reveal from useFrame if needed
  useImperativeHandle(ref, () => ({
    group: groupRef.current,
    setReveal: (v: number) => {
      if (surfaceRef.current) surfaceRef.current.uTime = v;
    },
  }));

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;

    // Surface plasma
    if (surfaceRef.current) {
      surfaceRef.current.uTime += delta;
      surfaceRef.current.uIntensity = intensity;
      surfaceRef.current.uMobileDampen = isMobile ? 1.0 : 0.0;
      surfaceRef.current.uReveal = THREE.MathUtils.lerp(
        surfaceRef.current.uReveal ?? 0,
        reveal,
        0.08
      );
    }

    // Three corona layers — slightly out-of-phase for shimmer
    // On mobile: reduce corona opacity to prevent over-bright additive glow
    const coronaScale = isMobile ? 0.55 : 1.0;
    if (corona1Ref.current) {
      corona1Ref.current.uTime += delta;
      corona1Ref.current.uReveal = reveal;
      corona1Ref.current.uOpacity = 1.0 * coronaScale;
    }
    if (corona2Ref.current) {
      corona2Ref.current.uTime += delta * 0.7;
      corona2Ref.current.uReveal = reveal;
      corona2Ref.current.uOpacity = 0.55 * coronaScale;
    }
    if (corona3Ref.current) {
      corona3Ref.current.uTime += delta * 0.45;
      corona3Ref.current.uReveal = reveal;
      corona3Ref.current.uOpacity = 0.22 * coronaScale;
    }

    // Subtle axial rotation — adds parallax to the boiling surface
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.rotation.x += delta * 0.012;
    }

    // Light pulse, scales with reveal
    // On mobile: drastically reduce pulse amplitude to avoid flashing
    if (lightRef.current) {
      const pulseAmp = isMobile ? 0.015 : 0.08;
      const pulseFreq = isMobile ? 0.3 : 0.7;
      const pulse = (1 - pulseAmp) + pulseAmp * Math.sin(t * pulseFreq);
      const baseIntensity = isMobile ? 4.5 : 6.0;
      lightRef.current.intensity = baseIntensity * reveal * pulse;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Core plasma surface */}
      <mesh geometry={SUN_GEOMETRY}>
        {/* @ts-ignore custom material */}
        <plasmaSunMaterialImpl
          ref={surfaceRef}
          uIntensity={intensity}
          uReveal={reveal}
          uColorCore={new THREE.Color('#fff6c8')}
          uColorMid={new THREE.Color('#ffb547')}
          uColorEdge={new THREE.Color('#ff5a1f')}
          uColorFlare={new THREE.Color('#ffe7a0')}
          uNoiseScale={2.4}
          uFlowSpeed={0.18}
        />
      </mesh>

      {/* Corona layer 1 — tight, hot */}
      <mesh geometry={CORONA_GEOMETRY} scale={1.18}>
        {/* @ts-ignore */}
        <coronaMaterialImpl
          ref={corona1Ref}
          uPower={3.5}
          uOpacity={1.0}
          uColorInner={new THREE.Color('#fff2c0')}
          uColorOuter={new THREE.Color('#ff8a2a')}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Corona layer 2 — mid halo */}
      <mesh geometry={CORONA_GEOMETRY} scale={1.55}>
        {/* @ts-ignore */}
        <coronaMaterialImpl
          ref={corona2Ref}
          uPower={2.6}
          uOpacity={0.55}
          uColorInner={new THREE.Color('#ffce7a')}
          uColorOuter={new THREE.Color('#ff5a1a')}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Corona layer 3 — wide outer god-ray glow */}
      <mesh geometry={CORONA_GEOMETRY} scale={2.4}>
        {/* @ts-ignore */}
        <coronaMaterialImpl
          ref={corona3Ref}
          uPower={1.8}
          uOpacity={0.22}
          uColorInner={new THREE.Color('#ffb060')}
          uColorOuter={new THREE.Color('#ff3a08')}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Scene illumination from the sun */}
      <pointLight
        ref={lightRef}
        color={'#ffd28a'}
        intensity={6}
        distance={120}
        decay={1.6}
      />
    </group>
  );
});

// ============================================================
// COLLISION ASTEROIDS — Creativity (left) & Technology (right)
// Surface materials encode each side's identity via emissive + tint.
// ============================================================
export type AsteroidVariant = 'creativity' | 'technology';

interface CollisionAsteroidProps {
  variant: AsteroidVariant;
  position?: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
}

export interface CollisionAsteroidHandle {
  group: THREE.Group | null;
  material: THREE.MeshStandardMaterial | null;
}

export const CollisionAsteroid = forwardRef<
  CollisionAsteroidHandle,
  CollisionAsteroidProps
>(function CollisionAsteroid(
  { variant, position = [0, 0, 0], scale = 1.5, rotationSpeed = 0.4 },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<THREE.MeshStandardMaterial>(null);
  const quality  = useCinematicStore.getState().quality;

  const geometry = useMemo(() => {
    const base =
      quality.nebulaParticles >= 15000
        ? ASTEROID_GEOMETRY_HI
        : quality.nebulaParticles >= 5000
        ? ASTEROID_GEOMETRY_MD
        : ASTEROID_GEOMETRY_LO;
    const seed = variant === 'creativity' ? 11 : 29;
    return makeAsteroidGeometry(base, seed, 0.28);
  }, [variant, quality.nebulaParticles]);

  // Procedural emissive texture — swirls for creativity, circuits for tech
  const emissiveMap = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (variant === 'creativity') {
      // Pink/purple/orange nebula swirls
      const grad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        20,
        size / 2,
        size / 2,
        size / 2
      );
      grad.addColorStop(0, '#ff8ad1');
      grad.addColorStop(0.4, '#a755ff');
      grad.addColorStop(0.8, '#3a1050');
      grad.addColorStop(1, '#0a0010');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Wispy swirls
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.15 + Math.random() * 0.25;
        ctx.fillStyle = ['#ffb0e0', '#ff7e3a', '#d690ff'][i % 3];
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * size,
          Math.random() * size,
          20 + Math.random() * 80,
          5 + Math.random() * 20,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // Circuit board: dark base + glowing cyan traces
      ctx.fillStyle = '#020812';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = '#26e6ff';
      ctx.lineCap = 'square';

      // Grid of right-angled traces
      const cell = 28;
      for (let y = cell; y < size; y += cell) {
        for (let x = cell; x < size; x += cell) {
          if (Math.random() > 0.55) continue;
          ctx.lineWidth = 1 + Math.random() * 2;
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          const dir = Math.floor(Math.random() * 4);
          const len = cell * (1 + Math.floor(Math.random() * 3));
          if (dir === 0) ctx.lineTo(x + len, y);
          else if (dir === 1) ctx.lineTo(x, y + len);
          else if (dir === 2) ctx.lineTo(x - len, y);
          else ctx.lineTo(x, y - len);
          ctx.stroke();

          // Nodes
          if (Math.random() > 0.7) {
            ctx.fillStyle = '#7df5ff';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#26e6ff';
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [variant]);

  useImperativeHandle(ref, () => ({
    group: groupRef.current,
    material: matRef.current,
  }));

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * rotationSpeed * 0.6;
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  const baseColor =
    variant === 'creativity' ? '#3a0a3a' : '#021018';
  const emissiveColor =
    variant === 'creativity' ? '#ff66c8' : '#1ee6ff';

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          ref={matRef}
          color={baseColor}
          emissive={emissiveColor}
          emissiveMap={emissiveMap}
          emissiveIntensity={2.4}
          roughness={0.65}
          metalness={0.35}
        />
      </mesh>
    </group>
  );
});

// ============================================================
// CINEMATIC PLANET — post-Bang planets that drift apart, then orbit
// Drei <Html> labels are attached EXTERNALLY in BigBangClash.
// ============================================================
export type PrimalTint = 'gold' | 'pink' | 'cyan';

interface CinematicPlanetProps {
  children?: React.ReactNode;
  /** Stable id used by parent to query position for HUD label attachment */
  id: string;
  tint: PrimalTint;
  /** Direction vector the asteroid drifts toward in 18-22s */
  driftDir: [number, number, number];
  /** Final orbital radius around the Sun (used 22s+) */
  orbitRadius: number;
  /** Initial angle on the orbital plane (radians) */
  orbitPhase: number;
  /** Orbit speed (radians/sec) */
  orbitSpeed: number;
  scale?: number;
  seed?: number;
  customColors?: { base: string; emissive: string };
}

export interface CinematicPlanetHandle {
  group: THREE.Group | null;
  getWorldPosition: (out: THREE.Vector3) => THREE.Vector3;
}

const TINT_COLORS: Record<
  PrimalTint,
  { base: string; emissive: string }
> = {
  gold: { base: '#3a2a08', emissive: '#ffc857' },
  pink: { base: '#3a0a28', emissive: '#ff5aa8' },
  cyan: { base: '#022430', emissive: '#3ae8ff' },
};

export const CinematicPlanet = forwardRef<
  CinematicPlanetHandle,
  CinematicPlanetProps
>(function CinematicPlanet(
  {
    tint,
    driftDir,
    orbitRadius,
    orbitPhase,
    orbitSpeed,
    scale = 1.2,
    seed = 7,
    customColors,
  },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const dir = useMemo(
    () => new THREE.Vector3(...driftDir).normalize(),
    [driftDir]
  );

  const colors = customColors || TINT_COLORS[tint];

  // Procedural planet material with FBM noise (khớp với InteractivePlanetNode)
  const planetMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.base),
      emissive: new THREE.Color(colors.emissive),
      emissiveIntensity: 0.15,
      roughness: 0.55,
      metalness: 0.35,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uNoiseScale = { value: 2.5 };
      (mat as any).userData.shader = shader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `
          #include <begin_vertex>
          vLocalPos = position;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          uniform float uTime;
          uniform float uNoiseScale;
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;

          float hash(vec3 p){p=fract(p*vec3(443.8975,397.2973,491.1871));p+=dot(p,p.yxz+19.19);return fract((p.x+p.y)*p.z);}
          float noise(vec3 p){
            vec3 i=floor(p); vec3 f=fract(p);
            f=f*f*(3.0-2.0*f);
            float n=mix(
              mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                  mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                  mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
            return n;
          }
          float fbm(vec3 p){
            float v=0.0; float a=0.5;
            for(int i=0;i<5;i++){v+=a*noise(p); p*=2.0; a*=0.5;}
            return v;
          }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
          #include <emissivemap_fragment>
          float n = fbm(vLocalPos * uNoiseScale);
          float bands = fbm(vLocalPos * uNoiseScale * 3.0 + uTime * 0.05);
          float pattern = smoothstep(0.3, 0.7, n * 0.7 + bands * 0.3);

          vec3 darkSurface = diffuseColor.rgb * 0.35;
          vec3 brightSurface = diffuseColor.rgb * 1.15;
          diffuseColor.rgb = mix(darkSurface, brightSurface, pattern);

          totalEmissiveRadiance += diffuseColor.rgb * 0.08 * (1.0 - pattern);
        `
      );
    };

    return mat;
  }, [colors.base, colors.emissive]);

  // Atmosphere fresnel shader
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(colors.emissive) },
          uPower: { value: 2.5 },
          uIntensity: { value: 1.0 },
        },
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          void main(){
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uPower;
          uniform float uIntensity;
          varying vec3 vNormal;
          void main(){
            float f = pow(1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))), uPower);
            gl_FragColor = vec4(uColor * f * uIntensity, f);
          }
        `,
      }),
    [colors.emissive]
  );

  useImperativeHandle(ref, () => ({
    group: groupRef.current,
    getWorldPosition: (out: THREE.Vector3) => {
      if (groupRef.current) groupRef.current.getWorldPosition(out);
      else out.set(0, 0, 0);
      return out;
    },
  }));

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    const g = groupRef.current;
    if (!g) return;

    if ((planetMaterial as any).userData.shader) {
      (planetMaterial as any).userData.shader.uniforms.uTime.value += delta;
    }

    // Three life phases:
    // 16.0–18.0  : explode outward from origin along drift direction (fast)
    // 18.0–22.0  : decelerate, drift slow, label appears
    // 22.0+      : ease into elliptical orbit at orbitRadius
    let x = 0, y = 0, z = 0;

    if (t < 16.0) {
      // Pre-bang: hidden at origin
      x = y = z = 0;
    } else if (t < 22.0) {
      // Drift phase
      const k = t - 16.0;
      const dist = 1 - Math.exp(-k * 0.55);
      const reach = orbitRadius * 1.05 * dist;
      x = dir.x * reach;
      y = dir.y * reach;
      z = dir.z * reach;

      if (t > 20.5) {
        const blend = smootherstep(20.5, 22.0, t);
        const ox = Math.cos(orbitPhase) * orbitRadius;
        const oz = Math.sin(orbitPhase) * orbitRadius;
        x = THREE.MathUtils.lerp(x, ox, blend);
        z = THREE.MathUtils.lerp(z, oz, blend);
        y = THREE.MathUtils.lerp(y, 0, blend);
      }
    } else {
      // Orbital phase
      const angle = orbitPhase + (t - 22.0) * orbitSpeed;
      x = Math.cos(angle) * orbitRadius;
      z = Math.sin(angle) * orbitRadius;
      y = Math.sin(angle * 0.5) * 0.4;
    }

    g.position.set(x, y, z);
    g.rotation.x += delta * 0.3;
    g.rotation.y += delta * 0.45;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh geometry={getPlanetGeometry()} material={planetMaterial} castShadow receiveShadow />
      <mesh geometry={getAtmosphereGeometry()} material={atmosphereMaterial} scale={1.25} />
      
      {/* Subtle halo glow */}
      <mesh geometry={getPlanetGeometry()} scale={1.12}>
        <meshBasicMaterial
          color={colors.emissive}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Local fill light */}
      <pointLight color={colors.emissive} intensity={0.9} distance={6} decay={2} />
    </group>
  );
});