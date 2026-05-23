'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

// -------------------------------------------------------------
// SHIP SHAPES DEFINITIONS
// -------------------------------------------------------------
interface ShipModelProps {
  shape: 'nexus' | 'uix' | 'prmpt' | 'phys' | 'cloud' | 'shield';
  color: string;
  bodyMat: THREE.MeshStandardMaterial;
  secondaryMat: THREE.MeshStandardMaterial;
  glowMat: THREE.MeshBasicMaterial;
}

const ShipModel = React.memo(function ShipModel({
  shape,
  bodyMat,
  secondaryMat,
  glowMat
}: ShipModelProps) {
  switch (shape) {
    case 'nexus': // AI - Sleek Arrow
      return (
        <group scale={0.42}>
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
        <group scale={0.42}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.5, 0.2]} material={bodyMat}>
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
        <group scale={0.42}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1, 0.3]} material={bodyMat}>
            <cylinderGeometry args={[1, 1.2, 4, 6]} />
          </mesh>
          <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]} material={secondaryMat}>
            <cylinderGeometry args={[0.6, 0.8, 1, 6]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={glowMat}>
            <torusGeometry args={[0.5, 0.05, 8, 24]} />
          </mesh>
        </group>
      );

    case 'phys': // PHYSICS - Heavy Block
      return (
        <group scale={0.42}>
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
        <group scale={0.42}>
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
        <group scale={0.42}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.2]} material={bodyMat}>
            <octahedronGeometry args={[2]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]} scale={[1, 1, 0.25]} material={secondaryMat}>
            <octahedronGeometry args={[1.5]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={glowMat}>
            <octahedronGeometry args={[0.5]} />
          </mesh>
        </group>
      );
  }
});

// -------------------------------------------------------------
// SINGLE WINGMAN SHIP
// -------------------------------------------------------------
interface WingmanShipProps {
  shape: 'nexus' | 'uix' | 'prmpt' | 'phys' | 'cloud' | 'shield';
  color: string;
  index: number;
}

const WingmanShip = React.memo(function WingmanShip({ shape, color, index }: WingmanShipProps) {
  const shipRef = useRef<THREE.Group>(null);
  
  // Premium materials
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#161722', metalness: 0.92, roughness: 0.08 }), []);
  const secondaryMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#090a12', metalness: 0.75, roughness: 0.35 }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: color, toneMapped: false }), [color]);

  // Keep references to clean up
  useEffect(() => {
    return () => {
      bodyMat.dispose();
      secondaryMat.dispose();
      glowMat.dispose();
    };
  }, [bodyMat, secondaryMat, glowMat]);

  return (
    <group ref={shipRef}>
      {/* Ship detailed hull */}
      <ShipModel 
        shape={shape} 
        color={color} 
        bodyMat={bodyMat} 
        secondaryMat={secondaryMat} 
        glowMat={glowMat} 
      />

      {/* Engine Exhaust & Spectrum Trail */}
      <group position={[0, 0, -1.05]}>
        <pointLight color={color} intensity={1.8} distance={6} />
        
        <mesh>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>

        <Trail
          width={0.4}
          length={12}
          color={new THREE.Color(color)}
          attenuation={(t) => t * t}
        >
          <mesh>
            <sphereGeometry args={[0.04]} />
            <meshBasicMaterial opacity={0} transparent />
          </mesh>
        </Trail>
      </group>
    </group>
  );
});

