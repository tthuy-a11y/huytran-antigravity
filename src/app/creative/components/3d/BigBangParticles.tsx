/**
 * BigBangParticles.tsx
 *
 * GPU particle explosion cho cảnh Cosmic Inferno (18s → 24s).
 *
 * Approach:
 *   - BufferGeometry với N points (tier-based: 5000/2000/500)
 *   - Pre-compute velocity, color, lifespan per particle KHI MOUNT (1 lần)
 *   - useFrame update positions: pos += vel * dt
 *   - Custom shader cho radial fade + size attenuation theo distance
 *
 * Triggering:
 *   - Mount → nổ ngay lập tức
 *   - Parent điều khiển mount/unmount qua useCinematicRange()
 *
 * Tại sao không dùng instancedMesh:
 *   - 5000 instances = 5000 draw calls metadata
 *   - Points = 1 draw call cho all → tiết kiệm CPU
 *   - Particles 2D billboards đủ đẹp cho big bang (không cần geometry per particle)
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore } from '../../lib/cinematicStore';
import { audioEngine } from '../../lib/audioEngine';

interface BigBangParticlesProps {
  origin?: [number, number, number];
  maxRadius?: number;        // distance particle có thể bay
  duration?: number;         // seconds — sau đó fade out hoàn toàn
  audioReactive?: boolean;
}

export function BigBangParticles({
  origin = [0, 0, 0],
  maxRadius = 30,
  duration = 6,
  audioReactive = true,
}: BigBangParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsedRef = useRef(0);

  const deviceTier = useCinematicStore((s) => s.deviceTier);

  // Tier-based particle count
  const count = useMemo(() => {
    return deviceTier === 'high' ? 5000 : deviceTier === 'mid' ? 2000 : 500;
  }, [deviceTier]);

  // Pre-compute attributes 1 lần
  const { positions, velocities, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Color palette cho big bang — orange/red/white-hot
    const palette = [
      new THREE.Color('#ffeb8a'), // hot white-yellow
      new THREE.Color('#ff9d3a'), // orange
      new THREE.Color('#ff4d2c'), // red
      new THREE.Color('#a85eff'), // purple (rare cosmic shock)
      new THREE.Color('#ffffff'), // pure white (rare)
    ];

    for (let i = 0; i < count; i++) {
      // Spherical distribution — uniform on unit sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 8; // bay 2..10 units/sec

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      // Start at origin (slight jitter)
      positions[i * 3] = origin[0] + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = origin[1] + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = origin[2] + (Math.random() - 0.5) * 0.2;

      velocities[i * 3] = vx;
      velocities[i * 3 + 1] = vy;
      velocities[i * 3 + 2] = vz;

      // Bias palette toward warm colors (80%)
      const colorIdx = Math.random() < 0.8
        ? Math.floor(Math.random() * 3)              // hot colors
        : 3 + Math.floor(Math.random() * 2);         // rare colors
      const c = palette[colorIdx];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Random size, weighted toward small
      sizes[i] = Math.random() < 0.85 ? 0.5 + Math.random() * 1.5 : 2 + Math.random() * 3;
    }

    return { positions, velocities, colors, sizes };
  }, [count, origin]);

  // Build geometry once
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  // Custom shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },         // 0..1 normalized elapsed
      uAudioBass: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    elapsedRef.current += delta;
    const progress = Math.min(1, elapsedRef.current / duration);
    uniforms.uTime.value = elapsedRef.current;
    uniforms.uProgress.value = progress;

    if (audioReactive) {
      uniforms.uAudioBass.value = audioEngine.getBassEnergy();
    }

    // Fade out toward end
    uniforms.uOpacity.value = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;

    // Update positions: pos += vel * delta * speedScale
    // SpeedScale giảm dần để particles chậm lại (cosmic drag)
    const speedScale = 1 - progress * 0.7;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocities[i * 3] * delta * speedScale;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * delta * speedScale;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * delta * speedScale;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={BIGBANG_VERTEX_SHADER}
        fragmentShader={BIGBANG_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================
// SHADERS — inline để dễ track trong 1 file
// ============================================================

const BIGBANG_VERTEX_SHADER = /* glsl */ `
attribute float size;
attribute vec3 color;

uniform float uProgress;
uniform float uAudioBass;

varying vec3 vColor;
varying float vDistance;

void main() {
    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDistance = length(position); // distance từ origin, dùng cho fade

    // Size attenuation theo distance camera + audio pulse
    float pulse = 1.0 + uAudioBass * 0.4;
    gl_PointSize = size * pulse * (300.0 / -mvPosition.z);

    // Shrink toward end để fade tự nhiên
    gl_PointSize *= 1.0 - uProgress * 0.4;

    gl_Position = projectionMatrix * mvPosition;
}
`;

const BIGBANG_FRAGMENT_SHADER = /* glsl */ `
uniform float uOpacity;
uniform float uProgress;

varying vec3 vColor;
varying float vDistance;

void main() {
    // Soft circular point
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= uOpacity;

    // Distance-based color shift: gần origin → trắng nóng, xa → màu gốc
    float heatMix = 1.0 - clamp(vDistance / 10.0, 0.0, 1.0);
    vec3 color = mix(vColor, vec3(1.0, 0.95, 0.85), heatMix * (1.0 - uProgress));

    // Boost brightness early in animation
    float bright = 1.5 - uProgress * 0.8;

    gl_FragColor = vec4(color * bright, alpha);
}
`;
