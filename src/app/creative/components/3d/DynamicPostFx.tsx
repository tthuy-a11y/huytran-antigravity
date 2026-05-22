'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { 
  BlendFunction, 
  KernelSize, 
  Resolution, 
  BloomEffect, 
  ChromaticAberrationEffect, 
  NoiseEffect, 
  VignetteEffect, 
  DepthOfFieldEffect 
} from 'postprocessing';
import * as THREE from 'three';
import {
  useCinematicStore,
  BIG_BANG_TIME,
  smoothstep,
  smootherstep,
  ramp,
} from '@/app/creative/lib/cinematicStore';

// ============================================================
// TIME-DRIVEN POST-FX ENVELOPES
// Each function maps current time → effect intensity.
// ALL math is pure: safe to call inside useFrame.
// ============================================================

export function bloomIntensityAt(t: number): number {
  const bangSigma = 0.25;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  const bangContribution = bang * 3.5;

  const buildup =
    t < 7.5
      ? 0
      : t < BIG_BANG_TIME
      ? Math.pow((t - 7.5) / (BIG_BANG_TIME - 7.5), 1.8) * 0.85
      : 0;

  const decay =
    t > BIG_BANG_TIME
      ? Math.exp(-(t - BIG_BANG_TIME) * 1.4) * 1.2
      : 0;

  let baseline: number;
  if (t < 5.0) {
    // Intense bloom flare during warp approach (peaks at 2s, fades by 4.5s)
    const warpFlare = THREE.MathUtils.lerp(0.0, 1.8, smoothstep(0.5, 2.0, t)) * (1 - smoothstep(3.0, 4.5, t));
    baseline = 0.55 + warpFlare + smoothstep(2.0, 5.0, t) * 0.4;
  } else if (t < 7.5) {
    baseline = 0.95;
  } else if (t < BIG_BANG_TIME) {
    baseline = 0.95;
  } else if (t < 17.0) {
    baseline = THREE.MathUtils.lerp(1.0, 1.4, smoothstep(14.0, 17.0, t));
  } else {
    baseline = 1.0 + smoothstep(17.0, 21.0, t) * 0.3;
  }

  return baseline + bangContribution + buildup + decay;
}

