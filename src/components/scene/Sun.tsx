"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "@/lib/store";
import { audioEngine } from "@/lib/AudioEngine";
const playClickTone = () => audioEngine.playClickTone();

interface SunProps {
  onReady?: (mesh: THREE.Mesh) => void;
}

export default function Sun({ onReady }: SunProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const corona1Ref = useRef<THREE.Mesh>(null);
  const corona2Ref = useRef<THREE.Mesh>(null);
  const corona3Ref = useRef<THREE.Mesh>(null);
  const corona4Ref = useRef<THREE.Mesh>(null);
  const corona5Ref = useRef<THREE.Mesh>(null);
  const textGroupRef = useRef<THREE.Group>(null);
  const solarWindRef = useRef<THREE.Points>(null);

  const [hovered, setHovered] = useState(false);
  const setSunFocused = useSceneStore((s) => s.setSunFocused);

  // Shader cho lõi mặt trời — plasma chuyển động
  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorHot: { value: new THREE.Color("#FFD86B") },
        uColorMid: { value: new THREE.Color("#FF8A1F") },
        uColorEdge: { value: new THREE.Color("#FF3A00") },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
          vPos = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColorHot;
        uniform vec3 uColorMid;
        uniform vec3 uColorEdge;
        varying vec3 vPos;
        varying vec3 vNormal;

        // Simplex noise (Ashima)
        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
          const vec2 C = vec2(1.0/6.0,1.0/3.0);
          const vec4 D = vec4(0.0,0.5,1.0,2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * snoise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 p = normalize(vPos) * 2.0;
          float n = fbm(p + uTime * 0.15);
          float n2 = fbm(p * 2.0 - uTime * 0.25);
          float t = smoothstep(-0.2, 0.6, n + n2 * 0.5);

          vec3 col = mix(uColorEdge, uColorMid, t);
          col = mix(col, uColorHot, smoothstep(0.4, 0.9, t));

          // rim light
          float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.0);
          col += uColorHot * rim * 0.6;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  // Corona material — semi-transparent glow
  const coronaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#FFB347") },
          uIntensity: { value: 1.0 },
        },
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uIntensity;
          varying vec3 vNormal;
          void main() {
            float fres = pow(1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))), 3.0);
            float pulse = 0.95 + 0.05 * sin(uTime * 0.4);
            gl_FragColor = vec4(uColor * fres * uIntensity * pulse, fres * 0.9);
          }
        `,
      }),
    []
  );

  // ==========================================
  // SOLAR WIND — particles radiating outward
  // ==========================================
  const solarWindData = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3); // direction & speed
    const lifetimes = new Float32Array(count); // 0..1 phase

    for (let i = 0; i < count; i++) {
      // Random direction on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );

      // Start near sun surface
      const startR = 5.0 + Math.random() * 1.0;
      positions[i * 3] = dir.x * startR;
      positions[i * 3 + 1] = dir.y * startR;
      positions[i * 3 + 2] = dir.z * startR;

      // Velocity (radial outward)
      const speed = 0.02 + Math.random() * 0.04;
      velocities[i * 3] = dir.x * speed;
      velocities[i * 3 + 1] = dir.y * speed;
      velocities[i * 3 + 2] = dir.z * speed;

      // Phase offset for staggered animation
      lifetimes[i] = Math.random();
    }

    return { positions, velocities, lifetimes, count };
  }, []);

  const solarWindGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(solarWindData.positions.slice(), 3)
    );
    return geo;
  }, [solarWindData]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    sunMaterial.uniforms.uTime.value = t;
    coronaMaterial.uniforms.uTime.value = t;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.05;
      const pulse = 1 + Math.sin(t * 0.4) * 0.006;
      coreRef.current.scale.setScalar(hovered ? pulse * 1.06 : pulse);
    }
    if (corona1Ref.current) corona1Ref.current.rotation.y -= delta * 0.02;
    if (corona2Ref.current) corona2Ref.current.rotation.y += delta * 0.04;
    if (corona3Ref.current) corona3Ref.current.rotation.y -= delta * 0.01;
    if (corona4Ref.current) corona4Ref.current.rotation.y += delta * 0.015;
    if (corona5Ref.current) corona5Ref.current.rotation.y -= delta * 0.008;
    if (textGroupRef.current) textGroupRef.current.rotation.y += delta * 0.12;

    // Animate solar wind particles
    if (solarWindRef.current) {
      const posAttr = solarWindRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const maxR = 14.0; // max distance before reset
      const sunR = 5.0;

      for (let i = 0; i < solarWindData.count; i++) {
        let x = posAttr.getX(i);
        let y = posAttr.getY(i);
        let z = posAttr.getZ(i);

        // Move outward
        x += solarWindData.velocities[i * 3];
        y += solarWindData.velocities[i * 3 + 1];
        z += solarWindData.velocities[i * 3 + 2];

        // Check if too far — reset to sun surface
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist > maxR) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = Math.sin(phi) * Math.cos(theta) * sunR;
          y = Math.sin(phi) * Math.sin(theta) * sunR;
          z = Math.cos(phi) * sunR;

          // Reassign velocity
          const dir = new THREE.Vector3(x, y, z).normalize();
          const speed = 0.02 + Math.random() * 0.04;
          solarWindData.velocities[i * 3] = dir.x * speed;
          solarWindData.velocities[i * 3 + 1] = dir.y * speed;
          solarWindData.velocities[i * 3 + 2] = dir.z * speed;
        }

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      // Slow rotation for wind cloud
      solarWindRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {/* Lõi mặt trời */}
      <mesh
        ref={(m) => {
          coreRef.current = m;
          if (m && onReady) onReady(m);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          playClickTone();
          setSunFocused(true);
        }}
      >
        <sphereGeometry args={[5, 96, 96]} />
        <primitive object={sunMaterial} attach="material" />
      </mesh>

      {/* Light source */}
      <pointLight
        position={[0, 0, 0]}
        intensity={6}
        color="#FFB347"
        distance={120}
        decay={1.4}
      />
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        color="#FFFFFF"
        distance={50}
      />

      {/* Corona 5 lớp — thêm 2 lớp ngoài cho cinematic effect */}
      <mesh ref={corona1Ref}>
        <sphereGeometry args={[5.7, 64, 64]} />
        <primitive
          object={coronaMaterial.clone()}
          attach="material"
        />
      </mesh>
      <mesh ref={corona2Ref}>
        <sphereGeometry args={[6.7, 64, 64]} />
        <shaderMaterial
          uniforms={{
            uTime: coronaMaterial.uniforms.uTime,
            uColor: { value: new THREE.Color("#FF7A1F") },
            uIntensity: { value: 0.55 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={coronaMaterial.vertexShader}
          fragmentShader={coronaMaterial.fragmentShader}
        />
      </mesh>
      <mesh ref={corona3Ref}>
        <sphereGeometry args={[8.5, 64, 64]} />
        <shaderMaterial
          uniforms={{
            uTime: coronaMaterial.uniforms.uTime,
            uColor: { value: new THREE.Color("#FFE08A") },
            uIntensity: { value: 0.25 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={coronaMaterial.vertexShader}
          fragmentShader={coronaMaterial.fragmentShader}
        />
      </mesh>
      {/* NEW: Corona layer 4 — soft outer haze */}
      <mesh ref={corona4Ref}>
        <sphereGeometry args={[10.5, 48, 48]} />
        <shaderMaterial
          uniforms={{
            uTime: coronaMaterial.uniforms.uTime,
            uColor: { value: new THREE.Color("#FFD066") },
            uIntensity: { value: 0.15 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={coronaMaterial.vertexShader}
          fragmentShader={coronaMaterial.fragmentShader}
        />
      </mesh>
      {/* NEW: Corona layer 5 — ultra-wide ambient glow */}
      <mesh ref={corona5Ref}>
        <sphereGeometry args={[13, 48, 48]} />
        <shaderMaterial
          uniforms={{
            uTime: coronaMaterial.uniforms.uTime,
            uColor: { value: new THREE.Color("#FFEECC") },
            uIntensity: { value: 0.08 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={coronaMaterial.vertexShader}
          fragmentShader={coronaMaterial.fragmentShader}
        />
      </mesh>

      {/* ===== SOLAR WIND PARTICLES ===== */}
      <points ref={solarWindRef}>
        <primitive object={solarWindGeo} attach="geometry" />
        <pointsMaterial
          color="#FFCC66"
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Holographic text quay quanh sun */}
      <group ref={textGroupRef}>
        {[0, 120, 240].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const r = 7.5;
          return (
            <Billboard
              key={i}
              position={[Math.cos(rad) * r, Math.sin(rad * 0.5) * 0.6, Math.sin(rad) * r]}
            >
              <Text
                fontSize={0.8}
                color="#E8FBFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#00E5FF"
                material-toneMapped={false}
              >
                THANH HUY 2003
              </Text>
            </Billboard>
          );
        })}
      </group>
    </group>
  );
}
