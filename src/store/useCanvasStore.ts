'use client';
import { create } from 'zustand';
import type { ComponentType } from 'react';

interface CameraOverride {
  position?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

interface CanvasState {
  scene: ComponentType | null;
  cameraOverride: CameraOverride | null;
  setScene: (scene: ComponentType | null, cameraOverride?: CameraOverride | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  scene: null,
  cameraOverride: null,
  setScene: (scene, cameraOverride = null) => set({ scene, cameraOverride }),
}));
