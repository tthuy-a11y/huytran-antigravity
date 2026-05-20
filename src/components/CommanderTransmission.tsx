'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  SignalHigh,
  Target,
  Zap,
  Phone,
  Mail,
  Download,
  Home,
  Power,
  ExternalLink,
  GitBranch,
  FileText,
  X,
  RefreshCcw,
  Globe,
  Rocket,
  Sparkles,
  Network,
  Layers,
  Cpu,
  Box,
  Database,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

// =============================================================================
// CONSTANTS
// =============================================================================
const COMMANDER_KEY = 'commander_progress_v3';

type TransmissionPhase =
  | 'idle'
  | 'incoming'
  | 'dialogue'
  | 'dossier'
  | 'collapsing'
  | 'collapsed'
  | 'dossier-reopen';

const TRANSMISSION_LINES = [
  { speaker: 'SYSTEM', color: '#00f2fe', text: '[ TÍN HIỆU ĐÃ ĐƯỢC GIẢI MÃ... KẾT NỐI BẢO MẬT ĐÃ THIẾT LẬP ]' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Chào Anh/Chị. Hệ thống ghi nhận Anh/Chị đã dành thời gian khám phá không gian số này.' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Em là Thanh Huy, một IT luôn khao khát vượt qua những giới hạn thiết kế và lập trình thông thường.' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Bằng sự sáng tạo của sức trẻ, kết hợp cùng khả năng làm việc bứt phá trong chuyên môn... chính là cách em vận hành không gian số này.' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Với mong muốn tìm kiếm cơ hội làm việc và phát triển năng lực bản thân...' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: '...em hy vọng sẽ có một buổi gặp mặt trực tiếp với Anh/Chị để có thể trao đổi với nhau nhiều hơn.' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Toàn bộ dữ liệu liên hệ của em đã được giải mã ở bảng điều khiển bên dưới.' },
  { speaker: 'CMDR. THANH HUY', color: '#22d3ee', text: 'Rất mong nhận được phản hồi từ Anh/Chị. Hẹn gặp lại...' },
];

// Phonetic hack: makes vi-VN TTS pronounce English tech terms naturally
function phoneticize(text: string): string {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/Frontend/gi, 'phờ-rần-end')
    .replace(/Backend/gi, 'bắc-end')
    .replace(/Phờ-rét-shờ IT/gi, 'Ai Ti')
    .replace(/Fresher IT/gi, 'Ai Ti')
    .replace(/RESTful API/gi, 'rest phi ây pi ai')
    .replace(/AI Tools?/gi, 'ây ai tu')
    .replace(/ChatGPT/gi, 'chat gờ pờ ti')
    .replace(/Gemini/gi, 'gê mi ni')
    .replace(/Copilot/gi, 'cờ pai lắt')
    .replace(/React\/Next\.js/gi, 'ri-ắt next giây-ét')
    .replace(/Next\.js/gi, 'next giây ét')
    .replace(/React/gi, 'ri ắt')
    .replace(/GitHub/gi, 'gích hấp')
    .replace(/UI\/UX/gi, 'du ai du ét')
    .replace(/DOM/gi, 'đom')
    .replace(/10x/gi, 'mười lần')
    .replace(/\.{3,}/g, '.')
    .trim();
}

// Pre-computed random values (ESLint react purity rules)
const WAVEFORM_BARS = Array.from({ length: 7 }, () => ({
  peak: Math.random() * 80 + 20,
  duration: 0.15 + Math.random() * 0.2,
  delay: Math.random() * 0.3,
}));

const FLOATING_PARTICLES = Array.from({ length: 18 }, () => ({
  left: 20 + Math.random() * 60,
  top: 20 + Math.random() * 60,
  z: 10 + Math.random() * 30,
  driftX: Math.random() * 40 - 20,
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 3,
}));

// VIDEO CLIPS — 3 videos mapped to dialogue lines
const VIDEO_CLIPS = [
  '/videos/commander/1.mp4',
  '/videos/commander/2.mp4',
  '/videos/commander/3.mp4',
];
const getVideoIndex = (line: number): number => {
  if (line <= 2) return 0;
  if (line <= 4) return 1;
  return 2;
};

