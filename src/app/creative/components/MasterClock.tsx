'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCinematicStore, BIG_BANG_TIME, CINEMATIC_DURATION } from '@/app/creative/lib/cinematicStore';
import { audioEngine } from '@/app/creative/lib/audioEngine';

// ============================================================
// MASTER CLOCK — 31s compressed timeline
// Big Bang at 8.0s. Audio cues fire once per threshold crossing.
// Palette: fast-warp whoosh + data flicker → tech sweep → bang climax.
// ============================================================
export function MasterClock({ onFinished }: { onFinished?: () => void }) {
  const finishedFiredRef = useRef(false);

  useFrame((_, delta) => {
    const state = useCinematicStore.getState();
    if (!state.isPlaying) return;

    const dt   = Math.min(delta, 1 / 30);
    const prev = state.time;
    const next = prev + dt;
    state.setTime(next);

    // One-shot cue helper — fires exactly once per threshold crossing
    const cue = (trigger: number, id: any, opts?: any) => {
      if (next >= trigger && prev < trigger) audioEngine.playCue(id, opts);
    };

    // ═══════════════════════════════════════════════════════════
    // CINEMATIC SPACE INTRO CUES (0s → 6.5s)
    // ═══════════════════════════════════════════════════════════
    // Phase 1: Void & Sparkles (0s to 1.5s)
    cue(0.05, 'warp-jump',       { volume: 0.65, rate: 0.35 }); // Growing deep space drone
    cue(0.20, 'planet-discover', { volume: 0.40, rate: 1.30 }); // Text 1 reveal beep: "Trong khoảng lặng..."

    // Phase 2: Hyperspace Warp Speed Rush (1.5s to 3.0s)
    cue(1.40, 'meteor-impact',   { volume: 0.85, rate: 0.40 }); // Deep heart-thump as speed stars accelerate
    cue(1.80, 'data-beep',       { volume: 0.30, rate: 1.40 }); // Text 2 reveal beep: "tôi tìm thấy..."
    cue(2.20, 'warp-jump',       { volume: 0.75, rate: 0.85 }); // Swooshing acceleration line whoosh

    // Phase 3: Swirling Galaxy Reveal & Orbit Approach (3.0s to 5.0s)
    cue(3.00, 'shockwave',       { volume: 0.70, rate: 0.50 }); // Climax whoosh: Swirling galaxy flaring open!
    cue(3.40, 'planet-discover', { volume: 0.45, rate: 1.00 }); // Text 3 reveal beep: "Nơi sáng tạo là chìa khóa..."
    cue(4.20, 'planet-discover', { volume: 0.85, rate: 0.75 }); // Majestic crystalline chime: Golden Sun emerging!

    // Phase 4: Planets Orbit Flyby & Landing Transition (5.0s to 6.5s)
    cue(5.00, 'data-beep',       { volume: 0.35, rate: 1.80 }); // Text 4 reveal beep: "Còn trí tuệ công nghệ..."
    cue(5.40, 'shockwave',       { volume: 0.85, rate: 0.95 }); // Doppler swoosh past orbits
    cue(6.20, 'glass-shatter',   { volume: 0.65, rate: 1.10 }); // Soft digital transition chime

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
