"use client";

import { create } from "zustand";

export interface PlanetState {
  id: string;
  isFocused: boolean;
}

interface SceneStore {
  focusedPlanetId: string | null;
  hoveredPlanetId: string | null;
  sunFocused: boolean;
  paused: boolean;
  setFocusedPlanet: (id: string | null) => void;
  setHoveredPlanet: (id: string | null) => void;
  setSunFocused: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  reset: () => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  focusedPlanetId: null,
  hoveredPlanetId: null,
  sunFocused: false,
  paused: false,
  setFocusedPlanet: (id) =>
    set({ focusedPlanetId: id, paused: id !== null, sunFocused: false }),
  setHoveredPlanet: (id) => set({ hoveredPlanetId: id }),
  setSunFocused: (v) => set({ sunFocused: v, paused: v, focusedPlanetId: null }),
  setPaused: (v) => set({ paused: v }),
  reset: () =>
    set({
      focusedPlanetId: null,
      hoveredPlanetId: null,
      sunFocused: false,
      paused: false,
    }),
}));
