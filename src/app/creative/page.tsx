'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, X, Orbit, Zap, Target, Crosshair, Radar, Activity,
  Cpu, Globe, Wand2, TerminalSquare, Layers, UtensilsCrossed, DatabaseZap, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// Dữ liệu 7 hành tinh
const planets = [
  { id: 'ai', name: "AI Agentic & Tự động", desc: "Kiến trúc AI tự trị đa luồng. Tích hợp Google Antigravity & OpenClaw tối ưu hóa logic phức tạp.", base: "#00f2fe", glow: "rgba(0,242,254,0.6)", size: 64, orbit: 220, speed: 20, icon: Cpu, moons: 2, ring: false, class: "S-Tier", coords: "NX-77.1" },
  { id: 'web', name: "Phát triển Web", desc: "Generative Design & UI/UX nổi bật. Tái định nghĩa trải nghiệm người dùng với hoạt ảnh phi truyền thống.", base: "#b026ff", glow: "rgba(176,38,255,0.6)", size: 76, orbit: 340, speed: 30, icon: Globe, moons: 1, ring: true, class: "A-Tier", coords: "VW-11.4" },
  { id: 'prompt', name: "Prompt Engineering", desc: "Khai phá ranh giới ngôn ngữ AI. Thiết lập cấu trúc lệnh tinh vi định hình ý tưởng thiết kế sáng tạo.", base: "#ff0844", glow: "rgba(255,8,68,0.6)", size: 48, orbit: 460, speed: 40, icon: Wand2, moons: 0, ring: false, class: "A-Tier", coords: "PR-99.0" },
  { id: 'creative', name: "Creative Coding", desc: "Điều khiển từng pixel bằng định luật vật lý và không gian 3 chiều. Viết mã tạo ra sự sống trên màn hình.", base: "#38f9d7", glow: "rgba(56,249,215,0.6)", size: 60, orbit: 580, speed: 50, icon: TerminalSquare, moons: 0, ring: false, class: "S-Tier", coords: "CC-42.8" },
  { id: 'uiux', name: "Experimental UI/UX", desc: "Motion Design & Micro-interactions. Tích hợp tâm lý học hành vi vào từng chuyển động của giao diện.", base: "#f6d365", glow: "rgba(246,211,101,0.6)", size: 52, orbit: 700, speed: 60, icon: Layers, moons: 0, ring: true, class: "B-Tier", coords: "UX-01.2" },
  { id: 'food', name: "Food Web System", desc: "Kiến trúc sư hệ thống toàn diện từ Front-end trải nghiệm đến Back-end vận hành (02/2026 - Nay).", base: "#8b5cf6", glow: "rgba(139,92,246,0.6)", size: 84, orbit: 840, speed: 75, icon: UtensilsCrossed, moons: 3, ring: false, class: "Core", coords: "FW-26.2" },
  { id: 'backend', name: "Backend Core", desc: "Xây dựng API tốc độ cao, tối ưu Database Query và kiến trúc Microservices tại Ayden Company.", base: "#f43f5e", glow: "rgba(244,63,94,0.6)", size: 44, orbit: 980, speed: 90, icon: DatabaseZap, moons: 0, ring: false, class: "Core", coords: "BE-11.9" },
];