// =============================================================================
// AUDIO ENGINE
// =============================================================================
class TransmissionAudio {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private isInitialized = false;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  async init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.isInitialized = true;
  }

  loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      this.preferredVoice =
        voices.find(v => v.lang.includes('vi') && v.name.toLowerCase().includes('male')) ||
        voices.find(v => v.lang.includes('vi')) ||
        voices[0] ||
        null;
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  speakLine(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 1500);
      return;
    }
    this.stopSpeaking();
    const clean = phoneticize(text);
    if (!clean) {
      if (onEnd) setTimeout(onEnd, 800);
      return;
    }
    this.speechUtterance = new SpeechSynthesisUtterance(clean);
    this.speechUtterance.lang = 'vi-VN';
    this.speechUtterance.rate = 1.05;
    this.speechUtterance.pitch = 1.0;
    this.speechUtterance.volume = 0.9;
    if (this.preferredVoice) this.speechUtterance.voice = this.preferredVoice;
    if (onEnd) {
      this.speechUtterance.onend = onEnd;
      this.speechUtterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(this.speechUtterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  playBGM() {
    if (!this.audioContext) return;
    this.stopBGM();
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.06;
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, this.audioContext.currentTime);
    osc2.frequency.setValueAtTime(240, this.audioContext.currentTime);
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc1.connect(filter).connect(gain).connect(this.audioContext.destination);
    osc2.connect(filter).connect(gain).connect(this.audioContext.destination);
    osc1.start();
    osc2.start();
    this.oscillators = [osc1, osc2];
  }

  stopBGM() {
    this.oscillators.forEach(osc => { try { osc.stop(); } catch { /* noop */ } });
    this.oscillators = [];
  }

  playType() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680 + Math.random() * 420, this.audioContext.currentTime);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 400, this.audioContext.currentTime);
    gain.gain.value = 0.02;
    osc.connect(filter).connect(gain).connect(this.audioContext.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.045);
    osc.stop(this.audioContext.currentTime + 0.08);
  }

  playDownloadSuccess() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(this.audioContext.destination);
    osc.start();
    osc.frequency.linearRampToValueAtTime(1600, now + 0.6);
    osc.stop(now + 0.6);
  }

  playWarp() {
    if (!this.audioContext) return;
    const noise = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 1.2, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) output[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
    noise.connect(filter).connect(gain).connect(this.audioContext.destination);
    noise.start();
  }

  dispose() {
    this.stopBGM();
    this.stopSpeaking();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

// =============================================================================
// HOLOGRAPHIC AVATAR (MEMOIZED)
// =============================================================================
const HolographicAvatar = memo(({ isActive, videoSrc, onEnded }: { isActive: boolean; videoSrc: string; onEnded?: () => void }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = videoSrc;
    if (isActive) {
      video.play().catch(() => {});
    }
  }, [videoSrc, isActive]);

  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(0,242,254,0.3),inset_0_0_30px_rgba(0,242,254,0.2)] bg-[#010614]">
      {/* Scan beam — subtle */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-3xl">
        <div
          className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/8 to-transparent"
          style={{ animation: 'scan-beam 3s linear infinite' }}
        />
      </div>

      {/* VIDEO — NATURAL COLORS + ORIGINAL AUDIO */}
      <video
        ref={videoRef}
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-top z-[1]"
        onEnded={onEnded}
      />

      {/* Subtle scanlines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,242,254,0.04)_3px,rgba(0,242,254,0.04)_4px)] pointer-events-none z-10" />

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] pointer-events-none z-30 rounded-3xl" />

      {/* Audio waveform */}
      {isActive && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1 h-6 z-40">
          {WAVEFORM_BARS.map((bar, i) => (
            <div
              key={i}
              className="w-1.5 bg-cyan-400 rounded-t shadow-[0_0_10px_#00f2fe]"
              style={{
                height: `${bar.peak}%`,
                animation: `audio-wave ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});
HolographicAvatar.displayName = 'HolographicAvatar';

// =============================================================================
// PROJECT SUMMARY CONTENT COMPONENT
// =============================================================================
const ProjectSummaryContent = () => {
  return (
    <div className="space-y-12 text-white/80 font-sans pb-10" style={{ perspective: '1400px' }}>
      
      {/* 1. Core Idea & Message */}
      <motion.section 
        animate={{ y: [0, -8, 0], rotateX: [0, 1.5, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-purple-900/20 border border-cyan-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.5),_inset_0_0_40px_rgba(34,211,238,0.1)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-purple-500 rounded-l-2xl" style={{ transform: 'translateZ(10px)' }} />
        <div className="flex items-center gap-3 mb-5" style={{ transform: 'translateZ(40px)' }}>
          <Sparkles className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <h3 className="text-2xl font-bold tracking-widest text-cyan-300 uppercase drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">Thông Điệp & Ý Tưởng</h3>
        </div>
        <div style={{ transform: 'translateZ(25px)' }}>
          <p className="text-lg leading-relaxed text-white/90">
            <strong className="text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">"Tôi không build website. Tôi kiến tạo không gian số có trọng lực riêng."</strong>
          </p>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            Antigravity Portfolio là một trải nghiệm tương tác (Interactive Portfolio) kết hợp chủ đề Không Gian Vũ Trụ (Cosmic Odyssey) và Cyberpunk. 
            Sử dụng <strong>DOM 3D thuần</strong>, <strong>HTML5 Canvas</strong>, hệ thống vật lý <strong>Matter.js</strong>, và âm thanh tổng hợp thời gian thực, 
            dự án vượt qua giới hạn phẳng thông thường để tạo nên một hệ sinh thái sống động mà không cần dùng đến các thư viện 3D nặng nề như WebGL/Three.js.
          </p>
        </div>
      </motion.section>

      {/* 2. System Architecture / Mind Map */}
      <section style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={{ y: [0, -5, 0], scale: [1, 1.01, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 mb-8"
          style={{ transform: 'translateZ(30px)' }}
        >
          <Network className="w-7 h-7 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
          <h3 className="text-2xl font-bold tracking-[4px] text-purple-300 uppercase drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">Sơ Đồ Cấu Trúc Hệ Thống</h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nhánh 1: Creative */}
          <motion.div 
            animate={{ y: [0, -12, 0], rotateY: [0, 4, 0], rotateX: [0, -2, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            className="bg-[#03010a]/90 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-7 shadow-[0_25px_50px_rgba(0,0,0,0.7),_inset_0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden group hover:border-cyan-400/80 transition-colors"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-500" style={{ transform: 'translateZ(10px)' }}>
              <Layers className="w-28 h-28 text-cyan-400" />
            </div>
            <h4 className="text-xl font-bold text-cyan-400 flex items-center gap-2 mb-4" style={{ transform: 'translateZ(45px)' }}>
              <Globe className="w-5 h-5 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> 1. KHÔNG GIAN SÁNG TẠO
            </h4>
            <p className="text-xs text-cyan-500/80 font-mono mb-5 border-b border-cyan-500/30 pb-3" style={{ transform: 'translateZ(35px)' }}>/creative - Cosmic Odyssey Engine</p>
            <ul className="space-y-4 text-sm text-white/85" style={{ transform: 'translateZ(25px)' }}>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,1)]">⊛</span>
                <span><strong>Hệ Mặt Trời 3D</strong> (DOM 3D) theo dõi chuột.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,1)]">⊛</span>
                <span><strong>Core_S: 2003:</strong> Lõi hố đen trung tâm.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,1)]">⊛</span>
                <span><strong>NEXUS-01 & UIX-99:</strong> Hành tinh kỹ năng bay quanh quỹ đạo đại diện cho AI & Giao diện.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,1)]">⊛</span>
                <span>Tương tác Hologram & Particle Starfield.</span>
              </li>
            </ul>
          </motion.div>

          {/* Nhánh 2: System */}
          <motion.div 
            animate={{ y: [0, -10, 0], rotateY: [0, -4, 0], rotateX: [0, 2, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-[#03010a]/90 backdrop-blur-xl border border-purple-500/40 rounded-xl p-7 shadow-[0_25px_50px_rgba(0,0,0,0.7),_inset_0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden group hover:border-purple-400/80 transition-colors"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-500" style={{ transform: 'translateZ(10px)' }}>
              <Cpu className="w-28 h-28 text-purple-400" />
            </div>
            <h4 className="text-xl font-bold text-purple-400 flex items-center gap-2 mb-4" style={{ transform: 'translateZ(45px)' }}>
              <Rocket className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> 2. TRẠM TỐC ĐỘ CAO
            </h4>
            <p className="text-xs text-purple-500/80 font-mono mb-5 border-b border-purple-500/30 pb-3" style={{ transform: 'translateZ(35px)' }}>/system - Exodus Engine V6</p>
            <ul className="space-y-4 text-sm text-white/85" style={{ transform: 'translateZ(25px)' }}>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1 drop-shadow-[0_0_5px_rgba(168,85,247,1)]">⊛</span>
                <span><strong>Command HUD:</strong> Giao diện điều khiển viễn tưởng quản lý hạm đội phi thuyền.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1 drop-shadow-[0_0_5px_rgba(168,85,247,1)]">⊛</span>
                <span><strong>Terminal Boot:</strong> Mã hóa Scramble Text & Matrix Rain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1 drop-shadow-[0_0_5px_rgba(168,85,247,1)]">⊛</span>
                <span>Hiệu ứng Wormhole/Blackhole Canvas tốc độ cao.</span>
              </li>
            </ul>
          </motion.div>

          {/* Component Tiêu Chuẩn */}
          <motion.div 
            animate={{ y: [0, -8, 0], rotateX: [0, 2, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="md:col-span-2 bg-[#03010a]/90 backdrop-blur-xl border border-emerald-500/40 rounded-xl p-7 shadow-[0_25px_50px_rgba(0,0,0,0.7),_inset_0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-400/80 transition-colors"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-500" style={{ transform: 'translateZ(10px)' }}>
              <Box className="w-32 h-32 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mb-6" style={{ transform: 'translateZ(45px)' }}>
              <Database className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 3. KHỐI TRỌNG LỰC & COMPONENT
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-white/85" style={{ transform: 'translateZ(25px)' }}>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 drop-shadow-[0_0_5px_rgba(16,185,129,1)]">⊛</span>
                  <span><strong>Zero-Gravity Physics:</strong> Dùng Matter.js tạo môi trường không trọng lực, kéo thả từ khóa kĩ năng (Next.js, AI...).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 drop-shadow-[0_0_5px_rgba(16,185,129,1)]">⊛</span>
                  <span><strong>Commander 3D Avatar:</strong> Tự động nhìn theo chuột, chớp mắt, nhép môi đồng bộ giọng nói nhân tạo.</span>
                </li>
              </ul>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 drop-shadow-[0_0_5px_rgba(16,185,129,1)]">⊛</span>
                  <span><strong>Giao diện Kính mờ:</strong> Glassmorphism chuyên sâu cho các form tương tác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 drop-shadow-[0_0_5px_rgba(16,185,129,1)]">⊛</span>
                  <span><strong>Synthetic Audio:</strong> Tạo âm thanh UI real-time qua Web Audio API.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CommanderTransmission() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransmissionPhase>('idle');

  const [currentLineState, setCurrentLineState] = useState(0);
  const currentLineRef = useRef(0);
  const setCurrentLine = useCallback((val: number) => {
    currentLineRef.current = val;
    setCurrentLineState(val);
  }, []);

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<{ speaker: string; color: string; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showProjectInfo, setShowProjectInfo] = useState(false);

  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const isTypingRef = useRef(false);
  const setIsTypingState = useCallback((val: boolean) => {
    setIsTyping(val);
    isTypingRef.current = val;
  }, []);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isAvatarTalking = isTyping || isSpeaking;

  const [transmissionCompleted, setTransmissionCompleted] = useState(false);

  const audioRef = useRef<TransmissionAudio | null>(null);
  const typewriterTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoNextTimeout = useRef<NodeJS.Timeout | null>(null);
  const nextLineRef = useRef<() => void>(() => {});

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-350, 350], [22, -22]);
  const rotateY = useTransform(mouseX, [-350, 350], [-22, 22]);
  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 28 });
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 28 });

  const checkTrigger = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const played = localStorage.getItem(`${COMMANDER_KEY}_played`) === 'true';
    const completed = localStorage.getItem(`${COMMANDER_KEY}_completed`) === 'true';
    if (played || completed) {
      if (completed) {
        setTransmissionCompleted(true);
        setPhase('collapsed');
      }
      return false;
    }
    let sessionStart = localStorage.getItem(`${COMMANDER_KEY}_session`);
    if (!sessionStart) {
      sessionStart = Date.now().toString();
      localStorage.setItem(`${COMMANDER_KEY}_session`, sessionStart);
    }
    const conditionA = Date.now() - parseInt(sessionStart) >= 240000;
    const visitedCreative = localStorage.getItem(`${COMMANDER_KEY}_creative`) === 'true';
    const visitedSystem = localStorage.getItem(`${COMMANDER_KEY}_system`) === 'true';
    let bothTime = localStorage.getItem(`${COMMANDER_KEY}_both`);
    if (visitedCreative && visitedSystem && !bothTime) {
      bothTime = Date.now().toString();
      localStorage.setItem(`${COMMANDER_KEY}_both`, bothTime);
    }
    const conditionB = bothTime && Date.now() - parseInt(bothTime) >= 60000;
    if (conditionA || conditionB) {
      localStorage.setItem(`${COMMANDER_KEY}_played`, 'true');
      return true;
    }
    return false;
  }, []);

  // Typewriter only — video handles audio
  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
    if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    setDisplayText('');
    setIsTypingState(true);
    setIsSpeaking(true);

    // Typewriter synced to video pace (~50ms/char)
    let i = 0;
    const type = () => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
        typewriterTimeout.current = setTimeout(type, 50 + Math.random() * 8);
      } else {
        setIsTypingState(false);
        setIsSpeaking(false);
        setDisplayText(text);
      }
    };
    type();
  }, [setIsTypingState]);

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayText, history]);

  useEffect(() => {
    nextLineRef.current = () => {
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
      audioRef.current?.stopSpeaking();
      setIsSpeaking(false);
      // Save current line to history before advancing
      setHistory(prev => [...prev, TRANSMISSION_LINES[currentLineRef.current]]);
      if (currentLineRef.current < TRANSMISSION_LINES.length - 1) {
        const nextIdx = currentLineRef.current + 1;
        setCurrentLine(nextIdx);
        startTypewriter(TRANSMISSION_LINES[nextIdx].text);
      } else {
        setPhase('dossier');
      }
    };
  }, [setCurrentLine, startTypewriter]);

  const handleSkipOrNext = useCallback(() => {
    if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    if (isTypingRef.current) {
      // Fast-forward text display; let speech continue
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      setIsTypingState(false);
      setDisplayText(TRANSMISSION_LINES[currentLineRef.current].text);
    } else {
      // Typing done — advance now
      audioRef.current?.stopSpeaking();
      setIsSpeaking(false);
      nextLineRef.current();
    }
  }, [setIsTypingState]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const startTransmission = () => {
    audioRef.current?.init();
    setPhase('dialogue');
    setCurrentVideoIdx(0);
  };

  // Video auto-advance: when current clip ends, play next or go to dossier
  const handleVideoEnded = useCallback(() => {
    setCurrentVideoIdx(prev => {
      if (prev < VIDEO_CLIPS.length - 1) {
        return prev + 1;
      } else {
        setPhase('dossier');
        return prev;
      }
    });
  }, []);

  // Skip all videos → go straight to dossier
  const skipToDossier = useCallback(() => {
    setPhase('dossier');
  }, []);

  const collapseToMailbox = () => {
    audioRef.current?.playWarp();
    audioRef.current?.stopSpeaking();
    const flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;inset:0;background:white;z-index:999999;animation:impactFlashAnim 0.6s ease-out forwards;pointer-events:none;';
    document.body.appendChild(flash);
    localStorage.setItem(`${COMMANDER_KEY}_completed`, 'true');
    setPhase('collapsing');
    setTimeout(() => {
      setPhase('collapsed');
      setTransmissionCompleted(true);
      if (document.body.contains(flash)) flash.remove();
      audioRef.current?.dispose();
    }, 800);
  };

  // Init + trigger polling
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new TransmissionAudio();
      audioRef.current.init();
      audioRef.current.loadVoices();
    }
    const checkInterval = setInterval(() => {
      if (checkTrigger() && phase === 'idle') setPhase('incoming');
    }, 1000);
    return () => {
      clearInterval(checkInterval);
      if (audioRef.current) {
        audioRef.current.dispose();
        audioRef.current = null;
      }
      if (typewriterTimeout.current) clearTimeout(typewriterTimeout.current);
      if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    };
  }, [checkTrigger, phase]);

  // Route tracking
  useEffect(() => {
    if (pathname === '/') {
      [
        `${COMMANDER_KEY}_played`, `${COMMANDER_KEY}_completed`, `${COMMANDER_KEY}_session`,
        `${COMMANDER_KEY}_creative`, `${COMMANDER_KEY}_system`, `${COMMANDER_KEY}_both`,
      ].forEach(k => localStorage.removeItem(k));
      audioRef.current?.stopSpeaking();
      const t = setTimeout(() => {
        setTransmissionCompleted(false);
        setPhase('idle');
        setHistory([]);
      }, 0);
      return () => clearTimeout(t);
    } else if (pathname === '/creative') {
      localStorage.setItem(`${COMMANDER_KEY}_creative`, 'true');
    } else if (pathname === '/system') {
      localStorage.setItem(`${COMMANDER_KEY}_system`, 'true');
    }
  }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase === 'dialogue') {
        if (e.key === 'Enter' || e.key === ' ') handleSkipOrNext();
        if (e.key === 'Escape') {
          audioRef.current?.stopSpeaking();
          audioRef.current?.playWarp();
          setPhase('dossier');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, handleSkipOrNext]);

  const inlineStyle = `
    .hologram-container { perspective: 1800px; perspective-origin: 50% 35%; }
    .transform-style-3d { transform-style: preserve-3d; }
    .cyber-grid-3d {
      background: linear-gradient(#22d3ee18 1px, transparent 1px), linear-gradient(90deg, #22d3ee18 1px, transparent 1px);
      background-size: 85px 85px;
      transform: rotateX(68deg) scale(1.9);
      animation: grid-move 32s linear infinite;
    }
    @keyframes grid-move { from { background-position: 0 0; } to { background-position: 85px 85px; } }
    @keyframes border-rotate { 0% { border-color: #22d3ee; } 33% { border-color: #c026d3; } 66% { border-color: #f97316; } 100% { border-color: #22d3ee; } }
    .chromatic { filter: contrast(120%) brightness(110%); }
    @keyframes downloadBurst { 0% { opacity: 1; transform: scale(0.8); filter: brightness(2); } 100% { opacity: 0; transform: scale(3.5); filter: brightness(1); } }
    @keyframes particleFly { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } }
    @keyframes impactFlashAnim { 0% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes holo-float {
      0%, 100% { filter: invert(1) grayscale(100%) hue-rotate(180deg) saturate(3) contrast(1.4) brightness(1.15) drop-shadow(0 0 25px rgba(0,242,254,0.65)); }
      50% { filter: invert(1) grayscale(100%) hue-rotate(180deg) saturate(3) contrast(1.4) brightness(1.25) drop-shadow(0 0 35px rgba(0,242,254,0.9)); }
    }
    @keyframes talk-glow {
      0% { filter: invert(1) grayscale(100%) hue-rotate(180deg) saturate(3) contrast(1.5) brightness(1.15) drop-shadow(0 0 25px rgba(0,242,254,0.65)); }
      100% { filter: invert(1) grayscale(100%) hue-rotate(180deg) saturate(3.5) contrast(1.6) brightness(1.3) drop-shadow(0 0 45px rgba(0,242,254,0.95)); }
    }
    @keyframes scan-beam {
      0% { top: -25%; }
      100% { top: 125%; }
    }
    @keyframes audio-wave {
      0% { transform: scaleY(0.2); opacity: 0.6; }
      100% { transform: scaleY(1); opacity: 1; }
    }
    @keyframes incoming-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
  `;

  // Collapsed mailbox icon
  if (phase === 'collapsed' || transmissionCompleted) {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        whileHover={{ scale: 1.18, rotate: 12 }}
        className="fixed bottom-8 right-8 z-[99999] w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 backdrop-blur-3xl border border-cyan-300/70 flex items-center justify-center cursor-pointer shadow-[0_0_70px_#22d3ee,0_0_140px_#c026d3]"
        onClick={() => {
          setPhase('dossier-reopen');
          audioRef.current?.init();
          audioRef.current?.loadVoices();
        }}
      >
        <div className="text-5xl z-10 relative">📬</div>
        <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-[spin_6s_linear_infinite]" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-ping">!</div>
      </motion.div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: inlineStyle }} />

      {/* Dev-only test trigger */}
      {phase === 'idle' && process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            localStorage.setItem(`${COMMANDER_KEY}_played`, 'true');
            setPhase('incoming');
          }}
          className="fixed bottom-4 left-4 z-[999999] px-4 py-2 bg-cyan-900/80 border border-cyan-500/50 rounded-lg text-cyan-400 font-mono text-xs hover:bg-cyan-800/80 transition-all"
        >
          [DEV] TRIGGER COMMANDER
        </button>
      )}

      <AnimatePresence>
        {(phase === 'incoming' || phase === 'dialogue' || phase === 'dossier' || phase === 'dossier-reopen' || phase === 'collapsing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[99999] backdrop-blur-3xl flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.92))' }}
          >
            {/* COCKPIT BACKGROUND */}
            <img
              src="/commander-bg.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30"
              style={{ filter: 'brightness(0.6) saturate(1.3)' }}
            />
            <div className="cyber-grid-3d absolute inset-0 pointer-events-none opacity-15" />

            {/* INCOMING PANEL — cyan sci-fi style */}
            {phase === 'incoming' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="text-center"
              >
                <div className="mx-auto max-w-sm border border-cyan-500/50 rounded-2xl p-8 bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(0,242,254,0.2),inset_0_0_30px_rgba(0,242,254,0.05)]">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <SignalHigh className="w-7 h-7 text-cyan-400" style={{ animation: 'incoming-pulse 1.2s ease-in-out infinite' }} />
                    <span className="text-xs font-mono tracking-[5px] text-cyan-400/70 uppercase">Secure Channel</span>
                  </div>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mb-6" />
                  <h1 className="text-2xl font-mono uppercase tracking-[3px] text-cyan-300">
                    INCOMING TRANSMISSION
                  </h1>
                  <p className="text-cyan-500/60 mt-2 text-xs font-mono tracking-[4px]">FROM: CMDR. THANH HUY</p>
                  <div className="mt-5 flex justify-center gap-2">
                    {[0.4, 0.7, 1.0].map((delay, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-cyan-400"
                        style={{ animation: `incoming-pulse 0.8s ease-in-out ${delay}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startTransmission}
                  className="mt-8 px-10 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-lg rounded-xl border border-cyan-500/40 hover:border-cyan-400/70 shadow-lg shadow-cyan-500/10 tracking-[3px] transition-all"
                >
                  KẾT NỐI NGAY
                </motion.button>
              </motion.div>
            )}

            {/* DIALOGUE + DOSSIER PANELS */}
            {(phase === 'dialogue' || phase === 'dossier' || phase === 'dossier-reopen') && (
              <div className="max-w-7xl w-full h-full flex flex-col lg:flex-row gap-8 p-8 relative">
                {/* AVATAR — dialogue: large centered, dossier: left side */}
                <div className={phase === 'dialogue' ? 'flex-1 flex flex-col items-center justify-center relative' : 'lg:w-[38%] flex flex-col items-center relative'}>
                  <motion.div
                    className={`hologram-container relative cursor-grab active:cursor-grabbing ${phase === 'dialogue' ? 'w-[340px] h-[440px] lg:w-[420px] lg:h-[520px]' : 'w-80 h-80 lg:w-96 lg:h-96'}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
                    style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-cyan-500 via-blue-600 to-transparent rounded-3xl opacity-40 blur-3xl"
                      style={{ transform: 'translateZ(-60px)' }}
                    />
                    <div className="absolute inset-0" style={{ transform: 'translateZ(0px)' }}>
                      <HolographicAvatar
                        isActive={phase === 'dialogue'}
                        videoSrc={VIDEO_CLIPS[phase === 'dialogue' ? currentVideoIdx : 2]}
                        onEnded={phase === 'dialogue' ? handleVideoEnded : undefined}
                      />
                    </div>
                    <div
                      className="absolute inset-0 rounded-3xl border-4 border-transparent chromatic pointer-events-none"
                      style={{ transform: 'translateZ(30px)', animation: 'border-rotate 6s linear infinite' }}
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      {FLOATING_PARTICLES.map((p, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-60"
                          style={{ left: `${p.left}%`, top: `${p.top}%`, transform: `translateZ(${p.z}px)` }}
                          animate={{ y: [-80, -400], x: [0, p.driftX], opacity: [0.8, 0] }}
                          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  <div className="mt-6 font-mono text-2xl text-cyan-400 tracking-[8px] uppercase px-10 py-3 bg-black/60 border border-cyan-400/40 rounded-3xl shadow-[0_0_30px_#00f2fe30]">
                    CMDR. THANH HUY
                  </div>

                  {/* NÚT THÔNG TIN DỰ ÁN (MỚI CHUYỂN LÊN + HIỆU ỨNG ẤN TƯỢNG) */}
                  <motion.button
                    onClick={() => setShowProjectInfo(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-8 relative group cursor-pointer z-50"
                  >
                    {/* Lớp nền phát sáng (glow) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                    
                    {/* Viền xoay gradient mượt mà */}
                    <div 
                      className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 opacity-90"
                      style={{ backgroundSize: '200% 200%', animation: 'border-rotate 3s linear infinite' }} 
                    />
                    
                    {/* Nội dung nút chính */}
                    <div className="relative flex items-center justify-center gap-3 bg-[#050210] px-8 py-4 rounded-[14px] text-white font-bold tracking-[2px] border border-white/5 transition-all duration-300">
                      <FileText className="w-5 h-5 text-cyan-400 group-hover:scale-125 transition-transform duration-300" /> 
                      <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent uppercase shadow-sm">
                        THÔNG TIN DỰ ÁN
                      </span>
                    </div>
                  </motion.button>

                  {/* Dialogue: video progress + skip button */}
                  {phase === 'dialogue' && (
                    <div className="mt-6 flex flex-col items-center gap-4">
                      {/* Video progress dots */}
                      <div className="flex items-center gap-3">
                        {VIDEO_CLIPS.map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${
                              i < currentVideoIdx ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                              : i === currentVideoIdx ? 'bg-cyan-400 animate-pulse shadow-[0_0_15px_#22d3ee] scale-125'
                              : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-cyan-400/60 text-xs font-mono tracking-widest mt-2">
                        Đang phát {currentVideoIdx + 1}/{VIDEO_CLIPS.length}
                      </p>
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL — only visible in dossier phase */}
                {(phase === 'dossier' || phase === 'dossier-reopen') && (
                <div className="flex-1 flex flex-col">
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 22 }}
                      className="flex-1 overflow-y-auto"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: '#22d3ee40 transparent' }}
                    >
                      <div
                        className="bg-[#03010a]/95 backdrop-blur-3xl border-2 border-cyan-500/40 rounded-3xl overflow-hidden relative"
                        style={{ 
                          boxShadow: '0 0 100px rgba(34,211,238,0.15), inset 0 0 60px rgba(0,242,254,0.1)',
                          perspective: '1400px'
                        }}
                      >
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,242,254,0.1)_50%)]" style={{ backgroundSize: '100% 4px' }} />
                        <div className="absolute left-0 w-full h-[15%] bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none" style={{ animation: 'scan-beam 4s linear infinite' }} />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-10 relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                          
                          {/* CỘT 1: IDENTITY + ẢNH CV SẠCH */}
                          <motion.div 
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            className="flex flex-col items-center text-center space-y-6"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <div className="w-44 h-44 bg-white rounded-2xl overflow-hidden border-4 border-cyan-400/60 shadow-[0_0_50px_rgba(34,211,238,0.5)] hover:shadow-[0_0_80px_rgba(34,211,238,0.8)] transition-all duration-500 hover:scale-105 relative group" style={{ transform: 'translateZ(10px)' }}>
                              <img
                                src="/commander.png"
                                alt="Trần Thanh Huy"
                                className="w-full h-full object-cover object-top"
                              />
                              <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-screen pointer-events-none" />
                            </div>
                            <div style={{ transform: 'translateZ(25px)' }}>
                              <h2 className="text-[1.8rem] font-black text-white tracking-[0.2em] uppercase" style={{ textShadow: '0 0 20px #22d3ee80, 0 0 40px #22d3ee40' }}>
                                TRẦN THANH HUY
                              </h2>
                              <p className="text-cyan-300 font-mono text-[0.85rem] mt-2 tracking-[0.25em] drop-shadow-[0_0_5px_#22d3ee]">CMDR-2003 • FRONTEND DEVELOPER</p>
                            </div>
                            <div className="flex items-center gap-3 bg-emerald-900/40 px-5 py-2.5 rounded-full border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]" style={{ transform: 'translateZ(30px)' }}>
                              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute" />
                              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full relative z-10" />
                              <span className="text-emerald-300 text-[11px] font-mono tracking-[0.2em] font-bold">AVAILABLE FOR PROJECTS</span>
                            </div>
                            {/* Liên hệ */}
                            <div className="space-y-3 w-full text-left text-sm mt-4 font-mono" style={{ transform: 'translateZ(15px)' }}>
                              <a href="tel:0944329202" onMouseEnter={() => audioRef.current?.playType()} className="flex items-center gap-4 hover:bg-cyan-900/40 p-3 rounded-xl transition-all text-cyan-100 hover:text-white border border-transparent hover:border-cyan-500/40 shadow-[inset_0_0_0_rgba(34,211,238,0)] hover:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
                                <Phone className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_#22d3ee]" /> <span className="tracking-[0.1em]">0944.329.202</span>
                              </a>
                              <a href="mailto:huytran.work.01@gmail.com" onMouseEnter={() => audioRef.current?.playType()} className="flex items-center gap-4 hover:bg-cyan-900/40 p-3 rounded-xl transition-all text-cyan-100 hover:text-white border border-transparent hover:border-cyan-500/40 shadow-[inset_0_0_0_rgba(34,211,238,0)] hover:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
                                <Mail className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_#22d3ee]" /> <span className="tracking-wider">huytran.work.01@gmail.com</span>
                              </a>
                              <a href="https://linkedin.com/in/huytran4" target="_blank" rel="noreferrer" onMouseEnter={() => audioRef.current?.playType()} className="flex items-center gap-4 hover:bg-cyan-900/40 p-3 rounded-xl transition-all text-cyan-100 hover:text-white border border-transparent hover:border-cyan-500/40 shadow-[inset_0_0_0_rgba(34,211,238,0)] hover:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
                                <ExternalLink className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_#22d3ee]" /> <span className="tracking-wider">/in/huytran4</span>
                              </a>
                              <a href="https://github.com/BLGCK44" target="_blank" rel="noreferrer" onMouseEnter={() => audioRef.current?.playType()} className="flex items-center gap-4 hover:bg-cyan-900/40 p-3 rounded-xl transition-all text-cyan-100 hover:text-white border border-transparent hover:border-cyan-500/40 shadow-[inset_0_0_0_rgba(34,211,238,0)] hover:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
                                <GitBranch className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_#22d3ee]" /> <span className="tracking-wider">github/BLGCK44</span>
                              </a>
                            </div>
                          </motion.div>

                          {/* CỘT 2: BIO */}
                          <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            className="space-y-6"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <div className="flex items-center gap-3 mb-6" style={{ transform: 'translateZ(30px)' }}>
                              <Target className="text-purple-400 w-5 h-5 drop-shadow-[0_0_8px_#a855f7]" />
                              <h3 className="text-purple-300 font-mono text-base tracking-[0.3em] font-bold uppercase drop-shadow-[0_0_10px_#a855f7]">GIỚI THIỆU</h3>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-2xl shadow-[inset_0_0_30px_rgba(168,85,247,0.1)]" style={{ transform: 'translateZ(15px)' }}>
                              <p className="text-white/90 leading-relaxed text-[0.95rem] mb-5">
                                Từng đảm nhiệm vị trí{' '}
                                <strong className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">Backend Intern</strong>{' '}
                                (làm việc trực tiếp với{' '}
                                <strong className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">RESTful APIs</strong> và Database),
                                em sở hữu tư duy hệ thống vững chắc về luồng dữ liệu.
                              </p>
                              <p className="text-white/90 leading-relaxed text-[0.95rem]">
                                Định hướng phát triển sâu vào Frontend, em kết hợp nền tảng lập trình lõi cùng sự linh hoạt trong việc ứng dụng{' '}
                                <strong className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI Tools</strong>{' '}
                                (ChatGPT, Gemini, Copilot) để tối ưu hiệu suất{' '}
                                <strong className="text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,1)] text-lg border-b border-purple-400/50 pb-1">10x</strong>.
                              </p>
                            </div>
                            
                            <div className="mt-8 p-5 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-l-4 border-cyan-400 rounded-r-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]" style={{ transform: 'translateZ(35px)' }}>
                              <p className="text-cyan-50 font-mono text-sm leading-relaxed tracking-wide italic">
                                <span className="text-cyan-300 text-xl font-serif">"</span>
                                Tôi không build website. Tôi kiến tạo không gian số có trọng lực riêng.
                                <span className="text-cyan-300 text-xl font-serif">"</span>
                              </p>
                            </div>
                            
                            <div className="text-[0.8rem] font-mono text-cyan-400/70 mt-8 tracking-[0.2em] border border-cyan-500/20 p-3 rounded-xl bg-[#010614] text-center shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]" style={{ transform: 'translateZ(10px)' }}>
                              📍 NINH KIỀU, CẦN THƠ &nbsp;|&nbsp; 📅 01.10.2003
                            </div>
                          </motion.div>

                          {/* CỘT 3: SKILLS */}
                          <motion.div 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            className="space-y-6"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <div className="flex items-center gap-3 mb-6" style={{ transform: 'translateZ(30px)' }}>
                              <Zap className="text-emerald-400 w-5 h-5 drop-shadow-[0_0_8px_#10b981]" />
                              <h3 className="text-emerald-300 font-mono text-base tracking-[0.3em] font-bold uppercase drop-shadow-[0_0_10px_#10b981]">KỸ NĂNG & CÔNG NGHỆ</h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-3" style={{ transform: 'translateZ(20px)' }}>
                              {['HTML/CSS/JS', 'React/Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'RESTful APIs', 'Matter.js', 'Canvas API', 'AI Prompt 10x', '3D DOM', 'UI/UX Design', 'Git/GitHub'].map((badge, i) => (
                                <motion.span
                                  key={i}
                                  whileHover={{ scale: 1.1, y: -3 }}
                                  onMouseEnter={() => audioRef.current?.playClick()}
                                  className="px-4 py-2 text-[11px] font-mono font-bold bg-[#010614] border border-emerald-500/40 rounded-lg text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/40 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-default"
                                >
                                  {badge}
                                </motion.span>
                              ))}
                            </div>
                            
                            <div className="mt-10 p-6 border border-emerald-500/30 bg-emerald-900/10 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" style={{ transform: 'translateZ(25px)' }}>
                              <div className="text-[11px] font-mono text-emerald-500/80 tracking-[0.3em] mb-3 font-bold uppercase">
                                HỌC VẤN
                              </div>
                              <div className="text-emerald-300 font-black tracking-widest drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] text-lg uppercase">
                                ĐẠI HỌC TÂY ĐÔ
                              </div>
                              <div className="text-emerald-100/90 font-mono text-[13px] mt-2 tracking-wider">
                                Cử nhân Công nghệ Thông tin <br/> (2021–2025)
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* 3 NÚT HÀNH ĐỘNG */}
                        <div className="border-t border-white/10 p-6 md:p-8 flex flex-wrap gap-4 relative z-50">
                          <motion.a
                            href="/CV_TranThanhHuy.pdf"
                            download="CV_TranThanhHuy_2026.pdf"
                            onClick={(e) => {
                              e.preventDefault();
                              audioRef.current?.playDownloadSuccess();
                              const burst = document.createElement('div');
                              burst.style.cssText =
                                'position:fixed;inset:0;pointer-events:none;z-index:999999;background:radial-gradient(circle,rgba(0,242,254,0.35)10%,transparent 60%);animation:downloadBurst 800ms forwards;';
                              for (let i = 0; i < 35; i++) {
                                const p = document.createElement('div');
                                const angle = Math.random() * Math.PI * 2;
                                const velocity = 100 + Math.random() * 250;
                                p.style.cssText =
                                  'position:absolute;width:4px;height:4px;background:#00f2fe;border-radius:50%;box-shadow:0 0 15px #00f2fe;animation:particleFly 800ms ease-out forwards;';
                                p.style.setProperty('--tx', `${Math.cos(angle) * velocity}px`);
                                p.style.setProperty('--ty', `${Math.sin(angle) * velocity}px`);
                                burst.appendChild(p);
                              }
                              document.body.appendChild(burst);
                              setTimeout(() => burst.remove(), 800);
                              const link = document.createElement('a');
                              link.href = '/CV_TranThanhHuy.pdf';
                              link.download = 'CV_TranThanhHuy_2026.pdf';
                              link.click();
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 min-w-[200px] flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] cursor-pointer"
                          >
                            <Download className="w-5 h-5" /> TẢI DOSSIER (CV)
                          </motion.a>

                          <motion.button
                            onClick={() => {
                              collapseToMailbox();
                              setTimeout(() => { window.location.href = '/creative'; }, 800);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group flex-1 min-w-[250px] flex items-center justify-between px-6 py-4 bg-[#010614] border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(0,242,254,0.1)] hover:shadow-[0_0_40px_rgba(0,242,254,0.3)] relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Globe className="w-6 h-6 text-blue-400 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                            <span className="tracking-[2px] uppercase relative z-10">TIẾP TỤC KHÁM PHÁ</span>
                            <Rocket className="w-6 h-6 text-cyan-400 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300" />
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              audioRef.current?.playWarp();
                              const flash = document.createElement('div');
                              flash.style.cssText =
                                'position:fixed;inset:0;background:white;z-index:999999;animation:impactFlashAnim 0.6s ease-out forwards;pointer-events:none;';
                              document.body.appendChild(flash);
                              setPhase('collapsing');
                              setTimeout(() => { window.location.href = '/'; }, 600);
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 min-w-[200px] flex items-center justify-center gap-3 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-mono py-4 rounded-2xl transition-all duration-300 bg-white/5 hover:bg-white/10 group"
                          >
                            <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" /> 
                            <span className="tracking-widest uppercase">THAY ĐỔI LỰA CHỌN</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLASS OVERLAY — THÔNG TIN DỰ ÁN */}
      <AnimatePresence>
        {showProjectInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8"
            onClick={() => setShowProjectInfo(false)}
          >
            {/* Backdrop blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

            {/* Glass card */}
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                backdropFilter: 'blur(40px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 80px rgba(34,211,238,0.1), 0 0 200px rgba(0,0,0,0.3), inset 0 0 60px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white tracking-wide">🌌 TỔNG HỢP DỰ ÁN ANTIGRAVITY</h2>
                </div>
                <button
                  onClick={() => setShowProjectInfo(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div
                className="px-8 py-6 overflow-y-auto"
                style={{
                  maxHeight: 'calc(85vh - 80px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#22d3ee40 transparent',
                }}
              >
                <ProjectSummaryContent />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
