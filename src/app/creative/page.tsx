'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, X, Target, Radar, Activity,  
  Cpu, Globe, Wand2, TerminalSquare, Layers, UtensilsCrossed, 
  DatabaseZap, ChevronRight, Fingerprint, Crosshair, Lock, Play, BarChart, Zap, Network
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ================= 1. TYPES & DATA =================
type PlanetStats = { power: number; sync: number; stability: number };
type Planet = {
  id: string; name: string; code: string; desc: string;
  color: string; darkColor: string; size: number; orbit: number; speed: number;
  icon: React.ElementType; moons: number; ring: boolean; type: string; freq: string;
  link: string; stats: PlanetStats; surface: string; startAngle: number;
};

interface PlanetNodeProps {
  p: Planet;
  index: number;
  total: number;
  isPaused: boolean;
  hoveredPlanet: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
  onClick: (p: Planet) => void;
}

interface HolographicModalProps {
  activePlanet: Planet;
  setActivePlanet: (p: Planet | null) => void;
}

const planets: Planet[] = [
  { id: 'ai', name: "Trí Tuệ Nhân Tạo", code: "NEXUS-01", desc: "Mạng lưới Neural tự trị. Tích hợp Antigravity & OpenClaw kiểm soát siêu logic hệ thống.", color: "#00f2fe", darkColor: "#005566", size: 68, orbit: 240, speed: 16, startAngle: 45, icon: Cpu, moons: 2, ring: false, type: "Mạng Nơ-ron", freq: "144.2 GHz", link: "/projects/ai", stats: { power: 98, sync: 95, stability: 88 }, surface: "conic-gradient(from 45deg, rgba(0,242,254,0.2), rgba(0,85,255,0.4), rgba(0,242,254,0.2))" },
  { id: 'web', name: "Sáng Tạo Giao Diện", code: "UIX-99", desc: "Bẻ cong định luật UI/UX bằng kiến trúc DOM 3D không gian và hoạt ảnh phi tuyến tính.", color: "#b026ff", darkColor: "#4a0080", size: 84, orbit: 380, speed: 14, startAngle: 120, icon: Globe, moons: 1, ring: true, type: "Giao Diện DOM", freq: "88.9 GHz", link: "/projects/web", stats: { power: 92, sync: 85, stability: 95 }, surface: "linear-gradient(45deg, rgba(176,38,255,0.3) 25%, transparent 25%, transparent 50%, rgba(176,38,255,0.3) 50%, rgba(176,38,255,0.3) 75%, transparent 75%, transparent)" },
  { id: 'prompt', name: "Kỹ Sư Ngôn Ngữ", code: "PRMPT-X", desc: "Kiến trúc sư ngôn ngữ máy. Thao túng mạng lưới tạo sinh AI để hình thành các khái niệm hình ảnh trừu tượng.", color: "#ff0844", darkColor: "#660011", size: 52, orbit: 520, speed: 12, startAngle: 210, icon: Wand2, moons: 0, ring: false, type: "Ngôn Ngữ Học", freq: "21.4 GHz", link: "/projects/prompt", stats: { power: 85, sync: 99, stability: 92 }, surface: "radial-gradient(circle at 70% 70%, rgba(255,8,68,0.4) 10%, transparent 50%)" },
  { id: 'creative', name: "Hiệu Ứng Vật Lý", code: "PHYS-42", desc: "Ban sự sống cho Pixel. Ứng dụng động lực học, hạt vi mô và ma trận toán học vào nghệ thuật Web.", color: "#00ff87", darkColor: "#004d29", size: 64, orbit: 660, speed: 10, startAngle: 15, icon: TerminalSquare, moons: 0, ring: true, type: "Động Lực Học", freq: "310.0 GHz", link: "/projects/creative", stats: { power: 90, sync: 88, stability: 85 }, surface: "repeating-linear-gradient(0deg, rgba(0,255,135,0.1), rgba(0,255,135,0.1) 5px, transparent 5px, transparent 10px)" },
  { id: 'uiux', name: "Trải Nghiệm Người Dùng", code: "BEHAV-7", desc: "Thiết kế thao túng tâm lý. Kết hợp sinh trắc học tạo ra các vi tương tác gây nghiện.", color: "#f6d365", darkColor: "#806600", size: 56, orbit: 800, speed: 8, startAngle: 280, icon: Layers, moons: 3, ring: false, type: "Tâm Lý Hành Vi", freq: "43.2 GHz", link: "/projects/uiux", stats: { power: 82, sync: 94, stability: 96 }, surface: "conic-gradient(from 180deg, transparent, rgba(246,211,101,0.3), transparent)" },
  { id: 'food', name: "Hệ Sinh Thái Tổng Thể", code: "CORE-S", desc: "Hệ thống cấp bậc S. Từ mạch máu Front-end trải nghiệm đến hạt nhân Back-end vận hành.", color: "#8b5cf6", darkColor: "#331166", size: 92, orbit: 960, speed: 6, startAngle: 160, icon: UtensilsCrossed, moons: 2, ring: false, type: "Hệ Thống Lõi", freq: "500.5 GHz", link: "/projects/food", stats: { power: 100, sync: 90, stability: 98 }, surface: "radial-gradient(ellipse at center, rgba(139,92,246,0.4) 0%, transparent 70%)" },
  { id: 'backend', name: "Máy Chủ Dữ Liệu", code: "REACT-B", desc: "Lõi phản ứng dữ liệu. Điều phối hàng triệu Query, kiến trúc Microservices phân tán chịu tải.", color: "#f43f5e", darkColor: "#66001a", size: 48, orbit: 1120, speed: 4, startAngle: 330, icon: DatabaseZap, moons: 0, ring: false, type: "Lõi Dữ Liệu", freq: "999.9 GHz", link: "/projects/backend", stats: { power: 95, sync: 80, stability: 100 }, surface: "repeating-conic-gradient(rgba(244,63,94,0.2) 0% 5%, transparent 5% 10%)" },
];

