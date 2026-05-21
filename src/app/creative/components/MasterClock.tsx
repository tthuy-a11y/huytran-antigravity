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
    // CREATION 0 → 4.5s  (deep warp zoom — from distant star to sun)
    // ═══════════════════════════════════════════════════════════
    cue(0.10, 'warp-jump',       { volume: 0.65, rate: 0.85 }); // Deep rumble as zoom initiates
    cue(0.90, 'shockwave',       { volume: 0.45, rate: 0.50 }); // Rushing whoosh through space
    cue(1.80, 'planet-discover', { volume: 0.35, rate: 1.20 }); // Slicing through outer orbits
    cue(2.80, 'planet-discover', { volume: 0.55, rate: 0.85 }); // Passing inner glowing planets
    cue(3.60, 'data-beep',       { volume: 0.35, rate: 1.50 }); // Sun arrival / Tech grid prep

    // ═══════════════════════════════════════════════════════════
    // TECHNOLOGY 4 → 8s  (fast holographic sweep — tense rising)
    // ═══════════════════════════════════════════════════════════
    cue(4.05, 'warp-jump',       { volume: 0.55, rate: 1.2 });  // slide into tech
    cue(4.50, 'laser',           { volume: 0.55, rate: 1.0 });  // grid scan
    cue(5.10, 'data-beep',       { volume: 0.50, rate: 1.6 });
    cue(5.65, 'glass-shatter',   { volume: 0.55, rate: 1.15 }); // alert
    cue(6.20, 'laser',           { volume: 0.55, rate: 1.05 }); // sweep
    cue(6.70, 'data-beep',       { volume: 0.48, rate: 1.8 });

    // ── Pre-bang buildup (7.0 → 8.0) ───────────────────────────
    cue(7.05, 'meteor-impact',   { volume: 0.75 });
    cue(7.45, 'glass-shatter',   { volume: 0.78, rate: 0.85 });
    cue(7.80, 'glass-shatter',   { volume: 0.95, rate: 0.70 }); // final crack

    // ═══════════════════════════════════════════════════════════
    // BIG BANG 8.0s
    // ═══════════════════════════════════════════════════════════
    cue(BIG_BANG_TIME,       'big-bang',      { volume: 1.0 });
    cue(BIG_BANG_TIME,       'shockwave',     { volume: 1.0 });
    cue(BIG_BANG_TIME + 0.1, 'glass-shatter', { volume: 0.85, rate: 1.3 });

    // ═══════════════════════════════════════════════════════════
    // CIVILIZATION / CONVERGENCE 8 → 17s  (9 seconds)
    // ═══════════════════════════════════════════════════════════
    cue( 9.00, 'meteor-impact',  { volume: 0.55 });   // debris settling
    cue(11.00, 'planet-discover',{ volume: 0.65 });   // primal #1 — gold
    cue(13.00, 'planet-discover',{ volume: 0.70 });   // primal #2 — pink
    cue(15.00, 'planet-discover',{ volume: 0.65 });   // primal #3 — cyan

    // ═══════════════════════════════════════════════════════════
    // AWAKENING 17 → 31s  (14 seconds)
    // ═══════════════════════════════════════════════════════════
    cue(17.30, 'planet-discover',{ volume: 0.60, rate: 0.9 }); // Sun reveal
    cue(20.00, 'data-beep',      { volume: 0.45 });
    cue(22.50, 'data-beep',      { volume: 0.40, rate: 0.9 });
    cue(25.00, 'warp-jump',      { volume: 0.75 });            // climax build
    cue(27.50, 'laser',          { volume: 0.65, rate: 0.9 });
    cue(30.00, 'shockwave',      { volume: 1.0,  rate: 1.6 }); // final hit

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
