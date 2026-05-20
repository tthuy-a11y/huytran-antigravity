'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicStore, CINEMATIC_DURATION } from '@/app/creative/lib/cinematicStore';

// ============================================================
// DIALOGUE TABLE (Vietnamese — Phase 0 spec)
// Note: lines 4, 5, 6 (18s/19s/20s primal asteroid labels) are
// rendered inside the 3D scene via Drei <Html>, so they are
// excluded from this 2D overlay layer.
// ============================================================
type DialogueLine = {
  id: string;
  text: string;
  start: number;
  end: number;
  /** Visual style preset */
  style:
    | 'neon-pink-italic'      // 1
    | 'mono-cyan-glitch'      // 2
    | 'large-vibrating'       // 3
    | 'serif-italic'          // 7, 8
    | 'gold-scaling'          // 9
    | 'massive-gold-explosive' // 10
    | 'custom-d10';
};

const DIALOGUE: DialogueLine[] = [
  {
    id: 'd1',
    text: 'Nơi sáng tạo là chìa khóa mở ra cánh cửa đến tận cùng vũ trụ',
    start: 2.0 * 0.85,
    end: 6.5 * 0.85,
    style: 'neon-pink-italic',
  },
  {
    id: 'd2',
    text: 'Còn trí tuệ công nghệ là công cụ dẫn dắt xuyên qua thời không',
    start: 8.0 * 0.85,
    end: 12.5 * 0.85,
    style: 'mono-cyan-glitch',
  },
  {
    id: 'd3',
    text: 'Khi sáng tạo giao thoa với trí tuệ công nghệ...',
    start: 13.5,
    end: 15.8,
    style: 'large-vibrating',
  },
  // 18/19/20s = Drei <Html>, handled in BigBangClash
  {
    id: 'd7',
    text: 'Trong khoảng lặng giữa các vì sao',
    start: 22.5,
    end: 24.2,
    style: 'serif-italic',
  },
  {
    id: 'd8',
    text: 'tôi tìm thấy tiếng vọng của chính mình...',
    start: 24.0,
    end: 26.0,
    style: 'serif-italic',
  },
  {
    id: 'd9',
    text: 'Khởi nguyên... một vũ trụ thức tỉnh',
    start: 26.0,
    end: 28.2,
    style: 'gold-scaling',
  },
  {
    id: 'd10',
    text: 'Chào mừng đến với Hệ Hành Tinh TH2003',
    start: 28.0,
    end: 30.0,
    style: 'custom-d10',
  },
];

// ============================================================
// STYLE PRESETS
// ============================================================
const STYLE_CLASSES: Record<DialogueLine['style'], string> = {
  'neon-pink-italic':
    'italic font-light text-2xl md:text-4xl tracking-wide',
  'mono-cyan-glitch':
    'font-mono text-xl md:text-3xl tracking-[0.15em] uppercase',
  'large-vibrating':
    'font-bold text-3xl md:text-6xl tracking-tight',
  'serif-italic':
    'italic font-serif text-xl md:text-3xl tracking-wide',
  'gold-scaling':
    'font-serif text-2xl md:text-5xl tracking-wide',
  'massive-gold-explosive':
    'font-black text-4xl md:text-7xl tracking-tight uppercase',
  'custom-d10':
    'font-black text-4xl md:text-7xl tracking-tight uppercase',
};

const STYLE_INLINE: Record<DialogueLine['style'], React.CSSProperties> = {
  'neon-pink-italic': {
    color: '#ffd0f0',
    textShadow:
      '0 0 12px #ff6ad0, 0 0 28px #c850ff, 0 0 60px #8030ff',
  },
  'mono-cyan-glitch': {
    color: '#dcfaff',
    textShadow:
      '0 0 8px #26e6ff, 0 0 22px #00b8ff, 0 0 44px #0080ff',
  },
  'large-vibrating': {
    color: '#ffffff',
    textShadow:
      '0 0 14px #ff7adf, 0 0 30px #7ad0ff, 0 0 60px #ffffff',
  },
  'serif-italic': {
    color: '#f3e6c8',
    textShadow:
      '0 0 10px rgba(255, 220, 160, 0.5), 0 0 24px rgba(255, 180, 100, 0.3)',
  },
  'gold-scaling': {
    background:
      'linear-gradient(180deg, #fff3b0 0%, #ffc857 45%, #ff8a1a 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    filter:
      'drop-shadow(0 0 16px rgba(255, 200, 80, 0.55)) drop-shadow(0 0 40px rgba(255, 150, 40, 0.35))',
  },
  'massive-gold-explosive': {
    background:
      'linear-gradient(180deg, #fff8d0 0%, #ffd56b 35%, #ff8a1a 70%, #ff5a1a 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    filter:
      'drop-shadow(0 0 24px rgba(255, 200, 80, 0.85)) drop-shadow(0 0 60px rgba(255, 120, 30, 0.6)) drop-shadow(0 0 100px rgba(255, 80, 20, 0.4))',
  },
  'custom-d10': {
    // Styling handled in DialogueLineView for individual spans
  },
};