const LOCAL_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`;

// ================= 2. SOUND ENGINE (Wow Factor) =================
const playSound = (type: 'hover' | 'click') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'hover') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'click') {
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) { /* Ignore if Audio API is restricted */ }
};

// ================= 3. MICRO-COMPONENTS =================

// 3.1 Text Giải Mã (Tối ưu rAF)
const DecryptText = React.memo(({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [display, setDisplay] = useState(text.replace(/./g, '_'));
  useEffect(() => {
    let frame: number; let isCancelled = false; const start = performance.now();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    const tick = (now: number) => {
      if (isCancelled) return;
      if (now - start < delay) { frame = requestAnimationFrame(tick); return; }
      const progress = Math.min((now - (start + delay)) / 800, 1);
      const iterations = progress * text.length;
      setDisplay(text.split("").map((_, i) => (i < iterations ? text[i] : chars[Math.floor(Math.random() * chars.length)])).join(""));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { isCancelled = true; cancelAnimationFrame(frame); };
  }, [text, delay]);
  return <span>{display}</span>;
});
DecryptText.displayName = 'DecryptText';

// 3.2 Canvas Starfield (Tạm biệt DOM Lag)
const CanvasStarfield = React.memo(({ isWarping, isPaused }: { isWarping: boolean, isPaused: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = canvas.width = window.innerWidth; let h = canvas.height = window.innerHeight;
    const starCount = reducedMotion ? 200 : (window.innerWidth < 768 ? 400 : 1200);
    const stars = Array.from({ length: starCount }).map(() => ({ x: Math.random() * w - w / 2, y: Math.random() * h - h / 2, z: Math.random() * 1000, pz: Math.random() * 1000 }));
    let animationFrameId: number; let currentSpeed = reducedMotion ? 0.3 : (isWarping ? 40 : 0.5);

    const render = () => {
      currentSpeed += ((isWarping ? 30 : (isPaused ? 0.1 : 0.5)) - currentSpeed) * 0.05;
      ctx.fillStyle = (isWarping || isPaused) ? 'rgba(1, 1, 3, 0.2)' : 'rgba(1, 1, 3, 1)';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2; const cy = h / 2;
      stars.forEach(star => {
        star.pz = star.z; star.z -= currentSpeed;
        if (star.z <= 0) { star.z = 1000; star.pz = 1000; star.x = Math.random() * w - w / 2; star.y = Math.random() * h - h / 2; }
        const x = cx + (star.x / star.z) * 1000; const y = cy + (star.y / star.z) * 1000;
        const px = cx + (star.x / star.pz) * 1000; const py = cy + (star.y / star.pz) * 1000;
        const depth = 1 - star.z / 1000;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y);
        ctx.lineWidth = depth * (currentSpeed > 5 ? 2.5 : 1);
        ctx.strokeStyle = `rgba(0, 242, 254, ${depth * 0.8})`; ctx.stroke();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); };
  }, [isWarping, isPaused]);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
});
CanvasStarfield.displayName = 'CanvasStarfield';

// 3.3 Node Hành Tinh (Tách nhỏ Component)
const PlanetNode = React.memo(({ p, index, total, isPaused, hoveredPlanet, onHover, onLeave, onClick }: PlanetNodeProps) => {
  const isHovered = hoveredPlanet === p.id;
  const isDimmed = (hoveredPlanet && !isHovered) || isPaused;
  const Icon = p.icon;

  return (
    <div className="absolute transform-style-3d">
      {/* 1. VÒNG QUỶ ĐẠO RÕ RỆT - GLOWING (Flat Leaf) */}
      <div 
        className={`absolute rounded-full border-2 pointer-events-none transition-all duration-1000 ${isDimmed ? 'opacity-10 blur-[4px]' : 'opacity-100'}`}
        style={{ 
          width: p.orbit * 2, height: p.orbit * 2, left: -p.orbit, top: -p.orbit,
          borderColor: isHovered ? p.color : 'rgba(255,255,255,0.08)',
          boxShadow: isHovered ? `0 0 50px ${p.color}70, inset 0 0 30px ${p.color}40` : '0 0 25px rgba(255,255,255,0.02)',
        }}
      />

      {/* 2. BASE ROTATOR (Pure 3D) */}
      <div className="absolute transform-style-3d" style={{ transform: `rotateZ(${p.startAngle}deg)` }}>
          
        {/* VỆT SAO CHỔI (Flat Leaf) */}
        <div className={`absolute pointer-events-none orbit-spin transition-all duration-1000 ${isDimmed ? 'opacity-0' : 'opacity-100'}`} 
             style={{ width: p.orbit * 2, height: p.orbit * 2, left: -p.orbit, top: -p.orbit, animationDuration: `${p.speed}s` }}>
          <div className="absolute top-1/2 left-1/2 h-[3px] -translate-y-1/2 origin-left blur-[1px] opacity-70"
               style={{ width: p.orbit, background: `linear-gradient(90deg, transparent, ${p.color})` }} />
        </div>

        {/* 3. HÀNH TINH (Pure 3D Chain) */}
        <div className="absolute transform-style-3d orbit-spin" style={{ animationDuration: `${p.speed}s` }}>
          <div className="absolute transform-style-3d" style={{ transform: `translateX(${p.orbit}px)` }}>
            <div className="absolute transform-style-3d orbit-anti-spin" style={{ animationDuration: `${p.speed}s` }}>
              {/* COUNTER-ROTATE ĐỂ MẶT LUÔN HƯỚNG VỀ CAMERA (Pure 3D) */}
              <div className="absolute transform-style-3d transition-transform duration-100 ease-out pointer-events-auto" 
                   style={{ transform: `rotateZ(${-p.startAngle}deg) rotateY(calc(0deg - var(--mouse-x))) rotateX(calc(-75deg - var(--mouse-y)))` }}>

                {/* QUẢ CẦU HÀNH TINH VÀ CHỮ (Leaf container, can flatten safely here) */}
                <div className={`absolute flex items-center justify-center cursor-crosshair group transition-all duration-1000 ${isDimmed ? 'opacity-10 scale-95 blur-[4px]' : 'opacity-100 scale-100'}`}
                     style={{ width: p.size, height: p.size, left: -p.size/2, top: -p.size/2 }}
                     onClick={(e) => { e.stopPropagation(); playSound('click'); onClick(p); }}
                     onMouseEnter={() => { if (!isPaused) { onHover(p.id); playSound('hover'); } }}
                     onMouseLeave={() => !isPaused && onLeave()}>
                  
                  <div className="absolute -inset-[60%] rounded-full opacity-0 group-hover:opacity-30 blur-[20px] transition-all duration-500 pointer-events-none" style={{ backgroundColor: p.color }} />
                  {p.ring && <div className="absolute w-[250%] h-[250%] rounded-full border-[6px] border-double border-white/20 group-hover:border-white/80 transition-colors duration-500 animate-[spin_10s_linear_infinite] pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.1)]" style={{ transform: 'rotateX(70deg) rotateY(15deg)', borderTopColor: p.color, borderBottomColor: p.color }} />}
                  
                  <div className="w-full h-full rounded-full relative overflow-hidden transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,1)] border border-white/20"
                       style={{ background: `radial-gradient(circle at 30% 30%, ${p.color} 0%, ${p.darkColor} 60%, #000 100%)`, boxShadow: `0 0 40px ${p.color}60, inset -15px -15px 30px rgba(0,0,0,0.9), inset 5px 5px 20px rgba(255,255,255,0.5)` }}>
                    <div className="absolute inset-0 mix-blend-overlay opacity-60" style={{ background: p.surface }} />
                    <div className="absolute inset-0 opacity-40 mix-blend-color-burn pointer-events-none" style={{ backgroundImage: LOCAL_NOISE }} />
                    <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] z-10 pointer-events-none transition-transform group-hover:scale-110" strokeWidth={1.5} />
                  </div>

                  {/* FLOATING LABEL - CHỮ SIÊU TO */}
                  <div className={`absolute -top-32 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center transition-all duration-500 ${isPaused ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
                    <div className="bg-black/90 backdrop-blur-2xl border border-white/40 px-6 py-3 rounded-2xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] whitespace-nowrap" style={{ borderColor: p.color }}>
                      <div className="text-3xl md:text-4xl font-black text-white tracking-widest leading-none drop-shadow-lg">{p.name}</div>
                      <div className="text-base md:text-lg font-mono text-white/90 mt-2 flex items-center justify-center gap-3">
                        <span>{p.code}</span><span className="w-px h-4 bg-white/40" /><span style={{ color: p.color }} className="font-bold drop-shadow-md">Nhóm: {p.type}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm md:text-base font-mono bg-black/80 px-5 py-1.5 rounded-full text-cyan-300 flex items-center gap-2 border border-white/10 shadow-lg">
                      <span className="animate-pulse">⚡</span><span>Tốc độ: {p.speed}s / vòng</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})

PlanetNode.displayName = 'PlanetNode';

// 3.4 Modal Split-Screen Hologram 
const CentralHUD = React.memo(({ activePlanet, setActivePlanet }: HolographicModalProps) => {
  const router = useRouter();
  const Icon = activePlanet.icon;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setActivePlanet(null); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [setActivePlanet]);
  
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto transition-all duration-700 animate-hud-glitch" onClick={() => setActivePlanet(null)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* CENTRAL GIANT PLANET */}
      <div className="relative w-72 h-72 md:w-[400px] md:h-[400px] flex items-center justify-center transform-style-3d animate-[float_6s_ease-in-out_infinite] z-20 pointer-events-none">
        <div className="absolute w-[140%] h-[140%] rounded-full border-[2px] border-dashed border-white/20 animate-[spin_30s_linear_infinite]" style={{ transform: 'rotateX(75deg)', borderColor: `${activePlanet.color}50` }} />
        <div className="absolute w-[180%] h-[180%] rounded-full border-t-[3px] border-b-[1px] border-white/30 animate-[spin_20s_linear_infinite_reverse]" style={{ transform: 'rotateX(60deg) rotateY(30deg)', borderColor: `${activePlanet.color}80` }} />
        
        <div className="w-full h-full rounded-full relative overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] border-2 border-white/30 transition-transform duration-1000 scale-in-center"
             style={{ background: `radial-gradient(circle at 30% 30%, ${activePlanet.color} 0%, ${activePlanet.darkColor} 70%)`, boxShadow: `0 0 150px ${activePlanet.color}80, inset -40px -40px 80px rgba(0,0,0,0.9)` }}>
          <div className="absolute inset-0 mix-blend-overlay opacity-60" style={{ background: activePlanet.surface }} />
          <div className="absolute inset-0 mix-blend-overlay opacity-50" style={{ backgroundImage: LOCAL_NOISE }} />
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px] mix-blend-overlay [mask-image:radial-gradient(circle,black_40%,transparent_100%)] animate-[spin_40s_linear_infinite]" />
          <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)] z-10" strokeWidth={1.5} />
        </div>
      </div>

      {/* FLOATING HUD PANELS */}
      <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full pointer-events-none flex flex-col justify-between p-8 md:p-12 z-30">
        
        {/* TOP: Header */}
        <div className="flex justify-between items-start w-full pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 p-6 clip-path-tech-large max-w-md shadow-[0_0_30px_rgba(0,0,0,0.5)] fade-in-left">
            <div className="inline-flex items-center gap-3 mb-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 clip-path-angled">
              <Lock className="w-3 h-3 text-cyan-400" /><span className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] uppercase font-bold"><DecryptText text="DATA EXTRACTED" delay={200} /></span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter leading-none font-space" style={{ textShadow: `0 0 20px ${activePlanet.color}` }}>
              <DecryptText text={activePlanet.name} delay={400} />
            </h2>
            <div className="flex gap-4 text-white/50 text-[10px] font-mono tracking-widest">
              <span>{activePlanet.code}</span>
              <span className="text-cyan-400">SIG: <DecryptText text={activePlanet.freq} delay={600} /></span>
            </div>
          </div>

          <button onClick={() => setActivePlanet(null)} className="p-4 z-50 bg-red-500/10 hover:bg-red-500/30 border border-red-500/50 transition-all flex items-center gap-2 group clip-path-angled cursor-pointer shadow-[0_0_20px_rgba(255,0,0,0.2)]">
            <span className="text-[10px] font-mono uppercase text-red-400 group-hover:text-white hidden sm:block font-bold tracking-widest">THOÁT</span>
            <X className="w-6 h-6 text-red-400 group-hover:text-white" />
          </button>
        </div>

        {/* BOTTOM: Stats & Action */}
        <div className="flex flex-col md:flex-row justify-between items-end w-full gap-8 pointer-events-auto">
          
          <div className="bg-black/40 backdrop-blur-xl border-l-[3px] p-6 max-w-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] fade-in-bottom relative" style={{ borderColor: activePlanet.color }}>
            <div className="absolute -left-[3px] top-0 w-1.5 h-1/3 bg-white animate-scan-vertical-fast shadow-[0_0_10px_#fff]" />
            <p className="text-white/90 text-sm md:text-base leading-relaxed font-light"><DecryptText text={activePlanet.desc} delay={700} /></p>
          </div>

          <div className="bg-[#05050A]/80 backdrop-blur-xl border border-white/20 p-6 clip-path-angled min-w-[300px] shadow-[0_0_30px_rgba(0,0,0,0.5)] fade-in-right">
            <div className="text-[10px] text-white/50 font-mono uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><BarChart className="w-4 h-4 text-cyan-400" /> System Diagnostics</div>
            <div className="space-y-4 mb-6">
              {[ { label: "Core Power", val: activePlanet.stats.power, color: "bg-[#ff5500]" }, { label: "Neural Sync", val: activePlanet.stats.sync, color: "bg-[#00f2fe]" }, { label: "Stability", val: activePlanet.stats.stability, color: "bg-[#00ff87]" } ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-24 text-[10px] font-mono text-white/50 uppercase tracking-widest">{stat.label}</div>
                  <div className="flex-1 h-1.5 bg-white/10 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full ${stat.color} shadow-[0_0_10px_currentColor] transition-all duration-1000`} style={{ '--target-width': `${stat.val}%`, animation: `fillBar 1s ${1 + i * 0.2}s forwards` } as React.CSSProperties} />
                  </div>
                  <div className="w-8 text-right text-[10px] font-mono text-white">{stat.val}%</div>
                </div>
              ))}
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); router.push(activePlanet.link); }} className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white py-4 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm clip-path-tech-large hover:text-black hover:bg-[var(--neon-cyan)] transition-colors duration-300 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <Zap className="w-5 h-5" fill="currentColor" /> Kích hoạt Phân Khu
            </button>
          </div>

        </div>
      </div>
    </div>
  );
})