export default function SpacePremiumPage() {
  const [activePlanet, setActivePlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [stars, setStars] = useState({ far: [], near: [] });
  const containerRef = useRef(null);

  // Sinh sao một lần
  useEffect(() => {
    setStars({
      far: Array.from({ length: 150 }).map(() => ({ x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.5 + 0.1 })),
      near: Array.from({ length: 50 }).map(() => ({ x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1.5, opacity: Math.random() * 0.8 + 0.2, delay: Math.random() * 5 }))
    });
  }, []);
  // Xử lý Parallax 4D siêu mượt
  const handleMouseMove = (e) => {
    if (!containerRef.current || activePlanet) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    containerRef.current.style.setProperty('--mouse-x', `${x}deg`);
    containerRef.current.style.setProperty('--mouse-y', `${-y}deg`);
  };

  const isPaused = activePlanet !== null;

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-[#020108] relative overflow-hidden font-sans text-white perspective-container cursor-crosshair selection:bg-cyan-500/30"
      onMouseMove={handleMouseMove}
      style={{ '--mouse-x': '0deg', '--mouse-y': '0deg' }}
      onClick={() => setActivePlanet(null)}
    >
      {/* ================= 1. DEEP SPACE (Vũ trụ Thẳm sâu) ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Lưới tọa độ Radar */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] transition-transform duration-1000"
          style={{ transform: 'translate(calc(var(--mouse-x) * -2), calc(var(--mouse-y) * 2))' }} 
        />
       
        {/* Tinh vân quang học (Nebulas) */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 blur-[150px] mix-blend-screen rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[70%] bg-cyan-900/10 blur-[150px] mix-blend-screen rounded-full animate-pulse-slow delay-1000" />
       
        {/* Các tầng Sao (Parallax Stars) */}
        <div className="absolute inset-0 transition-transform duration-1000" style={{ transform: 'translate(calc(var(--mouse-x) * -1), calc(var(--mouse-y) * 1))' }}>
          {stars.far.map((s, i) => (
            <div 
              key={`f-${i}`} 
              className="absolute bg-white rounded-full" 
              style={{ 
                left: `${s.x}%`, 
                top: `${s.y}%`, 
                width: s.size, 
                height: s.size, 
                opacity: s.opacity 
              }} 
            />
          ))}
        </div>
        <div className="absolute inset-0 transition-transform duration-1000" style={{ transform: 'translate(calc(var(--mouse-x) * -3), calc(var(--mouse-y) * 3))' }}>
          {stars.near.map((s, i) => (
            <div 
              key={`n-${i}`} 
              className="absolute bg-cyan-100 rounded-full animate-twinkle shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
              style={{ 
                left: `${s.x}%`, 
                top: `${s.y}%`, 
                width: s.size, 
                height: s.size, 
                opacity: s.opacity, 
                animationDelay: `${s.delay}s` 
              }} 
            />
          ))}
        </div>
      </div>
      {/* ================= 2. HEADER HUD (Giao diện Điều hướng) ================= */}
      <header className="absolute top-0 w-full z-50 p-6 md:p-8 flex justify-between items-start pointer-events-none">
        <Link href="/" className="pointer-events-auto flex items-center gap-4 group">
          <div className="p-3 bg-[#0a0a14]/80 backdrop-blur-xl border border-white/10 rounded-2xl group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] text-cyan-400/70 font-mono tracking-widest uppercase">SYS.OVERRIDE //</span>
            <span className="font-bold tracking-wider text-sm uppercase">Trạm Khởi Hành</span>
          </div>
        </Link>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 backdrop-blur-2xl bg-[#0a0a14]/60 px-6 py-3 border border-white/10 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <Radar className="w-5 h-5 text-cyan-400 animate-[spin_4s_linear_infinite]" />
            <h1 className="text-xl md:text-2xl font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-500 uppercase">
              VŨ TRỤ SÁNG TẠO
            </h1>
          </div>
        </div>
      </header>

      {/* ================= 3. 3D SOLAR SYSTEM ENGINE ================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        
        {/* Bộ Camera: Bám Parallax chuột */}
        <div 
          className={`camera-rig transform-style-3d transition-all duration-[1200ms] ease-cinematic w-full h-full flex items-center justify-center
               ${isPaused ? 'scale-[0.3] md:scale-[0.4] translate-y-[10%] opacity-30 blur-[6px] pointer-events-none system-paused' : 'scale-[0.25] sm:scale-[0.4] md:scale-[0.55] lg:scale-[0.7] xl:scale-[0.85] 2xl:scale-100'}`}
          style={{ transform: isPaused ? '' : `rotateX(calc(72deg + var(--mouse-y))) rotateY(var(--mouse-x))` }}
        >
          {/* A. LÕI MẶT TRỜI (THE SUN) */}
          <div className="absolute transform-style-3d pointer-events-auto z-50">
            {/* Lật ngược để đứng thẳng */}
            <div className="transform-style-3d transition-transform duration-1000 ease-out" style={{ transform: `rotateX(calc(-72deg - var(--mouse-y))) rotateY(calc(0deg - var(--mouse-x)))` }}>
              <div className="relative flex items-center justify-center w-48 h-48 group hover:scale-105 transition-transform duration-700 cursor-pointer">
                
                {/* Vòng từ trường (Magnetic Fields) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] border border-dashed border-orange-500/40 rounded-full animate-[spin_20s_linear_infinite] transform-style-3d pointer-events-none" style={{ transform: 'rotateX(70deg)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] border-[2px] border-yellow-400/30 rounded-full animate-[spin_15s_linear_infinite_reverse] transform-style-3d pointer-events-none" style={{ transform: 'rotateX(70deg)' }} />
                
                {/* Bão Plasma */}
                <div className="absolute -inset-[40%] bg-[radial-gradient(circle,rgba(250,204,21,0.4)_0%,transparent_60%)] animate-pulse-slow mix-blend-screen pointer-events-none rounded-full" />
                
                {/* Lõi Cầu */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff_0%,#facc15_20%,#ea580c_70%,#7f1d1d_100%)] shadow-[0_0_100px_rgba(234,88,12,0.8),inset_-20px_-20px_50px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.8)] overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 mix-blend-multiply pointer-events-none" />
                </div>
                
                {/* Typography Trung Tâm */}
                <div className="relative z-10 flex flex-col items-center drop-shadow-2xl pointer-events-none">
                  <div className="text-4xl font-black text-white tracking-tighter leading-none mb-1">THANH</div>
                  <div className="text-4xl font-black text-white tracking-tighter leading-none">HUY</div>
                  <div className="mt-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-500/40 shadow-inner">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-mono font-bold text-yellow-400 tracking-widest">2003_CORE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* B. QUỸ ĐẠO & HÀNH TINH (SKILLS) */}
          {planets.map((p, index) => {
            const delay = `-${(index / planets.length) * p.speed}s`;
            const isHovered = hoveredPlanet === p.id;
            const isDimmed = hoveredPlanet && hoveredPlanet !== p.id;
            return (
              <div key={p.id} className={`absolute transform-style-3d transition-opacity duration-500 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
                
                {/* Đường vẽ Quỹ Đạo */}
                <div className="absolute rounded-full border border-white/10 pointer-events-none transition-all duration-500"
                     style={{
                       width: p.orbit * 2, height: p.orbit * 2, left: -p.orbit, top: -p.orbit,
                       borderColor: isHovered ? `${p.base}60` : '',
                       boxShadow: isHovered ? `0 0 20px ${p.glow}, inset 0 0 20px ${p.glow}` : 'none'
                     }} />
                
                {/* Vệt Sao Chổi */}
                <div className="absolute pointer-events-none orbit-spin" style={{ width: p.orbit * 2, height: p.orbit * 2, left: -p.orbit, top: -p.orbit, animationDuration: `${p.speed}s`, animationDelay: delay }}>
                  <div className="absolute top-0 left-1/2 w-48 h-[2px] -translate-y-1/2 origin-left blur-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${p.base})` }} />
                </div>
                      {/* 3. Bẻ Góc Nhìn Trực Diện Camera (-72deg + parallax) */}
                      <div className="absolute transform-style-3d transition-transform duration-1000 ease-out pointer-events-auto"
                           style={{ transform: `rotateX(calc(-72deg - var(--mouse-y))) rotateY(calc(0deg - var(--mouse-x)))` }}>
                       
                        {/* ================= KHỐI CẦU HÀNH TINH ================= */}
                        <div
                          className="absolute flex items-center justify-center cursor-pointer group hover-target"
                          style={{ width: p.size, height: p.size, left: -p.size/2, top: -p.size/2 }}
                          onClick={(e) => { e.stopPropagation(); setActivePlanet(p); setHoveredPlanet(null); }}
                          onMouseEnter={() => !isPaused && setHoveredPlanet(p.id)}
                          onMouseLeave={() => !isPaused && setHoveredPlanet(null)}
                        >
                          {/* Khí Quyển Sáng (Atmosphere Glow) */}
                          <div className="absolute -inset-[40%] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[25px] pointer-events-none" style={{ backgroundColor: p.base }} />
                          
                          {/* Vành Đai Sao Thổ (Saturn Rings) */}
                          {p.ring && (
                            <div className="absolute w-[220%] h-[220%] rounded-full border-[5px] border-double border-white/40 pointer-events-none group-hover:border-white/80 transition-colors duration-500 animate-[spin_10s_linear_infinite] transform-style-3d" style={{ transform: 'rotateX(70deg) rotateY(15deg)', borderTopColor: p.base }} />
                          )}
                          
                          {/* Mặt Trăng (Moons) */}
                          {Array.from({ length: p.moons }).map((_, mIdx) => (
                            <div key={mIdx} className="absolute inset-0 animate-[spin_4s_linear_infinite] pointer-events-none" style={{ animationDelay: `-${mIdx * 1.5}s`, animationDuration: `${3 + mIdx}s` }}>
                              <div className="absolute top-[-30%] left-1/2 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_#fff]" />
                            </div>
                          ))}
                          
                          {/* Bề Mặt Vật Lý (Volumetric Core) */}
                          <div
                            className="w-full h-full rounded-full relative overflow-hidden transition-all duration-500 group-hover:scale-[1.2] group-hover:z-50"
                            style={{
                              backgroundColor: p.base,
                              boxShadow: `0 0 40px ${p.glow}, inset -15px -15px 30px rgba(0,0,0,0.8), inset 5px 5px 20px rgba(255,255,255,0.6)`
                            }}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6)_0%,transparent_60%)] pointer-events-none" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply pointer-events-none" />
                            <p.icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 h-2/5 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] z-10 pointer-events-none" />
                          </div>
                          
                          {/* Khung Nhắm Laze (Target Lock) */}
                          <div className="absolute -inset-4 border border-white/0 group-hover:border-white/40 rounded-full transition-colors duration-500 pointer-events-none border-dashed group-hover:animate-[spin_6s_linear_infinite]" />
                          
                          {/* Bảng tên Hologram Tooltip */}
                          <div className="absolute left-[130%] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none flex items-center z-[200]">
                            <div className="w-6 h-[1px] bg-gradient-to-r from-white/60 to-transparent" />
                            <div className="bg-[#05050a]/95 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative overflow-hidden min-w-[200px]">
                              <div className="absolute left-0 top-0 w-1 h-full" style={{ backgroundColor: p.base }} />
                              <div className="text-[9px] text-cyan-400 font-mono mb-1 tracking-widest flex justify-between uppercase">
                                <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" /> {p.class}</span>
                                <span>{p.coords}</span>
                              </div>
                              <div className="text-sm font-bold text-white tracking-wide truncate">{p.name}</div>
                              <div className="text-[9px] text-white/30 border-t border-white/10 pt-1 mt-1 font-mono uppercase">Click to Extract Data</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
          </div>
        </div>
      </div>

      {/* ================= 4. HOLOGRAM HUD MODAL (Khi Click Hành Tinh) ================= */}
      {activePlanet && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-[#010104]/80 backdrop-blur-[24px] pointer-events-auto transition-all duration-700"
          onClick={() => setActivePlanet(null)}
        >
          <div 
            className="relative w-full max-w-6xl md:min-h-[600px] bg-[#05050a]/90 border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col md:flex-row rounded-3xl overflow-hidden animate-hud-enter z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Tia Scanner Quét Ngang */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/80 shadow-[0_0_20px_#22d3ee] blur-[1px] animate-scan-vertical z-50 pointer-events-none" />
            
            <button 
              onClick={() => setActivePlanet(null)} 
              className="absolute top-6 right-6 p-3 group z-50 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-full transition-all flex items-center gap-2"
            >
              <span className="text-[10px] font-mono uppercase text-white/50 group-hover:text-red-400 hidden sm:block transition-colors tracking-widest">Abort_Scan</span>
              <X className="w-5 h-5 text-white/50 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
            </button>

            {/* Cột trái: Hologram Hành Tinh */}
            <div className="w-full md:w-[45%] relative flex flex-col items-center justify-center p-12 border-b md:border-b-0 md:border-r border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] overflow-hidden">
              <div className="relative w-56 h-56 md:w-72 md:h-72 animate-float flex items-center justify-center transform-style-3d mt-8 md:mt-0">
                <div className="absolute w-[140%] h-[140%] rounded-full border border-dashed border-cyan-500/30 animate-[spin_20s_linear_infinite]" style={{ transform: 'rotateX(75deg)' }} />
                <div className="absolute w-[160%] h-[160%] rounded-full border-t border-b border-cyan-400/40 animate-[spin_15s_linear_infinite_reverse]" style={{ transform: 'rotateX(75deg) rotateY(20deg)' }} />
                
                <div 
                  className="w-full h-full rounded-full relative overflow-hidden"
                  style={{
                    backgroundColor: activePlanet.base,
                    boxShadow: `0 0 100px ${activePlanet.glow}, inset -30px -30px 60px rgba(0,0,0,0.9), inset 15px 15px 40px rgba(255,255,255,0.6)`
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5)_0%,transparent_70%)]" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay pointer-events-none" />
                  <activePlanet.icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)] z-10" />
                </div>
              </div>
            </div>

            {/* Cột phải: Bảng Dữ Liệu */}
            <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center relative bg-[#030305]">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-cyan-400 rounded-sm animate-ping" />
                <span className="text-cyan-400 text-[10px] font-mono tracking-[0.3em] uppercase border-b border-cyan-500/30 pb-1">Data Synchronized</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] uppercase tracking-tight" style={{ textShadow: `0 0 40px ${activePlanet.glow}` }}>
                {activePlanet.name}
              </h2>
              
              <div className="relative pl-6 border-l-2 border-white/10 mb-10">
                <div className="absolute top-0 -left-[2px] w-1 h-10" style={{ backgroundColor: activePlanet.base }} />
                <p className="text-white/80 text-lg md:text-xl leading-relaxed font-light">
                  {activePlanet.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <div className="text-white/40 font-mono text-[10px] tracking-widest mb-2 uppercase flex items-center gap-2"><Orbit className="w-3 h-3" /> Bán Kính Quỹ Đạo</div>
                  <div className="text-white font-mono text-3xl font-bold">{activePlanet.orbit} <span className="text-sm text-cyan-400">MKm</span></div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <div className="text-white/40 font-mono text-[10px] tracking-widest mb-2 uppercase flex items-center gap-2"><Activity className="w-3 h-3" /> Tốc Độ Xử Lý</div>
                  <div className="text-white font-mono text-3xl font-bold">{activePlanet.speed} <span className="text-sm text-cyan-400">T/s</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. NÚT CHUYỂN TRANG (WARP GATE) ================= */}
      <div className="fixed bottom-8 right-8 z-40">
        <Link href="/system" className="group flex items-center gap-4 bg-[#05050a]/80 backdrop-blur-xl border border-white/10 p-2 pr-6 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] hover:border-cyan-500/50 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest mb-0.5">Tiếp tục hành trình</span>
            <span className="text-sm font-bold text-white uppercase tracking-wide">Trạm Logic & Tốc Độ</span>
          </div>
        </Link>
      </div>

      {/* ================= CSS PHYSICS & ANIMATION ENGINE ================= */}
      <style jsx global>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .perspective-container { perspective: 2000px; }
        .ease-cinematic { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes orbit-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(360deg); } }
        @keyframes orbit-anti-spin { from { transform: rotateZ(0deg); } to { transform: rotateZ(-360deg); } }
        .system-paused { animation-play-state: paused !important; }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.5); } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotateX(10deg); } 50% { transform: translateY(-15px) rotateX(-5deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        @keyframes scan-vertical { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(800px); opacity: 0; } }
        @keyframes hud-enter { 0% { opacity: 0; transform: scale(1.05) translateY(30px); filter: blur(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } }
        .animate-hud-enter { animation: hud-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scan-vertical { animation: scan-vertical 3s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

