'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';
import { audioEngine } from '@/app/creative/lib/audioEngine';

// ============================================================
// BOOT SEQUENCE — 2.0s DOM overlay played BEFORE cinematic timer
// Goal: hook the viewer in the first 2 seconds with system identity,
// terminal authenticity, and a glitch→flash punch into the warp arrival.
// ============================================================

const TERMINAL_LINES: { t: number; text: string; tone: 'sys' | 'data' | 'ok' | 'warn' }[] = [
  { t: 0.05, text: '> ANTIGRAVITY OS v2.7 — BOOT',                tone: 'sys'  },
  { t: 0.22, text: '> mounting /universe/th2003 ...',             tone: 'data' },
  { t: 0.40, text: '> calibrating quantum field ........... OK',  tone: 'ok'   },
  { t: 0.58, text: '> linking scene graph .................. OK', tone: 'ok'   },
  { t: 0.78, text: '> binding cinematic timeline (42s) ..... OK', tone: 'ok'   },
  { t: 0.98, text: '> warming plasma reactor ............... OK', tone: 'ok'   },
  { t: 1.18, text: '> stargate channel: open',                    tone: 'warn' },
  { t: 1.36, text: '> READY — punching warp',                     tone: 'sys'  },
];

const TONE_COLOR: Record<string, string> = {
  sys:  '#7cff9d',
  data: '#52e0ff',
  ok:   '#a3ffb1',
  warn: '#ffd86b',
};

