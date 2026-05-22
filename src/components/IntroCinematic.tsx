'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FastForward, ShieldAlert, Terminal, Volume2, VolumeX } from 'lucide-react';

const INTRO_CLIPS = [
  '/videos/intro/1.mp4',
  '/videos/intro/2.mp4',
  '/videos/intro/3.mp4',
];

const SUBTITLES = [
  'Khởi tạo giao thức Antigravity...',
  'Đồng bộ hóa dữ liệu vũ trụ...',
  'Mở cổng không gian chiều thứ 4...',
];

type Phase = 'prompt' | 'playing' | 'dissolving' | 'done';

interface IntroCinematicProps {
  onComplete: () => void;
}

export default function IntroCinematic({ onComplete }: IntroCinematicProps) {
  const [phase, setPhase] = useState<Phase>('prompt');
  const [clipIdx, setClipIdx] = useState(0);
  const [activeBuf, setActiveBuf] = useState<0 | 1>(0);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const vA = useRef<HTMLVideoElement>(null);
  const vB = useRef<HTMLVideoElement>(null);
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);
  const sfxCache = useRef<Record<string, HTMLAudioElement>>({});

  // Tải trước (preload) và cache các tài nguyên SFX để tối ưu hóa CPU & tránh lag luồng chính
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const effects = [
      '/audio/sfx/modal-open.mp3',
      '/audio/sfx/hover.mp3',
      '/audio/sfx/click.mp3',
      '/audio/cues/shockwave.mp3',
      '/audio/cues/glass-shatter.mp3',
      '/audio/cues/data-beep.mp3'
    ];
    effects.forEach(src => {
      try {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.load();
        sfxCache.current[src] = audio;
      } catch (_) {}
    });
  }, []);

  const playSfx = useCallback((src: string, vol = 0.6) => {
    if (typeof window === 'undefined') return;
    try {
      let audio = sfxCache.current[src];
      if (!audio) {
        audio = new Audio(src);
        sfxCache.current[src] = audio;
      }
      audio.currentTime = 0;
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch (_e) {}
  }, []);

  // 80 hạt lượng tử — GPU optimized, không re-compute
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 220 + Math.random() * 980;
      return {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
        scale: Math.random() * 3.2 + 0.5,
        duration: 0.8 + Math.random() * 1.1,
        delay: Math.random() * 0.12,
        color:
          Math.random() > 0.5
            ? '#00f2fe'
            : Math.random() > 0.25
              ? '#c026d3'
              : '#ff00e5',
      };
    });
  }, []);

  // SFX khi mở Prompt Gate
  useEffect(() => {
    if (phase === 'prompt') playSfx('/audio/sfx/modal-open.mp3', 0.65);
  }, [phase, playSfx]);

  // Cleanup timeouts khi unmount
  useEffect(() => {
    return () => activeTimeouts.current.forEach(clearTimeout);
  }, []);

  const triggerDissolve = useCallback(() => {
    if (phase === 'dissolving' || phase === 'done') return;
    setPhase('dissolving');
    if (vA.current) vA.current.pause();
    if (vB.current) vB.current.pause();

    playSfx('/audio/cues/shockwave.mp3', 0.95);
    const t1 = setTimeout(() => playSfx('/audio/cues/glass-shatter.mp3', 0.85), 160);

    const t2 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1620);

    activeTimeouts.current.push(t1, t2);
  }, [phase, onComplete, playSfx]);

  const handleVideoEnded = useCallback(() => {
    if (clipIdx < INTRO_CLIPS.length - 1) {
      setIsTransitioning(true);
      playSfx('/audio/cues/data-beep.mp3', 0.45);

      // Chuyển đổi clipIdx ngay lập tức để video tiếp theo bắt đầu phát không có độ trễ
      setClipIdx((prev) => prev + 1);

      // Tắt lớp transition glitch sau 420ms trong background
      const t = setTimeout(() => {
        setIsTransitioning(false);
      }, 420);
      activeTimeouts.current.push(t);
    } else {
      triggerDissolve();
    }
  }, [clipIdx, playSfx, triggerDissolve]);

  const handleStart = useCallback(() => {
    playSfx('/audio/cues/shockwave.mp3', 0.8);
    
    // 1. Gán src ngay lập tức cho vA và vB
    if (vA.current) {
      vA.current.src = INTRO_CLIPS[0];
      vA.current.muted = isMuted;
    }
    if (vB.current) {
      vB.current.src = INTRO_CLIPS[1] || INTRO_CLIPS[0];
      vB.current.muted = true; // Luôn tắt tiếng buffer ẩn để tránh xung đột audio
    }

    // 2. Kích hoạt phát vA (buffer hoạt động)
    if (vA.current) {
      const p = vA.current.play();
      if (p instanceof Promise) {
        p.then(() => {
          setAudioBlocked(false);
        }).catch((err) => {
          console.warn("Unmuted play blocked for vA, trying muted fallback:", err);
          if (vA.current) {
            vA.current.muted = true;
            setIsMuted(true);
            setAudioBlocked(true);
            vA.current.play().catch((innerErr) => {
              console.error("Muted play also blocked:", innerErr);
              setTimeout(handleVideoEnded, 1000);
            });
          }
        });
      }
    }

    // 3. Mở khóa vB (buffer ẩn) bằng cách phát và tạm dừng ngay lập tức ở chế độ MUTED
    if (vB.current) {
      const p = vB.current.play();
      if (p instanceof Promise) {
        p.then(() => {
          vB.current?.pause();
        }).catch(() => {});
      } else {
        vB.current.pause();
      }
    }

    setPhase('playing');
    setClipIdx(0);
    setActiveBuf(0);
  }, [playSfx, isMuted, handleVideoEnded]);

  const handleSkipImmediate = useCallback(() => {
    triggerDissolve();
  }, [triggerDissolve]);

  // Đồng bộ trạng thái âm thanh tới cả hai video
  useEffect(() => {
    if (vA.current) vA.current.muted = isMuted;
    if (vB.current) vB.current.muted = isMuted;
  }, [isMuted]);

  const handleUnblock = useCallback(() => {
    setAudioBlocked(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setAudioBlocked(false);
    setIsMuted((m) => !m);
  }, []);

  // Double-buffering chủ động + Preload clip tiếp theo ẩn dưới nền
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const nextSrc = INTRO_CLIPS[clipIdx];
    const isEven = clipIdx % 2 === 0;

    if (clipIdx > 0) {
      if (isEven) {
        // Phát trên vA
        if (vA.current) {
          if (!vA.current.src.endsWith(nextSrc)) {
            vA.current.src = nextSrc;
            vA.current.load();
          }
          vA.current.muted = isMuted;
          const p = vA.current.play();
          if (p instanceof Promise) p.catch(() => {});
        }
        // Đổi hiển thị active sang vA ngay lập tức
        setActiveBuf(0);
        
        // Preload clip tiếp theo (idx + 1) vào vB (inactive buffer)
        const nextClip = INTRO_CLIPS[clipIdx + 1];
        if (vB.current && nextClip) {
          if (!vB.current.src.endsWith(nextClip)) {
            vB.current.src = nextClip;
            vB.current.load();
          }
        }
      } else {
        // Phát trên vB
        if (vB.current) {
          if (!vB.current.src.endsWith(nextSrc)) {
            vB.current.src = nextSrc;
            vB.current.load();
          }
          vB.current.muted = isMuted;
          const p = vB.current.play();
          if (p instanceof Promise) p.catch(() => {});
        }
        // Đổi hiển thị active sang vB ngay lập tức
        setActiveBuf(1);

        // Preload clip tiếp theo (idx + 1) vào vA (inactive buffer)
        const nextClip = INTRO_CLIPS[clipIdx + 1];
        if (vA.current && nextClip) {
          if (!vA.current.src.endsWith(nextClip)) {
            vA.current.src = nextClip;
            vA.current.load();
          }
        }
      }
    } else {
      // clipIdx === 0
      // Preload sẵn clip thứ 2 vào vB
      const nextClip = INTRO_CLIPS[1];
      if (vB.current && nextClip) {
        if (!vB.current.src.endsWith(nextClip)) {
          vB.current.src = nextClip;
          vB.current.load();
        }
      }
    }

    // Phụ đề typewriter
    setSubtitle('');
    const text = SUBTITLES[clipIdx];
    if (text) {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setSubtitle(text.slice(0, i));
          // Play click SFX every 3rd character for authentic high-tech terminal feel
          if (i > 0 && i % 3 === 0 && !isMuted) {
            playSfx('/audio/sfx/click.mp3', 0.12);
          }
          i++;
        } else {
          clearInterval(interval);
        }
      }, 48);
      return () => clearInterval(interval);
    }
  }, [clipIdx, phase, isMuted, playSfx]);

  // Hotkeys: ESC, SPACE, ENTER
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'prompt') handleSkipImmediate();
        else if (phase === 'playing') triggerDissolve();
      } else if ((e.key === ' ' || e.key === 'Enter') && phase === 'prompt') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleSkipImmediate, triggerDissolve, handleStart]);

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        @keyframes cyber-glitch {
          0%   { filter: brightness(1) blur(0); transform: scale(1); }
          15%  { filter: brightness(3.5) contrast(2) hue-rotate(130deg); transform: scale(1.08) skewX(7deg); }
          35%  { filter: brightness(6) invert(0.7) blur(5px); transform: scale(0.93) skewX(-7deg); }
          70%  { filter: brightness(11) blur(28px); transform: scale(1.65); opacity: 0.45; }
          100% { filter: brightness(13) blur(65px); transform: scale(2.6); opacity: 0; }
        }
        .animate-dissolve { animation: cyber-glitch 1.45s cubic-bezier(0.23, 1, 0.32, 1) forwards; }

        @keyframes scan-beam { 0% { transform: translateY(-120%); } 100% { transform: translateY(120%); } }
        .animate-scan { animation: scan-beam 1.6s linear infinite; }

        @keyframes noise {
          0%,100% { transform: translate(0,0); }
          20% { transform: translate(-4%,4%); }
          40% { transform: translate(4%,-4%); }
          60% { transform: translate(4%,4%); }
          80% { transform: translate(-4%,-4%); }
        }
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
          animation: noise 0.15s steps(3) infinite;
        }

        @keyframes sheen {
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div 
        className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden transition-colors duration-[1600ms] ease-out ${
          phase === 'dissolving' 
            ? 'bg-[#010204]/0 backdrop-blur-none pointer-events-none' 
            : 'bg-[#010204]/95 backdrop-blur-3xl'
        }`}
      >
        <AnimatePresence>

          {/* ===== PHASE 1: PROMPT GATE ===== */}
          {phase === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ scale: 0.75, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(40px) brightness(4) hue-rotate(90deg)', rotateZ: -15, skewY: 10 }}
              transition={{ duration: 0.8, ease: [0.36, 0, 0.66, -0.56] }}
              className="relative max-w-md w-full mx-4 p-8 md:p-10 border border-cyan-400/40 rounded-[2rem] bg-[#02050a]/90 backdrop-blur-3xl shadow-[0_0_120px_-20px_rgba(0,242,254,0.4)] text-center"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-20 blur-2xl rounded-3xl animate-pulse" />
              <div className="relative">
                <ShieldAlert className="w-14 h-14 mx-auto text-cyan-400 mb-6 animate-pulse" />
                <h2 className="text-3xl font-black tracking-[4px] text-white uppercase mb-4 drop-shadow-[0_0_15px_#00f2fe]">
                  TÍN HIỆU HỆ THỐNG
                </h2>
                <p className="text-cyan-100/70 font-mono text-sm leading-relaxed mb-8">
                  Phát hiện truy cập mới.<br />
                  Kích hoạt chuỗi dữ liệu không gian trước khi vào Antigravity?
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleStart}
                    onMouseEnter={() => playSfx('/audio/sfx/hover.mp3', 0.4)}
                    className="group relative w-full py-5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-lg uppercase tracking-[3px] rounded-2xl overflow-hidden hover:scale-105 hover:shadow-[0_0_50px_rgba(0,242,254,0.65)] transition-all duration-300"
                  >
                    {/* Glass shimmer sheer sweep */}
                    <span 
                      className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full" 
                      style={{ animation: 'sheen 2.2s infinite' }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Play className="w-6 h-6 fill-black" /> XEM HƯỚNG DẪN
                    </span>
                  </button>
                  <button
                    onClick={handleSkipImmediate}
                    onMouseEnter={() => playSfx('/audio/sfx/hover.mp3', 0.4)}
                    className="w-full py-5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-white/50 hover:text-red-200 rounded-2xl uppercase tracking-[3px] text-sm transition-all duration-300 hover:shadow-[0_0_24px_rgba(239,68,68,0.15)]"
                  >
                    BỎ QUA → VÀO NGAY
                  </button>
                  <p className="text-white/30 text-xs font-mono pt-2">[SPACE] BẮT ĐẦU • [ESC] BỎ QUA</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== PHASE 2 & 3: VIDEO PLAYER + DISSOLVE ===== */}
          {(phase === 'playing' || phase === 'dissolving') && (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex items-center justify-center p-4 md:p-8 w-full h-full"
            >
              {/* Dynamic Cyberpunk Ambient Glow (Ambilight) */}
              <div 
                className="absolute w-full max-w-7xl aspect-video -z-10 opacity-75 blur-[100px] pointer-events-none transition-all duration-[1000ms] ease-in-out rounded-3xl scale-[1.08] saturate-200"
                style={{
                  background:
                    phase === 'dissolving'
                      ? 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%)'
                      : clipIdx === 0
                        ? 'radial-gradient(circle, rgba(6,182,212,0.42) 0%, rgba(59,130,246,0.05) 70%)'
                        : clipIdx === 1
                          ? 'radial-gradient(circle, rgba(168,85,247,0.42) 0%, rgba(99,102,241,0.05) 70%)'
                          : 'radial-gradient(circle, rgba(236,72,153,0.48) 0%, rgba(6,182,212,0.08) 70%)'
                }}
              />

              <div
                className={`relative w-full max-w-7xl aspect-video rounded-3xl overflow-hidden border-4 border-cyan-400/70 shadow-[0_0_130px_rgba(0,242,254,0.2)] ${
                  phase === 'dissolving' ? 'animate-dissolve' : ''
                }`}
              >
                {/* GLITCH TRANSITION LAYER */}
                <AnimatePresence>
                  {isTransitioning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-[#02050a] flex flex-col items-center justify-center font-mono overflow-hidden pointer-events-none"
                    >
                      <div className="bg-noise absolute inset-0 mix-blend-screen opacity-20" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,242,254,0.03)_1px,transparent_1px)] bg-[size:100%_4px]" />
                      <div className="w-full h-12 bg-cyan-400/20 animate-scan blur-2xl absolute" />
                      <div className="w-full h-[2px] bg-cyan-300 animate-scan absolute shadow-[0_0_15px_#00f2fe]" />
                      
                      <div className="relative z-30 flex flex-col items-center gap-2 text-center select-none px-4">
                        <div className="flex items-center gap-3 text-cyan-400 font-black tracking-[0.25em] text-xs sm:text-sm animate-pulse">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          {clipIdx === 1 ? 'ĐỒNG BỘ DỮ LIỆU VŨ TRỤ' : 'KÍCH HOẠT CỔNG KHÔNG GIAN'}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-cyan-300/60 font-mono tracking-widest uppercase">
                          {clipIdx === 1 
                            ? 'SYSTEM_STATUS: SECURING_SECTOR_2 // CORES_ACTIVE' 
                            : 'SYSTEM_STATUS: OPENING_WORMHOLE_SINGULARITY // QUANTUM_OVERCLOCK'
                          }
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-3 bg-cyan-500/85 rounded-[1px]"
                              initial={{ opacity: 0.1 }}
                              animate={{ opacity: [0.1, 1, 0.1] }}
                              transition={{
                                duration: 0.35,
                                repeat: Infinity,
                                delay: i * 0.03,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOUBLE BUFFERING VIDEOS */}
                <video
                  ref={vA}
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  style={{
                    opacity: activeBuf === 0 ? 1 : 0,
                    zIndex: activeBuf === 0 ? 3 : 2,
                    pointerEvents: activeBuf === 0 ? 'auto' : 'none'
                  }}
                  onEnded={() => { if (activeBuf === 0) handleVideoEnded(); }}
                />
                <video
                  ref={vB}
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  style={{
                    opacity: activeBuf === 1 ? 1 : 0,
                    zIndex: activeBuf === 1 ? 3 : 2,
                    pointerEvents: activeBuf === 1 ? 'auto' : 'none'
                  }}
                  onEnded={() => { if (activeBuf === 1) handleVideoEnded(); }}
                />

                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,242,254,0.05)_3px)] z-10" />
                {/* Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] pointer-events-none z-10" />

                {/* SUBTITLE TYPEWRITER */}
                {phase === 'playing' && !isTransitioning && (
                  <div className="absolute bottom-20 md:bottom-24 left-0 right-0 flex justify-center z-20 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-cyan-400/30 flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <span className="font-mono text-cyan-100 text-base tracking-widest drop-shadow-[0_0_8px_#00f2fe]">
                        {subtitle}<span className="animate-pulse">_</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress dots */}
                {phase === 'playing' && (
                  <div className="absolute top-8 left-8 flex gap-3 z-20">
                    {INTRO_CLIPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-12 rounded-full transition-all ${
                          i < clipIdx
                            ? 'bg-cyan-400 shadow-[0_0_12px_#00f2fe]'
                            : i === clipIdx
                              ? 'bg-cyan-300 animate-pulse shadow-[0_0_16px_#00f2fe]'
                              : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Mute toggle + audio-blocked prompt */}
                {phase === 'playing' && (
                  <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-3">

                    {/* Audio blocked banner */}
                    <AnimatePresence>
                      {audioBlocked && (
                        <motion.button
                          initial={{ opacity: 0, x: 40, scale: 0.85 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 40, scale: 0.85 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                          onClick={handleUnblock}
                          className="flex items-center gap-3 px-5 py-3 rounded-2xl font-mono text-sm font-bold tracking-widest backdrop-blur-2xl border border-yellow-400/80 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.35)] hover:shadow-[0_0_40px_rgba(250,204,21,0.6)] hover:bg-yellow-400/20 hover:text-white transition-all"
                        >
                          <motion.span
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                          >
                            <VolumeX className="w-5 h-5" />
                          </motion.span>
                          BẬT ÂM THANH
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* Main mute toggle */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={toggleMute}
                      onMouseEnter={() => playSfx('/audio/sfx/hover.mp3', 0.3)}
                      className="relative flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl font-mono text-sm font-semibold tracking-wider backdrop-blur-2xl transition-all"
                      style={{
                        background: isMuted
                          ? 'rgba(239,68,68,0.12)'
                          : 'rgba(0,242,254,0.08)',
                        border: isMuted
                          ? '1.5px solid rgba(239,68,68,0.55)'
                          : '1.5px solid rgba(0,242,254,0.45)',
                        color: isMuted ? 'rgb(252,165,165)' : 'rgb(103,232,249)',
                        boxShadow: isMuted
                          ? '0 0 22px rgba(239,68,68,0.25)'
                          : '0 0 22px rgba(0,242,254,0.2)',
                      }}
                    >
                      {/* Ripple ring khi unmuted */}
                      {!isMuted && (
                        <motion.span
                          className="absolute inset-0 rounded-2xl border border-cyan-400/40"
                          animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                        />
                      )}
                      {isMuted
                        ? <VolumeX className="w-5 h-5 flex-shrink-0" />
                        : <Volume2 className="w-5 h-5 flex-shrink-0" />
                      }
                      <span>{isMuted ? 'ĐÃ TẮT TIẾNG' : 'ÂM THANH BẬT'}</span>
                    </motion.button>

                  </div>
                )}

                {/* Skip button */}
                {phase === 'playing' && (
                  <motion.button
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={triggerDissolve}
                    onMouseEnter={() => playSfx('/audio/sfx/hover.mp3', 0.5)}
                    className="absolute bottom-8 right-8 z-50 flex items-center gap-3 px-7 py-4 bg-black/70 backdrop-blur-2xl border border-red-400/60 hover:border-red-400 text-red-300 hover:text-white rounded-3xl font-mono uppercase text-sm tracking-widest shadow-xl transition-all"
                  >
                    BỎ QUA <FastForward className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* PARTICLES + FLASHBANG (dissolving phase) */}
              {phase === 'dissolving' && (
                <div className="absolute inset-0 pointer-events-none z-[100]">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0 bg-cyan-100 mix-blend-screen"
                  />
                  {particles.map((p, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2 rounded-full"
                      style={{
                        backgroundColor: p.color,
                        width: p.scale * 4.5,
                        height: p.scale * 4.5,
                        boxShadow: `0 0 ${p.scale * 14}px ${p.color}`,
                      }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.15, rotate: 720 }}
                      transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}
