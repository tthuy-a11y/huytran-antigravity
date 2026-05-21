"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { PlanetData } from "@/lib/planets-data";
import { useSceneStore } from "@/lib/store";
import { audioEngine } from "@/lib/AudioEngine";
const playHoverTone = (freq: number, duration?: number) => audioEngine.playHoverTone(freq, duration);
const playClickTone = () => audioEngine.playClickTone();

interface PlanetProps {
  data: PlanetData;
  initialAngle: number;
}

export default function Planet({ data, initialAngle }: PlanetProps) {
  const orbitGroupRef = useRef<THREE.Group>(null);
  const planetGroupRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);

  const focusedPlanetId = useSceneStore((s) => s.focusedPlanetId);
  const setFocusedPlanet = useSceneStore((s) => s.setFocusedPlanet);
  const setHoveredPlanet = useSceneStore((s) => s.setHoveredPlanet);
  const paused = useSceneStore((s) => s.paused);

  const isFocused = focusedPlanetId === data.id;

  // Procedural planet material với noise
  const planetMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.color),
      emissive: new THREE.Color(data.emissiveColor),
      emissiveIntensity: 0.15,
      roughness: 0.55,
      metalness: 0.35,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uNoiseScale = { value: 2.5 };
      (mat as any).userData.shader = shader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `
          #include <begin_vertex>
          vLocalPos = position;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          uniform float uTime;
          uniform float uNoiseScale;
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;

          float hash(vec3 p){p=fract(p*vec3(443.8975,397.2973,491.1871));p+=dot(p,p.yxz+19.19);return fract((p.x+p.y)*p.z);}
          float noise(vec3 p){
            vec3 i=floor(p); vec3 f=fract(p);
            f=f*f*(3.0-2.0*f);
            float n=mix(
              mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                  mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                  mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
            return n;
          }
          float fbm(vec3 p){
            float v=0.0; float a=0.5;
            for(int i=0;i<5;i++){v+=a*noise(p); p*=2.0; a*=0.5;}
            return v;
          }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
          #include <emissivemap_fragment>
          float n = fbm(vLocalPos * uNoiseScale);
          float bands = fbm(vLocalPos * uNoiseScale * 3.0 + uTime * 0.05);
          float pattern = smoothstep(0.3, 0.7, n * 0.7 + bands * 0.3);

          vec3 darkSurface = diffuseColor.rgb * 0.35;
          vec3 brightSurface = diffuseColor.rgb * 1.15;
          diffuseColor.rgb = mix(darkSurface, brightSurface, pattern);

          totalEmissiveRadiance += diffuseColor.rgb * 0.08 * (1.0 - pattern);
        `
      );
    };

    return mat;
  }, [data.color, data.emissiveColor]);

  // Atmosphere fresnel shader
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(data.emissiveColor) },
          uPower: { value: 2.5 },
          uIntensity: { value: 1.0 },
        },
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          void main(){
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uPower;
          uniform float uIntensity;
          varying vec3 vNormal;
          void main(){
            float f = pow(1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))), uPower);
            gl_FragColor = vec4(uColor * f * uIntensity, f);
          }
        `,
      }),
    [data.emissiveColor]
  );

  // ==========================================
  // PLANET DUST CLOUD — particle system
  // ==========================================
  const dustData = useMemo(() => {
    const count = 120; // particles per planet
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = data.radius * (1.5 + Math.random() * 1.2);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Flatten slightly to form a disk-like shape
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.35;
      positions[i * 3 + 2] = r * Math.cos(phi);
      opacities[i] = 0.3 + Math.random() * 0.6;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }

    return { positions, opacities, speeds, count };
  }, [data.radius]);

  // ==========================================
  // RING MATERIALS — 3 tilted rotating rings
  // ==========================================
  const ringMaterials = useMemo(() => {
    const baseColor = new THREE.Color(data.emissiveColor);
    return [
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.MeshBasicMaterial({
        color: baseColor.clone().lerp(new THREE.Color(0xffffff), 0.5),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.MeshBasicMaterial({
        color: baseColor.clone().lerp(new THREE.Color(0xaaffff), 0.3),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ];
  }, [data.emissiveColor]);

  // Quỹ đạo elip
  const a = data.orbitRadius;
  const b = data.orbitRadius * (1 - data.orbitEccentricity);
  const tiltRad = (data.orbitTilt * Math.PI) / 180;
  const inclinationRad = (data.inclination * Math.PI) / 180;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Update shader uniforms
    const shader = (planetMaterial as any).userData.shader;
    if (shader) shader.uniforms.uTime.value = t;

    // Orbital motion
    if (orbitGroupRef.current && !paused) {
      const angle = initialAngle + t * data.orbitSpeed;
      const x = Math.cos(angle) * a;
      const z = Math.sin(angle) * b;
      orbitGroupRef.current.position.set(x, 0, z);
    }

    // Self spin
    if (planetMeshRef.current && !isFocused) {
      planetMeshRef.current.rotation.y += delta * data.spinSpeed;
    }

    // Hover effect
    if (planetGroupRef.current) {
      const targetScale = hovered ? 1.12 : isFocused ? 1.25 : 1.0;
      planetGroupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    // Emissive boost khi hover
    planetMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      planetMaterial.emissiveIntensity,
      hovered || isFocused ? 0.85 : 0.15,
      0.08
    );

    // Atmosphere intensity
    if (atmosphereRef.current) {
      const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        mat.uniforms.uIntensity.value,
        hovered || isFocused ? 2.2 : 1.0,
        0.08
      );
    }

    // Rotate dust cloud
    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.15;
      // Slight pulsing
      const dustScale = 1.0 + Math.sin(t * 1.5) * 0.05;
      const targetDustScale = hovered || isFocused ? dustScale * 1.3 : dustScale;
      dustRef.current.scale.lerp(
        new THREE.Vector3(targetDustScale, targetDustScale, targetDustScale),
        0.05
      );
    }

    // Rotate rings at different speeds
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.35;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.22;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.12;

    // Ring opacity boost on hover
    ringMaterials.forEach((mat, i) => {
      const baseOp = [0.6, 0.4, 0.25][i];
      const targetOp = hovered || isFocused ? baseOp * 1.8 : baseOp;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, 0.08);
    });
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (hovered) return;
    setHovered(true);
    setHoveredPlanet(data.id);
    playHoverTone(data.hoverFreq);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredPlanet(null);
    document.body.style.cursor = "default";
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    playClickTone();
    setFocusedPlanet(isFocused ? null : data.id);
  };

  // Ring size ratios
  const r = data.radius;

  return (
    <group rotation={[tiltRad, 0, 0]}>
      {/* Quỹ đạo visual — MULTI-LAYER */}
      <MultiLayerOrbit a={a} b={b} color={data.emissiveColor} />

      {/* Group quay quanh sun */}
      <group ref={orbitGroupRef}>
        <group
          ref={planetGroupRef}
          rotation={[0, 0, inclinationRad]}
        >
          {/* Planet mesh */}
          <mesh
            ref={planetMeshRef}
            material={planetMaterial}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[data.radius, 64, 64]} />
          </mesh>

          {/* Atmosphere */}
          <mesh ref={atmosphereRef} scale={1.18}>
            <sphereGeometry args={[data.radius, 32, 32]} />
            <primitive object={atmosphereMaterial} attach="material" />
          </mesh>

          {/* ===== ROTATING RINGS (3 lớp) ===== */}
          <mesh
            ref={ring1Ref}
            rotation={[Math.PI / 2 + 0.15, 0, 0]}
            material={ringMaterials[0]}
          >
            <ringGeometry args={[r * 1.5, r * 1.7, 96]} />
          </mesh>
          <mesh
            ref={ring2Ref}
            rotation={[Math.PI / 2 - 0.2, 0, 0]}
            material={ringMaterials[1]}
          >
            <ringGeometry args={[r * 1.8, r * 2.0, 96]} />
          </mesh>
          <mesh
            ref={ring3Ref}
            rotation={[Math.PI / 2 + 0.3, 0, 0]}
            material={ringMaterials[2]}
          >
            <ringGeometry args={[r * 2.1, r * 2.3, 96]} />
          </mesh>

          {/* ===== PARTICLE DUST CLOUD ===== */}
          <points ref={dustRef}>
            <bufferGeometry>
              <primitive
                attach="attributes-position"
                object={new THREE.BufferAttribute(dustData.positions, 3)}
              />
            </bufferGeometry>
            <pointsMaterial
              color={data.emissiveColor}
              size={0.06}
              sizeAttenuation
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>

          {/* Label khi hover */}
          {(hovered || isFocused) && (
            <Billboard position={[0, data.radius + 3.0, 0]}>
              <Text
                fontSize={2.5}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.06}
                outlineColor={data.emissiveColor}
                material-toneMapped={false}
              >
                {data.code}
              </Text>
              <Text
                fontSize={1.5}
                position={[0, -2.2, 0]}
                color={data.emissiveColor}
                anchorX="center"
                anchorY="middle"
                material-toneMapped={false}
              >
                {data.name}
              </Text>
            </Billboard>
          )}

          {/* Holographic modal khi focus */}
          {isFocused && (
            <Html
              position={[data.radius + 2.5, -4, 0]}
              center
              distanceFactor={10}
              transform
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  pointerEvents: "auto",
                  border: `2px solid ${data.emissiveColor}`,
                  boxShadow: `0 0 60px ${data.emissiveColor}90, inset 0 0 30px ${data.emissiveColor}50`,
                }}
                className="w-[320px] sm:w-[400px] md:w-[480px] p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#000f1e]/90 to-[#0a0528]/90 backdrop-blur-xl text-white font-mono animate-in fade-in zoom-in-95 duration-300"
              >
                <div
                  style={{ color: data.emissiveColor }}
                  className="text-xs sm:text-sm md:text-base tracking-[0.2em] mb-2 font-bold uppercase"
                >
                  ▸ PLANET ID: {data.code}
                </div>
                <div 
                  style={{ 
                    textShadow: `0 0 20px ${data.emissiveColor}, 0 0 40px ${data.emissiveColor}` 
                  }}
                  className="text-2xl sm:text-3xl md:text-[38px] font-black mb-4 uppercase tracking-wider leading-tight"
                >
                  {data.name}
                </div>
                <div className="text-sm sm:text-base md:text-lg leading-relaxed opacity-90 mb-6">
                  {data.description}
                </div>
                <div
                  style={{ borderTopColor: `${data.emissiveColor}50` }}
                  className="border-t-2 pt-4"
                >
                  {data.stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex justify-between items-center text-sm sm:text-base py-1.5 font-bold"
                    >
                      <span className="opacity-70 uppercase">{s.label}</span>
                      <span 
                        style={{ 
                          color: data.emissiveColor, 
                          textShadow: `0 0 10px ${data.emissiveColor}` 
                        }}
                      >
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}

/* =============================================
   MULTI-LAYER ORBIT — 3 lớp glow + particle flow
   ============================================= */
function MultiLayerOrbit({
  a,
  b,
  color,
}: {
  a: number;
  b: number;
  color: string;
}) {
  const particlesRef = useRef<THREE.Points>(null);

  // Shared ellipse points
  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * a, 0, Math.sin(angle) * b));
    }
    return pts;
  }, [a, b]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);

  // Orbit particle flow — small dots flowing along the orbit
  const particleData = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      // Initial positions (will be updated in useFrame)
      const angle = phases[i];
      positions[i * 3] = Math.cos(angle) * a;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * b;
    }

    return { positions, phases, count };
  }, [a, b]);

  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(particleData.positions, 3)
    );
    return geo;
  }, [particleData]);

  // Animate particles flowing along orbit
  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = particlesRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    for (let i = 0; i < particleData.count; i++) {
      const angle = particleData.phases[i] + t * 0.3;
      posAttr.setXYZ(
        i,
        Math.cos(angle) * a,
        (Math.sin(angle * 3 + t) * 0.15),
        Math.sin(angle) * b
      );
    }
    posAttr.needsUpdate = true;
  });

  const orbitColor = new THREE.Color(color);

  return (
    <group>
      {/* Layer 1 — Outer glow (wide, dim) */}
      <line>
        <primitive object={geometry.clone()} attach="geometry" />
        <lineBasicMaterial
          color={orbitColor}
          transparent
          opacity={0.12}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Layer 2 — Mid glow (color + brighter) */}
      <line>
        <primitive object={geometry.clone()} attach="geometry" />
        <lineBasicMaterial
          color={orbitColor}
          transparent
          opacity={0.35}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Layer 3 — Core line (thin, white/cyan, bright) */}
      <line>
        <primitive object={geometry.clone()} attach="geometry" />
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.55}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Layer 4 — Energy particle flow */}
      <points ref={particlesRef}>
        <primitive object={particleGeo} attach="geometry" />
        <pointsMaterial
          color={color}
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.9}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
