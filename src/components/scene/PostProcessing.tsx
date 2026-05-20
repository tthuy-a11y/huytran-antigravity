"use client";

import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

export default function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.3}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        eskil={false}
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <SMAA />
    </EffectComposer>
  );
}
