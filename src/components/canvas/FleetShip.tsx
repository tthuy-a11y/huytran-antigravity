'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useFleetStore } from '@/store/useFleetStore';

export const FleetShip = () => {
  const shipRef = useRef<THREE.Group>(null);
  const phase = useFleetStore((state) => state.flightPhase);
  const currentShip = useFleetStore((state) => state.currentShip);

  useFrame((state, delta) => {
    if (!shipRef.current) return;
    const s = shipRef.current;

    if (phase === 'power-up') {
      s.position.x = (Math.random() - 0.5) * 0.15;
      s.position.y = (Math.random() - 0.5) * 0.15;
      s.position.z = THREE.MathUtils.lerp(s.position.z, 3.2, delta * 3.5);
    } else if (phase === 'warping') {
      s.position.z -= 135 * delta;
      s.rotation.z -= 19 * delta;
    } else if (phase === 'arrival') {
      s.position.z = THREE.MathUtils.lerp(s.position.z, 0, delta * 4.5);
      s.rotation.z = THREE.MathUtils.lerp(s.rotation.z, 0, delta * 3.5);
    } else {
      s.position.z = THREE.MathUtils.lerp(s.position.z, 12, delta * 2.5);
    }
  });

  if (!currentShip && phase === 'idle') return null;

  const neonColor =
    currentShip === 'NEXUS-01' ? '#00ffff' :
    currentShip === 'UIX-99'   ? '#ff00ff' :
    '#00ffaa';

  return (
    <group ref={shipRef} position={[0, -0.5, 9]}>
      <Trail
        width={1.9}
        length={phase === 'warping' ? 34 : 8}
        color={new THREE.Color(neonColor)}
        attenuation={(t) => t * t * t}
      >
        <mesh position={[0, 0, 1.7]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial
            color={neonColor}
            emissive={neonColor}
            emissiveIntensity={14}
            toneMapped={false}
          />
        </mesh>
      </Trail>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.88, 3.5, 4]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.96}
          roughness={0.06}
          wireframe={phase === 'power-up'}
          emissive={phase === 'power-up' ? neonColor : '#222222'}
          emissiveIntensity={0.45}
        />
      </mesh>

      <mesh position={[0, -0.28, 0.75]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.07, 3.1, 1.25]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.32} />
      </mesh>
    </group>
  );
};
