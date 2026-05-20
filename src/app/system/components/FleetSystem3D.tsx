'use client';

import React, { useRef, useEffect, useState, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Ship3D, { type ShipShape } from './Ship3D';

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
  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const pointerX = state.pointer.x * 6;
    const pointerY = state.pointer.y * 6 + 2;

    if (warpSpeed) {
      cam.position.lerp(
        new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5 + 4, 25),
        delta * 5
      );
      cam.fov = THREE.MathUtils.lerp(cam.fov, 100, delta * 4);
    } else if (activeShipId !== null) {
      cam.position.lerp(new THREE.Vector3(0, 2, 22), delta * 3);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 60, delta * 3);
    } else {
      cam.position.lerp(new THREE.Vector3(pointerX, pointerY, 30), delta * 2);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 50, delta * 2);
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

  return (
    <group ref={tunnelRef} visible={isWarping}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <boxGeometry args={[0.2, 0.2, b.len]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </mesh>
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