// -------------------------------------------------------------
// SPACESHIP SQUADRON (MAIN SYSTEM CONTROLLER)
// -------------------------------------------------------------
export function SpaceshipSquadron() {
  const groupRef = useRef<THREE.Group>(null);

  // 1. Create a looping Catmull-Rom 3D Spline weaving around orbits (r = 9 to 28)
  const flightCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(32, 2, 0),
      new THREE.Vector3(22, -4, 22),
      new THREE.Vector3(0, 5, 28),
      new THREE.Vector3(-20, -1, 20),
      new THREE.Vector3(-30, 4, 0),
      new THREE.Vector3(-18, -5, -18),
      new THREE.Vector3(0, 3, -28),
      new THREE.Vector3(20, -3, -20)
    ], true); // true = closed loop
  }, []);

  // 2. Ships config (V-Formation wings)
  const shipsConfig = useMemo(() => [
    { id: 'nexus-01', shape: 'nexus' as const, color: '#00f2fe', wingOffset: 0.0, spacing: 0.0, height: 0.0 }, // Leader Center
    { id: 'uix-99',   shape: 'uix' as const,   color: '#b026ff', wingOffset: -0.012, spacing: -1.8, height: 0.15 }, // Left wing 1
    { id: 'prmpt-x',  shape: 'prmpt' as const, color: '#ff0844', wingOffset: -0.012, spacing: 1.8, height: 0.15 },  // Right wing 1
    { id: 'phys-42',  shape: 'phys' as const,  color: '#00ff87', wingOffset: -0.024, spacing: -3.5, height: 0.3 },  // Left wing outer 2
    { id: 'cloud-7',  shape: 'cloud' as const, color: '#f5a623', wingOffset: -0.024, spacing: 3.5, height: 0.3 },   // Right wing outer 2
    { id: 'shield-x', shape: 'shield' as const, color: '#ff007f', wingOffset: -0.035, spacing: 0.0, height: -0.4 }  // Tail center rear
  ], []);

  // Vectors and Matrices pre-allocated to avoid garbage collection overhead in requestAnimationFrame
  const currentPos = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const nextTangent = useMemo(() => new THREE.Vector3(), []);
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const rightVec = useMemo(() => new THREE.Vector3(), []);
  const computedUp = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const deltaT = useMemo(() => new THREE.Vector3(), []);
  const negatedTangent = useMemo(() => new THREE.Vector3(), []);
  const rotMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Keep track of current banking (smooth roll interpolation)
  const currentRolls = useRef<number[]>([0, 0, 0, 0, 0, 0]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Flight progress time variable
    const t = (state.clock.elapsedTime * 0.022) % 1.0; 
    const dt = 0.002; // lookahead distance for tangent derivative calculation

    // Update each ship in formation
    const children = groupRef.current.children;
    shipsConfig.forEach((config, idx) => {
      const shipGroup = children[idx] as THREE.Group;
      if (!shipGroup) return;

      // Coordinate shift for wing formation on loop
      let localT = (t + config.wingOffset) % 1.0;
      if (localT < 0) localT += 1.0; // wrap negative loop bounds

      // A. Get central path coordinates and direction tangent
      flightCurve.getPointAt(localT, currentPos);
      flightCurve.getTangentAt(localT, tangent);
      
      // Calculate next tangent for curving calculation
      const nextT = (localT + dt) % 1.0;
      flightCurve.getTangentAt(nextT, nextTangent);

      // B. Compute exact Frenet-Serret reference vectors
      rightVec.crossVectors(tangent, upVec).normalize();
      computedUp.crossVectors(rightVec, tangent).normalize();

      // C. Apply relative formation spacing offsets
      targetPos.copy(currentPos);
      // Lateral shift
      targetPos.addScaledVector(rightVec, config.spacing);
      // Elevation shift
      targetPos.addScaledVector(computedUp, config.height);

      shipGroup.position.copy(targetPos);

      // D. Compute Aeronautic Banking (Roll) physics into curves
      deltaT.subVectors(nextTangent, tangent);
      const turnAmount = deltaT.dot(rightVec);
      const desiredRoll = -turnAmount * 280.0; // scale factor of banking roll

      // Smooth roll dampening
      currentRolls.current[idx] = THREE.MathUtils.lerp(currentRolls.current[idx], desiredRoll, delta * 4.5);

      // E. Update Rotations
      // Look-at rotation matrix to align ship with flight tangent vector (GC-safe reuse)
      negatedTangent.copy(tangent).negate();
      rotMatrix.makeBasis(rightVec, computedUp, negatedTangent);
      shipGroup.rotation.setFromRotationMatrix(rotMatrix);

      // Add lateral bank roll to local rotation
      shipGroup.rotateZ(currentRolls.current[idx]);

      // F. Subtle engine vibrations
      const vibr = Math.sin(state.clock.elapsedTime * 12 + idx) * 0.012;
      shipGroup.position.y += vibr;
    });
  });

  return (
    <group>
      {/* Holographic Radar Flight Path */}
      <SquadronFlightPath curve={flightCurve} />

      {/* Actual Ships Group */}
      <group ref={groupRef}>
        {shipsConfig.map((config, idx) => (
          <WingmanShip 
            key={config.id} 
            shape={config.shape} 
            color={config.color} 
            index={idx} 
          />
        ))}
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// HOLOGRAPHIC RADAR FLIGHT PATH
// -------------------------------------------------------------
interface SquadronFlightPathProps {
  curve: THREE.CatmullRomCurve3;
}

const SquadronFlightPath = React.memo(function SquadronFlightPath({ curve }: SquadronFlightPathProps) {
  const points = useMemo(() => curve.getPoints(120), [curve]);
  
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: '#00f2fe',
      dashSize: 1.0,
      gapSize: 0.6,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    return line;
  }, [points]);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
});
