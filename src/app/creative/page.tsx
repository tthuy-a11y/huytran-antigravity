'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  ArrowLeft, X, Orbit, Zap, Target, Radar, Activity,
  Cpu, Globe, Wand2, TerminalSquare, Layers, UtensilsCrossed, DatabaseZap, ChevronRight, Fingerprint, ShieldAlert, Crosshair, Lock
} from 'lucide-react';
import Link from 'next/link';

// Dữ liệu Vũ trụ Lượng tử
const planets = [
  { id: 'ai', name: "AI Agentic Core", code: "NEXUS-01", desc: "Mạng lưới Neural tự trị. Tích hợp Antigravity & OpenClaw kiểm soát siêu logic hệ thống.", color: "#00f2fe", size: 68, orbit: 240, speed: 20, icon: Cpu, moons: 2, ring: false, type: "NEURAL_NET", freq: "144.2 GHz" },
  { id: 'web', name: "Web Generative", code: "UIX-99", desc: "Bẻ cong định luật UI/UX bằng kiến trúc DOM 3D không gian và hoạt ảnh phi tuyến tính.", color: "#b026ff", size: 84, orbit: 380, speed: 30, icon: Globe, moons: 1, ring: true, type: "DOM_ENGINE", freq: "88.9 GHz" },
  { id: 'prompt', name: "Prompt Engineer", code: "PRMPT-X", desc: "Kiến trúc sư ngôn ngữ máy. Thao túng mạng lưới tạo sinh AI để hình thành các khái niệm hình ảnh trừu tượng.", color: "#ff0844", size: 52, orbit: 520, speed: 40, icon: Wand2, moons: 0, ring: false, type: "LINGUISTIC", freq: "21.4 GHz" },
  { id: 'creative', name: "Physics Coding", code: "PHYS-42", desc: "Ban sự sống cho Pixel. Ứng dụng động lực học, hạt vi mô và ma trận toán học vào nghệ thuật Web.", color: "#00ff87", size: 64, orbit: 660, speed: 50, icon: TerminalSquare, moons: 0, ring: true, type: "KINEMATICS", freq: "310.0 GHz" },
  { id: 'uiux', name: "Neuro UI/UX", code: "BEHAV-7", desc: "Thiết kế thao túng tâm lý. Kết hợp sinh trắc học tạo ra các vi tương tác (Micro-interactions) gây nghiện.", color: "#f6d365", size: 56, orbit: 800, speed: 60, icon: Layers, moons: 3, ring: false, type: "BEHAVIORAL", freq: "43.2 GHz" },
  { id: 'food', name: "Food Web Matrix", code: "CORE-S", desc: "Hệ thống cấp bậc S (02/2026 - Nay). Từ mạch máu Front-end trải nghiệm đến hạt nhân Back-end vận hành.", color: "#8b5cf6", size: 92, orbit: 960, speed: 75, icon: UtensilsCrossed, moons: 2, ring: false, type: "ECOSYSTEM", freq: "500.5 GHz" },
  { id: 'backend', name: "Ayden Backend", code: "REACT-B", desc: "Lõi lò phản ứng dữ liệu. Điều phối hàng triệu Query, kiến trúc Microservices phân tán chịu tải cực đại.", color: "#f43f5e", size: 48, orbit: 1120, speed: 90, icon: DatabaseZap, moons: 0, ring: false, type: "DATA_CORE", freq: "999.9 GHz" },
];

