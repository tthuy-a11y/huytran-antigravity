// src/store/useFleetStore.ts
// Global Zustand store — đồng bộ phase giữa R3F Canvas (bất tử) và tất cả các page DOM.
// Không bị unmount khi router.push — animation warp liên tục.

import { create } from 'zustand';

export type FlightPhase = 'idle' | 'power-up' | 'warping' | 'arrival';

interface FleetState {
  flightPhase: FlightPhase;
  currentShip: string | null;
  setPhase: (phase: FlightPhase) => void;
  setCurrentShip: (shipId: string | null) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  flightPhase: 'idle',
  currentShip: null,
  setPhase: (phase) => set({ flightPhase: phase }),
  setCurrentShip: (shipId) => set({ currentShip: shipId }),
}));
