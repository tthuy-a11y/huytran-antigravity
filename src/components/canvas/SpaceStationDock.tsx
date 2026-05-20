'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFleetStore } from '@/store/useFleetStore';
import { usePathname } from 'next/navigation';

export const SpaceStationDock = () => {
  const stationRef = useRef<THREE.Group>(null);
  const phase = useFleetStore((state) => state.flightPhase);
  const pathname = usePathname();

  useFrame((_, delta) => {
    if (!stationRef.current) return;
    stationRef.current.rotation.z -= delta * 0.045;

    if (phase === 'power-up') {
      stationRef.current.position.x = (Math.random() - 0.5) * 0.07;
      stationRef.current.position.y = (Math.random() - 0.5) * 0.07;
    } else if (phase === 'warping') {
      stationRef.current.position.z += 95 * delta;
    } else {
      stationRef.current.position.set(0, 0, 0);
    }
  });

  if (pathname !== '/system' || phase === 'arrival') return null;

  const torusGeo = React.useMemo(() => new THREE.TorusGeometry(9.2, 0.16, 8, 48), []);
  const torusMat = React.useMemo(() => new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 1.3, toneMapped: false }), []);
  
  const cylGeo = React.useMemo(() => new THREE.CylinderGeometry(9.8, 9.8, 48, 24, 1, true), []);
  const cylMat = React.useMemo(() => new THREE.MeshStandardMaterial({ color: '#001122', wireframe: true, transparent: true, opacity: 0.38, emissive: '#00aaff', emissiveIntensity: 0.18 }), []);

  return (
    <group ref={stationRef}>
      {[0, -6, -12, -18, -24].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} geometry={torusGeo} material={torusMat} />
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -13]} geometry={cylGeo} material={cylMat} />
    </group>
  );
};
