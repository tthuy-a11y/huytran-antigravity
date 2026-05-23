'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FastForward, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '@/app/creative/lib/audioEngine';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';

type Phase = 'prompt' | 'playing' | 'dissolving' | 'done';

interface CreativeVideoIntroProps {
  onComplete: () => void;
}

// Poetic subtitles mapped to the video's exact timeline
type DialogueLine = {
  id: string; text: string; start: number; end: number;
  style: 'serif-italic' | 'neon-pink-italic' | 'mono-cyan-glitch';
};

const INTRO_DIALOGUE: DialogueLine[] = [
  { id: 'd1', text: 'Trong khoảng lặng giữa các vì sao', start: 0.2, end: 1.8, style: 'serif-italic' },
  { id: 'd2', text: 'tôi tìm thấy tiếng vọng của chính mình...', start: 1.2, end: 2.8, style: 'serif-italic' },
  { id: 'd3', text: 'Nơi sáng tạo là chìa khóa mở ra cánh cửa đến tận cùng vũ trụ', start: 2.5, end: 4.5, style: 'neon-pink-italic' },
  { id: 'd4', text: 'Còn trí tuệ công nghệ là công cụ dẫn dắt xuyên qua thời không', start: 4.2, end: 6.5, style: 'mono-cyan-glitch' },
];

// Styles from original CinematicUI.tsx to preserve project aesthetic
const STYLE_CLS: Record<DialogueLine['style'], string> = {
  'serif-italic': 'italic font-serif text-xl md:text-3xl lg:text-4xl tracking-normal text-center',
  'neon-pink-italic': 'italic font-light text-2xl md:text-4xl lg:text-5xl tracking-wide text-center',
  'mono-cyan-glitch': 'font-mono text-lg md:text-2xl lg:text-3xl tracking-[0.15em] uppercase text-center px-4',
};

const STYLE_INLINE: Record<DialogueLine['style'], React.CSSProperties> = {
  'serif-italic': { color: '#f3e6c8', textShadow: '0 0 10px rgba(255,220,160,0.5), 0 0 24px rgba(255,180,100,0.3)' },
  'neon-pink-italic': { color: '#ffd0f0', textShadow: '0 0 12px #ff6ad0, 0 0 28px #c850ff, 0 0 60px #8030ff' },
  'mono-cyan-glitch': { color: '#dcfaff', textShadow: '0 0 8px #26e6ff, 0 0 22px #00b8ff, 0 0 44px #0080ff' },
};

// Word Stagger Animation
function SplitWords({ text, stagger = 0.08 }: { text: string; stagger?: number }) {
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
          className="inline-block mr-[0.25em] last:mr-0"
          variants={{
            hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: 'easeOut' } },
          }}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Chromatic RGB Glitch Animation
