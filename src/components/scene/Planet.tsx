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

  return (
    <group rotation={[tiltRad, 0, 0]}>
      {/* Quỹ đạo visual line (ellipse) */}
      <OrbitLine a={a} b={b} color={data.emissiveColor} />

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

          {/* Label khi hover */}
          {(hovered || isFocused) && (
            <Billboard position={[0, data.radius + 1.2, 0]}>
              <Text
                fontSize={0.35}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.015}
                outlineColor={data.emissiveColor}
                material-toneMapped={false}
              >
                {data.code}
              </Text>
              <Text
                fontSize={0.22}
                position={[0, -0.45, 0]}
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
              position={[data.radius + 1.5, -4, 0]}
              center
              distanceFactor={8}
              transform
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  pointerEvents: "auto",
                  width: 320,
                  padding: 20,
                  background:
                    "linear-gradient(135deg, rgba(0,15,30,0.85), rgba(10,5,40,0.85))",
                  border: `1px solid ${data.emissiveColor}`,
                  borderRadius: 12,
                  backdropFilter: "blur(14px)",
                  color: "#fff",
                  fontFamily: "monospace",
                  boxShadow: `0 0 40px ${data.emissiveColor}80, inset 0 0 20px ${data.emissiveColor}30`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: data.emissiveColor,
                    marginBottom: 4,
                  }}
                >
                  ▸ PLANET ID: {data.code}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
                  {data.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    opacity: 0.85,
                    marginBottom: 14,
                  }}
                >
                  {data.description}
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${data.emissiveColor}50`,
                    paddingTop: 10,
                  }}
                >
                  {data.stats.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        padding: "3px 0",
                      }}
                    >
                      <span style={{ opacity: 0.6 }}>{s.label}</span>
                      <span style={{ color: data.emissiveColor }}>
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

/* Vẽ đường quỹ đạo elip */
function OrbitLine({
  a,
  b,
  color,
}: {
  a: number;
  b: number;
  color: string;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * a, 0, Math.sin(angle) * b));
    }
    return pts;
  }, [a, b]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        toneMapped={false}
      />
    </line>
  );
}
