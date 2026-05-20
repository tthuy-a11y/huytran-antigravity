"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function AsteroidBelt({
  count = 300,
  innerRadius = 20,
  outerRadius = 22,
}: {
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius =
        innerRadius + Math.random() * (outerRadius - innerRadius);
      const y = (Math.random() - 0.5) * 0.6;
      const scale = 0.05 + Math.random() * 0.15;
      const rotSpeed = (Math.random() - 0.5) * 2;
      items.push({ angle, radius, y, scale, rotSpeed });
    }
    return items;
  }, [count, innerRadius, outerRadius]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    data.forEach((d, i) => {
      const angle = d.angle + t * 0.04;
      const x = Math.cos(angle) * d.radius;
      const z = Math.sin(angle) * d.radius;
      dummy.position.set(x, d.y, z);
      dummy.rotation.set(t * d.rotSpeed, t * d.rotSpeed * 0.5, 0);
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#6b6b80"
        roughness={0.95}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