export function BootSequence() {
  const completeBoot     = useCinematicStore((s) => s.completeBoot);
  const hasBootCompleted = useCinematicStore((s) => s.hasBootCompleted);

  const [elapsed, setElapsed] = useState(0);
  const [show, setShow]       = useState(true);
  const startRef              = useRef<number>(0);
  const beepedRef             = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (hasBootCompleted) return;
    startRef.current = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      setElapsed(t);

      // Per-line typing tick
      TERMINAL_LINES.forEach((ln, i) => {
        if (t >= ln.t && !beepedRef.current.has(i)) {
          beepedRef.current.add(i);
          if (i % 2 === 0) {
            audioEngine.playCue('data-beep', { volume: 0.28, rate: 1.45 + Math.random() * 0.25 });
          }
        }
      });

      // Punch-through warp sound at 1.55s
      if (t >= 1.55 && !beepedRef.current.has(-1)) {
        beepedRef.current.add(-1);
        audioEngine.playCue('warp-jump', { volume: 0.85 });
      }

      // At 1.85s: start fade-out AND kick the cinematic timer simultaneously
      // (so camera arrival + warp lines are already animating as boot dissolves)
      if (t >= 1.85 && show) {
        setShow(false);
        completeBoot();
      }
      // Stop the rAF loop once fade exit transition has had time to finish
      if (t >= 2.5) {
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasBootCompleted, completeBoot, show]);

  if (hasBootCompleted) return null;

  // Flash intensity ramps fast 1.4s → 1.85s
  const flash = elapsed < 1.4 ? 0
              : elapsed < 1.85 ? ((elapsed - 1.4) / 0.45)
              : Math.max(0, 1 - (elapsed - 1.85) / 0.5);

  // Progress bar (loads to 100% by 1.4s)
  const pct = Math.min(100, (elapsed / 1.4) * 100);

  // Logo glitch trigger windows
  const logoGlitch = (elapsed > 0.55 && elapsed < 0.70) || (elapsed > 1.0 && elapsed < 1.12);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
          style={{ background: '#000000' }}
        >
          {/* Dark vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* Scanlines */}
          <div
            className="absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(120,255,180,0.18) 0px, rgba(120,255,180,0.18) 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* Drifting horizontal scanline */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(124,255,157,0.7) 50%, transparent 100%)',
              filter: 'blur(1px)',
              boxShadow: '0 0 18px rgba(124,255,157,0.55)',
            }}
            initial={{ top: '-5%' }}
            animate={{ top: '105%' }}
            transition={{ duration: 1.6, ease: 'linear', repeat: Infinity, repeatDelay: 0.2 }}
          />

          {/* CRT chromatic edge tint */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 180px rgba(0,80,40,0.35), inset 0 0 60px rgba(0,255,150,0.15)',
            }}
          />

          {/* Terminal text — top-left */}
          <div
            className="absolute left-[6%] top-[12%] font-mono text-[13px] md:text-[15px]"
            style={{
              textShadow: '0 0 8px currentColor',
              letterSpacing: '0.04em',
              lineHeight: 1.7,
            }}
          >
            {TERMINAL_LINES.map((ln, i) => {
              const visible = elapsed >= ln.t;
              if (!visible) return null;
              // Per-char reveal
              const localT  = elapsed - ln.t;
              const charCnt = Math.min(ln.text.length, Math.floor(localT * 78));
              const sliced  = ln.text.slice(0, charCnt);
              return (
                <div key={i} style={{ color: TONE_COLOR[ln.tone] }}>
                  {sliced}
                  {charCnt < ln.text.length && (
                    <span style={{ opacity: (Math.floor(elapsed * 12) % 2) ? 1 : 0.2 }}>▍</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center LOGO */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
              animate={{
                opacity: elapsed > 0.18 ? 1 : 0,
                scale:   logoGlitch ? 1.04 : 1.0,
                filter:  logoGlitch ? 'blur(0.6px)' : 'blur(0px)',
                x:       logoGlitch ? [0, -3, 2, 0] : 0,
              }}
              transition={{ duration: logoGlitch ? 0.12 : 0.5, ease: 'easeOut' }}
              style={{ willChange: 'transform, filter, opacity' }}
            >
              {/* RGB chroma split layers */}
              {logoGlitch && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-0 font-mono font-black uppercase tracking-[0.18em] text-3xl md:text-5xl"
                    style={{ color: '#ff3a8a', mixBlendMode: 'screen', transform: 'translate(-3px, 0)' }}
                  >
                    ANTIGRAVITY · OS
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 font-mono font-black uppercase tracking-[0.18em] text-3xl md:text-5xl"
                    style={{ color: '#26ffe6', mixBlendMode: 'screen', transform: 'translate(3px, 0)' }}
                  >
                    ANTIGRAVITY · OS
                  </span>
                </>
              )}
              <div
                className="relative font-mono font-black uppercase tracking-[0.18em] text-3xl md:text-5xl"
                style={{
                  color: '#d8ffe8',
                  textShadow:
                    '0 0 14px rgba(124,255,157,0.85), 0 0 32px rgba(60,255,180,0.55), 0 0 60px rgba(0,200,120,0.35)',
                }}
              >
                ANTIGRAVITY · OS
              </div>
              <div
                className="relative font-mono uppercase tracking-[0.42em] text-[11px] md:text-sm mt-3"
                style={{
                  color: 'rgba(160,255,200,0.65)',
                  textShadow: '0 0 6px rgba(124,255,157,0.6)',
                }}
              >
                v2.7 · INITIALIZING UNIVERSE PROTOCOL
              </div>

              {/* Progress bar */}
              <div
                className="relative mt-6 mx-auto w-[260px] md:w-[340px] h-[3px] rounded-full overflow-hidden"
                style={{ background: 'rgba(124,255,157,0.12)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #7cff9d 0%, #26ffe6 100%)',
                    boxShadow: '0 0 12px rgba(124,255,157,0.9), 0 0 24px rgba(38,255,230,0.55)',
                    transition: 'width 0.08s linear',
                  }}
                />
              </div>
              <div
                className="relative mt-2 font-mono text-[11px] md:text-xs tabular-nums"
                style={{ color: 'rgba(200,255,220,0.85)' }}
              >
                {pct.toFixed(0)}% — QUANTUM FIELD LOCK
              </div>
            </motion.div>
          </div>

          {/* Bottom-right status block */}
          <div
            className="absolute right-[6%] bottom-[10%] font-mono text-[11px] md:text-[12px] text-right"
            style={{ color: 'rgba(124,255,157,0.7)', textShadow: '0 0 6px rgba(124,255,157,0.5)' }}
          >
            <div>NODE · TH2003</div>
            <div>SECTOR · CREATIVE / 7842-Δ</div>
            <div style={{ opacity: (Math.floor(elapsed * 5) % 2) ? 1 : 0.45 }}>● LINK SECURE</div>
          </div>

          {/* Tracking-error bands — fire 2-3 times during boot */}
          {elapsed > 0.6 && elapsed < 0.72 && (
            <div
              className="absolute left-0 right-0 h-[3%]"
              style={{
                top: `${30 + Math.sin(elapsed * 38) * 12}%`,
                background: 'linear-gradient(180deg, rgba(120,255,180,0.4), rgba(120,255,180,0.05))',
                mixBlendMode: 'screen',
              }}
            />
          )}
          {elapsed > 1.05 && elapsed < 1.16 && (
            <div
              className="absolute left-0 right-0 h-[4%]"
              style={{
                top: `${55 + Math.sin(elapsed * 52) * 14}%`,
                background: 'linear-gradient(180deg, rgba(38,255,230,0.5), rgba(0,180,255,0.08))',
                mixBlendMode: 'screen',
              }}
            />
          )}

          {/* WHITE FLASH — punch-through */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: '#ffffff',
              opacity: flash * 0.95,
              mixBlendMode: 'screen',
            }}
          />

          {/* Iris collapse at the very end (rapid zoom-out vignette closing in) */}
          {elapsed > 1.7 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, transparent ${Math.max(0, 60 - (elapsed - 1.7) * 320)}%, #000 ${Math.max(0, 75 - (elapsed - 1.7) * 320)}%)`,
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
