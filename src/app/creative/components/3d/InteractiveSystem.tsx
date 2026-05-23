'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { OrbitControls, Html, useCursor, Stars, Sparkles } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';
import { PLANETS, PlanetData } from '@/lib/planets-data';
import { Sun } from './PlanetNode';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import { audioEngine } from '@/app/creative/lib/audioEngine';
import { getPlanetGeometry, getAtmosphereGeometry } from '@/app/creative/lib/geometryCache';
import { PresetGasPlanet, type PlanetPresetName } from './GasPlanet';

// ============================================================
// PLANET RINGS
// ============================================================
function PlanetRings({ radius, color }: { radius: number; color: string }) {
  const ringRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y -= delta * 0.15;
    }
  });

  return (
    <group rotation={[0.2, 0, -0.1]} ref={ringRef}>
      {/* Main Inner Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.5, radius * 2.0, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Outer Thin Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 2.2, radius * 2.25, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// ORBIT COMET TRAIL — vệt sao chổi dọc theo orbit path
// ============================================================
function OrbitCometTrail({
  orbitRadius,
  color,
  isHighlighted,
}: {
  orbitRadius: number;
  color: string;
  isHighlighted: boolean;
}) {
  const SEGMENTS = 128;
  const HEAD_ARC = Math.PI * 0.85;

  // Build a THREE.Line instance once — JSX <line> conflicts with SVGLineElement.
  const lineObj = useMemo(() => {
    const positions = new Float32Array(SEGMENTS * 3);
    const colors = new Float32Array(SEGMENTS * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / (SEGMENTS - 1);
      const angle = t * HEAD_ARC;
      positions[i * 3] = Math.cos(angle) * orbitRadius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * orbitRadius;
      const intensity = Math.pow(t, 2.2);
      colors[i * 3] = c.r * intensity;
      colors[i * 3 + 1] = c.g * intensity;
      colors[i * 3 + 2] = c.b * intensity;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [orbitRadius, color]);

  useFrame((_, delta) => {
    lineObj.rotation.y -= delta * 0.04;
    const mat = lineObj.material as THREE.LineBasicMaterial;
    const target = isHighlighted ? 0.95 : 0.45;
    mat.opacity += (target - mat.opacity) * 0.08;
  });

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

// ============================================================
// INTERACTIVE PLANET NODE
// ============================================================
function InteractivePlanetNode({ data, index }: { data: PlanetData; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const focusPlanet = useCinematicStore((s) => s.focusPlanet);
  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);
  const isFocused = focusedPlanetId === data.id;
  const isAnotherFocused = focusedPlanetId !== null && !isFocused;
  const isHighlighted = hovered || isFocused;

  useCursor(hovered);
  useSafeDispose([groupRef.current]);

  // Initial phase distribution
  const initialPhase = (index / PLANETS.length) * Math.PI * 2;

  // Mobile check to selectively enable heavy shaders
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  const gasPlanetPreset = useMemo(() => {
    if (data.id === 'backend-api') return 'jupiter';
    if (data.id === 'creative-canvas') return 'alien';
    if (data.id === 'ui-ux') return 'inferno';
    if (data.id === 'physics-motion') return 'neptune';
    return null;
  }, [data.id]);

  const shouldUseGasPlanet = gasPlanetPreset !== null;

  // Procedural planet material with noise
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

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Update shaders
    const shader = (planetMaterial as any).userData.shader;
    if (shader) shader.uniforms.uTime.value = t;

    const angle = initialPhase + t * data.orbitSpeed * 1.5;
    const x = Math.cos(angle) * data.orbitRadius;
    const z = Math.sin(angle) * data.orbitRadius;
    const y = Math.sin(angle * 1.5) * 1.2;

    groupRef.current.position.set(x, y, z);
    
    // Spin
    groupRef.current.rotation.y += delta * data.spinSpeed * 2.0;
    groupRef.current.rotation.x += delta * data.spinSpeed * 0.6;

    const targetScale = isFocused ? 1.25 : hovered ? 1.18 : isAnotherFocused ? 0.85 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

    // Emissive boost on hover
    planetMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      planetMaterial.emissiveIntensity,
      hovered || isFocused ? 0.85 : 0.15,
      0.08
    );

    // Atmosphere intensity
    atmosphereMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      atmosphereMaterial.uniforms.uIntensity.value,
      hovered || isFocused ? 2.2 : 1.0,
      0.08
    );
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    audioEngine.playSfx('hover', { volume: 0.2 });
    audioEngine.playCue('data-beep', { volume: 0.18, rate: 0.85 + Math.random() * 0.5 });
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    focusPlanet(data.id);
    audioEngine.playSfx('click', { volume: 0.6 });
  };

  const currentRadius = data.radius * 2.2;

  return (
    <group ref={groupRef}>
      <group>
        {shouldUseGasPlanet ? (
          <PresetGasPlanet 
            preset={gasPlanetPreset as PlanetPresetName} 
            radius={currentRadius} 
            audioReactive={true} 
            rotationSpeed={0.08} 
          />
        ) : (
          <mesh
            material={planetMaterial}
            castShadow
            receiveShadow
            scale={currentRadius}
            geometry={getPlanetGeometry()}
          />
        )}
        
        {/* Atmosphere / Glow */}
        <mesh scale={currentRadius * 1.18} geometry={getAtmosphereGeometry()}>
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
        
        {/* Glow Halo (Additive blending) */}
        <mesh scale={currentRadius * 1.3} geometry={getAtmosphereGeometry()}>
          <meshBasicMaterial
            color={data.emissiveColor}
            transparent
            opacity={isFocused ? 0.35 : hovered ? 0.25 : 0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      
      {/* TEXT HÀNH TINH — nâng cấp z-index, hiển thị description */}
      {(hovered || isFocused) && (
        <Html
          position={[0, currentRadius * 1.5 + 1.5, 0]}
          distanceFactor={7}
          center
          zIndexRange={[9999, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="planet-text flex flex-col items-center"
            style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }}
          >
            <div
              className="inline-flex flex-col items-center bg-black/70 backdrop-blur-xl px-6 py-3 rounded-3xl border border-white/20 shadow-[0_0_25px_rgba(0,242,254,0.3)]"
              style={{ borderColor: `${data.color}66`, boxShadow: `0 0 25px ${data.color}55` }}
            >
              <h3
                className="text-white font-black text-xl tracking-[2px] uppercase drop-shadow-md whitespace-nowrap"
                style={{ textShadow: `0 0 12px ${data.color}` }}
              >
                {data.name}
              </h3>
              <p className="text-white/80 text-sm max-w-[240px] leading-tight mt-1 font-light text-center">
                {data.description}
              </p>
              <div
                className="w-16 h-px mt-2 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${data.color}99, transparent)` }}
              />
            </div>
          </div>
        </Html>
      )}

      {/* Invisible raycast mesh để detect hover/click chính xác */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={currentRadius * 1.5}
        geometry={getAtmosphereGeometry()}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ============================================================
// CAMERA CONTROLLER
// Khi modal mở: chỉ DAMPEN target sang planet (vẫn cho user zoom/xoay),
// thêm offset sang trái để nhường sidebar phải. Không khóa camera position.
// ============================================================
function CameraController({ controlsRef }: { controlsRef: any }) {
  const { camera, size } = useThree();
  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const desiredCamPos = useMemo(() => new THREE.Vector3(), []);
  const offsetVec = useMemo(() => new THREE.Vector3(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const prevFocusRef = useRef<string | null>(null);

  // Snapshot khoảng cách camera-target khi BẮT ĐẦU focus, để giữ nguyên
  // distance do user đã chọn — không kéo camera vào planet.
  const lockedDistanceRef = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Detect transition open/close để snapshot/reset
    if (focusedPlanetId !== prevFocusRef.current) {
      if (focusedPlanetId) {
        lockedDistanceRef.current = camera.position.distanceTo(controls.target);
      } else {
        lockedDistanceRef.current = null;
      }
      prevFocusRef.current = focusedPlanetId;
    }

    if (focusedPlanetId) {
      const planetData = PLANETS.find((p) => p.id === focusedPlanetId);
      const planetIndex = PLANETS.findIndex((p) => p.id === focusedPlanetId);

      if (focusedPlanetId === 'sun-core') {
        targetPos.set(0, 0, 0);
      } else if (planetData) {
        const t = state.clock.elapsedTime;
        const initialPhase = (planetIndex / PLANETS.length) * Math.PI * 2;
        const angle = initialPhase + t * planetData.orbitSpeed * 1.5;
        targetPos.set(
          Math.cos(angle) * planetData.orbitRadius,
          Math.sin(angle * 1.5) * 1.2,
          Math.sin(angle) * planetData.orbitRadius
        );
      }

      // Sidebar phải ~480px → đẩy target sang TRÁI để planet hiện rõ
      const sidebarWidth = size.width >= 768 ? 480 : 0;
      const offsetWorld = sidebarWidth > 0
        ? (sidebarWidth / size.width) * 22 // ước lượng theo FOV scene
        : 0;
      // hướng "phải" theo camera (right vector)
      tmpVec.set(0, 0, -1).applyQuaternion(camera.quaternion); // forward
      offsetVec.crossVectors(tmpVec, camera.up).normalize();   // right
      targetPos.addScaledVector(offsetVec, offsetWorld * 0.35);

      // Lerp TARGET với damping nhẹ (0.25 — không cứng nhắc)
      controls.target.lerp(targetPos, 1 - Math.exp(-3.5 * delta));

      // Nếu user CHƯA zoom thủ công (distance gần với snapshot),
      // giữ camera ở khoảng cách lock; nếu user đã zoom, để OrbitControls lo.
      const lockedDist = lockedDistanceRef.current;
      if (lockedDist !== null) {
        const dir = tmpVec.subVectors(camera.position, controls.target).normalize();
        desiredCamPos.copy(controls.target).addScaledVector(dir, lockedDist);
        // Chỉ "kéo theo" rất nhẹ để camera trôi theo planet, không cướp wheel
        camera.position.lerp(desiredCamPos, 1 - Math.exp(-1.2 * delta));
      }

      controls.update();
    } else {
      // Unfocused: target từ từ về tâm
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-3 * delta));
      controls.update();
    }
  });

  return null;
}

// ============================================================
// SYSTEM ROOT
// ============================================================
export function InteractiveSystem() {
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Reset FOV and Position when entering system to prevent bugs from cinematic end
  useEffect(() => {
    if (hasEnteredSystem && camera && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      if (persp.fov !== 45) {
        persp.fov = 45;
        persp.updateProjectionMatrix();
      }
      
      // RESET POSITION to ensure the planetary system looks identical 
      // whether the user watched the cinematic (camera ends up at z=-300) 
      // or skipped it (camera stays at default z=200).
      // Slanted position [0, 25, 55] ensures orbits are beautiful ellipses.
      persp.position.set(0, 25, 55);
      persp.lookAt(0, 0, 0);
    }
  }, [hasEnteredSystem, camera]);

  // Setup OrbitControls config when entered system
  useEffect(() => {
    if (!controlsRef.current || !hasEnteredSystem) return;

    const controls = controlsRef.current;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = true; // wheel zoom luôn ON, kể cả khi modal mở
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.minDistance = 9;
    controls.maxDistance = 65;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.85;

    const onStart = () => {
      controls.autoRotate = false;
    };
    controls.addEventListener('start', onStart);

    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, [hasEnteredSystem]);

  // Khi modal mở: tăng damping (mượt hơn), tắt auto-rotate; zoom vẫn ON.
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (focusedPlanetId) {
      controls.dampingFactor = 0.28;
      controls.autoRotate = false;
      controls.rotateSpeed = 0.55;
    } else {
      controls.dampingFactor = 0.12;
      controls.rotateSpeed = 1.0;
    }
  }, [focusedPlanetId]);

  if (!hasEnteredSystem) return null;

  return (
    <group>
      {/* Central Sun */}
      <group>
        <Sun position={[0, 0, 0]} scale={3.9} reveal={1.0} intensity={1.25} />
        <mesh 
          onClick={(e) => {
            e.stopPropagation();
            useCinematicStore.getState().focusPlanet('sun-core');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[4.5, 32, 32]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
      />
      <CameraController controlsRef={controlsRef} />
      
      {/* Comet trails dọc orbit — render ở scene root để không trôi theo planet */}
      {PLANETS.map((planet) => (
        <OrbitCometTrail
          key={`trail-${planet.id}`}
          orbitRadius={planet.orbitRadius}
          color={planet.emissiveColor || planet.color}
          isHighlighted={focusedPlanetId === planet.id}
        />
      ))}

      {PLANETS.map((planet, i) => (
        <InteractivePlanetNode key={planet.id} data={planet} index={i} />
      ))}

      {/* Background Decor: Stars & Nebula Dust */}
      <group position={[0, -10, 0]}>
        <Stars radius={60} depth={50} count={6000} factor={4} saturation={1} fade speed={1.5} />
        <Sparkles count={3000} scale={120} size={2.5} speed={0.3} opacity={0.08} color="#00e5ff" />
        <Sparkles count={2000} scale={100} size={4} speed={0.1} opacity={0.05} color="#ff3366" />
      </group>

      {/* Supplemental lighting for interactive mode */}
      <ambientLight intensity={0.15} color="#a0d8ff" />
      <pointLight
        position={[15, 12, 20]}
        intensity={0.4}
        color="#fff8e0"
        distance={80}
      />
    </group>
  );
}
