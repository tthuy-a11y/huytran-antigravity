'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { useCinematicStore, CINEMATIC_DURATION } from '@/app/creative/lib/cinematicStore';

// ============================================================
// DIALOGUE TABLE — 31s compressed timeline (text 100% nguyên văn gốc)
// Primal asteroid labels (11s/13s/15s) = 3D Html in BigBangClash
// ============================================================
type DialogueLine = {
  id: string; text: string; start: number; end: number;
  style: 'neon-pink-italic' | 'mono-cyan-glitch' | 'large-vibrating'
       | 'serif-italic'     | 'gold-scaling'     | 'custom-d10' | 'custom-slam';
};

const DIALOGUE: DialogueLine[] = [
  // ═══════════════════════════════════════════════════════════
  // PURE SEQUENTIAL DIALOGUE SEQUENCE (0s to 6.5s)
  // ═══════════════════════════════════════════════════════════
  { id:'d1', text:'Trong khoảng lặng giữa các vì sao',
    start:0.2, end:1.6, style:'serif-italic' },
  { id:'d2', text:'tôi tìm thấy tiếng vọng của chính mình...',
    start:1.8, end:3.2, style:'serif-italic' },
  { id:'d3', text:'Nơi sáng tạo là chìa khóa mở ra cánh cửa đến tận cùng vũ trụ',
    start:3.4, end:4.8, style:'neon-pink-italic' },
  { id:'d4', text:'Còn trí tuệ công nghệ là công cụ dẫn dắt xuyên qua thời không',
    start:5.0, end:6.4, style:'mono-cyan-glitch' }
];

// ============================================================
// STYLE CLASSES
// ============================================================
const STYLE_CLS: Record<DialogueLine['style'], string> = {
  'neon-pink-italic':  'italic font-light text-2xl md:text-4xl lg:text-5xl tracking-wide',
  'mono-cyan-glitch':  'font-mono text-xl md:text-3xl lg:text-4xl tracking-[0.18em] uppercase',
  'large-vibrating':   'font-bold tracking-[-0.02em] whitespace-nowrap',
  'serif-italic':      'italic font-serif text-xl md:text-3xl lg:text-4xl tracking-normal',
  'gold-scaling':      'font-sans font-bold text-3xl md:text-5xl lg:text-6xl tracking-tight uppercase',
  'custom-d10':        'font-serif italic text-4xl md:text-6xl text-white drop-shadow-2xl text-center px-4',
  'custom-slam':       'w-full h-full flex flex-col items-center justify-center pointer-events-none select-none',
};

const STYLE_INLINE: Record<DialogueLine['style'], React.CSSProperties> = {
  'neon-pink-italic':  { color:'#ffd0f0', textShadow:'0 0 12px #ff6ad0, 0 0 28px #c850ff, 0 0 60px #8030ff' },
  'mono-cyan-glitch':  { color:'#dcfaff', textShadow:'0 0 8px #26e6ff, 0 0 22px #00b8ff, 0 0 44px #0080ff' },
  'large-vibrating':   { fontSize:'clamp(1.4rem,3.8vw,3.6rem)', lineHeight:'1.05' },
  'serif-italic':      { color:'#f3e6c8', textShadow:'0 0 10px rgba(255,220,160,0.5), 0 0 24px rgba(255,180,100,0.3)' },
  'gold-scaling':      {
    background:'linear-gradient(180deg,#fff3b0 0%,#ffc857 45%,#ff8a1a 100%)',
    WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', color:'transparent',
    filter:'drop-shadow(0 0 16px rgba(255,200,80,0.55)) drop-shadow(0 0 40px rgba(255,150,40,0.35))',
  },
  'custom-d10': {},
  'custom-slam': {},
};

// ============================================================
// MOTION VARIANTS
// ============================================================
const dissolveExit = {
  opacity:0, y:-30, filter:'blur(18px)', scale:0.92,
  transition:{ duration:1.2, ease:'easeIn' as const },
};

const fastDissolveExit = {
  opacity:0, y:-15, filter:'blur(12px)', scale:0.95,
  transition:{ duration:0.4, ease:'easeIn' as const },
};

