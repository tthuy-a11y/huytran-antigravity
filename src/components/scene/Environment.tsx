// @ts-nocheck
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Environment() {
  return (
    <>
      <TwinklingStars count={6000} />
      <NebulaBackground />
      <CosmicDust count={2000} />
      <ambientLight intensity={0.15} color="#4060a0" />
    </>
  );
}

/* =============================================
   TWINKLING STARS — shader-based opacity animation
   ============================================= */
function TwinklingStars({ count = 6000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, phases, baseSizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 150 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      // Random phase for twinkling offset
      ph[i] = Math.random() * Math.PI * 2;
      // Random base size
      sz[i] = 0.3 + Math.random() * 1.8;
    }

    return { positions: pos, phases: ph, baseSizes: sz };
  }, [count]);

  // Custom shader material for per-star twinkling
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aPhase;
        attribute float aSize;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          // Twinkling: each star has unique phase
          float twinkle = sin(uTime * (1.0 + aPhase * 0.5) + aPhase * 6.28) * 0.5 + 0.5;
          vAlpha = 0.15 + twinkle * 0.85;

          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (200.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;

        void main() {
          // Soft circular point
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float softness = 1.0 - smoothstep(0.2, 0.5, dist);
          gl_FragColor = vec4(vec3(0.9, 0.95, 1.0), vAlpha * softness);
        }
      `,
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));
    return geo;
  }, [positions, phases, baseSizes]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y += 0.00005;
    }
  });

  return (
    <points ref={ref} geometry={geometry} material={material} />
  );
}

function NebulaBackground() {
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color("#1a0a3a") },
          uColor2: { value: new THREE.Color("#3a1a5a") },
          uColor3: { value: new THREE.Color("#0a3a5a") },
          uColor4: { value: new THREE.Color("#5a1a4a") },
        },
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main(){
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform vec3 uColor4;
          varying vec3 vPos;

          float hash(vec3 p){p=fract(p*vec3(443.8975,397.2973,491.1871));p+=dot(p,p.yxz+19.19);return fract((p.x+p.y)*p.z);}
          float noise(vec3 p){
            vec3 i=floor(p); vec3 f=fract(p);
            f=f*f*(3.0-2.0*f);
            return mix(
              mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                  mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                  mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }
          float fbm(vec3 p){
            float v=0.0; float a=0.5;
            for(int i=0;i<6;i++){v+=a*noise(p); p*=2.0; a*=0.5;}
            return v;
          }

          void main(){
            vec3 dir = normalize(vPos);
            vec3 p = dir * 3.0 + vec3(uTime * 0.01);
            float n1 = fbm(p);
            float n2 = fbm(p * 1.7 + 10.0);
            float n3 = fbm(p * 0.5 - 5.0 + uTime * 0.02);

            vec3 col = mix(uColor1, uColor2, n1);
            col = mix(col, uColor3, smoothstep(0.3, 0.8, n2));
            col += uColor4 * smoothstep(0.5, 0.9, n3) * 0.6;

            col *= 0.7;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[300, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CosmicDust({ count = 2000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      pos[i * 3 + 2] = r * Math.cos(phi);

      const hue = Math.random();
      const c = new THREE.Color().setHSL(0.55 + hue * 0.3, 0.8, 0.6);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
