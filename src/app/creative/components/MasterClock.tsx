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

    // ── Boot / Creation ─────────────────────────────────────────
    cue(0.10, 'warp-jump',      { volume: 0.85 });
    cue(0.40, 'data-beep',      { volume: 0.45, rate: 2.0 });
    cue(1.50, 'data-beep',      { volume: 0.35, rate: 1.8 });
    cue(3.50, 'planet-discover',{ volume: 0.5  });

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