// ============================================================
// ANIMATION VARIANTS PER STYLE
// ============================================================
function getMotionProps(style: DialogueLine['style']) {
  switch (style) {
    case 'neon-pink-italic':
      return {
        initial: { opacity: 0, y: 30, filter: 'blur(20px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -20, filter: 'blur(14px)' },
        transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'mono-cyan-glitch':
      return {
        initial: { opacity: 0, x: -40, skewX: 12 },
        animate: { opacity: 1, x: 0, skewX: 0 },
        exit: { opacity: 0, x: 40, skewX: -12 },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'large-vibrating':
      return {
        initial: { opacity: 0, scale: 0.7 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.25, filter: 'blur(30px)' },
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'serif-italic':
      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'gold-scaling':
      return {
        initial: { opacity: 0, scale: 0.85, letterSpacing: '-0.05em' },
        animate: { opacity: 1, scale: 1, letterSpacing: '0.02em' },
        exit: { opacity: 0, scale: 1.1 },
        transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'massive-gold-explosive':
    case 'custom-d10':
      return {
        initial: { opacity: 0, scale: 0.5, filter: 'blur(40px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.15 },
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any },
      };
  }
}

// ============================================================
// GLITCH OVERLAY (mono-cyan-glitch only) — chromatic split layers
// ============================================================
function GlitchText({ text }: { text: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 z-0"
        style={{ color: '#ff3a8a', mixBlendMode: 'screen' }}
        animate={{ x: [0, -2, 1, -1, 0], opacity: [0.7, 0.9, 0.6, 0.8, 0.7] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] as any }}
      >
        {text}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-0 z-0"
        style={{ color: '#26ffe6', mixBlendMode: 'screen' }}
        animate={{ x: [0, 2, -1, 1, 0], opacity: [0.7, 0.6, 0.9, 0.7, 0.8] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] as any }}
      >
        {text}
      </motion.span>
    </span>
  );
}

// ============================================================
// VIBRATING WRAPPER (large-vibrating only) — peaks near 15.8s
// ============================================================
function VibratingText({
  text,
  cinematicTime,
}: {
  text: string;
  cinematicTime: number;
}) {
  // Vibration amplitude ramps up as we approach the Bang
  const intensity = Math.max(0, Math.min(1, (cinematicTime - 13.5) / 2.3));
  const amp = 2 + intensity * 6; // pixels
  return (
    <motion.span
      className="inline-block"
      animate={{
        x: [0, amp, -amp, amp * 0.6, -amp * 0.6, 0],
        y: [0, -amp * 0.4, amp * 0.4, -amp * 0.2, amp * 0.2, 0],
      }}
      transition={{
        duration: 0.18,
        repeat: Infinity,
        ease: [0.16, 1, 0.3, 1] as any,
      }}
    >
      {text}
    </motion.span>
  );
}

// ============================================================
// DIALOGUE LINE COMPONENT
// ============================================================
function DialogueLineView({
  line,
  cinematicTime,
}: {
  line: DialogueLine;
  cinematicTime: number;
}) {
  const motionProps = getMotionProps(line.style);
  const cls = STYLE_CLASSES[line.style];
  const styleObj = STYLE_INLINE[line.style];

  // Vertical positioning per style — primary line, sub-line, hero closer
  const position: React.CSSProperties = (() => {
    switch (line.style) {
      case 'serif-italic':
        // Two lines stack (d7 above, d8 below)
        return line.id === 'd7'
          ? { bottom: '32%', left: 0, right: 0 }
          : { bottom: '24%', left: 0, right: 0 };
      case 'gold-scaling':
        return { top: '40%', left: 0, right: 0 };
      case 'massive-gold-explosive':
      case 'custom-d10':
        return { top: '38%', left: 0, right: 0 };
      case 'large-vibrating':
        return { top: '45%', left: 0, right: 0 };
      default:
        return { bottom: '18%', left: 0, right: 0 };
    }
  })();

  let inner: React.ReactNode = line.text;
  if (line.style === 'mono-cyan-glitch') {
    inner = <GlitchText text={line.text} />;
  } else if (line.style === 'large-vibrating') {
    inner = <VibratingText text={line.text} cinematicTime={cinematicTime} />;
  } else if (line.style === 'custom-d10') {
    inner = (
      <span>
        <span style={{ 
          color: '#00e5ff', 
          textShadow: '0 0 10px #00e5ff, 0 0 20px #0088ff, 0 0 40px #00ffff' 
        }}>Chào mừng đến với Hệ Hành Tinh </span>
        <span style={{ 
          color: '#ff4d00',
          background: 'linear-gradient(180deg, #ffcc00 0%, #ff3300 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255, 50, 0, 0.8), 0 0 40px rgba(255, 100, 0, 0.6)',
          filter: 'drop-shadow(0 0 10px #ff0000)'
        }}>TH2003</span>
      </span>
    );
  }

  return (
    <motion.div
      key={line.id}
      className={`absolute text-center px-6 ${cls}`}
      style={{
        ...position,
        ...styleObj,
        willChange: 'transform, opacity, filter',
      }}
      {...motionProps}
    >
      {inner}
    </motion.div>
  );
}

// ============================================================
// SKIP BUTTON
// ============================================================
function SkipButton() {
  const skip = useCinematicStore((s) => s.skip);
  const isFinished = useCinematicStore((s) => s.isFinished);
  if (isFinished) return null;
  return (
    <motion.button
      onClick={skip}
      className="absolute bottom-8 right-8 pointer-events-auto group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
      transition={{ duration: 0.6, delay: 1.2 }}
    >
      <div
        className="px-5 py-2.5 rounded-full border border-white/30 backdrop-blur-md bg-black/30 text-white/90 text-sm tracking-widest uppercase font-light hover:border-white/70 transition-colors"
        style={{ letterSpacing: '0.2em' }}
      >
        Skip Intro →
      </div>
    </motion.button>
  );
}

// ============================================================
// AUDIO HINT (mute toggle)
// ============================================================
function MuteToggle() {
  const isMuted = useCinematicStore((s) => s.isMuted);
  const toggleMute = useCinematicStore((s) => s.toggleMute);
  return (
    <motion.button
      onClick={toggleMute}
      className="absolute bottom-8 left-8 pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      <div className="w-10 h-10 rounded-full border border-white/30 backdrop-blur-md bg-black/30 flex items-center justify-center text-white/90">
        {isMuted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </div>
    </motion.button>
  );
}

// ============================================================
// PROGRESS BAR — thin, bottom edge, fades after cinematic
// ============================================================
function ProgressBar({ cinematicTime }: { cinematicTime: number }) {
  const pct = Math.min(100, (cinematicTime / CINEMATIC_DURATION) * 100);
  const isFinished = useCinematicStore((s) => s.isFinished);
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5"
      animate={{ opacity: isFinished ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background:
            'linear-gradient(90deg, rgba(255,106,208,0.8), rgba(38,230,255,0.9), rgba(255,200,87,0.95))',
          boxShadow: '0 0 12px rgba(255,200,87,0.6)',
          transition: 'width 0.08s linear',
        }}
      />
    </motion.div>
  );
}

// ============================================================
// MAIN OVERLAY
// ============================================================
export function CinematicUI() {
  // We need cinematic time for *visibility windows* and amplitude scaling.
  // Subscribing via the React hook would re-render every frame — too costly.
  // Instead we read on a RAF tick and only re-render when the visible line set
  // (or vibration amplitude bucket) changes.
  const [cinematicTime, setCinematicTime] = useState(0);
  const lastBucketRef = useRef(-1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = useCinematicStore.getState().time;
      // Bucket to 0.05s — gives smooth amplitude updates without hammering React
      const bucket = Math.floor(t * 20);
      if (bucket !== lastBucketRef.current) {
        lastBucketRef.current = bucket;
        setCinematicTime(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Determine which dialogue lines are currently visible
  const activeLines = useMemo(
    () =>
      DIALOGUE.filter(
        (d) => cinematicTime >= d.start && cinematicTime <= d.end
      ),
    [cinematicTime]
  );

  const isFinished = useCinematicStore((s) => s.isFinished);

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none select-none"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Dialogue layer */}
      <AnimatePresence mode="sync">
        {activeLines.map((line) => (
          <DialogueLineView
            key={line.id}
            line={line}
            cinematicTime={cinematicTime}
          />
        ))}
      </AnimatePresence>

      {/* Controls */}
      <SkipButton />
      <MuteToggle />
      <ProgressBar cinematicTime={cinematicTime} />

      {/* Subtle scanline texture for the entire cinematic */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Letterbox bars — present during cinematic, fade away on finish */}
      <motion.div
        className="absolute top-0 left-0 right-0 bg-black"
        animate={{ height: isFinished ? 0 : 64 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black"
        animate={{ height: isFinished ? 0 : 64 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
      />
    </div>
  );
}