function getMotionProps(style: DialogueLine['style'], tier: string) {
  switch (style) {
    case 'neon-pink-italic': return {
      initial:{ opacity:0, y:18, filter:'blur(14px)' },
      animate:{ opacity:1, y:[0,-5,0], scale:[1,1.012,1], rotateZ:[0,0.8,0,-0.8,0], filter:'blur(0px)' },
      exit: dissolveExit,
      transition:{ duration:0.75, ease:[0.16,1,0.3,1] as any,
        y:{ duration:3.6, repeat:Infinity, ease:'easeInOut' },
        scale:{ duration:3.6, repeat:Infinity, ease:'easeInOut' },
        rotateZ:{ duration:5, repeat:Infinity, ease:'easeInOut' } },
    };
    case 'mono-cyan-glitch': return {
      initial:{ opacity:0, x:-18, skewX:5, filter:'blur(8px)' },
      animate:{ opacity:1, x:0, skewX:0, filter:'blur(0px)' },
      exit: fastDissolveExit,
      transition:{ duration:0.35, ease:[0.16,1,0.3,1] as any },
    };
    case 'large-vibrating': return {
      initial:{ opacity:0, scale:0.65, filter:'blur(12px)' },
      animate:{ opacity:1, scale:1, filter:'blur(0px)' },
      exit: fastDissolveExit,
      transition:{ duration:0.8, ease:[0.16,1,0.3,1] as any },
    };
    case 'serif-italic': return {
      initial:{ opacity:0, y:18 },
      animate:{ opacity:1, y:[0,-7,0], scale:[1,1.012,1], rotateZ:[0,-1,0,1,0] },
      exit: fastDissolveExit,
      transition:{ duration:0.6, ease:[0.16,1,0.3,1] as any,
        y:{ duration:4.5, repeat:Infinity, ease:'easeInOut' },
        scale:{ duration:4.5, repeat:Infinity, ease:'easeInOut' },
        rotateZ:{ duration:7, repeat:Infinity, ease:'easeInOut' } },
    };
    case 'gold-scaling': return {
      initial:{ opacity:0, scale:0.85, y:18 },
      animate:{ opacity:1, scale:1, y:0 },
      exit:{ opacity:0, scale:1.1, filter:'blur(16px)' },
      transition:{ duration:0.5, ease:[0.16,1,0.3,1] as any },
    };
    case 'custom-d10': return {
      initial:{ opacity:1 }, animate:{ opacity:1 },
      exit:{ opacity:0, scale:1.18, filter:'blur(28px)' },
      transition:{ duration:1.6, ease:[0.16,1,0.3,1] as any },
    };
    case 'custom-slam': return {
      initial:{ opacity:0 },
      animate:{ opacity:1 },
      exit:{ 
        opacity:0, 
        scale:1.15, 
        filter:'blur(32px)',
        transition: { duration: 1.2, ease: 'easeIn' as const }
      },
      transition:{ duration:0.5, ease:[0.16, 1, 0.3, 1] as any },
    };
  }
}

// ============================================================
// WORD STAGGER
// ============================================================
function SplitWords({ text, stagger = 0.05 }: { text:string; stagger?:number }) {
  const words = text.split(' ');
  return (
    <motion.span className="inline"
      initial="hidden" animate="visible"
      variants={{ visible:{ transition:{ staggerChildren:stagger } } }}
    >
      {words.map((w,i) => (
        <motion.span key={i} className="inline-block mr-[0.28em] last:mr-0"
          variants={{
            hidden:{ opacity:0, y:16, filter:'blur(8px)' },
            visible:{ opacity:1, y:0, filter:'blur(0px)', transition:{ duration:0.38, ease:[0.16,1,0.3,1] as any } },
          }}
        >{w}</motion.span>
      ))}
    </motion.span>
  );
}

