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
    // DEEP ZOOM FLYTHROUGH 0 → 5.5s (distant star → planet flyby → cosmic dust)
    // ═══════════════════════════════════════════════════════════
    cue(0.05, 'warp-jump',       { volume: 0.70, rate: 0.70 }); // Deep bass rumble — warp initiating
    cue(0.50, 'shockwave',       { volume: 0.50, rate: 0.40 }); // Space rushing sound — acceleration
    cue(1.50, 'data-beep',       { volume: 0.25, rate: 2.00 }); // High-speed data flicker
    cue(2.00, 'planet-discover', { volume: 0.35, rate: 1.30 }); // Galaxy becoming visible
    cue(2.80, 'planet-discover', { volume: 0.50, rate: 0.90 }); // Outer planet encounter
    cue(3.60, 'shockwave',       { volume: 0.60, rate: 0.80 }); // Cinematic Doppler swoosh past planet
    cue(3.80, 'planet-discover', { volume: 0.60, rate: 0.75 }); // Planet flyby — close encounter
    cue(4.00, 'shockwave',       { volume: 0.35, rate: 0.40 }); // Cosmic dust — distant rumble
    cue(4.80, 'data-beep',       { volume: 0.30, rate: 1.80 }); // TechGrid signal approaching

    // ═══════════════════════════════════════════════════════════
    // TECHNOLOGY 5.5 → 8s  (holographic grid sweep — tense rising)
    // ═══════════════════════════════════════════════════════════
    cue(5.60, 'warp-jump',       { volume: 0.55, rate: 1.2 });  // Slide into tech
    cue(6.00, 'laser',           { volume: 0.55, rate: 1.0 });  // Grid scan
    cue(6.50, 'data-beep',       { volume: 0.50, rate: 1.6 });
    cue(6.80, 'glass-shatter',   { volume: 0.55, rate: 1.15 }); // Alert

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