HolographicModal.displayName = 'HolographicModal';

// ================= 4. MAIN WRAPPER =================
export default function CosmicOdysseyPage() {
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [isWarping, setIsWarping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Giảm Asteroid Array Size để giữ mượt FPS
  const asteroids = useMemo(() => {
    const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 45;
    return Array.from({ length: count }).map(() => ({ r: Math.random() * 800 + 350, a: Math.random() * 360, s: Math.random() * 2 + 1, speed: Math.random() * 80 + 40 }));
  }, []);

  useEffect(() => {
    const warpTimer = setTimeout(() => setIsWarping(false), 2600);
    return () => clearTimeout(warpTimer);
  }, []);

  // Throttle Chuột siêu mượt bằng RequestAnimationFrame
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isWarping || activePlanet) return;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      containerRef.current?.style.setProperty('--mouse-x', `${x}deg`);
      containerRef.current?.style.setProperty('--mouse-y', `${-y}deg`);
    });
  }, [isWarping, activePlanet]);

  const handlePlanetClick = useCallback((p: Planet) => { setActivePlanet(p); setHoveredPlanet(null); }, []);
  const handlePlanetHover = useCallback((id: string) => setHoveredPlanet(id), []);
  const handlePlanetLeave = useCallback(() => setHoveredPlanet(null), []);

  const isPaused = activePlanet !== null;

  return (
    <div role="main" 
      ref={containerRef}
      className={`min-h-screen bg-[#000002] relative overflow-hidden font-sans text-white perspective-container selection:bg-cyan-500/30 ${isWarping ? 'cursor-wait' : 'cursor-crosshair'}`}
      onMouseMove={handleMouseMove}
      style={{ '--mouse-x': '0deg', '--mouse-y': '0deg', '--neon-cyan': '#00f2fe' } as React.CSSProperties}
      onClick={() => setActivePlanet(null)}
    >
      {/* GLOBAL POST-PROCESSING OVERLAYS */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-20 mix-blend-overlay bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      <div className="pointer-events-none fixed inset-0 z-[998] shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />

      {/* 1. INTRO BOOT SEQUENCE */}
      <div className={`fixed inset-0 z-[1000] pointer-events-none transition-opacity duration-1000 flex items-center justify-center ${isWarping ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 warp-engine" />
        <div className="text-[#00f2fe] font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed drop-shadow-[0_0_15px_#00f2fe] z-10 w-[400px]">
          <div className="flex gap-2 text-white mb-2"><Zap className="w-5 h-5"/> SYSTEM OVERRIDE</div>
          <DecryptText text="> INITIATING QUANTUM CORE V4...&#10;> BYPASSING GRAVITY FIELDS...&#10;> ESTABLISHING NEURAL LINK...&#10;> WELCOME TO THE NEXUS, CREATOR." delay={0} />
          <span className="animate-pulse">_</span>
        </div>
      </div>

      {/* 2. CANVAS BACKGROUND */}
      <CanvasStarfield isWarping={isWarping} isPaused={isPaused} />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] bg-[radial-gradient(circle,rgba(0,242,254,0.08)_0%,transparent_60%)] blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(circle,rgba(255,85,0,0.05)_0%,transparent_60%)] blur-[150px] mix-blend-screen" />
      </div>

      {/* 3. HEADER HUD */}
      <header className={`absolute top-0 w-full z-50 p-6 md:p-8 flex justify-between items-start pointer-events-none transition-all duration-[1500ms] ${isWarping ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Link href="/" className="pointer-events-auto flex items-center gap-4 group">
          <div className="relative p-3 bg-black/50 backdrop-blur-xl border border-white/20 hover:border-[#00f2fe] transition-all clip-path-angled shadow-[0_0_15px_rgba(0,242,254,0.1)]">
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-[#00f2fe] relative z-10 transition-colors" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] text-[#00f2fe] font-mono uppercase tracking-[0.4em] animate-pulse">Neural Link</span>
            <span className="font-black font-space tracking-[0.2em] text-sm uppercase">Trạm Khởi Hành</span>
          </div>
        </Link>
        <div className="flex items-center gap-3 backdrop-blur-2xl bg-black/60 px-8 py-3 border-l-2 border-b-2 border-[#00f2fe] clip-path-hex pointer-events-auto shadow-[0_0_30px_rgba(0,242,254,0.15)] group hover:bg-[#00f2fe]/10 transition-colors">
          <Radar className="w-5 h-5 text-[#00f2fe] group-hover:text-white transition-colors animate-[spin_3s_linear_infinite]" />
          <h1 className="text-xl md:text-2xl font-black font-space tracking-[0.3em] text-white uppercase group-hover:text-cyan-300">Hệ Siêu Kỹ Năng</h1>
        </div>
      </header>

      {/* 4. VẬT LÝ HỆ MẶT TRỜI 3D */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className={`camera-rig transform-style-3d ease-warp w-full h-full flex items-center justify-center will-change-transform transition-all duration-[1500ms]
             ${isWarping ? 'scale-[6] opacity-0 blur-[20px] system-paused' : isPaused ? 'scale-[0.35] md:scale-[0.45] translate-x-[15%] translate-y-[15%] opacity-20 blur-md pointer-events-none system-paused' : 'scale-[0.25] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.6] xl:scale-[0.75] 2xl:scale-90'}`}
             style={{ transform: isPaused || isWarping ? '' : `rotateX(calc(75deg + var(--mouse-y))) rotateY(calc(0deg + var(--mouse-x)))` }}>
          
          {/* LÕI HỐ ĐEN */}
          <div className={`absolute transform-style-3d pointer-events-auto  transition-all duration-700 ${hoveredPlanet ? 'opacity-60 scale-95 grayscale-[30%]' : 'opacity-100 scale-100'}`}>
            <div className="transform-style-3d transition-transform duration-100" style={{ transform: `rotateX(calc(-75deg - var(--mouse-y))) rotateY(calc(0deg - var(--mouse-x)))` }}>
              <div className="relative flex items-center justify-center w-72 h-72 group cursor-crosshair">
                <div className="absolute w-[1000px] h-[1000px] rounded-full border-t-[12px] border-orange-400/80 animate-[spin_8s_linear_infinite] transform-style-3d blur-[4px] shadow-[0_0_100px_#ff5500]" style={{ transform: 'rotateX(75deg) rotateY(-10deg)' }} />
                <div className="absolute w-[850px] h-[850px] rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,100,0,0.4)_25%,rgba(255,200,100,0.8)_50%,rgba(255,100,0,0.4)_75%,transparent_100%)] animate-[spin_5s_linear_infinite_reverse] transform-style-3d blur-[12px]" style={{ transform: 'rotateX(75deg)' }} />
                
                <div className="absolute inset-4 rounded-full bg-black shadow-[0_0_150px_rgba(255,85,0,0.9),inset_0_0_60px_rgba(255,150,0,0.7)] border-[3px] border-orange-500/50 flex flex-col items-center justify-center overflow-hidden z-10 group-hover:scale-[1.03] transition-transform animate-[core-pulse_4s_ease-in-out_infinite]">
                  <div className="absolute inset-0 opacity-40 mix-blend-color-dodge animate-[spin_30s_linear_infinite]" style={{ backgroundImage: LOCAL_NOISE }} />
                  <div className="relative z-20 flex flex-col items-center drop-shadow-[0_0_20px_#ffaa00]">
                    <Fingerprint className="w-14 h-14 text-orange-200 mb-2 opacity-95 animate-pulse" strokeWidth={1} />
                    <div className="text-5xl font-black text-white tracking-[0.2em] leading-none mb-1 font-space">HUY.DEV</div>
                    <div className="mt-2 text-[11px] font-mono bg-[#1a0500]/90 border border-orange-500/60 px-4 py-1.5 rounded clip-path-angled tracking-widest text-orange-400 uppercase flex items-center gap-2 shadow-[0_0_15px_#ff5500]">
                      <Activity className="w-3.5 h-3.5 animate-pulse" /> Core_S: 2003
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`absolute transform-style-3d pointer-events-none transition-opacity duration-700 ${hoveredPlanet ? 'opacity-20' : 'opacity-80'}`}>
            {asteroids.map((ast, i) => (
              <div key={`ast-${i}`} className="absolute transform-style-3d orbit-spin" style={{ animationDuration: `${ast.speed}s`, animationDelay: `-${Math.random()*100}s` }}>
                <div className="absolute rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ width: ast.s, height: ast.s, transform: `rotateZ(${ast.a}deg) translateX(${ast.r}px) rotateX(90deg)` }} />
              </div>
            ))}
          </div>

          {planets.map((p, index) => (
            <PlanetNode 
              key={p.id} p={p} index={index} total={planets.length} 
              isPaused={isPaused} hoveredPlanet={hoveredPlanet} 
              onHover={handlePlanetHover} onLeave={handlePlanetLeave} onClick={handlePlanetClick} 
            />
          ))}
        </div>
      </div>

      {/* 5. HOLOGRAM SPLIT-SCREEN MODAL */}
      {activePlanet && <CentralHUD activePlanet={activePlanet} setActivePlanet={setActivePlanet} />}

      {/* 6. WARP GATE (NAV) */}
      <div className={`fixed bottom-8 right-8 z-40 transition-all duration-1000 delay-500 ${isWarping || activePlanet ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Link href="/system" className="group flex items-center gap-5 bg-[#05050a]/90 backdrop-blur-3xl border border-white/20 p-2.5 pr-8 clip-path-hex-large shadow-[0_0_50px_rgba(0,0,0,1)] hover:border-[#00f2fe] hover:bg-cyan-950/40 transition-all duration-500">
          <div className="w-14 h-14 bg-white text-black flex items-center justify-center relative z-10 clip-path-angled group-hover:bg-[#00f2fe] transition-colors shadow-[0_0_20px_rgba(0,242,254,0)] group-hover:shadow-[0_0_30px_rgba(0,242,254,0.7)]">
            <ChevronRight className="w-7 h-7 group-hover:translate-x-1.5 transition-transform" />
          </div>
          <div className="flex flex-col relative z-10 pt-1">
            <span className="text-[10px] font-mono text-[#00f2fe] uppercase tracking-[0.25em] mb-0.5 animate-pulse">Khởi động Hyper-Jump</span>
            <span className="text-sm font-black text-white uppercase tracking-widest font-space">Trạm Tốc Độ Cao</span>
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700;900&display=swap');
        .font-space { font-family: 'Space Grotesk', sans-serif; }
        .transform-style-3d { transform-style: preserve-3d; }
        .perspective-container { perspective: 2000px; overflow: hidden; }
        
        .clip-path-angled { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
        .clip-path-hex { clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
        .clip-path-hex-large { clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px); }
        .clip-path-tech-large { clip-path: polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%, 0 40px); }

        @keyframes orbit-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(360deg); } }
        @keyframes orbit-anti-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(-360deg); } }
        .system-paused * { animation-play-state: paused !important; }

        .warp-engine { background-image: radial-gradient(2px 50px at 60px 150px, #00f2fe, transparent), radial-gradient(2px 40px at 100px 250px, #fff, transparent); background-size: 200px 300px; animation: warpSpeed 0.3s linear infinite; transform-origin: center; }
        @keyframes warpSpeed { 0% { transform: scale(1); opacity: 0; filter: hue-rotate(0deg); } 50% { opacity: 1; filter: hue-rotate(90deg); } 100% { transform: scale(5); opacity: 0; filter: hue-rotate(180deg); } }
        .ease-warp { transition-timing-function: cubic-bezier(0.85, 0, 0.15, 1); }

        @keyframes scan-vertical { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes tether-flow { 0% { stroke-dashoffset: 25; } 100% { stroke-dashoffset: 0; } }
        @keyframes fillBar { to { width: var(--target-width); } }
        @keyframes core-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); box-shadow: 0 0 200px rgba(255,80,0,1), inset 0 0 80px rgba(255,100,0,0.9); } }
        @keyframes hud-glitch { 0% { opacity: 0; transform: scale(1.05); filter: blur(10px); } 100% { opacity: 1; transform: scale(1); filter: blur(0); } }
        @keyframes scan-vertical-fast { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotateX(10deg); } 50% { transform: translateY(-15px) rotateX(-5deg); } }

        
        @keyframes scale-in-center { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fade-in-left { 0% { transform: translateX(-50px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in-right { 0% { transform: translateX(50px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in-bottom { 0% { transform: translateY(50px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .scale-in-center { animation: scale-in-center 0.8s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        .fade-in-left { animation: fade-in-left 0.8s cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.2s both; }
        .fade-in-right { animation: fade-in-right 0.8s cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.4s both; }
        .fade-in-bottom { animation: fade-in-bottom 0.8s cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.6s both; }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .warp-engine { display: none; }
        }
      `}</style>
    </div>
  );
}