function GlitchText({ text }: { text: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>
      <motion.span 
        aria-hidden 
        className="absolute inset-0 z-0 select-none"
        style={{ color: '#ff5aa8', mixBlendMode: 'screen', opacity: 0.5 }}
        animate={{ x: [0, -1, 0.7, 0], opacity: [0.5, 0.65, 0.4, 0.5] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        {text}
      </motion.span>
      <motion.span 
        aria-hidden 
        className="absolute inset-0 z-0 select-none"
        style={{ color: '#3ae8ff', mixBlendMode: 'screen', opacity: 0.5 }}
        animate={{ x: [0, 1, -0.7, 0], opacity: [0.5, 0.4, 0.65, 0.5] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function CreativeVideoIntro({ onComplete }: CreativeVideoIntroProps) {
  const [phase, setPhase] = useState<Phase>('prompt');
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  
  // Track precise video playback time for subtitle synchronization
  const [videoTime, setVideoTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Sync mute state with global engine
  useEffect(() => {
    audioEngine.setMuted(isMuted);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Clean up timeouts
  useEffect(() => {
    return () => activeTimeouts.current.forEach(clearTimeout);
  }, []);

  const triggerDissolve = useCallback(() => {
    if (phase === 'dissolving' || phase === 'done') return;
    setPhase('dissolving');
    if (videoRef.current) videoRef.current.pause();

    // Trigger high-tech glass shatter cue on dissolve
    audioEngine.playCue('glass-shatter', { volume: 0.8 });

    const t = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1200);

    activeTimeouts.current.push(t);
  }, [phase, onComplete]);

  const handleStart = useCallback(() => {
    // Initialize audio engine on user interaction
    audioEngine.init().then(() => {
      audioEngine.setMuted(isMuted);
      audioEngine.setSceneMix('creation');
    }).catch(() => {});

    // Play initial shockwave sweep
    audioEngine.playCue('shockwave', { volume: 0.6 });

    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise instanceof Promise) {
        playPromise.then(() => {
          setAudioBlocked(false);
        }).catch((err) => {
          console.warn("Audio playback blocked, fallback to muted:", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            setAudioBlocked(true);
            videoRef.current.play().catch((inner) => {
              console.error("Muted playback failed:", inner);
              triggerDissolve();
            });
          }
        });
      }
    }

    setPhase('playing');
  }, [isMuted, triggerDissolve]);

  // High-precision loop to sync time and audio cues
  useEffect(() => {
    if (phase !== 'playing') return;
    const video = videoRef.current;
    if (!video) return;

    let warpTriggered = false;
    let shockwaveTriggered = false;
    let frameId = 0;

    const tick = () => {
      if (video.paused || video.ended) return;
      const ct = video.currentTime;
      setVideoTime(ct); // Update react state for subtitle rendering

      // 1. Sync warp-jump sound exactly at 1.0s
      if (ct >= 1.0 && !warpTriggered) {
        warpTriggered = true;
        audioEngine.playCue('warp-jump', { volume: 0.85 });
      }

      // 2. Sync shockwave bass sweep exactly at 3.5s
      if (ct >= 3.5 && !shockwaveTriggered) {
        shockwaveTriggered = true;
        audioEngine.playCue('shockwave', { volume: 0.95 });
        audioEngine.setSceneMix('convergence', 2.0);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [phase]);

  // Compute active dialogues for the current video time
  const activeDialogues = useMemo(() => {
    return INTRO_DIALOGUE.filter((d) => videoTime >= d.start && videoTime <= d.end);
  }, [videoTime]);

  const handleUnblock = useCallback(() => {
    setAudioBlocked(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setAudioBlocked(false);
    setIsMuted((m) => !m);
  }, []);

  // Hotkeys Support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'prompt') triggerDissolve();
        else if (phase === 'playing') triggerDissolve();
      } else if ((e.key === ' ' || e.key === 'Enter') && phase === 'prompt') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleStart, triggerDissolve]);

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        @keyframes cyber-glitch {
          0%   { filter: brightness(1) blur(0); transform: scale(1); }
          20%  { filter: brightness(3) contrast(2) hue-rotate(90deg); transform: scale(1.05) skewX(5deg); }
          50%  { filter: brightness(5) invert(0.8) blur(4px); transform: scale(0.95) skewX(-5deg); }
          100% { filter: brightness(10) blur(40px); transform: scale(2.2); opacity: 0; }
        }
        .animate-dissolve { animation: cyber-glitch 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        
        @keyframes sheen { 100% { transform: translateX(200%); } }
      `}</style>

      <div 
        className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden transition-colors duration-[1200ms] ease-out ${
          phase === 'dissolving' 
            ? 'bg-[#010204]/0 backdrop-blur-none pointer-events-none' 
            : 'bg-[#010204]/98 backdrop-blur-3xl'
        }`}
      >
        <AnimatePresence>
          {/* ================= PHASE 1: PROMPT GATE ================= */}
          {phase === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, filter: 'blur(30px) brightness(3) hue-rotate(90deg)' }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative z-50 max-w-md w-full mx-4 p-8 border border-cyan-400/40 rounded-[2rem] bg-[#02050a]/95 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,242,254,0.3)] text-center"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-20 blur-xl rounded-3xl animate-pulse" />
              <div className="relative">
                <ShieldAlert className="w-12 h-12 mx-auto text-cyan-400 mb-5 animate-pulse" />
                <h2 className="text-2xl font-black tracking-[5px] text-white uppercase mb-3 drop-shadow-[0_0_12px_#00f2fe]">
                  THIẾT LẬP KẾT NỐI
                </h2>
                <p className="text-cyan-100/70 font-mono text-xs leading-relaxed mb-6">
                  Kích hoạt chuỗi hành trình không gian độc bản<br />
                  trước khi tiến vào Trạm Sáng Tạo Antigravity?
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleStart}
                    className="group relative w-full py-4.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-base uppercase tracking-[2px] rounded-xl overflow-hidden hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(0,242,254,0.5)] transition-all duration-300 cursor-pointer"
                  >
                    <span 
                      className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full" 
                      style={{ animation: 'sheen 2s infinite' }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Play className="w-5 h-5 fill-black" /> DU HÀNH KHÔNG GIAN
                    </span>
                  </button>
                  <button
                    onClick={triggerDissolve}
                    className="w-full py-4 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-white/40 hover:text-red-200 rounded-xl uppercase tracking-[2px] text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] cursor-pointer"
                  >
                    BỎ QUA {"->"} VÀO TRẠM
                  </button>
                  <p className="text-white/30 text-[10px] font-mono">[SPACE] KHỞI HÀNH • [ESC] BỎ QUA</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= PHASE 2: VIDEO CINEMATIC PLAYER + DIALOGUE OVERLAYS ================= */}
          {(phase === 'playing' || phase === 'dissolving') && (
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 w-full h-full">
              <div 
                className="absolute w-full max-w-7xl aspect-video -z-10 opacity-60 blur-[80px] pointer-events-none transition-all duration-1000 rounded-3xl scale-[1.05] saturate-150"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(168,85,247,0.1) 70%)'
                }}
              />

              <div
                className={`relative w-full max-w-7xl aspect-video rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_80px_rgba(0,242,254,0.15)] ${
                  phase === 'dissolving' ? 'animate-dissolve' : ''
                }`}
              >
                <video
                  ref={videoRef}
                  src="/videos/intro/creative-intro.mp4"
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover"
                  onEnded={triggerDissolve}
                />

                {/* Scanlines & Vignette */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,242,254,0.03)_3px)] z-10" />
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] pointer-events-none z-10" />

                {/* Active Subtitle Overlays (Positioned perfectly over the video) */}
                <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-end pb-24 md:pb-28">
                  <AnimatePresence mode="sync">
                    {activeDialogues.map((dialogue) => {
                      const cls = STYLE_CLS[dialogue.style];
                      const styleObj = STYLE_INLINE[dialogue.style];

                      // Define specific Y positions for the text
                      const positionY: React.CSSProperties = (() => {
                        if (dialogue.id === 'd1') return { transform: 'translateY(-45px)' };
                        if (dialogue.id === 'd2') return { transform: 'translateY(-10px)' };
                        return {};
                      })();

                      let content: React.ReactNode = dialogue.text;
                      if (dialogue.style === 'serif-italic') {
                        content = <SplitWords text={dialogue.text} stagger={0.08} />;
                      } else if (dialogue.style === 'neon-pink-italic') {
                        content = <SplitWords text={dialogue.text} stagger={0.05} />;
                      } else if (dialogue.style === 'mono-cyan-glitch') {
                        content = <GlitchText text={dialogue.text} />;
                      }

                      return (
                        <motion.div
                          key={dialogue.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`w-full text-center px-6 absolute left-0 right-0 ${cls}`}
                          style={{ ...styleObj, ...positionY }}
                        >
                          {content}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Mute Control & Audio Block Banner */}
                <div className="absolute top-5 right-5 z-50 flex flex-col items-end gap-2">
                  <AnimatePresence>
                    {audioBlocked && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={handleUnblock}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider backdrop-blur-xl border border-yellow-400/80 bg-yellow-400/10 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:bg-yellow-400/20 transition-all"
                      >
                        <VolumeX className="w-4 h-4 animate-bounce" /> BẬT ÂM THANH
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={toggleMute}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs font-semibold backdrop-blur-xl transition-all border border-cyan-400/30 text-cyan-300 bg-cyan-400/5 hover:scale-105"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{isMuted ? 'TẮT ÂM' : 'ÂM THANH'}</span>
                  </button>
                </div>

                {/* Skip button */}
                <button
                  onClick={triggerDissolve}
                  className="absolute bottom-5 right-5 z-50 flex items-center gap-2 px-5 py-3 bg-black/70 backdrop-blur-md border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-xl font-mono uppercase text-xs tracking-wider transition-all"
                >
                  BỎ QUA <FastForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
