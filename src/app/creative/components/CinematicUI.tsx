'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
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
    text: 'KHI SÁNG TẠO GIAO THOA VỚI TRÍ TUỆ CÔNG NGHỆ...',
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
    end: 27.0,
    style: 'gold-scaling',
  },
  {
    id: 'd10',
    text: 'Chào mừng đến với Hệ Hành Tinh TH2003',
    start: 27.0,
    end: 30.0,
    style: 'custom-d10',
  },
];

// ============================================================
// STYLE PRESETS
// ============================================================
const STYLE_CLASSES: Record<DialogueLine['style'], string> = {
  'neon-pink-italic':
    'italic font-light text-2xl md:text-4xl lg:text-5xl tracking-wide',
  'mono-cyan-glitch':
    'font-mono text-xl md:text-3xl lg:text-4xl tracking-[0.18em] uppercase',
  'large-vibrating':
    'font-bold tracking-[-0.02em] whitespace-nowrap',
  'serif-italic':
    'italic font-serif text-xl md:text-3xl lg:text-4xl tracking-wide',
  'gold-scaling':
    'font-serif text-2xl md:text-5xl lg:text-6xl tracking-wide',
  'massive-gold-explosive':
    'font-black text-4xl md:text-7xl tracking-tight uppercase',
  'custom-d10':
    'w-full h-full',
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
    fontSize: 'clamp(1.4rem, 3.8vw, 3.6rem)',
    lineHeight: '1.05',
    // color and textShadow are now dynamically animated via Framer Motion
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
function getMotionProps(style: DialogueLine['style'], deviceTier: string, cinematicTime: number) {
  const dissolveExit = { 
    opacity: 0, 
    y: -30, 
    filter: 'blur(18px)', 
    letterSpacing: '0.28em', 
    scale: 0.92,
    transition: { duration: 1.35, ease: 'easeIn' as any }
  };

  switch (style) {
    case 'neon-pink-italic':
      return {
        initial: { opacity: 0, y: 30, filter: 'blur(20px)' },
        animate: { 
          opacity: 1, 
          y: deviceTier === 'high' ? [0, -7, 0] : [0, -4, 0], 
          scale: [1, 1.015, 1], 
          rotateZ: [0, 1, 0, -1, 0],
          filter: 'blur(0px)' 
        },
        exit: dissolveExit,
        transition: { 
          duration: 1.4, ease: [0.16, 1, 0.3, 1] as any,
          y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          rotateZ: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        },
      };
    case 'mono-cyan-glitch':
      return {
        initial: { opacity: 0, x: -40, skewX: 12 },
        animate: { opacity: 1, x: 0, skewX: 0 },
        exit: dissolveExit,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'large-vibrating':
      return {
        initial: { opacity: 0, scale: 0.7, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: dissolveExit,
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'serif-italic':
      return {
        initial: { opacity: 0, y: 16 },
        animate: { 
          opacity: 1, 
          y: deviceTier === 'high' ? [0, -7, 0] : [0, -4, 0],
          scale: [1, 1.015, 1],
          rotateZ: [0, -1, 0, 1, 0],
        },
        exit: dissolveExit,
        transition: { 
          duration: 1.3, ease: [0.16, 1, 0.3, 1] as any,
          y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          rotateZ: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }
        },
      };
    case 'gold-scaling':
      // Removed letterSpacing animation — caused render lag + invisibility on weak GPUs
      return {
        initial: { opacity: 0, scale: 0.88, y: 14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 1.08, filter: 'blur(16px)' },
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'massive-gold-explosive':
      return {
        initial: { opacity: 0, scale: 0.5, filter: 'blur(40px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.15 },
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any },
      };
    case 'custom-d10':
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0, scale: 1.2, filter: 'blur(30px)' },
        transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] as any },
      };
  }
}