// ============================================================
// RGB GLITCH
// ============================================================
function GlitchText({ text }: { text:string }) {
  // Softened chromatic split — readable, not seizure-inducing
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>
      <motion.span aria-hidden className="absolute inset-0 z-0 select-none"
        style={{ color:'#ff5aa8', mixBlendMode:'screen', opacity:0.55 }}
        animate={{ x:[0,-1.2,0.8,0], opacity:[0.55,0.7,0.45,0.55] }}
        transition={{ duration:1.1, repeat:Infinity, ease:'easeInOut' }}
      >{text}</motion.span>
      <motion.span aria-hidden className="absolute inset-0 z-0 select-none"
        style={{ color:'#3ae8ff', mixBlendMode:'screen', opacity:0.55 }}
        animate={{ x:[0,1.2,-0.8,0], opacity:[0.55,0.45,0.7,0.55] }}
        transition={{ duration:1.1, repeat:Infinity, ease:'easeInOut', delay:0.12 }}
      >{text}</motion.span>
      <motion.span aria-hidden
        className="absolute left-0 right-0 h-[1px] bg-cyan-300/45 blur-[1px] pointer-events-none"
        style={{ top:0 }}
        animate={{ top:['-5%','110%'] }}
        transition={{ duration:2.8, repeat:Infinity, ease:'linear', repeatDelay:1.5 }}
      />
    </span>
  );
}

// ============================================================
// DYNAMIC CLIMAX TEXT (large-vibrating)
// Intensifies as Big Bang approaches — peaks at 9.5s
// ============================================================
function DynamicClimaxText({ text }: { text:string }) {
  const progress    = useMotionValue(0);
  const x           = useMotionValue(0);
  const y           = useMotionValue(0);
  const color       = useTransform(progress, [0,0.25,0.6,1], ['#ffffff','#67e8f9','#ff3a00','#ffeb8a']);
  const scale       = useTransform(progress, (p) => 1 + p * 0.1);
  const textShadow  = useTransform(progress, (p) => {
    const g = 18 + p * 65;
    return `0 0 ${g}px currentColor, 0 0 ${g*1.6}px currentColor`;
  });

  useAnimationFrame((msec) => {
    const t         = useCinematicStore.getState().time;
    // Build-up starts 1s before bang (7.0s), peaks at bang (8.0s)
    const intensity = Math.max(0, Math.min(1, (t - 7.0) / 1.0));
    const beat      = intensity > 0 ? Math.sin(msec * 0.018) * intensity * 0.07 : 0;
    progress.set(Math.min(1, intensity + beat));
    const amp = 1.2 + intensity * 5;
    x.set(Math.sin(msec*0.055)*amp + Math.cos(msec*0.032)*amp*0.5);
    y.set(Math.cos(msec*0.042)*(amp*0.38) + Math.sin(msec*0.022)*(amp*0.18));
  });

  return (
    <motion.span style={{ x, y, scale, color, textShadow, display:'inline-block' }}>
      {text}
    </motion.span>
  );
}

