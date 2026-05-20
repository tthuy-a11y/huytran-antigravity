'use client';

import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { ArrowLeft, Zap, Database, GitBranch, Cpu, Target, Activity, Waves, Lock, X, Fingerprint, Orbit, Play, TerminalSquare, Rocket, ShieldAlert, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DynamicFleetSystem3D = dynamic(() => import('./components/FleetSystem3D'), { ssr: false });

// ============================================================================
// 1. TYPESCRIPT INTERFACES
// ============================================================================
type ShipStats = [number, number, number, number];
type ShipShape = 'nexus' | 'uix' | 'prmpt' | 'phys' | 'cloud' | 'shield';
interface FleetShip {
  id: number; icon: React.ElementType; code: string; title: string; hex: string; stats: ShipStats; items: string[]; link: string; shape: ShipShape; shipName: string;
}
const getClipPath = (s: ShipShape) => ({
  nexus: 'polygon(50% 0%, 100% 30%, 85% 100%, 50% 85%, 15% 100%, 0% 30%)',
  uix: 'polygon(50% 10%, 100% 70%, 80% 100%, 50% 80%, 20% 100%, 0% 70%)',
  prmpt: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
  phys: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 50% 100%, 0% 70%, 0% 30%)',
  cloud: 'polygon(0% 20%, 50% 0%, 100% 20%, 90% 100%, 10% 100%)',
  shield: 'polygon(50% 0%, 90% 20%, 100% 70%, 50% 100%, 0% 70%, 10% 20%)'
}[s]);

// ============================================================================
// 2. SYNTHETIC AUDIO ENGINE (WEB AUDIO API)
// ============================================================================
class AudioSystem {
  ctx: AudioContext | null = null;
  init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }
  play(type: 'type' | 'boot' | 'hover' | 'click' | 'warp' | 'abort' | 'deploy' | 'beep' | 'impact') {
    if (!this.ctx) this.init(); if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination); const now = this.ctx.currentTime;
      switch (type) {
        case 'type':
          osc.type = 'square'; osc.frequency.setValueAtTime(800 + Math.random()*200, now);
          gain.gain.setValueAtTime(0.01, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now); osc.stop(now + 0.05); break;
        case 'boot':
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(50, now); osc.frequency.exponentialRampToValueAtTime(150, now + 2);
          gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.05, now + 1); gain.gain.linearRampToValueAtTime(0, now + 3);
          osc.start(now); osc.stop(now + 3); break;
        case 'hover':
          osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
          gain.gain.setValueAtTime(0.01, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1); break;
        case 'warp':
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(40, now); osc.frequency.exponentialRampToValueAtTime(800, now + 1.2);
          gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.5); gain.gain.linearRampToValueAtTime(0, now + 1.2);
          osc.start(now); osc.stop(now + 1.2); break;
        case 'abort':
          osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
          gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now); osc.stop(now + 0.4); break;
        case 'deploy':
          osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.3); osc.frequency.linearRampToValueAtTime(400, now + 0.6); osc.frequency.linearRampToValueAtTime(1200, now + 1.2);
          gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.001, now + 1.2);
          osc.start(now); osc.stop(now + 1.2); break;
        case 'impact': // Asteroid collision boom
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
          gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now); osc.stop(now + 0.3); break;
        case 'beep':
          osc.type = 'sine'; osc.frequency.setValueAtTime(1500, now); gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1); break;
      }
    } catch (e) {}
  }
}
const sfx = typeof window !== 'undefined' ? new AudioSystem() : null;

// ============================================================================
// 3. SUB-COMPONENTS (MEMOIZED AAA)
// ============================================================================

// --- TERMINAL OS BOOT SEQUENCE ---
const BootTerminal = memo(({ onComplete }: { onComplete: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bootText = useMemo(() => [
    "EXODUS KERNEL v9.0.4 INITIALIZING...",
    "LOADING QUANTUM MODULES.................. [OK]",
    "ESTABLISHING SECURE UPLINK............... [OK]",
    "BYPASSING NEURAL FIREWALL................ [OK]",
    "DECRYPTING CLASSIFIED ASSETS............. [OK]",
    "SYNCING ORBITAL SATELLITES............... [OK]",
    "ACCESS GRANTED. WELCOME COMMANDER."
  ], []);

  useEffect(() => {
    sfx?.init(); sfx?.play('boot');
    let currentLine = 0; let currentChar = 0;
    
    const typeWriter = () => {
      if (currentLine >= bootText.length) {
        setTimeout(onComplete, 1000); return;
      }
      const fullString = bootText[currentLine];
      if (currentChar < fullString.length) {
        setLines(prev => {
          const newLines = [...prev];
          if (newLines[currentLine] === undefined) newLines[currentLine] = '';
          newLines[currentLine] = fullString.substring(0, currentChar + 1);
          return newLines;
        });
        if (Math.random() > 0.5) sfx?.play('type');
        currentChar++;
        setTimeout(typeWriter, Math.random() * 20 + 10); // typing speed
      } else {
        currentLine++; currentChar = 0;
        setTimeout(typeWriter, currentLine === bootText.length - 1 ? 500 : 150); // Line delay
      }
    };
    setTimeout(typeWriter, 500);
  }, [bootText, onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#02040a] p-10 font-mono text-cyan-500 text-sm md:text-lg flex flex-col justify-end pb-20">
      <div className="crt-overlay" />
      <div className="max-w-4xl mx-auto w-full">
        <Fingerprint className="w-16 h-16 mb-8 opacity-50 animate-pulse text-cyan-700" />
        {lines.map((line, i) => (
          <div key={i} className="mb-2 uppercase tracking-widest">{line}{i === lines.length - 1 ? <span className="animate-ping">_</span> : ''}</div>
        ))}
      </div>
    </div>
  );
});
BootTerminal.displayName = 'BootTerminal';

// --- FPS MONITOR ---
const FPSMonitor = memo(() => {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let frames = 0; let prev = performance.now(); let req: number;
    const loop = (now: number) => { frames++; if (now - prev >= 1000) { setFps(frames); frames = 0; prev = now; } req = requestAnimationFrame(loop); };
    req = requestAnimationFrame(loop); return () => cancelAnimationFrame(req);
  }, []);
  return (
    <div className="fixed top-5 right-5 z-[9900] pointer-events-none flex flex-col items-end text-[9px] font-mono mix-blend-screen text-cyan-500">
      <span>SYS.PERF</span><span className="text-white font-bold">{fps} FPS</span>
    </div>
  );
});
FPSMonitor.displayName = 'FPSMonitor';

