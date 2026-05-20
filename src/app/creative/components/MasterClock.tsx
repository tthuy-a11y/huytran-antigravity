'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCinematicStore, BIG_BANG_TIME, CINEMATIC_DURATION } from '@/app/creative/lib/cinematicStore';
import { audioEngine } from '@/app/creative/lib/audioEngine';

// ============================================================
// MASTER CLOCK
// Increments Zustand `time` from 0 → 30s while `isPlaying`.
// Lives inside Canvas so it ticks on the WebGL render loop.
// ============================================================
export function MasterClock({
  onFinished,
}: {
  onFinished?: () => void;
}) {
  const finishedFiredRef = useRef(false);

  useFrame((_, delta) => {
    const state = useCinematicStore.getState();
    if (!state.isPlaying) return;

    // Clamp delta to avoid massive jumps after tab blur / debugging pauses
    const dt = Math.min(delta, 1 / 30);

    const next = state.time + dt;
    state.setTime(next);

    // Audio Choreography Timeline
    const playAt = (timeTrigger: number, cueId: any, options?: any) => {
      if (next >= timeTrigger && state.time < timeTrigger) {
        audioEngine.playCue(cueId, options);
      }
    };

    playAt(0.2, 'data-beep', { volume: 0.4 });
    playAt(6.5, 'warp-jump', { volume: 0.6 });
    playAt(9.0, 'laser', { volume: 0.5 });
    playAt(13.5, 'glass-shatter', { volume: 0.7 });
    playAt(15.5, 'meteor-impact', { volume: 0.8 });
    playAt(BIG_BANG_TIME, 'big-bang', { volume: 1.0 });
    playAt(BIG_BANG_TIME, 'shockwave', { volume: 1.0 });
    playAt(22.5, 'planet-discover', { volume: 0.6 });
    // Synced with "Chào mừng đến với Hệ Hành Tinh" (28.0s)
    playAt(28.0, 'data-beep', { volume: 0.5 });
    // Synced with "TH2003" explosion (28.0s + 0.6s delay)
    playAt(28.6, 'shockwave', { volume: 0.4, rate: 1.5 });

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