// ============================================================
// DIALOGUE LINE VIEW
// ============================================================
function DialogueLineView({ line, cinematicTime }: { line:DialogueLine; cinematicTime:number }) {
  const tier        = useCinematicStore((s) => s.deviceTier) || 'high';
  const motionProps = getMotionProps(line.style, tier);
  const cls         = STYLE_CLS[line.style];
  const styleObj    = STYLE_INLINE[line.style];

  const position: React.CSSProperties = (() => {
    switch (line.style) {
      case 'serif-italic':
        // d1 is the first line ("Trong khoảng lặng..."), d2 is the second ("tôi tìm thấy...")
        return line.id === 'd1' ? { bottom:'32%', left:0, right:0 } : { bottom:'23%', left:0, right:0 };
      case 'gold-scaling':
        return { top:'40%', left:0, right:0 };
      case 'large-vibrating':
        return { top:'44%', left:0, right:0 };
      case 'custom-d10':
      case 'custom-slam':
        return { top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' };
      default:
        return { bottom:'17%', left:0, right:0 };
    }
  })();

  let inner: React.ReactNode = line.text;
  if      (line.style === 'neon-pink-italic') inner = <SplitWords text={line.text} stagger={0.06} />;
  else if (line.style === 'mono-cyan-glitch') inner = <GlitchText text={line.text} />;
  else if (line.style === 'large-vibrating')  inner = <DynamicClimaxText text={line.text} />;
  else if (line.style === 'serif-italic')     inner = <SplitWords text={line.text} stagger={0.09} />;
  else if (line.style === 'gold-scaling') {
    inner = (
      <>
        <SplitWords text={line.text} stagger={0.12} />
        <motion.span aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background:'linear-gradient(105deg,transparent 30%,rgba(255,240,150,0.35) 50%,transparent 70%)', backgroundSize:'200% 100%' }}
          animate={{ backgroundPosition:['-100% 0','200% 0'] }}
          transition={{ duration:2.2, repeat:Infinity, repeatDelay:1.4, ease:'easeInOut' }}
        />
      </>
    );
  } else if (line.style === 'custom-d10') {
    inner = (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* "Chào mừng đến với Hệ Hành Tinh" */}
        <motion.div className="absolute z-10 flex flex-col items-center w-full"
          initial={{ opacity:0, y:-22 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.9, ease:'easeOut' }}
          style={{ top:'18%', fontFamily:'serif' }}
        >
          <span className="text-2xl md:text-4xl font-light italic mb-3"
            style={{ color:'#dcfaff', textShadow:'0 0 18px rgba(0,229,255,0.85), 0 0 38px rgba(0,153,255,0.55)' }}>
            Chào mừng đến với
          </span>
          <span className="text-4xl md:text-6xl font-bold uppercase tracking-[0.1em]"
            style={{ color:'#bff3ff', textShadow:'0 0 14px rgba(0,229,255,0.9), 0 0 30px rgba(0,153,255,0.7), 0 0 60px rgba(0,153,255,0.4)' }}>
            Hệ Hành Tinh
          </span>
        </motion.div>

        {/* TH2003 hero */}
        <div className="absolute z-20" style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
          {/* Ignition glow burst — cheap radial div */}
          <motion.div aria-hidden className="absolute rounded-full pointer-events-none"
            initial={{ opacity:0, scale:0.25 }}
            animate={{ opacity:[0,1,0.82], scale:[0.25,1.5,1.12] }}
            transition={{ duration:1.6, delay:0.25, ease:'easeOut', times:[0,0.45,1] }}
            style={{
              top:'50%', left:'50%', width:'130%', height:'130%', transform:'translate(-50%,-50%)',
              background:'radial-gradient(circle,rgba(255,240,180,0.95)0%,rgba(255,180,40,0.55)25%,rgba(255,80,20,0.25)55%,transparent 75%)',
              filter:'blur(22px)',
            }}
          />
          {/* TH2003 text */}
          <motion.div className="relative uppercase"
            initial={{ opacity:0, scale:0.35 }} animate={{ opacity:1, scale:1 }}
            transition={{ duration:1.0, delay:0.25, ease:[0.16,1,0.3,1] as any }}
            style={{
              background:'linear-gradient(180deg,#ffffff 0%,#fff0a0 22%,#ffb800 58%,#ff5500 100%)',
              WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent',
              color:'transparent',
              filter:'drop-shadow(0 0 36px rgba(255,160,40,0.9))',
              fontSize:'clamp(5rem,12vw,12rem)', fontWeight:900, lineHeight:1, willChange:'transform,opacity',
            }}
          >TH2003</motion.div>
        </div>
      </div>
    );
  } else if (line.style === 'custom-slam') {
    inner = (
      <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none select-none">
        {/* Ignition Sun Burst backdrop behind TH2003 */}
        <div className="absolute z-0 flex items-center justify-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <motion.div
            aria-hidden
            className="rounded-full"
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{ 
              opacity: [0, 0.95, 0.75, 0.95], 
              scale: [0.1, 1.65, 1.4, 1.6] 
            }}
            transition={{ 
              duration: 3.5, 
              ease: "easeOut",
              times: [0, 0.35, 0.7, 1],
              opacity: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
            }}
            style={{
              width: '280px',
              height: '280px',
              background: 'radial-gradient(circle, rgba(255,190,40,0.95) 0%, rgba(255,100,20,0.4) 30%, rgba(255,30,0,0.15) 55%, transparent 75%)',
              filter: 'blur(36px)',
              mixBlendMode: 'screen'
            }}
          />
        </div>
  
        {/* 3-layer cohesive text cluster */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* Layer 1: "Chào mừng đến với" */}
          <motion.div
            initial={{ opacity: 0, y: -25, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif italic font-light tracking-wide text-2xl md:text-3xl lg:text-4xl text-cyan-100/90 mb-1"
            style={{
              textShadow: '0 0 12px rgba(0, 240, 255, 0.65), 0 0 30px rgba(0, 100, 255, 0.3)'
            }}
          >
            Chào mừng đến với
          </motion.div>
  
          {/* Layer 2: "HỆ HÀNH TINH" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans font-extrabold uppercase tracking-[0.2em] text-3xl md:text-5xl lg:text-6xl text-cyan-50/95 mb-4"
            style={{
              textShadow: '0 0 16px rgba(0, 242, 254, 0.85), 0 0 35px rgba(0, 150, 255, 0.5), 0 0 70px rgba(0, 100, 255, 0.25)'
            }}
          >
            Hệ Hành Tinh
          </motion.div>
  
          {/* Layer 3: "TH2003" */}
          <motion.div
            initial={{ opacity: 0, scale: 3.2, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1.0, filter: 'blur(0px)' }}
            transition={{ duration: 0.95, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative font-serif italic font-black uppercase text-7xl md:text-9xl lg:text-[10rem] leading-none tracking-tight select-none"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 22%, #ffb800 58%, #ff5500 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              filter: 'drop-shadow(0 0 32px rgba(255,140,0,0.85)) drop-shadow(0 0 70px rgba(255,60,0,0.45)) drop-shadow(0 0 120px rgba(255,0,0,0.25))'
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
      style={{ ...position, ...styleObj, willChange:'transform,opacity,filter,color' }}
      {...motionProps}
    >{inner}</motion.div>
  );
}

// ============================================================
// SKIP BUTTON
// ============================================================
function SkipButton() {
  const skip       = useCinematicStore((s) => s.skip);
  const isFinished = useCinematicStore((s) => s.isFinished);
  if (isFinished) return null;
  return (
    <motion.button onClick={skip}
      className="absolute bottom-24 right-6 pointer-events-auto"
      initial={{ opacity:0, x:28 }} animate={{ opacity:1, x:0 }}
      whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }}
      transition={{ duration:0.6, delay:1.5, ease:[0.16,1,0.3,1] as any }}
    >
      <motion.span className="absolute inset-0 rounded-2xl border border-white/25"
        animate={{ scale:[1,1.14], opacity:[0.5,0] }}
        transition={{ repeat:Infinity, duration:2.2, ease:'easeOut' }} />
      <div className="relative flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-white/25 bg-black/45 backdrop-blur-xl">
        <span className="text-white/75 text-sm tracking-[0.22em] uppercase font-light">Bỏ qua</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round">
          <polygon points="5 3 19 12 5 21 5 3" /><line x1="19" y1="3" x2="19" y2="21" />
        </svg>
      </div>
    </motion.button>
  );
}

// ============================================================
// MUTE TOGGLE (with animated sound bars)
// ============================================================
const WAVE_HEIGHTS = [0.35, 0.65, 1.0, 0.65, 0.35];
function SoundWaveBars() {
  return (
    <div className="flex items-center gap-[3px]" style={{ height:20 }}>
      {WAVE_HEIGHTS.map((peak, i) => (
        <motion.span key={i} className="block w-[3px] rounded-full bg-cyan-400"
          animate={{ scaleY:[peak*0.3, peak, peak*0.45, peak*0.85, peak*0.3] }}
          transition={{ duration:0.7, repeat:Infinity, delay:i*0.09, ease:'easeInOut' }}
          style={{ height:20, transformOrigin:'center' }}
        />
      ))}
    </div>
  );
}

function MuteToggle() {
  const isMuted    = useCinematicStore((s) => s.isMuted);
  const toggleMute = useCinematicStore((s) => s.toggleMute);
  return (
    <motion.button onClick={toggleMute}
      className="absolute bottom-24 left-6 pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl transition-colors"
      initial={{ opacity:0, x:-28 }} animate={{ opacity:1, x:0 }}
      whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }}
      transition={{ duration:0.6, delay:1.5, ease:[0.16,1,0.3,1] as any }}
      style={{
        border: isMuted ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,242,254,0.4)',
        background: isMuted ? 'rgba(0,0,0,0.4)' : 'rgba(0,242,254,0.06)',
        boxShadow: isMuted ? 'none' : '0 0 20px rgba(0,242,254,0.12)',
      }}
      aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
    >
      {isMuted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      ) : <SoundWaveBars />}
      <span className="text-xs tracking-[0.2em] uppercase font-light"
        style={{ color: isMuted ? 'rgba(255,255,255,0.45)' : 'rgba(0,242,254,0.9)' }}>
        {isMuted ? 'Tắt tiếng' : 'Âm thanh'}
      </span>
    </motion.button>
  );
}

