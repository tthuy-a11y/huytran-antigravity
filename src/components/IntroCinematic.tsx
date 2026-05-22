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

  const playSfx = useCallback((src: string, vol = 0.6) => {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch (_e) {}
  }, []);

  // SFX khi mở Prompt Gate
  useEffect(() => {
    if (phase === 'prompt') playSfx('/audio/sfx/modal-open.mp3', 0.65);
  }, [phase, playSfx]);

  // Cleanup timeouts khi unmount
  useEffect(() => {
    return () => activeTimeouts.current.forEach(clearTimeout);
  }, []);

  const handleStart = useCallback(() => {
    playSfx('/audio/sfx/click.mp3', 0.85);
    
    // Synchronously unlock videos during user interaction!
    if (vA.current) {
      vA.current.src = INTRO_CLIPS[0];
      vA.current.muted = isMuted;
      vA.current.play().catch(() => {
        setIsMuted(true);
        setAudioBlocked(true);
        vA.current!.muted = true;
        vA.current!.play().catch(() => setTimeout(handleVideoEnded, 1000));
      });
    }
    if (vB.current) {
      vB.current.src = INTRO_CLIPS[1] || INTRO_CLIPS[0];
      vB.current.muted = isMuted;
      vB.current.play().then(() => vB.current?.pause()).catch(() => {});
    }

    setPhase('playing');
  }, [playSfx, isMuted, handleVideoEnded]);

  const handleSkipImmediate = useCallback(() => {
    playSfx('/audio/sfx/click.mp3', 0.5);
    setPhase('done');
    onComplete();
  }, [playSfx, onComplete]);

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

      const t = setTimeout(() => {
        setClipIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 420);
      activeTimeouts.current.push(t);
    } else {
      triggerDissolve();
    }
  }, [clipIdx, playSfx, triggerDissolve]);

  // Sync mute state to video elements
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

  // Play video + subtitle syncing
  useEffect(() => {
    if (phase !== 'playing' || isTransitioning) return;
    
    const nextSrc = INTRO_CLIPS[clipIdx];
    const nextBuf = activeBuf === 0 ? 1 : 0;

    if (clipIdx === 0) {
      // First clip: already unlocked and started in handleStart
    } else {
      // Subsequent clips: double buffer swap
      if (nextBuf === 0) {
        if (vA.current) {
          if (!vA.current.src.endsWith(nextSrc)) {
            vA.current.src = nextSrc;
            vA.current.load();
          }
          vA.current.muted = isMuted;
          vA.current.play().catch(() => {});
        }
      } else {
        if (vB.current) {
          if (!vB.current.src.endsWith(nextSrc)) {
            vB.current.src = nextSrc;
            vB.current.load();
          }
          vB.current.muted = isMuted;
          vB.current.play().catch(() => {});
        }
      }
    }

    setSubtitle('');
    const text = SUBTITLES[clipIdx];
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setSubtitle(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 48);
    return () => clearInterval(interval);
  }, [clipIdx, phase, isTransitioning, isMuted, handleVideoEnded]);

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
      `}</style>

      <div className="fixed inset-0 z-[99999] bg-[#010204]/95 backdrop-blur-3xl flex items-center justify-center overflow-hidden">
        <AnimatePresence>

          {/* ===== PHASE 1: PROMPT GATE ===== */}
          {phase === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ scale: 0.75, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.15, opacity: 0, filter: 'blur(15px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                    className="group relative w-full py-5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-lg uppercase tracking-[3px] rounded-2xl overflow-hidden hover:scale-105 shadow-[0_0_40px_rgba(0,242,254,0.4)] transition-transform"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Play className="w-6 h-6" /> XEM HƯỚNG DẪN
                    </span>
                  </button>
                  <button
                    onClick={handleSkipImmediate}
                    onMouseEnter={() => playSfx('/audio/sfx/hover.mp3', 0.4)}
                    className="w-full py-5 border border-white/20 hover:border-cyan-400 text-white/60 hover:text-white rounded-2xl uppercase tracking-[3px] text-sm transition-all"
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
                      className="absolute inset-0 z-20 bg-black flex items-center justify-center"
                    >
                      <div className="bg-noise absolute inset-0 mix-blend-screen" />
                      <div className="w-full h-9 bg-cyan-400/30 animate-scan blur-xl" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOUBLE BUFFERING VIDEOS */}
                <video
                  ref={vA}
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-300"
                  style={{ opacity: activeBuf === 0 ? 1 : 0, zIndex: activeBuf === 0 ? 2 : 1 }}
                  onEnded={() => { if (activeBuf === 0) handleVideoEnded(); }}
                  onPlaying={() => { if (clipIdx % 2 === 0) setActiveBuf(0); }}
                />
                <video
                  ref={vB}
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-300"
                  style={{ opacity: activeBuf === 1 ? 1 : 0, zIndex: activeBuf === 1 ? 2 : 1 }}
                  onEnded={() => { if (activeBuf === 1) handleVideoEnded(); }}
                  onPlaying={() => { if (clipIdx % 2 === 1) setActiveBuf(1); }}
                />

                {/* Preload next clip */}
                {INTRO_CLIPS[clipIdx + 1] && (
                  <link rel="preload" as="video" href={INTRO_CLIPS[clipIdx + 1]} />
                )}

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