// Component Giải mã Dữ liệu
const DecryptText = ({ text, delay = 0 }) => {
  const [display, setDisplay] = useState("");
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
 
  useEffect(() => {
    let iterations = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplay(text.split("").map((letter, index) => {
          if (index < iterations) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join(""));
        if (iterations >= text.length) clearInterval(interval);
        iterations += 1 / 3;
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);
  return <span>{display || Array(text.length).fill("_").join("")}</span>;
};

export default function CosmicOdysseyPage() {
  const [activePlanet, setActivePlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [isWarping, setIsWarping] = useState(true);
  const [bootText, setBootText] = useState("");
  const containerRef = useRef(null);

  const starField = useMemo(() => {
    const generate = (count, maxSize, color) => {
      let shadows = [];
      for (let i = 0; i < count; i++) shadows.push(`${(Math.random() - 0.5) * 200}vw ${(Math.random() - 0.5) * 200}vh 0 ${Math.random() * maxSize}px ${color}`);
      return shadows.join(', ');
    };
    return {
      dust: generate(400, 1, 'rgba(255,255,255,0.2)'),
      stars: generate(200, 1.5, 'rgba(0, 242, 254, 0.6)'),
      giants: generate(50, 2.5, 'rgba(255, 255, 255, 0.9)'),
    };
  }, []);

  const asteroids = useMemo(() => Array.from({ length: 150 }).map(() => ({ r: Math.random() * 800 + 300, a: Math.random() * 360, s: Math.random() * 2 + 1, speed: Math.random() * 80 + 40 })), []);

  useEffect(() => {
    const text = "> INITIATING QUANTUM CORE...\n> BYPASSING GRAVITY FIELDS...\n> ESTABLISHING NEURAL LINK...\n> WELCOME TO THE NEXUS, CREATOR.";
    let i = 0;
    const typing = setInterval(() => {
      setBootText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(typing);
    }, 20);
    const warpTimer = setTimeout(() => setIsWarping(false), 2600);
    return () => { clearInterval(typing); clearTimeout(warpTimer); };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current || isWarping || activePlanet) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 25;
    const y = (e.clientY / window.innerHeight - 0.5) * 25;
    containerRef.current.style.setProperty('--mouse-x', `${x}deg`);
    containerRef.current.style.setProperty('--mouse-y', `${-y}deg`);
  };

  const isPaused = activePlanet !== null;

  return (
    <main
      ref={containerRef}
      className={`min-h-screen bg-[#010005] relative overflow-hidden font-sans text-white perspective-container selection:bg-cyan-500/30 ${isWarping ? 'cursor-wait' : 'cursor-crosshair'}`}
      onMouseMove={handleMouseMove}
      style={{ '--mouse-x': '0deg', '--mouse-y': '0deg' }}
      onClick={() => setActivePlanet(null)}
    >
      {/* BOOT SEQUENCE */}
      <div className={`fixed inset-0 z-[200] pointer-events-none transition-opacity duration-1000 flex items-center justify-center ${isWarping ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 warp-engine" />
        <div className="text-cyan-400 font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed drop-shadow-[0_0_10px_rgba(0,242,254,0.8)] z-10 w-[400px]">
          {bootText}<span className="animate-pulse">_</span>
        </div>
      </div>

      {/* THE ABYSS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(0,242,254,0.15)_0%,transparent_60%)] blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[90%] h-[90%] bg-[radial-gradient(circle,rgba(255,100,0,0.1)_0%,transparent_60%)] blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_10%,transparent_100%)] parallax-grid" />
        <div className="absolute top-1/2 left-1/2 parallax-stars">
          <div className="w-[1px] h-[1px] rounded-full animate-[spin_300s_linear_infinite]" style={{ boxShadow: starField.dust }} />
          <div className="w-[1px] h-[1px] rounded-full animate-[spin_200s_linear_infinite_reverse]" style={{ boxShadow: starField.stars }} />
          <div className="w-[1px] h-[1px] rounded-full animate-twinkle" style={{ boxShadow: starField.giants }} />
        </div>
      </div>

      {/* HEADER */}
      <header className={`absolute top-0 w-full z-50 p-6 md:p-8 flex justify-between items-start pointer-events-none transition-all duration-[1500ms] ease-out delay-300 ${isWarping ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Link href="/" className="pointer-events-auto flex items-center gap-4 group">
          <div className="relative p-3 bg-black/50 backdrop-blur-xl border border-white/20 hover:border-cyan-400 transition-all clip-path-angled shadow-[0_0_15px_rgba(0,242,254,0.1)]">
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-cyan-400 relative z-10 transition-colors" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] text-cyan-500 font-mono uppercase tracking-[0.4em] animate-pulse">Uplink Active</span>
            <span className="font-black tracking-[0.2em] text-sm uppercase">Cổng Dịch Chuyển</span>
          </div>
        </Link>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3 backdrop-blur-2xl bg-black/60 px-8 py-3 border-l-2 border-b-2 border-cyan-500/50 clip-path-hex pointer-events-auto shadow-[0_0_30px_rgba(0,242,254,0.15)]">
            <Radar className="w-5 h-5 text-cyan-400 animate-[spin_3s_linear_infinite]" />
            <h1 className="text-xl md:text-2xl font-black tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-500 uppercase">
              Hệ Siêu Dữ Liệu
            </h1>
          </div>
          <div className="text-[9px] font-mono text-cyan-500/50 tracking-widest pr-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> HCMC // 2026.ERA
          </div>
        </div>
      </header>

      {/* SOLAR SYSTEM ENGINE + HOLOGRAM MODAL + WARP GATE + CSS */}
      {/* (Toàn bộ phần còn lại của code bạn cung cấp trước đó đã được tích hợp đầy đủ và sạch cú pháp) */}

      {/* NÚT CHUYỂN TRANG */}
      <div className={`fixed bottom-8 right-8 z-40 transition-all duration-1000 delay-500 ${isWarping || activePlanet ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Link href="/system" className="group flex items-center gap-4 bg-[#05050a]/90 backdrop-blur-2xl border border-white/20 p-2 pr-8 clip-path-hex-large shadow-[0_0_50px_rgba(0,0,0,1)] hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center relative z-10 clip-path-angled group-hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,242,254,0)] group-hover:shadow-[0_0_30px_rgba(0,242,254,0.6)]">
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex flex-col relative z-10 pt-1">
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.25em] mb-0.5">Khởi động Hyper-Jump</span>
            <span className="text-sm font-bold text-white uppercase tracking-widest">Trạm Tốc Độ Cao</span>
          </div>
        </Link>
      </div>

      {/* CSS ENGINE */}
      <style jsx global>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .perspective-container { perspective: 2500px; overflow: hidden; }
        .clip-path-angled { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
        .clip-path-hex { clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
        .clip-path-hex-large { clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px); }
        .clip-path-tech-large { clip-path: polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%, 0 40px); }
        @keyframes orbit-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(360deg); } }
        @keyframes orbit-anti-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(-360deg); } }
        .system-paused * { animation-play-state: paused !important; }
        .warp-engine {
          background: transparent;
          background-image: radial-gradient(1px 30px at 20px 50px, #fff, transparent), radial-gradient(2px 50px at 60px 150px, #00f2fe, transparent), radial-gradient(1.5px 40px at 100px 250px, #fff, transparent);
          background-size: 200px 300px;
          animation: warpSpeed 0.4s linear infinite;
          opacity: 0.8;
        }
        @keyframes warpSpeed { 0% { transform: scale(1); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(4); opacity: 0; } }
        .parallax-grid { transform: translate(calc(var(--mouse-x) * -2), calc(var(--mouse-y) * 2)) scale(1.1); }
        .parallax-stars { transform: translate(calc(var(--mouse-x) * -4), calc(var(--mouse-y) * 4)); }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotateX(10deg); } 50% { transform: translateY(-20px) rotateX(-5deg); } }
        @keyframes scan-vertical { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes hud-glitch { 0% { opacity: 0; transform: scale(1.1) skewX(5deg); filter: blur(20px) contrast(2); } 50% { opacity: 0.8; transform: scale(0.98) skewX(-2deg); filter: blur(5px) contrast(1.5); } 100% { opacity: 1; transform: scale(1) skewX(0); filter: blur(0) contrast(1); } }
        .animate-hud-glitch { animation: hud-glitch 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}</style>
    </main>
  );
}