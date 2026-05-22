'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeDispose } from '@/app/creative/lib/useSafeDispose';
import {
  useCinematicStore,
  smoothstep,
  smootherstep,
  BIG_BANG_TIME,
} from '@/app/creative/lib/cinematicStore';
import {
  Sun,
  CollisionAsteroid,
  CinematicPlanet,
  type CinematicPlanetHandle,
  type PrimalTint,
} from '@/app/creative/components/3d/PlanetNode';

// ============================================================
// TIMELINE — 31s compressed, Big Bang @ 8.0s
// ============================================================
const CONVERGENCE_START = 5.5;   // asteroids visible / rushing in
const BANG              = BIG_BANG_TIME;   // 8.0
const PRIMAL_REVEAL     = 9.0;   // 3 primal asteroids emerge (post-bang)
const AWAKENING_START   = 17.0;  // Sun blazes, debris clearing
const SCENE_END         = 27.0;

// Module-scope scratch vectors (zero GC in useFrame hot paths)
const S = {
  pos:    new THREE.Vector3(),
  vec:    new THREE.Vector3(),
  quat:   new THREE.Quaternion(),
  euler:  new THREE.Euler(),
  scale:  new THREE.Vector3(1, 1, 1),
  mat:    new THREE.Matrix4(),
  color:  new THREE.Color(),
};
const TUMBLE_QUAT = new THREE.Quaternion();

// ============================================================
// 1. COLLISION PAIR — two asteroids rush toward each other
// ============================================================
function CollisionPair() {
  const leftRef  = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    const L = leftRef.current, R = rightRef.current;
    if (!L || !R) return;

    const vis = t >= CONVERGENCE_START - 0.5 && t <= BANG + 0.15;
    if (L.visible !== vis) { L.visible = vis; R.visible = vis; }
    if (!vis) return;

    // Cubic ease-in: slow build then rockets in
    const raw = Math.min(1, Math.max(0, (t - CONVERGENCE_START) / (BANG - CONVERGENCE_START)));
    const k   = raw * raw * raw;
    const dist = THREE.MathUtils.lerp(22, 1.6, k);
    L.position.set(-dist, 0, 0);
    R.position.set( dist, 0, 0);

    // Impact compression squeeze
    if (t >= BANG - 0.06) {
      const crush = Math.max(0, 1 - (t - (BANG - 0.06)) / 0.18);
      const s = 1 + (1 - crush) * 0.35;
      L.scale.setScalar(s); R.scale.setScalar(s);
    } else {
      L.scale.setScalar(1); R.scale.setScalar(1);
    }
  });

  return (
    <>
      <group ref={leftRef}>
        <CollisionAsteroid variant="creativity" scale={1.8} rotationSpeed={0.7} />
      </group>
      <group ref={rightRef}>
        <CollisionAsteroid variant="technology" scale={1.8} rotationSpeed={-0.8} />
      </group>
    </>
  );
}

