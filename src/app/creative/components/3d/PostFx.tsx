/**
 * PostFx.tsx
 *
 * Post-processing pipeline cho cinematic.
 * Effects bind vào cinematicTargets.fx (GSAP-driven uniforms).
 */

'use client';

import { EffectComposer } from '@react-three/postprocessing';
import {
  BlendFunction,
  KernelSize,
  BloomEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  VignetteEffect
} from 'postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { cinematicTargets } from '../../lib/cinematicTimeline';
import { useCinematicStore } from '../../lib/cinematicStore';

export function PostFx() {
  const deviceTier = useCinematicStore((s) => s.deviceTier);
  const { camera } = useThree();

  // Create raw effects to avoid React 19 "ref as prop" JSON.stringify bug in @react-three/postprocessing
  const bloom = useMemo(() => new BloomEffect({
    intensity: deviceTier === 'high' ? 1.2 : 0.8,
    luminanceThreshold: deviceTier === 'high' ? 0.3 : 0.4,
    luminanceSmoothing: deviceTier === 'high' ? 0.5 : 0.4,
    kernelSize: deviceTier === 'high' ? KernelSize.LARGE : KernelSize.MEDIUM,
    mipmapBlur: deviceTier === 'high'
  }), [deviceTier]);

  const chromatic = useMemo(() => new ChromaticAberrationEffect({
    blendFunction: BlendFunction.NORMAL,
    offset: new THREE.Vector2(0.0005, 0.0005),
    radialModulation: false,
    modulationOffset: 0.15,
  }), []);

  const noise = useMemo(() => {
    const effect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: true
    });
    effect.blendMode.opacity.value = 0.15;
    return effect;
  }, []);

  const vignette = useMemo(() => new VignetteEffect({
    eskil: false,
    offset: deviceTier === 'high' ? 0.2 : 0.25,
    darkness: deviceTier === 'high' ? 0.6 : 0.5
  }), [deviceTier]);

  useFrame(() => {
    const fx = cinematicTargets.fx;
    bloom.intensity = fx.bloomIntensity;
    chromatic.offset.set(fx.chromaticAberration, fx.chromaticAberration);
    noise.blendMode.opacity.value = fx.filmGrainIntensity;
    // VignetteEffect uses uniforms internally in postprocessing
    vignette.uniforms.get('darkness')!.value = fx.vignetteDarkness;
  });

  if (deviceTier === 'low') {
    return (
      <EffectComposer>
        <primitive object={vignette} />
      </EffectComposer>
    );
  }

  if (deviceTier === 'mid') {
    return (
      <EffectComposer>
        <primitive object={bloom} />
        <primitive object={chromatic} />
        <primitive object={vignette} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <primitive object={bloom} />
      <primitive object={chromatic} />
      <primitive object={noise} />
      <primitive object={vignette} />
    </EffectComposer>
  );
}
