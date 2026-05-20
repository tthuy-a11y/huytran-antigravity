'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';

export type ShipShape = 'nexus' | 'uix' | 'prmpt' | 'phys' | 'cloud' | 'shield' | string;

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
  onClick,
  onHover,
}: Ship3DProps) {
  const groupRef = useRef<Group>(null);
  const engineRef = useRef<THREE.PointLight>(null);
  
  // Deterministic offset per ship id
  const floatOffset = useMemo(() => ((id * 2654435761) >>> 0) / 4294967296 * 100, [id]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const delta = Math.min(dt, 0.05); // Cap delta to prevent huge jumps if tab is inactive

    if (isRushing) {
      groupRef.current.position.z -= 100 * delta;
      groupRef.current.rotation.z += 10 * delta;
      if (engineRef.current) engineRef.current.intensity = 8;
    } else if (isActive) {
      const targetZ = isWarping ? 15 : 10;
      groupRef.current.position.lerp(new THREE.Vector3(0, -1, targetZ), delta * 5);
      groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0.2, delta * 4);
      groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, t * 0.5, delta * 3);
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 4);
      if (engineRef.current) engineRef.current.intensity = 4;
    } else {
      const targetZ = isWarping ? position[2] - 50 : position[2];
      groupRef.current.position.lerp(
        new THREE.Vector3(position[0], position[1] + Math.sin(t * 1.5 + floatOffset) * 0.6, targetZ),
        delta * 3
      );
      groupRef.current.rotation.x = MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(t * 0.8 + floatOffset) * 0.08,
        delta * 3
      );
      groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 3);
      groupRef.current.rotation.z = MathUtils.lerp(
        groupRef.current.rotation.z,
        Math.sin(t + floatOffset) * 0.12,
        delta * 3
      );
      if (engineRef.current) {
        engineRef.current.intensity = isWarping ? 10 : 1.5 + Math.sin(t * 5 + floatOffset) * 0.5;
      }
    }
  });

  // Premium PBR Materials (Memoized)
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1c29', metalness: 0.9, roughness: 0.1, envMapIntensity: 2 }), []);
  const secondaryMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0d0f18', metalness: 0.7, roughness: 0.4 }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: color, toneMapped: false }), [color]);

  const renderGeometry = () => {
    switch(shape) {
      case 'nexus': // AI - Sleek Arrow
        return (
          <group>
            <mesh scale={[1, 0.2, 3]} material={bodyMat}>
              <coneGeometry args={[1, 2, 4]} />
            </mesh>
            <mesh position={[0, 0.1, -0.5]} scale={[0.5, 0.2, 1.5]} material={glowMat}>
              <boxGeometry />
            </mesh>
            <mesh position={[0, 0, -2.5]} material={glowMat}>
              <sphereGeometry args={[0.3]} />
            </mesh>
          </group>
        );
      case 'uix': // WEB - Agile Delta
        return (
          <group>
            <mesh rotation={[Math.PI/2, 0, 0]} scale={[1, 1.5, 0.2]} material={bodyMat}>
              <cylinderGeometry args={[0, 1.5, 3, 3]} />
            </mesh>
            <mesh position={[0, 0.2, 0.5]} scale={[0.4, 0.3, 1]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#000" metalness={1} roughness={0} />
            </mesh>
            <mesh position={[-1, 0, -1.2]} material={glowMat}>
              <boxGeometry args={[0.2, 0.2, 0.5]} />
            </mesh>
            <mesh position={[1, 0, -1.2]} material={glowMat}>
              <boxGeometry args={[0.2, 0.2, 0.5]} />
            </mesh>
          </group>
        );
      case 'prmpt': // PROMPT - Command Hex
        return (
          <group>
            <mesh rotation={[Math.PI/2, 0, 0]} scale={[1.2, 1, 0.3]} material={bodyMat}>
              <cylinderGeometry args={[1, 1.2, 4, 6]} />
            </mesh>
            <mesh position={[0, 0, -2]} rotation={[Math.PI/2, 0, 0]} material={secondaryMat}>
              <cylinderGeometry args={[0.6, 0.8, 1, 6]} />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]} material={glowMat}>
              <torusGeometry args={[0.5, 0.05, 8, 24]} />
            </mesh>
          </group>
        );
      case 'phys': // PHYSICS - Heavy Block
        return (
          <group>
            <mesh scale={[2, 0.8, 2.5]} material={bodyMat}>
              <boxGeometry />
            </mesh>
            <mesh position={[0, 0.6, 0.5]} scale={[1, 0.4, 1.5]} material={secondaryMat}>
              <boxGeometry />
            </mesh>
            <mesh position={[-0.8, 0.2, -0.5]} material={glowMat}>
              <sphereGeometry args={[0.3]} />
            </mesh>
            <mesh position={[0.8, 0.2, -0.5]} material={glowMat}>
              <sphereGeometry args={[0.3]} />
            </mesh>
          </group>
        );
      case 'cloud': // DATA - Carrier
        return (
          <group>
            <mesh scale={[2.5, 0.5, 3]} material={secondaryMat}>
              <boxGeometry />
            </mesh>
            {[-1, 0, 1].map((x, i) => (
              <mesh key={i} position={[x, 0.3, 0]} scale={[0.2, 0.2, 2]} material={glowMat}>
                <boxGeometry />
              </mesh>
            ))}
            <mesh position={[0, -0.4, 0]} scale={[1.5, 0.3, 2.5]} material={bodyMat}>
              <boxGeometry />
            </mesh>
          </group>
        );
      case 'shield': // SECURITY - Shield Cross
        return (
          <group>
            <mesh rotation={[Math.PI/2, 0, 0]} scale={[1, 1, 0.2]} material={bodyMat}>
              <octahedronGeometry args={[2]} />
            </mesh>
            <mesh rotation={[Math.PI/2, 0, Math.PI/4]} scale={[1, 1, 0.25]} material={secondaryMat}>
              <octahedronGeometry args={[1.5]} />
            </mesh>
            <mesh position={[0, 0.1, 0]} material={glowMat}>
              <octahedronGeometry args={[0.5]} />
            </mesh>
          </group>
        );
      default:
        return (
          <mesh material={bodyMat}>
            <boxGeometry args={[2, 1, 3]} />
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
      scale={isActive ? 1.5 : 1}
    >
      {/* Ship detailed hull */}
      {renderGeometry()}

      {/* Engine and Trail */}
      <group position={[0, 0, -2.5]}>
        <pointLight ref={engineRef} color={color} intensity={2} distance={20} />
        
        <mesh>
          <sphereGeometry args={[isActive ? 0.6 : 0.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={isActive ? 0.8 : 0.3} />
        </mesh>

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
    </group>
  );
}
