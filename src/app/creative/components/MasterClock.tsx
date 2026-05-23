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
    // EPIC 28-SECOND TIMELINE CUES
    // ═══════════════════════════════════════════════════════════
    // Phase 1: Void & Sparkling Stars (0.0s → 4.0s)
    cue(0.05, 'warp-jump',       { volume: 0.65, rate: 0.35 }); // Growing deep space drone
    cue(0.20, 'planet-discover', { volume: 0.40, rate: 1.30 }); // Text 1 reveal beep: "Trong khoảng lặng..."
    cue(1.20, 'meteor-impact',   { volume: 0.85, rate: 0.40 }); // Deep heart-thump as sparks grow
    cue(2.10, 'data-beep',       { volume: 0.30, rate: 1.40 }); // Text 2 reveal beep: "tôi tìm thấy..."
    cue(3.00, 'shockwave',       { volume: 0.70, rate: 0.50 }); // Galaxy reveals: vast swirling nebula

    // Phase 2: Tech Grid Transition (4.0s → 8.0s)
    cue(4.00, 'planet-discover', { volume: 0.45, rate: 1.00 }); // Text 3 reveal beep: "Nơi sáng tạo là chìa khóa..."
    cue(4.50, 'glass-shatter',   { volume: 0.65, rate: 1.10 }); // Soft digital tech transition chime
    cue(5.50, 'warp-jump',       { volume: 0.55, rate: 1.20 }); // Sliding into tech grid
    cue(6.00, 'data-beep',       { volume: 0.35, rate: 1.80 }); // Text 4 reveal beep: "Còn trí tuệ công nghệ..."
    cue(6.80, 'glass-shatter',   { volume: 0.55, rate: 1.15 }); // Grid warning click
    cue(7.50, 'glass-shatter',   { volume: 0.78, rate: 0.85 }); // Final pre-bang crack

    // Phase 3: BIG BANG CLIMAX (8.0s → 17.0s)
    cue(BIG_BANG_TIME,       'big-bang',      { volume: 1.00 }); // Explosive Big Bang!
    cue(BIG_BANG_TIME,       'shockwave',     { volume: 1.00 }); // Secondary blast shockwave
    cue(7.50, 'data-beep',       { volume: 0.40, rate: 1.50 }); // Text 5 reveal beep: "KHI SÁNG TẠO GIAO THOA..."
    cue(12.00, 'meteor-impact',  { volume: 0.55, rate: 0.80 }); // Debris settling thump

    // Phase 4: AWAKENING & SOLAR SYSTEM BIRTH (17.0s → 28.25s)
    cue(17.30, 'planet-discover', { volume: 0.60, rate: 0.90 }); // Golden sun core reveal
    cue(20.00, 'planet-discover', { volume: 0.65, rate: 0.95 }); // Primal discover chime #1 ("Một thời đại mới")
    cue(21.50, 'planet-discover', { volume: 0.70, rate: 1.20 }); // Primal discover chime #2 ("Một kỷ nguyên mới")
    cue(23.00, 'planet-discover', { volume: 0.65, rate: 1.45 }); // Primal discover chime #3 ("Một vũ trụ mới")
    cue(24.50, 'planet-discover', { volume: 0.95, rate: 0.75 }); // Welcome cristal chime
    cue(24.50, 'meteor-impact',   { volume: 1.00, rate: 0.55 }); // Blockbuster low bass impact slam for text d9!
    cue(27.75, 'shockwave',       { volume: 1.00, rate: 1.40 }); // Warp-out pullback sound starts

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
