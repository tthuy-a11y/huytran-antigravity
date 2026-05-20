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
    t < 13.0
      ? 0
      : t < BIG_BANG_TIME
      ? Math.pow((t - 13.0) / (BIG_BANG_TIME - 13.0), 1.8) * 0.85
      : 0;

  const decay =
    t > BIG_BANG_TIME
      ? Math.exp(-(t - BIG_BANG_TIME) * 1.4) * 1.2
      : 0;

  let baseline: number;
  if (t < 7.0) {
    baseline = 0.55 + smoothstep(2.0, 7.0, t) * 0.4;
  } else if (t < 13.0) {
    baseline = 0.95;
  } else if (t < BIG_BANG_TIME) {
    baseline = 0.95;
  } else if (t < 22.0) {
    baseline = THREE.MathUtils.lerp(1.0, 1.4, smoothstep(18.0, 22.0, t));
  } else {
    baseline = 1.0 + smoothstep(22.0, 28.0, t) * 0.3;
  }

  return baseline + bangContribution + buildup + decay;
}

export function chromaticAt(t: number): number {
  let v = 0;
  if (t >= 7.0 && t < 13.0) {
    v = 0.0008 + 0.0004 * Math.sin(t * 6.0);
  }
  if (t >= 13.0 && t < BIG_BANG_TIME) {
    v = THREE.MathUtils.lerp(0.001, 0.006, smoothstep(13.0, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.35;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  v += bang * 0.020;
  if (t > BIG_BANG_TIME && t < 19.0) {
    v += Math.exp(-(t - BIG_BANG_TIME) * 2.2) * 0.008;
  }
  if (t >= 22.0) v = 0;
  return v;
}

export function noiseAt(t: number): number {
  let v = 0.05;
  if (t >= 7.0 && t < 13.0) v = 0.12;
  if (t >= 13.0 && t < BIG_BANG_TIME) {
    v = THREE.MathUtils.lerp(0.12, 0.35, smoothstep(13.0, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.4;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  v += bang * 0.45;
  if (t > BIG_BANG_TIME && t < 19.5) {
    v = Math.max(v, 0.18 * Math.exp(-(t - BIG_BANG_TIME) * 1.8));
  }
  if (t >= 22.0) {
    v = THREE.MathUtils.lerp(0.12, 0.04, smoothstep(22.0, 26.0, t));
  }
  return v;
}

export function vignetteAt(t: number): number {
  if (t < 7.0) return THREE.MathUtils.lerp(0.85, 0.55, smoothstep(0, 7.0, t));
  if (t < 13.0) return 0.4;
  if (t < BIG_BANG_TIME) {
    return THREE.MathUtils.lerp(0.4, 0.15, smoothstep(13.0, BIG_BANG_TIME, t));
  }
  const bangSigma = 0.3;
  const bang = Math.exp(
    -((t - BIG_BANG_TIME) * (t - BIG_BANG_TIME)) / (2 * bangSigma * bangSigma)
  );
  if (t < 18.5) {
    return THREE.MathUtils.lerp(0.4, 0.05, Math.max(bang, smoothstep(BIG_BANG_TIME - 0.5, BIG_BANG_TIME + 1.0, t)));
  }
  if (t < 22.0) {
    return THREE.MathUtils.lerp(0.05, 0.35, smoothstep(18.5, 22.0, t));
  }
  return THREE.MathUtils.lerp(0.35, 0.55, smoothstep(22.0, 28.0, t));
}

export function dofFocusAt(t: number): { focusDistance: number; bokehScale: number } {
  if (t < 22.0) return { focusDistance: 1.0, bokehScale: 0 };
  const k = smoothstep(22.0, 27.0, t);
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
    const intensity = bloomIntensityAt(t);
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