// ============================================================
// WORD-STAGGER — stagger each word in on entry
// ============================================================
function SplitWords({ text, stagger = 0.09 }: { text: string; stagger?: number }) {
  const words = text.split(' ');
  return (
    <motion.span
      className="inline"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.28em] last:mr-0"
          variants={{
            hidden: { opacity: 0, y: 22, filter: 'blur(10px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as any } },
          }}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ============================================================
// GLITCH OVERLAY (mono-cyan-glitch) — RGB split + scan sweep
// ============================================================
function GlitchText({ text }: { text: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>
      {/* Red channel */}
      <motion.span
        aria-hidden
        className="absolute inset-0 z-0 select-none"
        style={{ color: '#ff3a8a', mixBlendMode: 'screen' }}
        animate={{ x: [0, -3, 2, -1, 0, -2, 0], skewX: [0, 1.5, -1, 0.5, 0], opacity: [0.7, 0.95, 0.5, 0.85, 0.7] }}
        transition={{ duration: 0.38, repeat: Infinity }}
      >
        {text}
      </motion.span>
      {/* Cyan channel */}
      <motion.span
        aria-hidden
        className="absolute inset-0 z-0 select-none"
        style={{ color: '#26ffe6', mixBlendMode: 'screen' }}
        animate={{ x: [0, 3, -2, 1, 0, 2, 0], opacity: [0.7, 0.55, 0.9, 0.65, 0.8, 0.7] }}
        transition={{ duration: 0.38, repeat: Infinity, delay: 0.06 }}
      >
        {text}
      </motion.span>
      {/* Scan line sweeping through */}
      <motion.span
        aria-hidden
        className="absolute left-0 right-0 h-[2px] bg-cyan-300/70 blur-[1px] pointer-events-none"
        style={{ top: 0 }}
        animate={{ top: ['-5%', '110%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
      />
    </span>
  );
}

// ============================================================
// VIBRATING WRAPPER (large-vibrating only) — peaks near 15.8s
// ============================================================
function VibratingText({ text }: { text: string }) {
  return (
    <motion.span
      className="inline-block"
      animate={{ x: [0, 3, -3, 2, -2, 0], y: [0, -2, 2, -1, 1, 0] }}
      transition={{ duration: 0.12, repeat: Infinity, ease: 'linear' }}
    >
      {text}
    </motion.span>
  );
}

function DynamicClimaxText({ text }: { text: string }) {
  const progress = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const color = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    ['#ffffff', '#67e8f9', '#ff3a00', '#ffeb8a']
  );
  
  const scale = useTransform(progress, (p) => 1 + p * 0.08);
  const textShadow = useTransform(progress, (p) => {
    const glow = 20 + p * 60;
    return `0 0 ${glow}px currentColor, 0 0 ${glow * 1.5}px currentColor`;
  });

  useAnimationFrame((t) => {
    const timeSec = useCinematicStore.getState().time;
    const intensity = Math.max(0, Math.min(1, (timeSec - 13.0) / 3.8));
    
    let beat = 0;
    if (intensity > 0) {
      beat = Math.sin(t * 0.015) * (intensity * 0.06);
    }
    progress.set(intensity + beat);

    const amp = 1.5 + intensity * 4;
    x.set(Math.sin(t * 0.05) * amp + Math.cos(t * 0.03) * amp * 0.5);
    y.set(Math.cos(t * 0.04) * (amp * 0.35) + Math.sin(t * 0.02) * (amp * 0.15));
  });

  return (
    <motion.span 
      style={{ x, y, scale, color, textShadow, display: 'inline-block' }}
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
  const deviceTier = useCinematicStore((s) => s.deviceTier) || 'high';
  const motionProps = getMotionProps(line.style, deviceTier, cinematicTime);
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
        return { top: '38%', left: 0, right: 0 };
      case 'custom-d10':
        return { top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
      case 'large-vibrating':
        return { top: '45%', left: 0, right: 0 };
      default:
        return { bottom: '18%', left: 0, right: 0 };
    }
  })();

  let inner: React.ReactNode = line.text;
  if (line.style === 'neon-pink-italic') {
    inner = <SplitWords text={line.text} stagger={0.1} />;
  } else if (line.style === 'mono-cyan-glitch') {
    inner = <GlitchText text={line.text} />;
  } else if (line.style === 'large-vibrating') {
    inner = <DynamicClimaxText text={line.text} />;
  } else if (line.style === 'serif-italic') {
    inner = <SplitWords text={line.text} stagger={0.13} />;
  } else if (line.style === 'gold-scaling') {
    inner = (
      <>
        <SplitWords text={line.text} stagger={0.12} />
        {/* Gold shimmer sweep */}
        <motion.span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,240,150,0.35) 50%, transparent 70%)', backgroundSize: '200% 100%' }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        />
      </>
    );
  } else if (line.style === 'custom-d10') {
    inner = (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Phần 1: "Chào mừng đến với Hệ Hành Tinh" — chỉ opacity + translate (an toàn cho mọi GPU) */}
        <motion.div
          className="absolute z-10 flex flex-col items-center justify-center w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ top: '20%', fontFamily: 'serif' }}
        >
          <span
            className="text-2xl md:text-4xl font-light italic mb-3"
            style={{ color: '#dcfaff', textShadow: '0 0 18px rgba(0,229,255,0.85), 0 0 38px rgba(0,153,255,0.55)' }}
          >
            Chào mừng đến với
          </span>
          <span
            className="text-4xl md:text-6xl font-bold uppercase tracking-[0.1em]"
            style={{
              color: '#bff3ff',
              textShadow: '0 0 14px rgba(0,229,255,0.9), 0 0 30px rgba(0,153,255,0.7), 0 0 60px rgba(0,153,255,0.4)',
            }}
          >
            Hệ Hành Tinh
          </span>
        </motion.div>

        {/* Phần 2: TH2003 — backdrop light burst (separate DOM element) + simple gradient text.
            Tránh chained drop-shadow heavy filters → render mượt trên mọi GPU. */}
        <div
          className="absolute z-20"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Ignition light burst — radial gradient div behind text (CHEAP) */}
          <motion.div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0.85], scale: [0.3, 1.4, 1.15] }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut', times: [0, 0.5, 1] }}
            style={{
              top: '50%',
              left: '50%',
              width: '120%',
              height: '120%',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(255,240,180,0.95) 0%, rgba(255,180,40,0.55) 25%, rgba(255,80,20,0.25) 55%, transparent 75%)',
              filter: 'blur(20px)',
            }}
          />
          {/* The TH2003 text — gradient clip + ONE drop-shadow only */}
          <motion.div
            className="relative uppercase"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 25%, #ffb800 60%, #ff5500 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              filter: 'drop-shadow(0 0 32px rgba(255,160,40,0.85))',
              fontSize: 'clamp(5rem, 12vw, 12rem)',
              fontWeight: 900,
              lineHeight: 1,
              willChange: 'transform, opacity',
            }}
          >
            TH2003
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={line.id}
      className={`absolute text-center px-6 ${cls}`}
      style={{
        ...position,
        ...styleObj,
        willChange: 'transform, opacity, filter, color',
      }}
      {...motionProps}
    >
      {inner}
    </motion.div>
  );
}