// --- PARALLAX 3D HOLOGRAM (MOUSE TRACKING) ---
const InteractiveHologram = memo(({ icon: Icon, color }: { icon: any, color: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let req: number;
    const move = (e: MouseEvent) => {
      req = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 40; // Max 20deg tilt
        const y = (e.clientY / window.innerHeight - 0.5) * -40;
        containerRef.current.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
      });
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(req); };
  }, []);

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center perspective-[1000px] mb-8">
      <div ref={containerRef} className="relative w-full h-full transform-style-3d transition-transform duration-100 ease-out flex items-center justify-center">
        {/* Lớp RGB Split Chromatic Aberration */}
        <Icon className="absolute w-32 h-32 md:w-48 md:h-48 opacity-60 z-10 mix-blend-screen transform translate-z-[10px]" style={{ color: 'red', filter: 'blur(3px)', transform: 'translateZ(10px) translate(-5px, 2px)' }} strokeWidth={1} />
        <Icon className="absolute w-32 h-32 md:w-48 md:h-48 opacity-60 z-20 mix-blend-screen transform translate-z-[20px]" style={{ color: 'cyan', filter: 'blur(3px)', transform: 'translateZ(20px) translate(5px, -2px)' }} strokeWidth={1} />
        
        {/* Lõi Core Chính */}
        <Icon className="absolute w-32 h-32 md:w-48 md:h-48 text-white z-30 drop-shadow-[0_0_30px_white] transform translate-z-[40px] animate-[pulse_2s_infinite]" strokeWidth={1} />
      </div>
      
      {/* Vòng sáng đáy */}
      <div className="absolute -bottom-10 w-48 h-10 rounded-full blur-[20px] opacity-40 animate-pulse" style={{ backgroundColor: color }} />
    </div>
  );
});
InteractiveHologram.displayName = 'InteractiveHologram';

// --- DATA STREAM MATRIX ---
const MatrixRain = memo(({ color, active }: { color: string, active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const resize = () => { canvas.width = canvas.parentElement!.clientWidth; canvas.height = canvas.parentElement!.clientHeight; }; resize(); window.addEventListener('resize', resize);
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*<>[]{}/\\|'.split('');
    const fontSize = 14; const columns = canvas.width / fontSize;
    const drops: number[] = Array.from({ length: columns }).map(() => Math.random() * -100);
    
    let reqId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(1, 3, 10, 0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color; ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1; reqId = requestAnimationFrame(draw);
    };
    reqId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(reqId); window.removeEventListener('resize', resize); };
  }, [color, active]);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none w-full h-full mask-image-y" />;
});
MatrixRain.displayName = 'MatrixRain';

// --- SCRAMBLE TEXT ---
const ScrambleText = memo(({ text, active, delay = 0 }: { text: string, active: boolean, delay?: number }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!active) { setDisplay(''); return; }
    let iter = 0; let intervalId: NodeJS.Timeout; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    const tId = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplay(text.split('').map((c, i) => (i < iter || c === ' ' ? c : chars[Math.floor(Math.random() * chars.length)])).join(''));
        if (iter >= text.length) { clearInterval(intervalId); setDisplay(text); } iter += 1 / 3;
      }, 30);
    }, delay);
    return () => { clearTimeout(tId); clearInterval(intervalId); };
  }, [text, active, delay]);
  return <span>{display}</span>;
});
ScrambleText.displayName = 'ScrambleText';

