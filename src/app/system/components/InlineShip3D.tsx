'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ShipShape } from './Ship3D';

interface InlineShip3DProps {
  color: string;
  shape: ShipShape | string;
  isHovered?: boolean;
}

function ShipModel({ color, shape, isHovered }: InlineShip3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef<THREE.Euler>(new THREE.Euler(0.3, 0, 0));
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (isHovered) {
        // Spin when hovered to show off the 3D model
        targetRotation.current.y += delta * 2;
        targetRotation.current.z = Math.sin(state.clock.elapsedTime * 8) * 0.1;
        targetRotation.current.x = THREE.MathUtils.lerp(targetRotation.current.x, 0.5, delta * 5);
      } else {
        // Return to standard display angle
        targetRotation.current.y = THREE.MathUtils.lerp(targetRotation.current.y, 0, delta * 3);
        targetRotation.current.z = THREE.MathUtils.lerp(targetRotation.current.z, 0, delta * 3);
        targetRotation.current.x = THREE.MathUtils.lerp(targetRotation.current.x, 0.3, delta * 3);
      }
      
      groupRef.current.rotation.x = targetRotation.current.x;
      groupRef.current.rotation.y = targetRotation.current.y;
      groupRef.current.rotation.z = targetRotation.current.z;
    }
  });

  // Premium PBR Materials (Memoized to prevent R3F crashes)
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1c29', metalness: 0.9, roughness: 0.1, envMapIntensity: 2 }), []);
  const secondaryMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0d0f18', metalness: 0.7, roughness: 0.4 }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: color, toneMapped: false }), [color]);
  
  // Render specific geometries based on ship shape to showcase variety
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
            {/* Energy Core */}
            <mesh position={[0, 0, -2.5]} material={glowMat}>
              <sphereGeometry args={[0.3]} />
            </mesh>
          </group>
        );
      case 'uix': // WEB - Agile Delta
        return (
          <group>
            {/* Chassis */}
            <mesh rotation={[Math.PI/2, 0, 0]} scale={[1, 1.5, 0.2]} material={bodyMat}>
              <cylinderGeometry args={[0, 1.5, 3, 3]} />
            </mesh>
            {/* Cockpit */}
            <mesh position={[0, 0.2, 0.5]} scale={[0.4, 0.3, 1]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#000" metalness={1} roughness={0} />
            </mesh>
            {/* Wing Thrusters */}
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
            {/* Quantum Cores */}
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
            {/* Data Banks */}
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
          <group>
            <mesh material={bodyMat}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} scale={isHovered ? 1.2 : 1}>
      {renderGeometry()}
      {/* Engine Exhaust Glow */}
      <mesh position={[0, 0, -2.5]}>
        <sphereGeometry args={[isHovered ? 0.6 : 0.2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isHovered ? 0.8 : 0.3} />
      </mesh>
      
      {/* Particles around the ship */}
      {isHovered && (
        <Sparkles count={50} scale={4} size={4} speed={0.4} color={color} opacity={0.8} />
      )}
    </group>
  );
}

export default function InlineShip3D({ color, shape }: InlineShip3DProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div 
      className="w-full h-full absolute inset-0 z-30 transition-all duration-300"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <Canvas camera={{ position: [0, 3, 7], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color={color} />
        
        <PresentationControls 
          global 
          rotation={[0, 0, 0]} 
          polar={[-0.4, 0.2]} 
          azimuth={[-0.5, 0.5]}
        >
          <Float rotationIntensity={1} floatIntensity={1} speed={2}>
            <ShipModel color={color} shape={shape} isHovered={hovered} />
          </Float>
        </PresentationControls>
        
        {/* Environment reflection for metals */}
        <Environment preset="city" />
        
        {/* Soft shadow underneath */}
        <ContactShadows position={[0, -2, 0]} opacity={hovered ? 0.8 : 0.4} scale={10} blur={2} far={4} color={color} />
      </Canvas>
    </div>
  );
}