// ============================================================
// SKIP BUTTON — above letterbox (bottom-24), prominent design
// ============================================================
function SkipButton() {
  const skip = useCinematicStore((s) => s.skip);
  const isFinished = useCinematicStore((s) => s.isFinished);
  if (isFinished) return null;
  return (
    <motion.button
      onClick={skip}
      className="absolute bottom-24 right-6 pointer-events-auto"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] as any }}
    >
      {/* Pulsing outer ring */}
      <motion.span
        className="absolute inset-0 rounded-2xl border border-white/25"
        animate={{ scale: [1, 1.14], opacity: [0.5, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
      />
      <div className="relative flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-white/25 bg-black/45 backdrop-blur-xl">
        <span className="text-white/75 text-sm tracking-[0.22em] uppercase font-light">Bỏ qua</span>
        {/* Double-bar skip icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round">
          <polygon points="5 3 19 12 5 21 5 3" />
          <line x1="19" y1="3" x2="19" y2="21" />
        </svg>
      </div>
    </motion.button>
  );
}

// Sound wave bars — animated when unmuted
const WAVE_HEIGHTS = [0.35, 0.65, 1.0, 0.65, 0.35];

function SoundWaveBars() {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 20 }}>
      {WAVE_HEIGHTS.map((peak, i) => (
        <motion.span
          key={i}
          className="block w-[3px] rounded-full bg-cyan-400"
          animate={{ scaleY: [peak * 0.3, peak, peak * 0.45, peak * 0.85, peak * 0.3] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }}
          style={{ height: 20, transformOrigin: 'center' }}
        />
      ))}
    </div>
  );
}

// ============================================================
// MUTE TOGGLE — above letterbox (bottom-24), with sound-wave bars
// ============================================================
function MuteToggle() {
  const isMuted = useCinematicStore((s) => s.isMuted);
  const toggleMute = useCinematicStore((s) => s.toggleMute);
  return (
    <motion.button
      onClick={toggleMute}
      className="absolute bottom-24 left-6 pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl transition-colors"
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] as any }}
      style={{
        border: isMuted
          ? '1px solid rgba(255,255,255,0.2)'
          : '1px solid rgba(0,242,254,0.4)',
        background: isMuted ? 'rgba(0,0,0,0.4)' : 'rgba(0,242,254,0.06)',
        boxShadow: isMuted ? 'none' : '0 0 20px rgba(0,242,254,0.12)',
      }}
      aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
    >
      {isMuted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <SoundWaveBars />
      )}
      <span
        className="text-xs tracking-[0.2em] uppercase font-light"
        style={{ color: isMuted ? 'rgba(255,255,255,0.45)' : 'rgba(0,242,254,0.9)' }}
      >
        {isMuted ? 'Tắt tiếng' : 'Âm thanh'}
      </span>
    </motion.button>
  );
}

// ============================================================
// PROGRESS BAR — sits at bottom-16 (above 64px letterbox)
// ============================================================
function ProgressBar({ cinematicTime }: { cinematicTime: number }) {
  const pct = Math.min(100, (cinematicTime / CINEMATIC_DURATION) * 100);
  const isFinished = useCinematicStore((s) => s.isFinished);
  return (
    <motion.div
      className="absolute left-6 right-6 h-[3px] rounded-full bg-white/8"
      style={{ bottom: 80 }}
      animate={{ opacity: isFinished ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background:
            'linear-gradient(90deg, rgba(255,106,208,0.9), rgba(38,230,255,1), rgba(255,200,87,1))',
          boxShadow: '0 0 10px rgba(38,230,255,0.7), 0 0 22px rgba(255,200,87,0.4)',
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

