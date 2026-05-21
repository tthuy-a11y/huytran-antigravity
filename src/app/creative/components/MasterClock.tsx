'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCinematicStore, BIG_BANG_TIME, CINEMATIC_DURATION } from '@/app/creative/lib/cinematicStore';
import { audioEngine } from '@/app/creative/lib/audioEngine';

// ============================================================
// MASTER CLOCK — 42s front-loaded timeline
// Big Bang at 9.5s. Audio cues fire once per threshold crossing.
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

    // ── Boot / Creation (5-Layer Audio Timeline) ──────────────────
    // Layer 1 (Cosmic Ambient) is continuously playing via background mix.
    // Layer 2: Warp Jump
    cue(0.10, 'warp-jump',       { volume: 0.85 });
    
    // Layer 3: Digital Data Pulse
    cue(0.40, 'data-beep',       { volume: 0.65, rate: 2.0 });
    
    // Layer 4: Rising Energy Synth
    cue(1.00, 'planet-discover', { volume: 0.55, rate: 0.8 });
    
    // Layer 3 (repeated): Data Pulse
    cue(1.50, 'data-beep',       { volume: 0.70, rate: 2.3 });
    
    // Layer 5: Particle Whoosh (layered light streaks)
    cue(2.80, 'laser',           { volume: 0.40, rate: 1.8 });
    cue(2.90, 'laser',           { volume: 0.40, rate: 1.9 });
    cue(3.00, 'laser',           { volume: 0.40, rate: 2.0 });
    
    // Layer 2 + 5: Warp Impact + Creation Burst (arrival at z=22)
    cue(3.50, 'shockwave',       { volume: 0.90 });
    cue(3.50, 'glass-shatter',   { volume: 0.60, rate: 0.7 });

    // ── Technology ──────────────────────────────────────────────
    cue(5.10, 'warp-jump',      { volume: 0.65 });
    cue(6.80, 'laser',          { volume: 0.55 });
    cue(8.00, 'glass-shatter',  { volume: 0.75 });

    // ── Pre-bang buildup ─────────────────────────────────────────
    cue(8.80, 'meteor-impact',  { volume: 0.85 });
    cue(9.20, 'glass-shatter',  { volume: 0.90, rate: 0.8 });

    // ── BIG BANG 9.5s ────────────────────────────────────────────
    cue(BIG_BANG_TIME,      'big-bang',       { volume: 1.0  });
    cue(BIG_BANG_TIME,      'shockwave',      { volume: 1.0  });
    cue(BIG_BANG_TIME + 0.1,'glass-shatter',  { volume: 0.85, rate: 1.3 });

    // ── Post-bang debris / pillars ───────────────────────────────
    cue(11.5, 'meteor-impact',  { volume: 0.60 });
    cue(14.0, 'planet-discover',{ volume: 0.65 });
    cue(17.0, 'planet-discover',{ volume: 0.70 });
    cue(20.0, 'planet-discover',{ volume: 0.60 });

    // ── Awakening ────────────────────────────────────────────────
    cue(22.5, 'planet-discover',{ volume: 0.55 });
    cue(27.0, 'data-beep',      { volume: 0.50 });

    // ── Climax outro ─────────────────────────────────────────────
    cue(35.0, 'warp-jump',      { volume: 0.80 });
    cue(38.5, 'laser',          { volume: 0.70, rate: 0.9 });
    cue(41.0, 'shockwave',      { volume: 1.0,  rate: 1.6 });

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
