"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import Sun from "./Sun";
import PlanetSystem from "./PlanetSystem";
import Environment from "./Environment";
import AsteroidBelt from "./AsteroidBelt";
import PostProcessing from "./PostProcessing";
import HologramModal from "./HologramModal";

export default function SceneCanvas() {
  return (
    <>
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "#02030a",
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 18, 45]} fov={55} />

        <Suspense fallback={null}>
          <Environment />
          <Sun />
          <PlanetSystem />
          <AsteroidBelt count={250} innerRadius={20.5} outerRadius={22} />
          <PostProcessing />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={15}
          maxDistance={90}
          autoRotate
          autoRotateSpeed={0.25}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
        />
      </Canvas>
      <HologramModal />
    </>
  );
}
