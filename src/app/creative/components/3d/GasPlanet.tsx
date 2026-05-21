/**
 * GasPlanet.tsx
 *
 * React Three Fiber component render gas giant planet bằng custom shader.
 *
 * Thay thế cho approach cũ (background-image từ Wikipedia CDN):
 *   - Không phụ thuộc external assets
 *   - Animated (storm vortex, band drift)
 *   - Audio-reactive (bass → atmosphere pulse)
 *   - GPU-accelerated, scale tốt
 *
 * Props:
 *   - radius            : kích thước
 *   - position          : Three.js vec3 (default [0,0,0])
 *   - baseColor         : màu chính (e.g. "#d9a366" cho Jupiter)
 *   - accentColor       : màu storm
 *   - bandSharpness     : 0..1 (rõ band)
 *   - segments          : sphere tessellation (32 high, 24 mid, 16 low)
 *   - audioReactive     : có pulse theo bass không
 *
 * Usage:
 *   <GasPlanet
 *     radius={2}
 *     baseColor="#d9a366"
 *     accentColor="#f25e2c"
 *     bandSharpness={0.6}
 *     audioReactive
 *   />
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../lib/audioEngine';
import { useCinematicStore } from '../../lib/cinematicStore';
import { getPlanetGeometry } from '../../lib/geometryCache';

// Import shaders đã convert sang string để tương thích Next.js Turbopack
import { vertexShader, fragmentShader } from '@/app/creative/shaders/gasPlanetShaders';

// NOTE: Nếu `?raw` import không work với Next.js, dùng cách này:
//   - Tạo file shaders/index.ts với `export const gasPlanetFrag = "..."`
//   - Hoặc dùng raw-loader trong next.config.mjs

interface GasPlanetProps {
  radius?: number;
  position?: [number, number, number];
  baseColor?: string;
  accentColor?: string;
  bandSharpness?: number;
  segments?: number;
  audioReactive?: boolean;
  rotationSpeed?: number;
}

export function GasPlanet({
  radius = 2,
  position = [0, 0, 0],
  baseColor = '#d9a366',
  accentColor = '#f25e2c',
  bandSharpness = 0.5,
  segments,
  audioReactive = false,
  rotationSpeed = 0.05,
}: GasPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const deviceTier = useCinematicStore((s) => s.deviceTier);

  // Tier-based tessellation nếu không truyền explicit
  const tessellation = useMemo(() => {
    if (segments !== undefined) return segments;
    return deviceTier === 'high' ? 32 : deviceTier === 'mid' ? 24 : 16;
  }, [segments, deviceTier]);

  // Build uniforms 1 lần — sau đó update qua useFrame
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uAccentColor: { value: new THREE.Color(accentColor) },
      uBandSharp: { value: bandSharpness },
      uAudioBass: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
    }),
    [], // intentionally empty — props updates handled trong useFrame
  );

  // Update uniforms khi props thay đổi
  useMemo(() => {
    uniforms.uBaseColor.value.set(baseColor);
    uniforms.uAccentColor.value.set(accentColor);
    uniforms.uBandSharp.value = bandSharpness;
  }, [baseColor, accentColor, bandSharpness, uniforms]);

  // Per-frame update: time, audio bass, camera position
  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Time uniform
    uniforms.uTime.value += delta;

    // Audio reactivity
    if (audioReactive) {
      uniforms.uAudioBass.value = audioEngine.getBassEnergy();
    }

    // Camera position cho fresnel
    uniforms.uCameraPos.value.copy(state.camera.position);

    // Slow self-rotation
    meshRef.current.rotation.y += delta * rotationSpeed;
  });

  return (
    <mesh ref={meshRef} position={position} scale={radius} geometry={getPlanetGeometry()}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// ============================================================
// PRESET — Jupiter, Saturn-style, Neptune-style etc.
// Convenience component cho consumer
// ============================================================

export const PLANET_PRESETS = {
  jupiter: {
    baseColor: '#d9a366',
    accentColor: '#f25e2c',
    bandSharpness: 0.65,
  },
  saturn: {
    baseColor: '#e8c98a',
    accentColor: '#b8854a',
    bandSharpness: 0.5,
  },
  neptune: {
    baseColor: '#3d6bdb',
    accentColor: '#7ba6ff',
    bandSharpness: 0.4,
  },
  alien: {
    baseColor: '#5b3d8a',
    accentColor: '#ff4d8a',
    bandSharpness: 0.7,
  },
  inferno: {
    baseColor: '#8a2a1a',
    accentColor: '#ffaa3a',
    bandSharpness: 0.8,
  },
} as const;

export type PlanetPresetName = keyof typeof PLANET_PRESETS;

interface PresetPlanetProps extends Omit<GasPlanetProps, 'baseColor' | 'accentColor' | 'bandSharpness'> {
  preset: PlanetPresetName;
}

export function PresetGasPlanet({ preset, ...rest }: PresetPlanetProps) {
  const config = PLANET_PRESETS[preset];
  return <GasPlanet {...config} {...rest} />;
}
