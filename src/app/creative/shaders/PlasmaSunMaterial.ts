import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// ============================================================
// CLASSIC SIMPLEX 3D + FBM NOISE (Ashima Arts / Stefan Gustavson)
// ============================================================
export const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
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
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion — layered noise for plasma turbulence
  float fbm(vec3 p, int octaves, float lacunarity, float gain) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      sum += amp * snoise(p * freq);
      freq *= lacunarity;
      amp *= gain;
    }
    return sum;
  }

  // Ridged multifractal for filaments / flares
  float ridged(vec3 p, int octaves) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      float n = 1.0 - abs(snoise(p * freq));
      n = n * n;
      sum += amp * n;
      freq *= 2.05;
      amp *= 0.5;
    }
    return sum;
  }
`;

// ============================================================
// PLASMA SUN — SURFACE SHADER
// Boiling, turbulent star surface with granulation + flare bands.
// ============================================================
const sunVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const sunFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;       // overall plasma boil amount
  uniform float uReveal;          // 0..1, reveal animation on awakening
  uniform vec3  uColorCore;       // hottest white-yellow center
  uniform vec3  uColorMid;        // amber
  uniform vec3  uColorEdge;       // deep orange / red shadow rim
  uniform vec3  uColorFlare;      // hot ejection highlight
  uniform float uNoiseScale;
  uniform float uFlowSpeed;
  uniform float uMobileDampen; // 0.0 = desktop (full effect), 1.0 = mobile (reduced pulse)

  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vPos) * uNoiseScale;
    float t = uTime * uFlowSpeed;

    // Two-layer flow: large convection cells + fine granulation
    vec3 q1 = p + vec3(0.0, t * 0.25, 0.0);
    vec3 q2 = p * 2.7 + vec3(t * 0.4, -t * 0.3, t * 0.15);

    float convection = fbm(q1, 5, 2.0, 0.55);
    float granulation = fbm(q2, 4, 2.1, 0.5);

    // Hot filaments: ridged noise + time advection
    float flares = ridged(p * 1.6 + vec3(t * 0.6), 5);

    // Combine into a heat field [0, ~1.4]
    float heat = 0.55 + 0.45 * convection + 0.25 * granulation + 0.5 * flares * uIntensity;
    heat = clamp(heat, 0.0, 1.6);

    // Reveal animation: poles wash in first
    float reveal = smoothstep(0.0, 1.0, uReveal);
    heat *= reveal;

    // Color gradient through plasma stages
    vec3 col = mix(uColorEdge, uColorMid, smoothstep(0.25, 0.7, heat));
    col = mix(col, uColorCore, smoothstep(0.7, 1.15, heat));
    col = mix(col, uColorFlare, smoothstep(1.1, 1.45, heat) * 0.9);

    // Fresnel rim — limb darkening reversed for stars (limb brightening on flares)
    float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.0);
    col += uColorFlare * fres * 0.6 * reveal;

    // Pulsing brightness pumps the bloom pass
    // On mobile: reduce pulse amplitude (0.08→0.02) and slow frequency (0.7→0.3)
    float pulseAmp = mix(0.04, 0.015, uMobileDampen);
    float pulseFreq = mix(0.4, 0.25, uMobileDampen);
    float pulse = (1.0 - pulseAmp) + pulseAmp * sin(uTime * pulseFreq);
    col *= pulse;

    // Boost overall so Bloom can grab it — reduce on mobile
    float boostFactor = mix(1.4, 1.12, uMobileDampen);
    col *= boostFactor;

    gl_FragColor = vec4(col, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const PlasmaSunMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uReveal: 1.0,
    uColorCore:  new THREE.Color('#fff6c8'),
    uColorMid:   new THREE.Color('#ffb547'),
    uColorEdge:  new THREE.Color('#ff5a1f'),
    uColorFlare: new THREE.Color('#ffe7a0'),
    uNoiseScale: 2.4,
    uFlowSpeed:  0.18,
    uMobileDampen: 0.0,
  },
  sunVertex,
  sunFragment
);

// ============================================================
// CORONA — additive, view-aligned, fresnel-driven halo
// ============================================================
const coronaVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const coronaFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uReveal;
  uniform float uPower;          // fresnel sharpness
  uniform float uOpacity;
  uniform vec3  uColorInner;
  uniform vec3  uColorOuter;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  ${NOISE_GLSL}

  void main() {
    float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);

    // Slowly rotating noise mask so the corona ripples like god rays
    vec3 p = normalize(vPos) * 3.0;
    float n = fbm(p + vec3(0.0, uTime * 0.08, 0.0), 4, 2.0, 0.55);
    float rays = 0.5 + 0.5 * n;

    float a = fres * rays * uOpacity * smoothstep(0.0, 1.0, uReveal);

    vec3 col = mix(uColorOuter, uColorInner, fres);
    col *= (1.0 + rays * 0.4);

    if (a < 0.002) discard;
    gl_FragColor = vec4(col * a * 2.0, a);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const CoronaMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uReveal: 1.0,
    uPower: 3.0,
    uOpacity: 1.0,
    uColorInner: new THREE.Color('#ffe9a8'),
    uColorOuter: new THREE.Color('#ff7a1a'),
  },
  coronaVertex,
  coronaFragment
);

// ============================================================
// REGISTRATION
// ============================================================
extend({ PlasmaSunMaterialImpl, CoronaMaterialImpl });

// TypeScript JSX intrinsic declarations
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      plasmaSunMaterialImpl: any;
      coronaMaterialImpl: any;
    }
  }
}

// Strongly-typed uniform interfaces (for use in PlanetNode)
export interface PlasmaSunUniforms {
  uTime: number;
  uIntensity: number;
  uReveal: number;
  uColorCore: THREE.Color;
  uColorMid: THREE.Color;
  uColorEdge: THREE.Color;
  uColorFlare: THREE.Color;
  uNoiseScale: number;
  uFlowSpeed: number;
  uMobileDampen: number;
}

export interface CoronaUniforms {
  uTime: number;
  uReveal: number;
  uPower: number;
  uOpacity: number;
  uColorInner: THREE.Color;
  uColorOuter: THREE.Color;
}