// ============================================================================
// 4. MAIN EXODUS ENGINE (V6)
// ============================================================================
export default function ExodusGodTier() {
  const [osBooted, setOsBooted] = useState(false);
  const [activeShip, setActiveShip] = useState<number | null>(null);
  const [warpSpeed, setWarpSpeed] = useState(false);
  const [deployState, setDeployState] = useState<'idle' | 'charging' | 'deployed'>('idle');
  const [showGate, setShowGate] = useState(false);
  const [rushingShipId, setRushingShipId] = useState<number | null>(null);
  const [impactParticles, setImpactParticles] = useState<Array<{id:number;x:number;y:number;s:number;d:number;c:string}>>([]);
  const [impactFlash, setImpactFlash] = useState(false);
  const [asteroids, setAsteroids] = useState<Array<{id:number;x:number;y:number;r:number;s:number;d:number}>>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // STATELESS ENGINE REF
  const engineRef = useRef({
    width: 0, height: 0, cx: 0, cy: 0, rawX: -100, rawY: -100, mx: 0, my: 0,
    speed: 0.5, targetSpeed: 0.5, time: 0,
    accretionParticles: [] as any[], shockwaves: [] as any[]
  });

  const fleet: FleetShip[] = useMemo(() => [
    { id: 0, icon: Cpu, code: "NEXUS-01", title: "Trí Tuệ Nhân Tạo", shipName: "PHI THUYỀN AI", hex: "#00f2fe", shape: 'nexus' as ShipShape, stats: [98, 95, 92, 88], items: ["Tự động hóa toàn bộ quy trình thông minh", "Phân tích dữ liệu lớn, trích xuất thông tin tức thời", "Tối ưu 300% tốc độ xử lý công việc", "Tạo trợ lý AI từ câu lệnh tự nhiên"], link: "/ai" },
    { id: 1, icon: Globe, code: "UIX-99", title: "Thiết Kế Web 3D", shipName: "PHI THUYỀN WEB", hex: "#b026ff", shape: 'uix' as ShipShape, stats: [90, 88, 96, 85], items: ["Thiết kế giao diện không gian 3 chiều", "Trải nghiệm người dùng đỉnh cao", "Hiệu ứng chuyển động siêu mượt mà", "Hiển thị hoàn hảo trên mọi thiết bị"], link: "/web3d" },
    { id: 2, icon: Zap, code: "PRMPT-X", title: "Kỹ Thuật Prompt", shipName: "PHI THUYỀN PROMPT", hex: "#ff0844", shape: 'prmpt' as ShipShape, stats: [95, 92, 88, 90], items: ["Kiến trúc sư ngôn ngữ cho AI", "Tạo hình ảnh và nội dung cực nhanh", "Tư duy chuỗi và tư duy phân nhánh", "Làm chủ câu lệnh đa phương thức"], link: "/prompt" },
    { id: 3, icon: Rocket, code: "PHYS-42", title: "Lập Trình Vật Lý", shipName: "PHI THUYỀN VẬT LÝ", hex: "#00ff87", shape: 'phys' as ShipShape, stats: [92, 90, 99, 95], items: ["Hoạt hình theo quy luật vật lý thực tế", "Hệ thống hạt và mô phỏng chất lỏng", "Phát hiện và xử lý va chạm", "Mô phỏng vật lý thời gian thực"], link: "/physics" },
    { id: 4, icon: Database, code: "CLOUD-7", title: "Dữ Liệu & Đám Mây", shipName: "PHI THUYỀN DỮ LIỆU", hex: "#f5a623", shape: 'cloud' as ShipShape, stats: [85, 99, 90, 80], items: ["Kiến trúc phân tán siêu tốc độ", "Đường ống xử lý và kho dữ liệu", "Kiến trúc ứng dụng đám mây", "Bảng điều khiển phân tích thời gian thực"], link: "/data" },
    { id: 5, icon: ShieldAlert, code: "SHIELD-X", title: "An Ninh Mạng", shipName: "PHI THUYỀN BẢO MẬT", hex: "#ff007f", shape: 'shield' as ShipShape, stats: [88, 92, 85, 98], items: ["Mã hóa và bảo mật đa lớp", "Kiểm thử xâm nhập và đánh giá", "Kiến trúc không tin cậy (Zero-Trust)", "Quy trình ứng phó sự cố"], link: "/security" },
  ], []);

  // --- Actions ---
  const engageShip = useCallback((id: number) => {
    if (activeShip === id || rushingShipId !== null) return;
    const shipColor = fleet.find(f => f.id === id)?.hex || '#fff';
    sfx?.play('click'); setRushingShipId(id);
    // 200ms: Asteroids rush in from edges
    setTimeout(() => {
      setAsteroids(Array.from({length:6},(_,i)=>({ id:i, x:(Math.random()-.5)*600, y:-300-Math.random()*200, r:Math.random()*720, s:8+Math.random()*16, d:Math.random()*.2 })));
    }, 200);
    // 500ms: IMPACT! Flash + explosion particles + sound
    setTimeout(() => {
      sfx?.play('impact'); setImpactFlash(true);
      setImpactParticles(Array.from({length:40},(_,i)=>({ id:i, x:(Math.random()-.5)*500, y:(Math.random()-.5)*500, s:Math.random()*8+2, d:Math.random()*.2, c: Math.random()>.5 ? shipColor : '#fff' })));
      setTimeout(() => setImpactFlash(false), 150);
    }, 500);
    // 1200ms: Warp drive engage
    setTimeout(() => {
      sfx?.play('warp'); setWarpSpeed(true); engineRef.current.targetSpeed = 400;
      setImpactParticles([]); setAsteroids([]);
    }, 1200);
    // 1800ms: Arrive at HUD
    setTimeout(() => {
      setActiveShip(id); setWarpSpeed(false); setRushingShipId(null);
      engineRef.current.targetSpeed = 0.5;
    }, 1800);
  }, [activeShip, rushingShipId, fleet]);

  const abortMission = useCallback(() => {
    if (activeShip === null || deployState !== 'idle') return;
    sfx?.play('abort'); setWarpSpeed(true); engineRef.current.targetSpeed = 400;
    setTimeout(() => { setActiveShip(null); setWarpSpeed(false); engineRef.current.targetSpeed = 0.5; }, 800);
  }, [activeShip, deployState]);

  const handleDeploy = useCallback(() => {
    setDeployState('charging'); sfx?.play('deploy');
    engineRef.current.targetSpeed = 1000;
    
    // Spawn Shockwave to Canvas Engine
    engineRef.current.shockwaves.push({ r: 10, color: fleet[activeShip!].hex, alpha: 1 });

    setTimeout(() => {
      setDeployState('deployed'); sfx?.play('beep');
      engineRef.current.shockwaves.push({ r: 50, color: '#fff', alpha: 1 }); // Final Burst
      
      setTimeout(() => { setDeployState('idle'); abortMission(); }, 1500);
    }, 1500);
  }, [activeShip, fleet, abortMission]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape' && activeShip !== null) abortMission(); };
    window.addEventListener('keydown', keyHandler); return () => window.removeEventListener('keydown', keyHandler);
  }, [activeShip, abortMission]);

  // --- GOD-TIER CANVAS ENGINE (BLACKHOLE ACCRETION & WORMHOLE) ---
  useEffect(() => {
    if (!osBooted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    const updateSize = () => { engineRef.current.width = canvas.width = window.innerWidth; engineRef.current.height = canvas.height = window.innerHeight; engineRef.current.cx = window.innerWidth / 2; engineRef.current.cy = window.innerHeight / 2; }; updateSize();
    const handleMouseMove = (e: MouseEvent) => { engineRef.current.rawX = e.clientX; engineRef.current.rawY = e.clientY; };
    window.addEventListener('resize', updateSize); window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const STARS = window.innerWidth > 1024 ? 1200 : 500;
    const stars = Array.from({ length: STARS }).map(() => ({ x: (Math.random() - 0.5) * 5000, y: (Math.random() - 0.5) * 5000, z: Math.random() * 3000 + 100, pz: 0 }));

    let reqId: number;
    const animate = () => {
      const st = engineRef.current; st.time += 0.005; st.speed += (st.targetSpeed - st.speed) * 0.1;
      const { width: w, height: h, cx, cy, speed, accretionParticles, shockwaves } = st;
      
      st.mx += ((st.rawX > 0 ? (st.rawX - cx) * 0.15 : 0) - st.mx) * 0.1;
      st.my += ((st.rawY > 0 ? (st.rawY - cy) * 0.15 : 0) - st.my) * 0.1;

      ctx.fillStyle = `rgba(1, 2, 7, ${speed > 10 ? 0.2 : 0.6})`; ctx.fillRect(0, 0, w, h);
      
      const realCx = cx - st.mx; const realCy = cy - st.my;

      // 1. BLACK HOLE & ACCRETION DISK (Idle state)
      if (speed < 20) {
        ctx.save(); ctx.translate(realCx, realCy); ctx.rotate(st.time); ctx.scale(1, 0.3); // 3D Tilt effect
        
        // Disk Glow
        const diskGrad = ctx.createRadialGradient(0, 0, 60, 0, 0, 400);
        diskGrad.addColorStop(0, 'rgba(0,0,0,0)'); diskGrad.addColorStop(0.15, 'rgba(6, 182, 212, 0.8)'); diskGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)'); diskGrad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fillStyle = diskGrad; ctx.fill();
        
        // Accretion Particles sucking into Event Horizon
        if (accretionParticles.length < 150) {
          accretionParticles.push({ angle: Math.random() * Math.PI * 2, dist: Math.random() * 600 + 200, spd: Math.random() * 0.02 + 0.01, size: Math.random() * 2 + 0.5 });
        }
        ctx.fillStyle = '#fff';
        accretionParticles.forEach(p => {
          p.angle += p.spd; p.dist -= 2; // Suck in
          if (p.dist < 60) p.dist = 800; // Respawn far away
          ctx.beginPath(); ctx.arc(Math.cos(p.angle) * p.dist, Math.sin(p.angle) * p.dist, p.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();

        // Event Horizon (Absolute Black)
        ctx.beginPath(); ctx.arc(realCx, realCy, 60, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
        ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 30; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke(); ctx.shadowBlur = 0;
      }

      // 2. WORMHOLE TUNNEL (Warp state)
      if (speed > 50) {
        ctx.lineWidth = 2;
        for (let i = 0; i < 15; i++) {
          const z = (st.time * 2000 + i * 150) % 2000;
          if (z < 10) continue;
          const r = (3000 * 300) / z;
          ctx.beginPath(); ctx.arc(realCx, realCy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${1 - z/2000})`; ctx.stroke();
        }
      }

      // 3. STARS & LENSING
      ctx.globalCompositeOperation = 'screen';
      stars.forEach(star => {
        star.pz = star.z; star.z -= speed;
        if (star.z < 10) { star.x = (Math.random() - 0.5) * 5000; star.y = (Math.random() - 0.5) * 5000; star.z = 3000; star.pz = 3000; }
        
        let sx = star.x; let sy = star.y; const distSq = sx*sx + sy*sy;
        // Gravitational Lensing around Blackhole
        if (distSq < 500000 && star.z > 500 && speed < 10) {
          const force = 40000 / distSq; const invDist = 1 / Math.sqrt(distSq); sx += (sx * invDist) * force; sy += (sy * invDist) * force;
        }
        const projX = (sx * 500) / star.z + realCx; const projY = (sy * 500) / star.z + realCy;
        
        if (speed > 5) {
          const oldX = (sx * 500) / star.pz + realCx; const oldY = (sy * 500) / star.pz + realCy;
          ctx.lineWidth = Math.max(1, (3000 - star.z) / 400);
          ctx.beginPath(); ctx.moveTo(oldX - 2, oldY); ctx.lineTo(projX - 2, projY); ctx.strokeStyle = 'rgba(255, 0, 50, 0.8)'; ctx.stroke(); // RGB Split Shift
          ctx.beginPath(); ctx.moveTo(oldX + 2, oldY); ctx.lineTo(projX + 2, projY); ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(oldX, oldY); ctx.lineTo(projX, projY); ctx.strokeStyle = '#fff'; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(projX, projY, Math.max(0.3, (3000 - star.z) / 400), 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${1 - star.z/3000})`; ctx.fill();
        }
      });

      // 4. SHOCKWAVES (Deploy Explosion)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        ctx.beginPath(); ctx.arc(realCx, realCy, sw.r, 0, Math.PI * 2);
        ctx.lineWidth = 10 * sw.alpha; ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.stroke();
        sw.r += 30; sw.alpha -= 0.02;
        if (sw.alpha <= 0) shockwaves.splice(i, 1);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      reqId = requestAnimationFrame(animate);
    };
    animate();
    
    // Auto show gate logic
    const t = setTimeout(() => setShowGate(true), 6000);
    return () => { window.removeEventListener('resize', updateSize); window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(reqId); clearTimeout(t); };
  }, [osBooted]);

  const activeData = activeShip !== null ? fleet.find(f => f.id === activeShip) : null;

  if (!osBooted) return <BootTerminal onComplete={() => setOsBooted(true)} />;

  return (
    <main className={`min-h-screen bg-[#010103] relative overflow-hidden font-sans text-slate-200 cursor-crosshair select-none transition-all duration-[1200ms] ${warpSpeed ? 'scale-[1.1] blur-[1px] brightness-125' : 'scale-100'} ${deployState !== 'idle' ? 'hue-rotate-[15deg] saturate-150' : ''}`}>
      
      {/* GOD-TIER CSS (CRT & GLITCH & 3D) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
        .cyber-clip { clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px); }
        .cyber-clip-sm { clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
        .mask-image-y { mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
        
        /* CRT Post-Processing Overlay */
        .crt-overlay { pointer-events: none; position: fixed; inset: 0; z-index: 9999; background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.6) 100%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 100% 100%, 100% 3px; mix-blend-mode: overlay; }
        
        .scanline { background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent); animation: scan-vert 4s ease-in-out infinite alternate; will-change: top; }
        @keyframes scan-vert { 0% { top: -10%; } 100% { top: 110%; } }
        
        .warp-shake { animation: shake-violent 0.1s infinite; will-change: transform; }
        @keyframes shake-violent { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 3px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(-2px, -3px); } }
        
        /* Glitch Transitions */
        .glitch-trans { animation: glitch-trans-anim 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        @keyframes glitch-trans-anim { 0% { clip-path: inset(10% 0 80% 0); transform: translate(-5px, 2px); } 20% { clip-path: inset(80% 0 10% 0); transform: translate(5px, -2px); } 40% { clip-path: inset(40% 0 40% 0); transform: translate(5px, 2px); } 60% { clip-path: inset(20% 0 60% 0); transform: translate(-5px, -2px); } 80% { clip-path: inset(60% 0 20% 0); transform: translate(5px, 2px); } 100% { clip-path: inset(0 0 0 0); transform: translate(0); } }

        .orbital-sphere { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.08); top: 50%; left: 50%; transform-style: preserve-3d; will-change: transform; pointer-events:none; }
        .ring-x { width: 140%; height: 140%; animation: spin-x 10s linear infinite; border-top: 2px solid var(--theme); }
        .ring-y { width: 160%; height: 160%; animation: spin-y 15s linear infinite reverse; border-right: 2px dashed var(--theme); }
        @keyframes spin-x { 100% { transform: translate(-50%, -50%) rotateX(60deg) rotateY(360deg) rotateZ(360deg); } }
        @keyframes spin-y { 100% { transform: translate(-50%, -50%) rotateX(360deg) rotateY(60deg) rotateZ(360deg); } }
        
        .transform-style-3d { transform-style: preserve-3d; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }

        /* === CINEMATIC SHIP SEQUENCE — 1.8s === */
        @keyframes shipFullSequence {
          0%   { transform: translateY(0) scale(1) rotate(0deg); opacity:1; }
          8%   { transform: translateY(20px) scale(.9) rotate(-3deg); opacity:1; } /* crouch */
          18%  { transform: translateY(-100px) scale(1.15) rotate(12deg); opacity:1; } /* rush up */
          25%  { transform: translateY(-60px) translateX(-30px) scale(1.05) rotate(-25deg); } /* dodge left */
          32%  { transform: translateY(-80px) translateX(35px) scale(1.08) rotate(18deg); } /* dodge right */
          42%  { transform: translateY(-130px) scale(1.2) rotate(360deg); opacity:1; } /* barrel roll 1 */
          55%  { transform: translateY(-100px) scale(1.1) rotate(720deg); opacity:1; } /* barrel roll 2 */
          68%  { transform: translateY(-160px) scale(.9) rotate(1080deg); opacity:.8; } /* barrel roll 3 */
          80%  { transform: translateY(-250px) scale(.5) rotate(1260deg); opacity:.4; } /* fly away */
          100% { transform: translateY(-500px) scale(.1) rotate(1440deg); opacity:0; } /* vanish */
        }
        .ship-rush-active { animation: shipFullSequence 1.8s cubic-bezier(.23,1,.32,1) forwards; }

        /* PARTICLE DEBRIS — flies outward */
        @keyframes particleBurst {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--px),var(--py)) scale(0); opacity:0; }
        }
        .particle-burst { animation: particleBurst .6s ease-out forwards; }

        /* ASTEROID RUSH — flies across screen */
        @keyframes asteroidRush {
          0%   { transform: translate(var(--ax), var(--ay)) rotate(0deg) scale(1); opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { transform: translate(calc(var(--ax) * -1), calc(var(--ay) * -1.5)) rotate(var(--ar)) scale(.3); opacity:0; }
        }
        .asteroid-rush { animation: asteroidRush .8s linear forwards; }

        /* IMPACT FLASH — full screen white flash */
        @keyframes impactFlashAnim {
          0%   { opacity:.8; }
          100% { opacity:0; }
        }
        .impact-flash { animation: impactFlashAnim .15s ease-out forwards; }

        /* BACKGROUND IMAGE LAYERS */
        .fleet-bg {
          background: url('/images/system/space-fleet.png') center/cover no-repeat;
          animation: parallaxDrift 30s ease-in-out infinite alternate;
        }
        .gate-bg {
          background: url('/images/system/warp-gate.png') center/cover no-repeat;
          animation: gatePulse 4s ease-in-out infinite alternate;
        }
        .bridge-bg {
          background: url('/images/system/command-bridge.png') center/cover no-repeat;
          animation: bridgeGlow 6s ease-in-out infinite alternate;
        }
        @keyframes parallaxDrift {
          0%   { transform: scale(1.05) translate(-1%, -1%); }
          50%  { transform: scale(1.08) translate(1%, 0%); }
          100% { transform: scale(1.1) translate(-0.5%, 1%); }
        }
        @keyframes gatePulse {
          0%   { opacity: 0.3; transform: scale(1) rotate(0deg); filter: brightness(1) hue-rotate(0deg); }
          50%  { opacity: 0.5; transform: scale(1.02) rotate(1deg); filter: brightness(1.3) hue-rotate(5deg); }
          100% { opacity: 0.3; transform: scale(1) rotate(-1deg); filter: brightness(1) hue-rotate(-5deg); }
        }
        @keyframes bridgeGlow {
          0%   { filter: brightness(0.8) saturate(1.2); transform: scale(1); }
          50%  { filter: brightness(1.1) saturate(1.4); transform: scale(1.02); }
          100% { filter: brightness(0.8) saturate(1.2); transform: scale(1); }
        }
        /* Floating ship card enhancement */
        .ship-card-glow {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ship-card-glow:hover {
          transform: scale(1.05) translateY(-8px);
        }
      `}} />

      <div className="crt-overlay" />
      <FPSMonitor />

      {/* CORE CANVAS — 2D Blackhole Engine */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${warpSpeed ? 'warp-shake' : ''}`}>
        <canvas ref={canvasRef} className="absolute inset-0 block" />
      </div>

      {/* 3D FLEET LAYER — Ships bay lơ lửng */}
      {osBooted && (
        <div className={`fixed inset-0 z-[1] pointer-events-auto ${warpSpeed ? 'warp-shake' : ''} ${activeShip !== null ? 'pointer-events-none' : ''}`}>
          <DynamicFleetSystem3D
            fleet={fleet.map(s => ({ id: s.id, shape: s.shape as any, hex: s.hex, shipName: s.shipName, code: s.code }))}
            activeShip={activeShip}
            rushingShipId={rushingShipId}
            warpSpeed={warpSpeed}
            onEngage={engageShip}
            playSfx={(type) => sfx?.play(type as any)}
          />
        </div>
      )}

      {/* IMPACT FLASH OVERLAY */}
      {impactFlash && <div className="fixed inset-0 z-[9998] bg-white impact-flash pointer-events-none" />}

      {/* ============================================================================ */}
      {/* LAYER 1: IDLE HUB */}
      {/* ============================================================================ */}

      {/* CINEMATIC BACKGROUND IMAGES */}
      <div className={`fixed inset-0 z-[0] pointer-events-none transition-opacity duration-1000 ${activeShip !== null || warpSpeed ? 'opacity-0' : 'opacity-100'}`}>
        {/* Space Fleet panorama */}
        <div className="absolute inset-0 fleet-bg opacity-40 mix-blend-screen" />
        {/* Warp Gate at center */}
        <div className="absolute inset-0 gate-bg mix-blend-screen" />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(1,1,3,0.9) 70%)' }} />
      </div>

      <div className={`relative z-20 w-full min-h-screen flex flex-col transition-all duration-700 ease-in-out ${activeShip !== null || warpSpeed ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100 glitch-trans'}`}>
        
        <header className="p-6 md:p-12 flex justify-between items-start">
          <Link href="/" className="group flex items-center gap-4 cyber-clip bg-[#02050f]/60 backdrop-blur-md border border-white/10 px-6 py-2 hover:border-cyan-500 hover:bg-cyan-950/40 transition-colors" onMouseEnter={() => sfx?.play('hover')} onClick={() => sfx?.play('click')}>
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" /> <span className="font-mono text-xs tracking-widest text-slate-300 uppercase font-bold hidden sm:inline">Trang Chủ</span>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">Trạm Tốc Độ Cao</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center pb-10 w-full px-4 md:px-8 mt-8">
          
          {/* GLASSMORPHISM STATION HUB */}
          <div className="relative w-full max-w-[1300px] rounded-[2.5rem] border border-white/10 bg-[#040814]/40 backdrop-blur-xl p-8 md:p-14 shadow-[0_0_80px_rgba(0,242,254,0.07)] overflow-hidden">
            {/* Tech accents for the glass frame */}
            <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-cyan-500 to-transparent" />
            <div className="absolute bottom-0 right-0 w-32 h-1 bg-gradient-to-l from-purple-500 to-transparent" />
            <div className="absolute top-0 left-0 w-1 h-32 bg-gradient-to-b from-cyan-500 to-transparent" />
            <div className="absolute bottom-0 right-0 w-1 h-32 bg-gradient-to-t from-purple-500 to-transparent" />
            
            {/* Grid pattern background inside frame */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <div className="relative z-10 text-center mb-12 md:mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                TRẠM CHỈ HUY
              </h2>
              <div className="mt-4 flex items-center justify-center gap-3 font-mono text-cyan-400 text-sm md:text-base tracking-[0.2em]">
                <Target className="w-4 h-4 animate-pulse text-red-500" /> 
                <span>KÍCH HOẠT PHI THUYỀN ĐỂ KHÁM PHÁ</span>
                <Target className="w-4 h-4 animate-pulse text-red-500" />
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 w-full mx-auto">
            {fleet.map((ship, idx) => {
              const isRushing = rushingShipId === ship.id;
              const isOtherRushing = rushingShipId !== null && rushingShipId !== ship.id;
              return (
                <div key={ship.id} className={`flex justify-center transition-all duration-500 ${isOtherRushing ? 'scale-90 opacity-10 blur-sm pointer-events-none' : ''}`}>
                  <div
                    onClick={() => engageShip(ship.id)}
                    onPointerEnter={() => sfx?.play('hover')}
                    className={`group relative cursor-crosshair transition-all duration-300 ${isRushing ? '' : 'hover:scale-105 hover:z-50'}`}
                    style={{ '--theme': ship.hex } as React.CSSProperties}
                  >
                    {/* SPACESHIP BODY */}
                    <div className={`relative w-[160px] h-[200px] md:w-[200px] md:h-[250px] ${isRushing ? 'ship-rush-active' : ''}`} style={{ filter: `drop-shadow(0 0 ${isRushing ? 60 : 18}px ${ship.hex})`, transition: 'filter .3s' }}>
                      {/* Impact Particles — 40 debris pieces with mixed colors */}
                      {isRushing && impactParticles.map(p => (
                        <div key={p.id} className="particle-burst" style={{ position:'absolute', top:'40%', left:'50%', width:p.s, height:p.s, borderRadius: p.id % 3 === 0 ? '2px' : '50%', background:p.c, boxShadow:`0 0 10px ${p.c}`, '--px':`${p.x}px`, '--py':`${p.y}px`, animationDelay:`${p.d}s` } as React.CSSProperties} />
                      ))}
                      {/* Asteroids — rocky debris flying across */}
                      {isRushing && asteroids.map(a => (
                        <div key={a.id} className="asteroid-rush" style={{ position:'absolute', top:'30%', left:'50%', width:a.s, height:a.s, background:'linear-gradient(135deg,#888 0%,#333 100%)', borderRadius:'30% 70% 50% 40%', boxShadow:'inset -2px -2px 4px rgba(0,0,0,.6), 0 0 12px rgba(255,150,50,.3)', '--ax':`${a.x}px`, '--ay':`${a.y}px`, '--ar':`${a.r}deg`, animationDelay:`${a.d}s`, zIndex:30 } as React.CSSProperties} />
                      ))}
                      {/* Ship Hull */}
                      <div className="w-full h-full relative overflow-hidden" style={{ clipPath: getClipPath(ship.shape) }}>
                        <div className="absolute inset-0" style={{ background:`linear-gradient(180deg,${ship.hex}15 0%,#000 50%,${ship.hex}08 100%)`, border:`2px solid ${ship.hex}50`, borderRadius:16 }} />
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft:'30px solid transparent', borderRight:'30px solid transparent', borderBottom:`50px solid ${ship.hex}40` }} />
                        <div className="absolute top-[45%] left-2 w-2 h-16 rounded-full -skew-y-12 rotate-12" style={{ background:`${ship.hex}30` }} />
                        <div className="absolute top-[45%] right-2 w-2 h-16 rounded-full skew-y-12 -rotate-12" style={{ background:`${ship.hex}30` }} />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity animate-pulse" style={{ background:ship.hex }} />
                        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:6px_6px]" />
                      </div>
                      {/* TEXT ON SHIP */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 z-20 pointer-events-none">
                        <div className="text-sm md:text-base font-black tracking-wider leading-tight text-white uppercase" style={{ textShadow:`0 2px 12px ${ship.hex}80` }}>
                          {ship.shipName}
                        </div>
                        <div className="mt-1.5 text-[9px] md:text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-white/80">{ship.title}</div>
                        <div className="mt-2.5 text-[8px] md:text-[9px] font-mono px-3 py-1 rounded-full border border-white/20" style={{ color:ship.hex, background:'rgba(0,0,0,.7)', boxShadow:`0 0 8px ${ship.hex}30` }}>
                          {ship.code}
                        </div>
                      </div>
                      {/* Ship Icon */}
                      {(() => { const ShipIcon = ship.icon as React.ComponentType<any>; return <ShipIcon className="absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-5 text-white/70 z-20 group-hover:-translate-y-1 transition-transform" strokeWidth={1.5} />; })()}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================================ */}
      {/* LAYER 2: COMMAND HUD (ACTIVE STATE) */}
      {/* ============================================================================ */}
      {activeData && !warpSpeed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-10 glitch-trans">
          {/* Command Bridge Background */}
          <div 
            className="absolute inset-0 bridge-bg" 
            style={{ 
              backgroundImage: `url(${[
                '/images/system/ship_ai_bg.png',
                '/images/system/ship_web_bg.png',
                '/images/system/ship_prompt_bg.png',
                '/images/system/ship_physics_bg.png',
                '/images/system/ship_data_bg.png',
                '/images/system/ship_security_bg.png'
              ][activeData.id] || '/images/system/command-bridge.png'})`
            }} 
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute inset-0 opacity-20 mix-blend-color" style={{ backgroundColor: activeData.hex }} />
          
          <button onClick={abortMission} onMouseEnter={() => sfx?.play('hover')} className={`absolute top-6 left-6 md:top-10 md:left-10 cyber-clip-sm bg-cyan-950/40 border border-cyan-500/50 px-6 py-3 flex items-center gap-3 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors z-[100] group backdrop-blur-md ${deployState !== 'idle' ? 'hidden' : ''}`}>
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> <span className="font-mono text-sm tracking-[0.2em] font-bold">QUAY LẠI HẠM ĐỘI</span>
          </button>

          <div className={`w-full max-w-[1600px] h-full flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 perspective-[1500px] transition-all duration-700 ${deployState === 'deployed' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
            
            {/* TRÁI: METRICS */}
            <div className={`hidden lg:flex flex-col w-[300px] h-[75vh] justify-between transition-transform duration-500 ${deployState !== 'idle' ? '-translate-x-20 opacity-0 pointer-events-none' : ''}`} style={{ '--theme': activeData.hex } as React.CSSProperties}>
              <div className="cyber-clip bg-[#01030a]/80 backdrop-blur-md border border-white/10 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform-style-3d rotate-y-[10deg]">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4"><ShieldAlert className="w-6 h-6 animate-pulse" style={{ color: activeData.hex }} /><span className="font-mono text-sm tracking-widest text-white/70">CHỈ SỐ HỆ THỐNG</span></div>
                <div className="space-y-6">
                  {['TỐC ĐỘ', 'LÕI XỬ LÝ', 'TRÍ TUỆ', 'NHIỆT ĐỘ'].map((lbl, i) => (
                    <div key={lbl}>
                      <div className="flex justify-between font-mono text-sm text-white/70 tracking-widest mb-2.5"><span className="font-bold">{lbl}</span> <span style={{ color: activeData.hex, fontWeight: 'bold', fontSize: '1rem' }}><ScrambleText text={`${activeData.stats[i]}%`} active={deployState==='idle'} delay={300} /></span></div>
                      <div className="h-2.5 w-full bg-white/5 cyber-clip-sm overflow-hidden"><div className="h-full transition-all duration-[1000ms] ease-out shadow-[0_0_10px_currentColor]" style={{ width: `${activeData.stats[i]}%`, backgroundColor: activeData.hex, transitionDelay: `${i*0.1}s` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GIỮA: MOUSE-TRACKED PARALLAX HOLOGRAM */}
            <div className="flex-1 flex flex-col items-center justify-center relative pointer-events-none">
              <div className="orbital-sphere ring-x hidden md:block opacity-30" style={{ '--theme': deployState !== 'idle' ? '#ff0000' : activeData.hex } as React.CSSProperties} />
              <div className="orbital-sphere ring-y hidden md:block opacity-30" style={{ '--theme': deployState !== 'idle' ? '#ff0000' : activeData.hex } as React.CSSProperties} />
              
              <InteractiveHologram icon={activeData.icon} color={deployState !== 'idle' ? '#ff0000' : activeData.hex} />
              
              <div className="px-12 py-5 bg-black/80 border-y-2 cyber-clip-sm flex flex-col items-center text-center transition-colors duration-300 backdrop-blur-md" style={{ borderColor: deployState !== 'idle' ? '#ff0000' : activeData.hex }}>
                <span className="text-sm font-mono tracking-widest uppercase text-white/60 mb-2 flex items-center gap-2">
                  {deployState === 'idle' ? <><Target className="w-3.5 h-3.5 text-red-500 animate-spin" /> ĐANG KẾT NỐI</> : <><AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-ping" /> ĐANG TẢI LÊN...</>}
                </span>
                <span className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white" style={{ textShadow: `0 0 20px ${deployState !== 'idle' ? 'red' : activeData.hex}` }}>
                  <ScrambleText text={activeData.title} active={true} delay={100} />
                </span>
              </div>
            </div>

            {/* PHẢI: DATA STREAM & ACTION */}
            <div className={`w-full lg:w-[480px] h-[75vh] relative transform-style-3d rotate-y-[-10deg] transition-transform duration-500 ${deployState !== 'idle' ? 'translate-x-20 opacity-0 pointer-events-none' : ''}`} style={{ '--theme': activeData.hex } as React.CSSProperties}>
              <div className="cyber-clip bg-[#01030a]/80 backdrop-blur-2xl border border-white/10 p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] h-full relative z-10 flex flex-col overflow-hidden">
                <MatrixRain color={activeData.hex} active={deployState === 'idle'} />
                <div className="absolute inset-0 w-full h-[10%] scanline pointer-events-none opacity-30 z-10" />

                <div className="mb-8 border-b border-white/10 pb-5 relative z-20">
                  <div className="flex items-center gap-3 mb-3 font-mono text-base tracking-widest uppercase" style={{ color: activeData.hex }}><Lock className="w-6 h-6 animate-pulse" /> DỮ LIỆU CHI TIẾT</div>
                  <h3 className="text-5xl font-black text-white uppercase tracking-widest drop-shadow-lg">{activeData.code}</h3>
                </div>

                <ul className="space-y-8 flex-1 relative z-20 overflow-y-auto pr-4 custom-scrollbar">
                  {activeData.items.map((item, i) => (
                    <li key={i} className="flex gap-5 items-start group">
                      <div className="mt-2.5 w-3 h-3 shrink-0 bg-white/20 cyber-clip-sm group-hover:scale-150 transition-transform" style={{ backgroundColor: activeData.hex, boxShadow: `0 0 14px ${activeData.hex}` }} />
                      <span className="text-lg lg:text-xl text-cyan-50/95 leading-relaxed font-sans group-hover:text-white transition-colors font-semibold"><ScrambleText text={item} active={true} delay={400 + i * 150} /></span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-white/10 relative z-20">
                  <button 
                    onClick={abortMission} onMouseEnter={() => sfx?.play('hover')}
                    className="w-full cyber-clip-sm py-5 font-mono text-lg tracking-[0.3em] font-black uppercase text-white transition-all flex items-center justify-center gap-3 hover:scale-[1.02] hover:text-black" 
                    style={{ backgroundColor: 'transparent', border: `2px solid ${activeData.hex}`, boxShadow: `0 0 30px ${activeData.hex}60` }}
                  >
                    <ArrowLeft className="w-6 h-6" /> QUAY LẠI HẠM ĐỘI
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}