export function chromaticAt(t: number): number {
  let v = 0;
  
  // Warp speed RGB shift (peaks at 1.5s when speed is highest, decays by 3.5s)
  if (t > 0.0 && t < 4.8) {
    v += THREE.MathUtils.lerp(0.0, 0.035, smoothstep(0.5, 1.5, t)) * (1 - smoothstep(4.0, 4.8, t));
  }

  if (t >= 5.0 && t < 7.5) {
    v = 0.0008 + 0.0004 * Math.sin(t * 6.0);
  }
  if (t >= 7.5 && t < BIG_BANG_TIME) {
    v = THREE.MathUtils.lerp(0.001, 0.006, smoothstep(7.5, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.35;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  v += bang * 0.020;
  if (t > BIG_BANG_TIME && t < 15.0) {
    v += Math.exp(-(t - BIG_BANG_TIME) * 2.2) * 0.008;
  }
  
  // V8 - Post-processing upgrades for Awakening Outro
  if (t >= 17.0) {
    v = 0;
    // 1. Title card slam shockwave thump at t = 24.5s
    if (t >= 24.5 && t < 25.5) {
      const elapsed = t - 24.5;
      v += Math.exp(-elapsed * 5.0) * 0.022; // Quick sharp decay
    }
    // 2. Final warp speed pullback streaking at t = 27.75s to 28.25s
    if (t >= 27.75 && t <= 28.25) {
      const elapsed = t - 27.75;
      v += (elapsed / 0.5) * 0.038; // Intense warp streak
    }
  }
  return v;
}

export function noiseAt(t: number): number {
  let v = 0.05;
  if (t >= 5.0 && t < 7.5) v = 0.12;
  if (t >= 7.5 && t < BIG_BANG_TIME) {
    v = THREE.MathUtils.lerp(0.12, 0.35, smoothstep(7.5, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.4;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  v += bang * 0.45;
  if (t > BIG_BANG_TIME && t < 15.0) {
    v = Math.max(v, 0.18 * Math.exp(-(t - BIG_BANG_TIME) * 1.8));
  }
  if (t >= 17.0) {
    v = THREE.MathUtils.lerp(0.12, 0.04, smoothstep(17.0, 20.0, t));
  }
  return v;
}

export function vignetteAt(t: number): number {
  if (t < 2.0) return THREE.MathUtils.lerp(0.98, 0.70, smoothstep(0, 2.0, t));
  if (t < 5.0) return THREE.MathUtils.lerp(0.70, 0.55, smoothstep(2.0, 5.0, t));
  if (t < 7.5) return 0.4;
  if (t < BIG_BANG_TIME) {
    return THREE.MathUtils.lerp(0.4, 0.15, smoothstep(7.5, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.3;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  if (t < 14.5) {
    return THREE.MathUtils.lerp(0.4, 0.05, Math.max(bang, smoothstep(BIG_BANG_TIME - 0.5, BIG_BANG_TIME + 1.0, t)));
  }
  if (t < 17.0) {
    return THREE.MathUtils.lerp(0.05, 0.35, smoothstep(14.5, 17.0, t));
  }
  return THREE.MathUtils.lerp(0.35, 0.55, smoothstep(17.0, 21.0, t));
}

export function dofFocusAt(t: number): { focusDistance: number; bokehScale: number } {
  // Cinematic Planet Flyby (macro focus on planet, blur stars)
  if (t >= 2.5 && t < 4.5) {
    const bokeh = smoothstep(2.5, 3.2, t) * (1 - smoothstep(3.8, 4.5, t)) * 3.5;
    const focus = THREE.MathUtils.lerp(0.05, 0.005, smoothstep(2.5, 3.8, t));
    return { focusDistance: focus, bokehScale: bokeh };
  }

  if (t < 17.0) return { focusDistance: 1.0, bokehScale: 0 };
  const k = smoothstep(17.0, 20.5, t);
  return {
    focusDistance: 0.012,
    bokehScale: k * 2.5,
  };
}

export function flashAt(t: number): number {
  if (t < BIG_BANG_TIME - 0.05 || t > BIG_BANG_TIME + 0.9) return 0;
  if (t < BIG_BANG_TIME) {
    return Math.pow((t - (BIG_BANG_TIME - 0.05)) / 0.05, 4) * 0.4;
  }
  const k = (t - BIG_BANG_TIME) / 0.9;
  return Math.pow(1 - k, 2.5);
}

// ============================================================
// COMPONENT
// ============================================================
export function DynamicPostFx() {
  const { gl, camera } = useThree();
  const quality = useCinematicStore((s) => s.quality);

  // Detect mobile once for bloom dampening
  const isMobileRef = useRef(
    typeof window !== 'undefined'
      ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      : false
  );

  const bloomKernelSize = useMemo(() => {
    if (quality.bloomResolution >= 512) return KernelSize.HUGE;
    if (quality.bloomResolution >= 256) return KernelSize.LARGE;
    return KernelSize.MEDIUM;
  }, [quality.bloomResolution]);

  const chromaticOffset = useMemo(() => new THREE.Vector2(0, 0), []);

  // Raw effects to bypass React 19 "ref as prop" JSON.stringify bug
  const bloomEffect = useMemo(() => new BloomEffect({
    intensity: 0.55,
    luminanceThreshold: 0.7,
    luminanceSmoothing: 0.4,
    mipmapBlur: true,
    kernelSize: bloomKernelSize,
    resolutionX: Resolution.AUTO_SIZE,
    resolutionY: quality.bloomResolution
  }), [bloomKernelSize, quality.bloomResolution]);

  const chromaticEffect = useMemo(() => new ChromaticAberrationEffect({
    offset: chromaticOffset,
    radialModulation: false,
    modulationOffset: 0,
    blendFunction: BlendFunction.NORMAL
  }), [chromaticOffset]);

  const dofEffect = useMemo(() => new DepthOfFieldEffect(camera, {
    focusDistance: 1.0,
    focalLength: 0.05,
    bokehScale: 0
  }), [camera]);

  const noiseEffect = useMemo(() => {
    const effect = new NoiseEffect({
      premultiply: true,
      blendFunction: BlendFunction.SCREEN
    });
    effect.blendMode.opacity.value = 0.05;
    return effect;
  }, []);

  const vignetteEffect = useMemo(() => new VignetteEffect({
    offset: 0.5,
    darkness: 0.85,
    blendFunction: BlendFunction.NORMAL
  }), []);

  useFrame(() => {
    const t = useCinematicStore.getState().time;

    // ---------- BLOOM ----------
    let intensity = bloomIntensityAt(t);
    // On mobile: reduce bloom intensity in the interactive system phase
    // to prevent the sun's additive glow from causing visible flashing
    if (isMobileRef.current && t >= 17.0) {
      intensity *= 0.6;
    }
    bloomEffect.intensity = intensity;

    const flash = flashAt(t);
    const threshold = THREE.MathUtils.lerp(0.7, 0.0, flash);
    if (bloomEffect.luminanceMaterial) {
      bloomEffect.luminanceMaterial.threshold = threshold;
      bloomEffect.luminanceMaterial.smoothing = THREE.MathUtils.lerp(0.4, 0.95, flash);
    }

    // ---------- CHROMATIC ABERRATION ----------
    const ca = chromaticAt(t);
    chromaticOffset.set(ca, ca);
    if (chromaticEffect.offset) {
      chromaticEffect.offset.set(ca, ca);
    } else if (chromaticEffect.uniforms?.get) {
      chromaticEffect.uniforms.get('offset')?.value.set(ca, ca);
    }

    // ---------- VIGNETTE ----------
    const v = vignetteAt(t);
    if (vignetteEffect.uniforms?.get) {
      vignetteEffect.uniforms.get('darkness')!.value = v;
      vignetteEffect.uniforms.get('offset')!.value = THREE.MathUtils.lerp(0.5, 0.3, v);
    } else {
      (vignetteEffect as any).darkness = v;
      (vignetteEffect as any).offset = THREE.MathUtils.lerp(0.5, 0.3, v);
    }

    // ---------- NOISE ----------
    if (noiseEffect.blendMode) {
      noiseEffect.blendMode.opacity.value = noiseAt(t);
    }

    // ---------- DEPTH OF FIELD ----------
    const { focusDistance, bokehScale } = dofFocusAt(t);
    if (dofEffect.circleOfConfusionMaterial) {
      dofEffect.circleOfConfusionMaterial.uniforms.focusDistance.value = focusDistance;
    }
    
    if (typeof (dofEffect as any).bokehScale === 'number') {
      (dofEffect as any).bokehScale = bokehScale;
    } else if (dofEffect.uniforms?.get) {
      dofEffect.uniforms.get('bokehScale')!.value = bokehScale;
    } else if ((dofEffect.uniforms as any)?.bokehScale) {
      (dofEffect.uniforms as any).bokehScale.value = bokehScale;
    }
  });

  useMemo(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.15;
  }, [gl]);

  return (
    <EffectComposer
      multisampling={quality.msaa ? 4 : 0}
    >
      <primitive object={bloomEffect} />
      <primitive object={chromaticEffect} />
      <primitive object={dofEffect} />
      <primitive object={noiseEffect} />
      <primitive object={vignetteEffect} />
    </EffectComposer>
  );
}