// ============================================================
// 2. EXPLOSION DEBRIS — 4k–45k instanced streaks
// ============================================================
function ExplosionDebris() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useCinematicStore((s) => s.quality);

  const cfg = useMemo(() => {
    const count = quality.explosionParticles;
    const vel   = new Float32Array(count * 3);
    const spin  = new Float32Array(count * 3);
    const size  = new Float32Array(count);
    const life  = new Float32Array(count);
    const cR    = new Float32Array(count);
    const cG    = new Float32Array(count);
    const cB    = new Float32Array(count);

    const palette = [
      new THREE.Color('#ffffff'), new THREE.Color('#fff5c0'),
      new THREE.Color('#ffb56b'), new THREE.Color('#ff7a3a'),
      new THREE.Color('#ff5fa0'), new THREE.Color('#7af0ff'),
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const sx = Math.sin(phi) * Math.cos(theta);
      const sy = Math.cos(phi);
      const sz = Math.sin(phi) * Math.sin(theta);

      const r = Math.random();
      const speed = r > 0.95 ? 24 + Math.random() * 16
                  : r > 0.72 ? 11 + Math.random() * 9
                  :              4 + Math.random() * 7;

      vel[i*3] = sx*speed; vel[i*3+1] = sy*speed; vel[i*3+2] = sz*speed;
      spin[i*3] = (Math.random()-0.5)*10;
      spin[i*3+1] = (Math.random()-0.5)*10;
      spin[i*3+2] = (Math.random()-0.5)*10;
      size[i] = 0.04 + Math.random() * 0.14;
      life[i] = 2.5 + Math.random() * 4.0;

      const col = r > 0.85 ? palette[Math.floor(Math.random()*2)]
                : r > 0.55 ? palette[2 + Math.floor(Math.random()*2)]
                :             palette[Math.floor(Math.random()*palette.length)];
      cR[i] = col.r; cG[i] = col.g; cB[i] = col.b;
    }
    return { count, vel, spin, size, life, cR, cG, cB };
  }, [quality.explosionParticles]);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 0.18, 0.18), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cfg.count * 3), 3);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    (mesh.instanceColor as THREE.InstancedBufferAttribute).setUsage(THREE.DynamicDrawUsage);
    S.scale.setScalar(0);
    S.mat.compose(S.pos.set(0,0,0), S.quat.identity(), S.scale);
    for (let i = 0; i < cfg.count; i++) {
      mesh.setMatrixAt(i, S.mat);
      mesh.instanceColor.setXYZ(i, 0, 0, 0);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate  = true;
    return () => { geo.dispose(); mat.dispose(); };
  }, [cfg, geo, mat]);

  useFrame(() => {
    const t    = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = t - BANG;
    const active  = elapsed >= -0.01 && elapsed <= 6.5;
    if (!active) { if (mesh.visible) mesh.visible = false; return; }
    if (!mesh.visible) mesh.visible = true;

    const colorArr = mesh.instanceColor!.array as Float32Array;
    const k        = 0.55;

    for (let i = 0; i < cfg.count; i++) {
      const i3       = i * 3;
      const lifeSpan = cfg.life[i];
      const pe       = Math.min(elapsed, lifeSpan);
      const lr       = pe / lifeSpan;

      // Position via closed-form drag integral
      const integ = (1 - Math.exp(-k * pe)) / k;
      S.pos.set(cfg.vel[i3]*integ, cfg.vel[i3+1]*integ, cfg.vel[i3+2]*integ);

      // Streak orientation (velocity → box X axis)
      S.vec.set(cfg.vel[i3], cfg.vel[i3+1], cfg.vel[i3+2]).normalize();
      const dot = S.vec.x;
      if (dot > 0.9999)       S.quat.identity();
      else if (dot < -0.9999) S.quat.set(0, 0, 1, 0);
      else {
        const ay = -S.vec.z, az = S.vec.y;
        const ang = Math.acos(dot), s = Math.sin(ang / 2);
        const len = Math.hypot(0, ay, az);
        if (len > 1e-6) S.quat.set(0, ay/len*s, az/len*s, Math.cos(ang/2));
        else S.quat.identity();
      }

      // Tumble (post 0.8s)
      if (pe > 0.8) {
        const tt = pe - 0.8;
        S.euler.set(cfg.spin[i3]*tt*0.3, cfg.spin[i3+1]*tt*0.3, cfg.spin[i3+2]*tt*0.3);
        TUMBLE_QUAT.setFromEuler(S.euler);
        S.quat.multiply(TUMBLE_QUAT);
      }

      // Size: streak + fade
      const spd      = Math.hypot(cfg.vel[i3], cfg.vel[i3+1], cfg.vel[i3+2]);
      const drag     = Math.exp(-k * pe);
      const streakL  = THREE.MathUtils.lerp(cfg.size[i]*0.8, cfg.size[i]*spd*0.36*drag, smoothstep(0, 0.4, pe));
      const fadeOut  = 1 - smoothstep(0.55, 1.0, lr);
      S.scale.set(streakL, cfg.size[i]*fadeOut, cfg.size[i]*fadeOut);
      S.mat.compose(S.pos, S.quat, S.scale);
      mesh.setMatrixAt(i, S.mat);

      // Color: hot-white at birth → palette → dark
      const hot   = 1 - smoothstep(0, 0.45, pe);
      const br    = fadeOut * 2.8;
      colorArr[i3]   = (cfg.cR[i] + (1-cfg.cR[i])*hot) * br;
      colorArr[i3+1] = (cfg.cG[i] + (1-cfg.cG[i])*hot) * br;
      colorArr[i3+2] = (cfg.cB[i] + (1-cfg.cB[i])*hot) * br;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, cfg.count]} frustumCulled={false} />
  );
}

