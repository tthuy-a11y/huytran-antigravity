'use client';

import React, { useRef, useEffect, useState, Component, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Ship3D, { type ShipShape } from './Ship3D';
import { SpaceStationDock } from '@/components/canvas/SpaceStationDock';

// ErrorBoundary prevents R3F errors from crashing the app
class R3FErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[FleetSystem3D ErrorBoundary]', error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export interface FleetShipData {
  id: number;
  shape: ShipShape;
  hex: string;
  shipName: string;
  code: string;
}

interface FleetSystem3DProps {
  fleet: FleetShipData[];
  activeShip: number | null;
  rushingShipId: number | null;
  warpSpeed: boolean;
  onEngage: (id: number) => void;
  playSfx?: (type: string) => void;
}

function CameraRig({ activeShipId, warpSpeed }: { activeShipId: number | null; warpSpeed: boolean }) {
  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const pointerX = state.pointer.x * 6;
    const pointerY = state.pointer.y * 6 + 2;
    const delta = Math.min(dt, 0.05); // Cap to avoid jarring jumps

    if (warpSpeed) {
      cam.position.lerp(
        new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5 + 4, 25),
        delta * 6
      );
      cam.fov = THREE.MathUtils.lerp(cam.fov, 100, delta * 5);
    } else if (activeShipId !== null) {
      cam.position.lerp(new THREE.Vector3(0, 2, 22), delta * 4);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 60, delta * 4);
    } else {
      cam.position.lerp(new THREE.Vector3(pointerX, pointerY, 30), delta * 3);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 50, delta * 3);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(0, 0, 0);
  });
  return null;
}

// Module-level pre-computed warp tunnel bars
const WARP_TUNNEL_BARS = Array.from({ length: 150 }, () => ({
  x: (Math.random() - 0.5) * 80,
  y: (Math.random() - 0.5) * 80,
  z: -Math.random() * 600,
  len: Math.random() * 60 + 20,
}));

function WarpTunnel({ isWarping }: { isWarping: boolean }) {
  const tunnelRef = useRef<THREE.Group>(null);
  const bars = WARP_TUNNEL_BARS;

  useFrame((_, delta) => {
    if (!tunnelRef.current || !isWarping) return;
    tunnelRef.current.position.z += delta * 300;
    if (tunnelRef.current.position.z > 200) tunnelRef.current.position.z = -200;
  });

  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.2, 0.2, 1), []);
  const boxMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#00f2fe', transparent: true, opacity: 0.6 }), []);

  return (
    <group ref={tunnelRef} visible={isWarping}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} scale={[1, 1, b.len]} geometry={boxGeo} material={boxMat} />
      ))}
    </group>
  );
}

// ==========================================
// THIÊN THẠCH TRÔI (ASTEROIDS)
// ==========================================
const ASTEROID_DATA = Array.from({ length: 40 }, () => ({
  x: (Math.random() - 0.5) * 80,
  y: (Math.random() - 0.5) * 40,
  z: (Math.random() - 0.5) * 60 - 10,
  scale: Math.random() * 0.4 + 0.1,
  rx: Math.random() * Math.PI,
  ry: Math.random() * Math.PI,
  speed: Math.random() * 0.2 + 0.05,
}));

function AsteroidField({ isWarping }: { isWarping: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current || isWarping) return;
    groupRef.current.children.forEach((mesh: any, i) => {
      mesh.rotation.x += ASTEROID_DATA[i].speed * delta;
      mesh.rotation.y += ASTEROID_DATA[i].speed * delta;
      mesh.position.y += Math.sin(Date.now() * 0.001 + i) * 0.005;
    });
  });
  const astGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const astMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111522', roughness: 0.9, metalness: 0.1 }), []);

  return (
    <group ref={groupRef} visible={!isWarping}>
      {ASTEROID_DATA.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]} rotation={[a.rx, a.ry, 0]} scale={a.scale} geometry={astGeo} material={astMat} />
      ))}
    </group>
  );
}

