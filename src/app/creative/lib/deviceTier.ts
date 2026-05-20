/**
 * deviceTier.ts
 * ──────────────────────────────────────────────────────────────────
 * Phát hiện hiệu năng device để quyết định bật/tắt features.
 *
 * Tier:
 *   - high: GPU desktop, full bloom + 5000 particles + post-FX
 *   - mid:  laptop, integrated GPU, giảm particle, no chromatic
 *   - low:  mobile cũ / low-power mode, fallback 2D
 *
 * Cách xác định:
 *   1. `navigator.hardwareConcurrency` (số CPU cores)
 *   2. `navigator.deviceMemory` (RAM, only on some browsers)
 *   3. WebGL renderer string (GPU info)
 *   4. Touch + width (mobile detection)
 *   5. prefersReducedMotion override
 *
 * Sau khi detect → lưu vào Zustand store.
 */

export type DeviceTier = 'high' | 'mid' | 'low';

interface DeviceInfo {
  tier: DeviceTier;
  cores: number;
  memoryGb: number | null;
  isMobile: boolean;
  hasReducedMotion: boolean;
  gpu: string;
  webgl2: boolean;
  reasoning: string[];
}

export function detectDeviceTier(): DeviceInfo {
  const reasoning: string[] = [];

  // — CPU cores —
  const cores = navigator.hardwareConcurrency ?? 4;
  reasoning.push(`cores=${cores}`);

  // — Memory (not on Safari) —
  const memoryGb = (navigator as any).deviceMemory ?? null;
  if (memoryGb !== null) reasoning.push(`mem=${memoryGb}GB`);

  // — Mobile detection (touch + viewport) —
  const isMobile =
    'ontouchstart' in window &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
  reasoning.push(`mobile=${isMobile}`);

  // — Reduced motion preference —
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hasReducedMotion) reasoning.push('prefers-reduced-motion');

  // — GPU info via WebGL —
  let gpu = 'unknown';
  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    webgl2 = !!gl;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
    reasoning.push(`webgl2=${webgl2}`, `gpu=${gpu.substring(0, 40)}`);
  } catch (e) {
    reasoning.push('webgl-error');
  }

  // — Decide tier —
  let tier: DeviceTier;

  if (hasReducedMotion) {
    tier = 'low';
    reasoning.push('→ low (reduced motion)');
  } else if (!webgl2) {
    tier = 'low';
    reasoning.push('→ low (no webgl2)');
  } else if (isMobile && cores <= 4) {
    tier = 'low';
    reasoning.push('→ low (mobile + cores ≤4)');
  } else if (isMobile) {
    tier = 'mid';
    reasoning.push('→ mid (mobile but >4 cores)');
  } else if (cores >= 8 && (memoryGb === null || memoryGb >= 8)) {
    // Check if GPU string suggests dedicated card
    const isDedicatedGpu = /nvidia|radeon|geforce|rtx|gtx/i.test(gpu);
    if (isDedicatedGpu) {
      tier = 'high';
      reasoning.push('→ high (8+ cores + dedicated GPU)');
    } else {
      tier = 'mid';
      reasoning.push('→ mid (8+ cores but integrated GPU)');
    }
  } else {
    tier = 'mid';
    reasoning.push('→ mid (default)');
  }

  return { tier, cores, memoryGb, isMobile, hasReducedMotion, gpu, webgl2, reasoning };
}

/**
 * Số presets cho từng tier — dùng trong R3F components.
 */
export const TIER_PRESETS = {
  high: {
    particleCount: 5000,
    starCount: 3000,
    bloomMipmap: true,
    chromaticAberration: true,
    godRays: true,
    filmGrain: true,
    pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1),
    msaa: 4,
    shadowMap: true,
    audioFftSize: 64,
    enableEchoTrails: true,
  },
  mid: {
    particleCount: 2000,
    starCount: 1500,
    bloomMipmap: false,
    chromaticAberration: false,
    godRays: false,
    filmGrain: true,
    pixelRatio: 1.5,
    msaa: 0,
    shadowMap: false,
    audioFftSize: 32,
    enableEchoTrails: false,
  },
  low: {
    particleCount: 500,
    starCount: 600,
    bloomMipmap: false,
    chromaticAberration: false,
    godRays: false,
    filmGrain: false,
    pixelRatio: 1,
    msaa: 0,
    shadowMap: false,
    audioFftSize: 16,
    enableEchoTrails: false,
  },
} as const;

/**
 * Init device detection vào store. Gọi 1 lần khi mount.
 */
export function initDeviceTier(setTier: (tier: DeviceTier) => void, setReducedMotion: (b: boolean) => void) {
  if (typeof window === 'undefined') return;

  const info = detectDeviceTier();

  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed('[DeviceTier] Detection');
    console.log('Tier:', info.tier);
    console.log('Cores:', info.cores);
    console.log('Memory:', info.memoryGb ? `${info.memoryGb}GB` : 'unknown');
    console.log('Mobile:', info.isMobile);
    console.log('GPU:', info.gpu);
    console.log('WebGL2:', info.webgl2);
    console.log('Reasoning:', info.reasoning);
    console.groupEnd();
  }

  setTier(info.tier);
  setReducedMotion(info.hasReducedMotion);

  // Listen for reduced-motion changes
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => {
    setReducedMotion(e.matches);
    if (e.matches) setTier('low');
  };
  if (mq.addEventListener) {
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  } else {
    // Legacy Safari
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }
}
