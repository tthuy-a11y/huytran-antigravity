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
    // Phase 1: Darkness & Energy Seed (0s to 1.0s)
    cue(0.05, 'warp-jump',       { volume: 0.65, rate: 0.35 }); // Low, growing space drone in absolute black
    cue(0.20, 'planet-discover', { volume: 0.45, rate: 1.20 }); // Subtitle 1 keystroke: "Trong khoảng lặng..."
    cue(0.30, 'meteor-impact',   { volume: 0.95, rate: 0.35 }); // Heartbeat Thump 1: energy seed appears!
    cue(0.90, 'meteor-impact',   { volume: 1.00, rate: 0.38 }); // Heartbeat Thump 2: energy seed blooms!

    // Phase 2: Galaxy Materialization (1.0s to 2.0s)
    cue(1.20, 'data-beep',       { volume: 0.30, rate: 1.40 }); // Subtitle 2: "tôi tìm thấy..."
    cue(1.30, 'shockwave',       { volume: 0.65, rate: 0.45 }); // Deep atmospheric whoosh as galaxy fades in

    // Phase 3: Planetary Bloom & Hyperspace Rush (2.0s to 3.5s)
    cue(2.20, 'planet-discover', { volume: 0.75, rate: 0.75 }); // Majestic chime: Sun & solar system revealed!
    cue(2.50, 'planet-discover', { volume: 0.50, rate: 0.90 }); // Subtitle 3: "Nơi sáng tạo là chìa khóa..."
    cue(2.60, 'warp-jump',       { volume: 0.85, rate: 0.95 }); // Swooshing warp jump acceleration as we zoom past

    // Phase 4: Planet Flyby & Fog Exit (3.5s to 5.5s)
    cue(3.50, 'shockwave',       { volume: 0.80, rate: 0.90 }); // Doppler swoosh past orbits
    cue(4.20, 'data-beep',       { volume: 0.35, rate: 1.80 }); // Subtitle 4: "Còn trí tuệ công nghệ..."
    cue(4.30, 'shockwave',       { volume: 0.90, rate: 0.60 }); // Fog wipe begins
    cue(4.50, 'glass-shatter',   { volume: 0.75, rate: 1.10 }); // Transition impact into TechGrid

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

    // ═══════════════════════════════════════════════════════════
    // AWAKENING 17 → 27s
    // ═══════════════════════════════════════════════════════════
    cue(17.30, 'planet-discover',{ volume: 0.60, rate: 0.9 }); // Sun reveal
    
    // Nhanh, gọn, dứt khoát ending
    cue(20.00, 'data-beep',      { volume: 0.45, rate: 1.5 }); // Một thời đại mới
    cue(20.00, 'planet-discover',{ volume: 0.65 });            // primal #1 (gold)
    cue(21.50, 'data-beep',      { volume: 0.50, rate: 1.2 }); // Một kỷ nguyên mới
    cue(21.50, 'planet-discover',{ volume: 0.70 });            // primal #2 (pink)
    cue(23.00, 'warp-jump',      { volume: 0.65, rate: 1.1 }); // Một vũ trụ mới
    cue(23.00, 'planet-discover',{ volume: 0.65 });            // primal #3 (cyan)
    cue(24.50, 'planet-discover', { volume: 0.95, rate: 0.75 }); // Majestic crystalline chime
    cue(24.50, 'meteor-impact',   { volume: 1.00, rate: 0.55 }); // Blockbuster low bass impact slam!
    cue(27.75, 'shockwave',       { volume: 1.00, rate: 1.40 }); // Warp-out pullback sound starts at 27.75s

    if (next >= CINEMATIC_DURATION && !finishedFiredRef.current) {
      finishedFiredRef.current = true;
      onFinished?.();
    }
  });

  return null;
}
