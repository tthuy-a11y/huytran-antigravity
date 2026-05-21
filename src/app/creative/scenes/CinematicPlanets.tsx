'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCinematicStore, smoothstep, fadeWindow } from '@/app/creative/lib/cinematicStore';
import { PLANETS } from '@/lib/planets-data';
import { Sun } from '@/app/creative/components/3d/PlanetNode';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';

// ============================================================
// SHARED GEOMETRIES — cached once, reused across all instances
// ============================================================
const PLANET_SPHERE = new THREE.SphereGeometry(1, 32, 32);
const ATMOSPHERE_SPHERE = new THREE.SphereGeometry(1, 24, 24);

// ============================================================
// ATMOSPHERE FRESNEL SHADER — beautiful rim-glow
// ============================================================
const makeAtmosphereMaterial = (color: THREE.Color) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uPower: { value: 2.8 },
      uIntensity: { value: 0.9 },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
        float glow = fresnel * uIntensity;
        gl_FragColor = vec4(uColor * glow, glow * uOpacity);
      }
    `,
  });

// ============================================================
// CINEMATIC PLANET NODE
// ============================================================
interface CinematicPlanetNodeProps {
  data: (typeof PLANETS)[number];
  index: number;
  globalOpacity: number;
}

function CinematicPlanetNode({ data, index, globalOpacity }: CinematicPlanetNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmoRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const elapsedRef = useRef(0);

  const displayRadius = data.radius * 2.8;

  const atmosphereMaterial = useMemo(
    () => makeAtmosphereMaterial(new THREE.Color(data.emissiveColor)),
    [data.emissiveColor],
  );

  useSafeDispose(atmosphereMaterial);

  // Temp vector for distance calculations
  const _pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const t = useCinematicStore.getState().time;
    const g = groupRef.current;
    const mat = matRef.current;
    if (!g) return;

    // Accumulate elapsed for orbit animation
    if (t >= 0 && t <= 6.5) {
      elapsedRef.current += delta;
    }

    // --- Position on orbit ---
    const initialPhase = (index / PLANETS.length) * Math.PI * 2;
    const angle = initialPhase + elapsedRef.current * data.orbitSpeed * 1.5;
    const x = Math.cos(angle) * data.orbitRadius;
    const z = Math.sin(angle) * data.orbitRadius;
    const y = Math.sin(angle * 1.5) * 1.2;
    g.position.set(x, y, z);

    // --- Self-rotation (spin) ---
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * data.spinSpeed;
      meshRef.current.rotation.x += delta * data.spinSpeed * 0.3;
    }

    // --- Proximity glow: boost when camera is within 15 units ---
    g.getWorldPosition(_pos);
    const distToCam = camera.position.distanceTo(_pos);
    const proximityFactor = smoothstep(25, 5, distToCam); // 0 at 25+, 1 at ≤5

    if (mat) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(0.5, 2.5, proximityFactor) * globalOpacity;
      mat.opacity = globalOpacity;
    }

    // Boost atmosphere when close
    const atmoMat = atmosphereMaterial;
    if (atmoMat.uniforms) {
      atmoMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(0.9, 2.2, proximityFactor);
      atmoMat.uniforms.uOpacity.value = globalOpacity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Planet body */}
      <mesh ref={meshRef} geometry={PLANET_SPHERE} scale={displayRadius}>
        <meshStandardMaterial
          ref={matRef}
          color={data.color}
          emissive={data.emissiveColor}
          emissiveIntensity={0.5}
          roughness={0.45}
          metalness={0.25}
          transparent
          opacity={globalOpacity}
        />
      </mesh>

      {/* Atmosphere fresnel glow */}
      <mesh
        ref={atmoRef}
        geometry={ATMOSPHERE_SPHERE}
        material={atmosphereMaterial}
        scale={displayRadius * 1.22}
      />

      {/* Planet name label */}
      <PlanetNameFlash data={data} parentPosition={groupRef} />
    </group>
  );
}

// ============================================================
// ORBIT RING CINEMATIC — thin glowing ring with camera flash
// ============================================================
interface OrbitRingCinematicProps {
  orbitRadius: number;
  color: string;
  globalOpacity: number;
}

function OrbitRingCinematic({ orbitRadius, color, globalOpacity }: OrbitRingCinematicProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(orbitRadius - 0.04, orbitRadius + 0.04, 128),
    [orbitRadius],
  );

  useSafeDispose(ringGeometry);

  useFrame(() => {
    if (!matRef.current) return;

    // Camera distance to origin (the sun) projected onto the XZ plane
    const camDist = Math.sqrt(
      camera.position.x * camera.position.x + camera.position.z * camera.position.z,
    );
    const ringProximity = Math.abs(camDist - orbitRadius);

    // Flash when camera passes through the orbit ring (within ±3 units)
    const flash = ringProximity < 3 ? smoothstep(3, 0, ringProximity) : 0;
    const baseOpacity = 0.15 + Math.sin(Date.now() * 0.001) * 0.03; // subtle pulse
    matRef.current.opacity = (baseOpacity + flash * 0.7) * globalOpacity;
  });

  return (
    <mesh ref={meshRef} geometry={ringGeometry} rotation-x={-Math.PI / 2}>
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================
// PLANET NAME FLASH — drei Html label, proximity-triggered
// ============================================================
interface PlanetNameFlashProps {
  data: (typeof PLANETS)[number];
  parentPosition: React.RefObject<THREE.Group | null>;
}

function PlanetNameFlash({ data, parentPosition }: PlanetNameFlashProps) {
  const { camera } = useThree();
  const containerRef = useRef<HTMLDivElement>(null);
  const _worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!containerRef.current || !parentPosition.current) return;

    parentPosition.current.getWorldPosition(_worldPos);
    const dist = camera.position.distanceTo(_worldPos);

    // Only visible within 20 units, smooth fade
    const visibility = dist <= 20 ? smoothstep(20, 12, dist) : 0;
    containerRef.current.style.opacity = String(visibility);
  });

  return (
    <Html
      position={[0, data.radius * 2.2 + 1.2, 0]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <div
        ref={containerRef}
        style={{
          opacity: 0,
          transition: 'opacity 0.15s ease-out',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#00FFE5',
          textShadow: '0 0 8px rgba(0, 255, 229, 0.6), 0 0 20px rgba(0, 255, 229, 0.3)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0, 20, 30, 0.45)',
          border: '1px solid rgba(0, 255, 229, 0.2)',
          borderRadius: '4px',
          padding: '4px 10px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {data.name}
        <span
          style={{
            display: 'block',
            fontSize: '8px',
            letterSpacing: '0.2em',
            color: 'rgba(0, 255, 229, 0.5)',
            marginTop: '2px',
          }}
        >
          {data.code}
        </span>
      </div>
    </Html>
  );
}

// ============================================================
// CINEMATIC PLANETS — Scene root (default export)
// ============================================================
export default function CinematicPlanets() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    // Visibility control
    if (groupRef.current) {
      groupRef.current.visible = t >= -0.1 && t <= 6.5;
    }
  });

  // We read time reactively for JSX-level decisions
  const t = useCinematicStore((s) => s.time);
  // Extended fade-out: 2 seconds for smooth transition to cosmic dust / TechGrid
  const opacity = fadeWindow(t, 0, 6.5, 0.05, 2.0);
  const isVisible = t >= -0.1 && t <= 6.5;

  return (
    <group ref={groupRef} visible={isVisible}>
      {/* Central Sun */}
      <Sun position={[0, 0, 0]} scale={3.9} reveal={opacity} intensity={1.25} />

      {/* Planets + Orbit Rings */}
      {PLANETS.map((planet, i) => (
        <group key={planet.id}>
          <CinematicPlanetNode
            data={planet}
            index={i}
            globalOpacity={opacity}
          />
          <OrbitRingCinematic
            orbitRadius={planet.orbitRadius}
            color={planet.color}
            globalOpacity={opacity}
          />
        </group>
      ))}

      {/* Ambient fill — soft blue-white for planet visibility */}
      <ambientLight color="#a0d8ff" intensity={0.4} />

      {/* Dramatic side lighting — brighter for cinematic punch */}
      <pointLight position={[12, 8, 15]} color="#ffffff" intensity={3.0} distance={100} decay={1.5} />
      <pointLight position={[-10, -5, 20]} color="#00ffe5" intensity={1.0} distance={80} decay={2} />
    </group>
  );
}
