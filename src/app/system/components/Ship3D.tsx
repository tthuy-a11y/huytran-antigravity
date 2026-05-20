'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Trail, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';

export type ShipShape = 'sleek' | 'agile' | 'heavy' | 'command' | 'carrier' | 'stealth';

interface Ship3DProps {
  id: number;
  shape: ShipShape;
  color: string;
  position: [number, number, number];
  isActive: boolean;
  isRushing: boolean;
  isWarping: boolean;
  shipName: string;
  code: string;
  onClick: (id: number) => void;
  onHover: (id: number, state: boolean) => void;
}

export default function Ship3D({
  id,
  shape,
  color,
  position,
  isActive,
  isRushing,
  isWarping,
  shipName,
  code,
  onClick,
  onHover,
}: Ship3DProps) {
  const groupRef = useRef<Group>(null);
  const engineRef = useRef<THREE.PointLight>(null);
  // Deterministic offset per ship id — keeps motion varied without impure render
  const floatOffset = useMemo(() => ((id * 2654435761) >>> 0) / 4294967296 * 100, [id]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (isRushing) {
      groupRef.current.position.z -= 80 * delta;
      groupRef.current.rotation.z += 8 * delta;
      if (engineRef.current) engineRef.current.intensity = 8;
    } else if (isActive) {
      const targetZ = isWarping ? 15 : 10;
      groupRef.current.position.lerp(new THREE.Vector3(0, -1, targetZ), delta * 4);
      groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0.2, delta * 3);
      groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, t * 0.5, delta * 2);
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 3);
      if (engineRef.current) engineRef.current.intensity = 4;
    } else {
      const targetZ = isWarping ? position[2] - 50 : position[2];
      groupRef.current.position.lerp(
        new THREE.Vector3(position[0], position[1] + Math.sin(t * 1.5 + floatOffset) * 0.5, targetZ),
        delta * 2
      );
      groupRef.current.rotation.x = MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(t * 0.8 + floatOffset) * 0.05,
        delta * 2
      );
      groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2);
      groupRef.current.rotation.z = MathUtils.lerp(
        groupRef.current.rotation.z,
        Math.sin(t + floatOffset) * 0.1,
        delta * 2
      );
      if (engineRef.current) {
        engineRef.current.intensity = isWarping ? 10 : 1.5 + Math.sin(t * 5 + floatOffset) * 0.5;
      }
    }
  });

  const renderHull = () => {
    const hullMat = <meshStandardMaterial color="#0b0f19" metalness={0.9} roughness={0.2} />;
    switch (shape) {
      case 'sleek':
        return (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0, 1.2, 5, 4]} />
              {hullMat}
            </mesh>
            <mesh position={[0, -0.2, -1.5]} scale={[3, 0.1, 1.5]}>
              <boxGeometry />
              {hullMat}
            </mesh>
          </group>
        );
      case 'agile':
        return (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[1.5, 4, 3]} />
              {hullMat}
            </mesh>
            <mesh position={[0, 0, -1]} scale={[4, 0.1, 1]}>
              <boxGeometry />
              {hullMat}
            </mesh>
          </group>
        );
      case 'heavy':
        return (
          <group>
            <mesh>
              <boxGeometry args={[2, 1.5, 4]} />
              {hullMat}
            </mesh>
            <mesh position={[-1.5, 0, -1]}>
              <boxGeometry args={[1, 1, 3]} />
              {hullMat}
            </mesh>
            <mesh position={[1.5, 0, -1]}>
              <boxGeometry args={[1, 1, 3]} />
              {hullMat}
            </mesh>
          </group>
        );
      case 'command':
        return (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <octahedronGeometry args={[2, 0]} />
              {hullMat}
            </mesh>
            <mesh position={[0, 0, -1.5]} scale={[4, 0.2, 1]}>
              <boxGeometry />
              {hullMat}
            </mesh>
          </group>
        );
      case 'carrier':
        return (
          <group>
            <mesh>
              <boxGeometry args={[4, 1.2, 5]} />
              {hullMat}
            </mesh>
            <mesh position={[0, 1, -1]}>
              <boxGeometry args={[1.5, 1, 2]} />
              {hullMat}
            </mesh>
          </group>
        );
      case 'stealth':
        return (
          <group>
            <mesh>
              <boxGeometry args={[3, 0.2, 3]} />
              {hullMat}
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[1, 0.2, 2]} />
              {hullMat}
            </mesh>
          </group>
        );
      default:
        return (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1, 4, 4]} />
            {hullMat}
          </mesh>
        );
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHover(id, true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        onHover(id, false);
      }}
    >
      <group>
        {renderHull()}
        <mesh scale={1.05}>
          {renderHull()}
          <meshBasicMaterial color={color} wireframe transparent opacity={isActive ? 0.6 : 0.15} />
        </mesh>
      </group>

      <group position={[0, 0, -2.5]}>
        <pointLight ref={engineRef} color={color} intensity={2} distance={20} />
        <Trail
          width={isWarping ? 3 : isActive ? 1.5 : 0.5}
          length={isWarping || isRushing ? 30 : 8}
          color={new THREE.Color(color)}
          attenuation={(t) => t * t}
        >
          <mesh>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial opacity={0} transparent />
          </mesh>
        </Trail>
      </group>

      {!isActive && !isRushing && (
        <Html center position={[0, -2, 0]} zIndexRange={[100, 0]} className="pointer-events-none">
          <div className="flex flex-col items-center">
            <span
              className="font-black text-white uppercase tracking-widest text-sm drop-shadow-md whitespace-nowrap"
              style={{ textShadow: `0 0 10px ${color}` }}
            >
              {shipName}
            </span>
            <span
              className="text-[10px] font-mono mt-1 px-3 py-0.5 rounded-full border border-white/20 bg-black/60 whitespace-nowrap"
              style={{ color, boxShadow: `0 0 8px ${color}40` }}
            >
              {code}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