// ==========================================
// PHI THUYỀN TUẦN TRA (FIGHTERS)
// ==========================================
const FIGHTER_DATA = Array.from({ length: 15 }, () => ({
  x: (Math.random() - 0.5) * 60,
  y: (Math.random() - 0.5) * 20,
  z: (Math.random() - 0.5) * 40 - 20,
  speed: Math.random() * 5 + 2,
  offset: Math.random() * Math.PI * 2,
}));

function FighterSwarm({ isWarping }: { isWarping: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!groupRef.current || isWarping) return;
    const time = state.clock.elapsedTime;
    groupRef.current.children.forEach((mesh: any, i) => {
      const data = FIGHTER_DATA[i];
      mesh.position.x = data.x + Math.sin(time * 0.5 + data.offset) * 15;
      mesh.position.z = data.z + Math.cos(time * 0.5 + data.offset) * 15;
      mesh.rotation.y = time * 0.5 + data.offset;
      mesh.position.y = data.y + Math.sin(time * 2 + i) * 2;
    });
  });

  const fighterGeo = useMemo(() => new THREE.ConeGeometry(1, 3, 3), []);
  const fighterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333', emissive: '#00f2fe', emissiveIntensity: 0.2 }), []);
  const engineGeo = useMemo(() => new THREE.BoxGeometry(0.2, 0.2, 1.5), []);
  const engineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#00f2fe' }), []);

  return (
    <group ref={groupRef} visible={!isWarping}>
      {FIGHTER_DATA.map((f, i) => (
        <group key={i} position={[f.x, f.y, f.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={0.3} geometry={fighterGeo} material={fighterMat} />
          <mesh position={[0, 0, -0.6]} geometry={engineGeo} material={engineMat} />
        </group>
      ))}
    </group>
  );
}

export default function FleetSystem3D({
  fleet,
  activeShip,
  rushingShipId,
  warpSpeed,
  onEngage,
  playSfx,
}: FleetSystem3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0">
      <R3FErrorBoundary>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
          style={{ background: 'transparent' }}
        >
          <PerspectiveCamera makeDefault position={[0, 2, 30]} fov={50} />
          <CameraRig activeShipId={activeShip} warpSpeed={warpSpeed} />

          {/* Transparent background — Canvas 2D blackhole shows through */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -20, -10]} intensity={0.8} color="#00f2fe" />

          <Stars
            radius={150}
            depth={50}
            count={warpSpeed ? 4000 : 1500}
            factor={4}
            fade
            speed={warpSpeed ? 15 : 1}
          />
          <WarpTunnel isWarping={warpSpeed} />

          {/* BACKGROUND ENVIRONMENT SCENE */}
          <group position={[0, 0, -15]} scale={1.5}>
            <SpaceStationDock />
          </group>
          <AsteroidField isWarping={warpSpeed} />
          <FighterSwarm isWarping={warpSpeed} />

          {/* MAIN FLEET */}
          <group position={[0, -2, 0]}>
            {fleet.map((ship, idx) => {
              const row = Math.floor(idx / 2);
              const isLeft = idx % 2 === 0;
              const x = (isLeft ? -1 : 1) * (row * 6 + 5);
              const y = Math.sin(idx) * 2;
              const z = -row * 10;

              const isActive = activeShip === ship.id;
              const isRushing = rushingShipId === ship.id;
              const isHidden = activeShip !== null && !isActive && !isRushing;

              if (isHidden && !warpSpeed) return null;

              return (
                <Ship3D
                  key={ship.id}
                  id={ship.id}
                  shape={ship.shape}
                  color={ship.hex}
                  position={[x, y, z]}
                  isActive={isActive}
                  isRushing={isRushing}
                  isWarping={warpSpeed}
                  shipName={ship.shipName}
                  code={ship.code}
                  onClick={onEngage}
                  onHover={(hoveredId, state) => {
                    if (state && activeShip === null && rushingShipId === null) {
                      playSfx?.(`hover`);
                      document.body.style.cursor = 'crosshair';
                    } else {
                      document.body.style.cursor = 'auto';
                    }
                  }}
                />
              );
            })}
          </group>
        </Canvas>
      </R3FErrorBoundary>
    </div>
  );
}