// ============================================================
// PROGRESS BAR
// ============================================================
function ProgressBar({ cinematicTime }: { cinematicTime:number }) {
  const pct        = Math.min(100, (cinematicTime / CINEMATIC_DURATION) * 100);
  const isFinished = useCinematicStore((s) => s.isFinished);
  return (
    <motion.div className="absolute left-6 right-6 h-[3px] rounded-full bg-white/[0.08]"
      style={{ bottom:80 }} animate={{ opacity: isFinished ? 0 : 1 }} transition={{ duration:0.8 }}
    >
      <div className="h-full rounded-full" style={{
        width:`${pct}%`,
        background:'linear-gradient(90deg,rgba(255,106,208,0.9),rgba(38,230,255,1),rgba(255,200,87,1))',
        boxShadow:'0 0 10px rgba(38,230,255,0.7), 0 0 22px rgba(255,200,87,0.4)',
        transition:'width 0.08s linear',
      }} />
    </motion.div>
  );
}

// ============================================================
// MAIN OVERLAY
// ============================================================
export function CinematicUI() {
  const [cinematicTime, setCinematicTime] = useState(0);
  const bucketRef = useRef(-1);

  // Poll store at 20 fps — avoids re-rendering every WebGL frame
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t      = useCinematicStore.getState().time;
      const bucket = Math.floor(t * 20);
      if (bucket !== bucketRef.current) { bucketRef.current = bucket; setCinematicTime(t); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const activeLines = useMemo(
    () => DIALOGUE.filter((d) => cinematicTime >= d.start && cinematicTime <= d.end),
    [cinematicTime]
  );
  const isFinished = useCinematicStore((s) => s.isFinished);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none"
      style={{ fontFamily:'system-ui,-apple-system,sans-serif' }}
    >
      {/* Dialogue */}
      <AnimatePresence mode="sync">
        {activeLines.map((line) => (
          <DialogueLineView key={line.id} line={line} cinematicTime={cinematicTime} />
        ))}
      </AnimatePresence>

      {/* Controls */}
      <SkipButton />
      <MuteToggle />
      <ProgressBar cinematicTime={cinematicTime} />

      {/* CRT scanline texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,0.5)0px,rgba(255,255,255,0.5)1px,transparent 1px,transparent 3px)' }}
      />

      {/* Letterbox — fades out when cinematic finishes */}
      <motion.div className="absolute top-0 left-0 right-0 bg-black"
        animate={{ height: isFinished ? 0 : 64 }}
        transition={{ duration:0.8, ease:[0.16,1,0.3,1] as any }}
      />
      <motion.div className="absolute bottom-0 left-0 right-0 bg-black"
        animate={{ height: isFinished ? 0 : 64 }}
        transition={{ duration:0.8, ease:[0.16,1,0.3,1] as any }}
      />
    </div>
  );
}