// ============================================================
// 3. SHOCKWAVE — 3 expanding rings with chromatic aberration
// ============================================================
function ShockwaveRing({ delay, colorA, colorB, colorC }: {
  delay: number; colorA: string; colorB: string; colorC: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uElapsed: { value: 0 },
    uOpacity: { value: 0 },
    uColorA:  { value: new THREE.Color(colorA) },
    uColorB:  { value: new THREE.Color(colorB) },
    uColorC:  { value: new THREE.Color(colorC) },
  }), [colorA, colorB, colorC]);

  const geo = useMemo(() => new THREE.RingGeometry(0.85, 1.0, 128, 1), []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, dt) => {
    const t    = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = t - BANG - delay;
    const active  = elapsed >= -0.02 && elapsed <= 2.5;
    if (!active) { if (mesh.visible) mesh.visible = false; return; }
    if (!mesh.visible) mesh.visible = true;

    uniforms.uElapsed.value += dt;
    const k      = Math.max(0, elapsed) / 2.5;
    const eased  = 1 - Math.pow(1 - k, 2.8);
    mesh.scale.setScalar(Math.max(0.001, eased * 38));
    uniforms.uOpacity.value = Math.pow(1 - k, 1.4) * (1 - delay * 0.25);
    mesh.lookAt(0, 0, 50);
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <shaderMaterial
        uniforms={uniforms}
        transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        vertexShader={/* glsl */`
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `}
        fragmentShader={/* glsl */`
          precision highp float;
          varying vec2 vUv;
          uniform float uElapsed, uOpacity;
          uniform vec3 uColorA, uColorB, uColorC;
          void main(){
            float d = abs(vUv.x - 0.5) * 2.0;
            float core   = pow(1.0 - smoothstep(0.0,1.0,d), 1.2);
            float inner  = 1.0 - smoothstep(0.0,0.38,d);
            float middle = 1.0 - smoothstep(0.2,0.7,d);
            float outer  = 1.0 - smoothstep(0.5,1.0,d);
            vec3 col = uColorA*inner + uColorB*middle*0.7 + uColorC*outer*0.5;
            gl_FragColor = vec4(col * 3.2, core * uOpacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

function Shockwave() {
  return (
    <>
      <ShockwaveRing delay={0.00} colorA="#ffffff" colorB="#ff8a3a" colorC="#7af0ff" />
      <ShockwaveRing delay={0.12} colorA="#ffe0a0" colorB="#ff5030" colorC="#30d0ff" />
      <ShockwaveRing delay={0.28} colorA="#ffc060" colorB="#c02060" colorC="#00b8ff" />
    </>
  );
}

// ============================================================
// 4. WHITE FLASH — fullscreen billboard at bang
// ============================================================
function WhiteFlash() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const geo     = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ camera }) => {
    const t    = useCinematicStore.getState().time;
    const mesh = meshRef.current;
    if (!mesh || !matRef.current) return;
    const elapsed = t - BANG;
    let opacity = 0;
    if (elapsed >= -0.04 && elapsed < 1.1) {
      opacity = elapsed < 0
        ? Math.pow((elapsed + 0.04) / 0.04, 4) * 0.7
        : Math.pow(Math.max(0, 1 - elapsed / 1.1), 2.2);
    }
    if (opacity < 0.001) { if (mesh.visible) mesh.visible = false; return; }
    if (!mesh.visible) mesh.visible = true;
    matRef.current.opacity = opacity;
    mesh.position.copy(camera.position);
    S.vec.set(0, 0, -1).applyQuaternion(camera.quaternion);
    mesh.position.addScaledVector(S.vec, 2);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.setScalar(10);
  });

  return (
    <mesh ref={meshRef} geometry={geo} renderOrder={9999}>
      <meshBasicMaterial ref={matRef} color="#ffffff" transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// ============================================================
// 5. PRIMAL ASTEROIDS — 3 bodies drift out, then orbit
// ============================================================
const PRIMAL_CONFIG = [
  { id:'asteroid-1', tint:'gold'  as PrimalTint, driftDir:[-0.9, 0.35,-0.25] as [number,number,number],
    orbitRadius:8,  orbitPhase:Math.PI*0.15, orbitSpeed:0.18, scale:1.35, seed:13,
    labelStart:20.0, labelText:'Một thời đại mới',  labelColor:'#ffc857' },
  { id:'asteroid-2', tint:'pink'  as PrimalTint, driftDir:[0.85,-0.20, 0.40] as [number,number,number],
    orbitRadius:10.5,orbitPhase:Math.PI*0.85, orbitSpeed:0.14, scale:1.65, seed:27,
    labelStart:21.5, labelText:'Một kỷ nguyên mới',   labelColor:'#ff5aa8' },
  { id:'asteroid-3', tint:'cyan'  as PrimalTint, driftDir:[0.15, 0.70,-0.85] as [number,number,number],
    orbitRadius:13,  orbitPhase:Math.PI*1.55, orbitSpeed:0.11, scale:1.5, seed:41,
    labelStart:23.0, labelText:'Một vũ trụ mới',     labelColor:'#3ae8ff' },
] as const;

function PrimalLabel({ text, color, fade }: { text:string; color:string; fade:number }) {
  if (fade < 0.01) return null;
  return (
    <Html center distanceFactor={15} zIndexRange={[10,0]}
      style={{ pointerEvents:'none', userSelect:'none', opacity: fade, transform:'translate(0,-198px)', transition:'opacity 0.3s ease-out' }}
    >
      <div style={{
        color:'#fff', fontFamily:'system-ui,sans-serif', fontWeight:700,
        fontSize:'4.35rem', letterSpacing:'0.08em', whiteSpace:'nowrap',
        background:'rgba(0,0,0,0.22)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        padding:'27px 60px', borderRadius:'999px',
        border:`1px solid ${color}55`,
        boxShadow:`0 0 60px ${color}99, 0 0 150px ${color}44, inset 0 0 42px ${color}22`,
        textShadow:`0 0 30px ${color}, 0 0 66px ${color}88`,
      }}>
        <span style={{
          background:`linear-gradient(180deg,#ffffff 0%,${color} 100%)`,
          WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent',
        }}>{text}</span>
      </div>
    </Html>
  );
}

function PrimalWithFollower({ cfg }: { cfg: typeof PRIMAL_CONFIG[number] }) {
  const handle      = useRef<CinematicPlanetHandle>(null);
  const follower    = useRef<THREE.Group>(null);
  const visRef      = useRef(false);
  const fadeRef     = useRef(0);
  const [fade, setFade] = useState(0);

  useFrame(() => {
    const t = useCinematicStore.getState().time;

    // Sync follower group to asteroid world position
    if (handle.current && follower.current) {
      handle.current.getWorldPosition(S.pos);
      follower.current.position.copy(S.pos);
    }

    // Label fade window
    const start = cfg.labelStart;
    const shouldShow = t >= start && t <= SCENE_END;
    const newFade = shouldShow
      ? smoothstep(start, start + 0.8, t) * (1 - smoothstep(SCENE_END - 1.5, SCENE_END, t))
      : 0;
    if (Math.abs(newFade - fadeRef.current) > 0.025) {
      fadeRef.current = newFade;
      setFade(newFade);
    }
    if (shouldShow !== visRef.current) visRef.current = shouldShow;

    // Hide asteroid before primal reveal
    if (handle.current?.group) {
      const reveal = t >= PRIMAL_REVEAL - 0.3;
      if (handle.current.group.visible !== reveal) handle.current.group.visible = reveal;
    }
  });

  return (
    <>
      <CinematicPlanet
        ref={handle} id={cfg.id} tint={cfg.tint}
        driftDir={cfg.driftDir} orbitRadius={cfg.orbitRadius}
        orbitPhase={cfg.orbitPhase} orbitSpeed={cfg.orbitSpeed}
        scale={cfg.scale} seed={cfg.seed}
      />
      <group ref={follower}>
        <PrimalLabel text={cfg.labelText} color={cfg.labelColor} fade={fade} />
      </group>
    </>
  );
}

// ============================================================
// 6. SUN REVEAL — emerges from dust at 16.5s (start of awakening phase)
// ============================================================
function SunReveal() {
  const groupRef  = useRef<THREE.Group>(null);
  const revealRef = useRef(0);
  const [reveal, setReveal] = useState(0);
  const bucketRef = useRef(-1);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;
    const vis = t >= 16.5;
    if (groupRef.current.visible !== vis) groupRef.current.visible = vis;
    if (!vis) return;

    const r = smootherstep(17.0, 20.0, t);
    revealRef.current = r;
    const sc = THREE.MathUtils.lerp(0.82, 1.0, smootherstep(17.0, 22.0, t));
    groupRef.current.scale.setScalar(sc);

    const bucket = Math.floor(r * 80);
    if (bucket !== bucketRef.current) { bucketRef.current = bucket; setReveal(r); }
  });

  return (
    <group ref={groupRef}>
      <Sun position={[0,0,0]} scale={3.2} reveal={reveal} intensity={1.0} />
    </group>
  );
}

// ============================================================
// 7. DUST CLOUD
// ============================================================
function DustCloud() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useCinematicStore((s) => s.quality);

  const cfg = useMemo(() => {
    const count = quality.debrisCount;
    const dirs  = new Float32Array(count*3), speeds = new Float32Array(count), sizes = new Float32Array(count);
    for (let i=0; i<count; i++) {
      const th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
      dirs[i*3] = Math.sin(ph)*Math.cos(th); dirs[i*3+1] = Math.cos(ph); dirs[i*3+2] = Math.sin(ph)*Math.sin(th);
      speeds[i] = 0.5 + Math.random()*2.2; sizes[i] = 0.14 + Math.random()*0.38;
    }
    return { count, dirs, speeds, sizes };
  }, [quality.debrisCount]);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color:'#b08050', transparent: true, opacity:0.7,
    blending: THREE.NormalBlending, depthWrite: false,
  }), []);

  useEffect(() => {
    const mesh = meshRef.current; if (!mesh) return;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    S.scale.setScalar(0); S.mat.compose(S.pos.set(0,0,0), S.quat.identity(), S.scale);
    for (let i=0; i<cfg.count; i++) mesh.setMatrixAt(i, S.mat);
    mesh.instanceMatrix.needsUpdate = true;
    return () => { geo.dispose(); mat.dispose(); };
  }, [cfg, geo, mat]);

  useFrame(() => {
    const t    = useCinematicStore.getState().time;
    const mesh = meshRef.current; if (!mesh) return;
    const elapsed = t - BANG;
    const active  = elapsed >= 0 && elapsed <= 9;
    if (!active) { if (mesh.visible) mesh.visible = false; return; }
    if (!mesh.visible) mesh.visible = true;
    mat.opacity = 0.7 * smoothstep(0, 0.4, elapsed) * (1 - smoothstep(6, 9, elapsed));
    for (let i=0; i<cfg.count; i++) {
      const i3 = i*3, dist = cfg.speeds[i] * elapsed * 1.5;
      S.pos.set(cfg.dirs[i3]*dist, cfg.dirs[i3+1]*dist, cfg.dirs[i3+2]*dist);
      const s = cfg.sizes[i] * (1 - smoothstep(5, 8, elapsed)*0.6);
      S.scale.setScalar(s);
      S.euler.set(elapsed*(0.3+i*0.01), elapsed*0.4, 0);
      TUMBLE_QUAT.setFromEuler(S.euler);
      S.mat.compose(S.pos, TUMBLE_QUAT, S.scale);
      mesh.setMatrixAt(i, S.mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, cfg.count]} frustumCulled={false} />;
}

// ============================================================
// SCENE ROOT
// ============================================================
export function BigBangClash() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = useCinematicStore.getState().time;
    if (!groupRef.current) return;
    const vis = t >= CONVERGENCE_START - 0.5;
    if (groupRef.current.visible !== vis) groupRef.current.visible = vis;
  });

  return (
    <group ref={groupRef}>
      <CollisionPair />
      <WhiteFlash />
      <Shockwave />
      <ExplosionDebris />
      <DustCloud />
      {PRIMAL_CONFIG.map((c) => <PrimalWithFollower key={c.id} cfg={c} />)}
      <SunReveal />
      <ambientLight intensity={0.18} />
    </group>
  );
}
