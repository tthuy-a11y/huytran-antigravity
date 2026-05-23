'use client';

import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { ArrowLeft, Zap, Database, GitBranch, Cpu, Target, Activity, Waves, Lock, X, Fingerprint, Orbit, Play, TerminalSquare, Rocket, ShieldAlert, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useFleetStore } from '@/store/useFleetStore';

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
import { audioEngine } from '@/lib/AudioEngine';

class AudioSystem {
  init() {
    audioEngine.init();
  }
  play(type: string, id?: number) {
    switch (type) {
      case 'type':
        audioEngine.playHoverTone(800, 0.05);
        break;
      case 'boot':
        audioEngine.playPowerUp();
        break;
      case 'hover':
        audioEngine.playHoverTone(600, 0.1);
        break;
      case 'riser':
        if (id !== undefined) audioEngine.playShipRiser(id);
        break;
      case 'click':
        audioEngine.playClickTone();
        break;
      case 'impact':
        if (id !== undefined) audioEngine.playShipImpact(id);
        else audioEngine.playSonicBoom();
        break;
      case 'warp':
        if (id !== undefined) audioEngine.playShipWarp(id);
        else audioEngine.playSonicBoom();
        break;
      case 'abort':
        audioEngine.stopAll();
        audioEngine.playPowerUp();
        break;
      case 'deploy':
        audioEngine.playPowerUp();
        break;
      case 'beep':
        audioEngine.playArrival();
        break;
      case 'portalWarp':
        audioEngine.playPortalWarp();
        break;
      case 'navWarp':
        audioEngine.playNavWarp();
        break;
    }
  }
  stopAll() {
    audioEngine.stopAll();
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
    <div className="fixed inset-0 z-[99999] bg-[#02040a] p-4 md:p-10 font-mono text-cyan-500 text-xs sm:text-sm md:text-lg flex flex-col justify-end pb-20">
      <div className="crt-overlay" />
      <div className="max-w-4xl mx-auto w-full max-h-[40vh] overflow-y-auto custom-scrollbar">
        <Fingerprint className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-8 opacity-50 animate-pulse text-cyan-700" />
        {lines.map((line, i) => (
          <div key={i} className="mb-2 uppercase tracking-widest leading-relaxed">{line}{i === lines.length - 1 ? <span className="animate-ping">_</span> : ''}</div>
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
  const [screenShake, setScreenShake] = useState<'light' | 'medium' | 'heavy' | ''>('');
  const [asteroids, setAsteroids] = useState<Array<{id:number;x:number;y:number;r:number;s:number;d:number}>>([]);
  const [portalTransitPhase, setPortalTransitPhase] = useState<'idle' | 'activate' | 'pull' | 'breach' | 'flash' | 'blackout'>('idle');
  const [navTransitPhase, setNavTransitPhase] = useState<'idle' | 'activate' | 'warp' | 'flash' | 'blackout'>('idle');
  const [navTransitTarget, setNavTransitTarget] = useState<string>('');
  const router = useRouter();
  const { setPhase: setFleetPhase } = useFleetStore();
  const portalTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const navTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Pre-compute particle positions to avoid Math.random() in render (prevents jank on re-renders)
  const portalVortexData = useMemo(() => 
    Array.from({length: 16}, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 200 + ((i * 137.508) % 1) * 400; // Golden angle distribution, stable
      const colors = ['#00ffff', '#fff', '#b026ff'];
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 4 + (((i * 7) % 11) / 11) * 8, // Deterministic pseudo-random
        color: colors[i % 3],
      };
    }), []);

  const portalStreakData = useMemo(() =>
    Array.from({length: 12}, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 300 + (((i * 13) % 17) / 17) * 500;
      return {
        width: 40 + (((i * 11) % 13) / 13) * 80,
        rotation: (angle * 180) / Math.PI,
        sx: Math.cos(angle) * dist,
        sy: Math.sin(angle) * dist,
        gradient: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? '#00ffff' : '#b026ff'}, white)`,
      };
    }), []);
  
  // Cleanup audio + portal timers on unmount to prevent sound bleed & memory leak
  useEffect(() => {
    return () => {
      sfx?.stopAll();
      portalTimerRefs.current.forEach(clearTimeout);
      portalTimerRefs.current = [];
      navTimerRefs.current.forEach(clearTimeout);
      navTimerRefs.current = [];
    };
  }, []);
  
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
    
    // 0ms: Riser & Init
    sfx?.play('click'); 
    sfx?.play('riser', id);
    setRushingShipId(id);

    // 1200ms: Light Shake
    setTimeout(() => {
      setScreenShake('light');
    }, 1200);

    // 2400ms: Medium Shake + Asteroids rush
    setTimeout(() => {
      setScreenShake('medium');
      // Number of asteroids based on ship
      const asteroidCount = id === 0 ? 4 : (id === 2 ? 12 : (id === 3 ? 15 : (id === 5 ? 6 : 8)));
      setAsteroids(Array.from({length:asteroidCount},(_,i)=>({ id:i, x:(Math.random()-.5)*800, y:-400-Math.random()*400, r:Math.random()*720, s:8+Math.random()*20, d:Math.random()*.1 })));
    }, 2400);

    // 3000ms: IMPACT! Flash + particles + sound
    setTimeout(() => {
      sfx?.play('impact', id); setImpactFlash(true);
      
      let particleCount = id === 2 ? 80 : (id === 5 ? 60 : 40);
      let pColor = id === 0 ? '#00f2fe' : (id === 5 ? '#ff007f' : shipColor);
      setImpactParticles(Array.from({length:particleCount},(_,i)=>({ id:i, x:(Math.random()-.5)*500, y:(Math.random()-.5)*500, s:Math.random()*8+2, d:Math.random()*.2, c: Math.random()>.5 ? pColor : '#fff' })));
      
      setTimeout(() => setImpactFlash(false), id === 5 ? 350 : 150); 
    }, 3000);

    // 4000ms: Warp drive engage
    setTimeout(() => {
      sfx?.play('warp', id); 
      setWarpSpeed(true); 
      setScreenShake('heavy');
      
      engineRef.current.targetSpeed = id === 3 ? 800 : (id === 2 ? 600 : 400); 
      setImpactParticles([]); setAsteroids([]);
      
      if (id === 0) engineRef.current.shockwaves.push({ r: 20, color: '#00f2fe', alpha: 1 });
      if (id === 4) engineRef.current.shockwaves.push({ r: 50, color: '#f5a623', alpha: 0.8 });
      if (id === 1) engineRef.current.shockwaves.push({ r: 10, color: '#b026ff', alpha: 1 }, { r: 60, color: '#fff', alpha: 0.5 });
      if (id === 3) engineRef.current.shockwaves.push({ r: 100, color: '#00ff87', alpha: 1 });
      
    }, 4000);

    // 5000ms: Arrive at HUD
    setTimeout(() => {
      setScreenShake('');
      setActiveShip(id); setWarpSpeed(false); setRushingShipId(null);
      engineRef.current.targetSpeed = 0.5;
    }, 5000);
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

  // ── PORTAL CINEMATIC TRANSIT — 3.5s SPEC ─────────────────────────────
  const handlePortalClick = useCallback(() => {
    if (portalTransitPhase !== 'idle') return;
    // Clear any previous timers
    portalTimerRefs.current.forEach(clearTimeout);
    portalTimerRefs.current = [];

    const pushTimer = (fn: () => void, ms: number) => {
      portalTimerRefs.current.push(setTimeout(fn, ms));
    };

    // 0ms: ACTIVATE — sound + portal grows, rings accelerate
    sfx?.play('portalWarp');
    setPortalTransitPhase('activate');
    setScreenShake('light');
    setFleetPhase('warping'); // Sync R3F canvas across pages

    // 600ms: PULL — star-pull + warp speed + accretion acceleration
    pushTimer(() => {
      setPortalTransitPhase('pull');
      setScreenShake('medium');
      setWarpSpeed(true);
      engineRef.current.targetSpeed = 800;
      // Star-pull: accretion particles rush inward faster
      engineRef.current.accretionParticles.forEach((p: any) => { p.spd *= 3; });
      // Spawn shockwaves
      engineRef.current.shockwaves.push(
        { r: 10, color: '#00ffff', alpha: 1 },
        { r: 30, color: '#fff', alpha: 0.6 }
      );
    }, 600);

    // 1800ms: BREACH — dimensional tear, heavy shake, triple shockwave
    pushTimer(() => {
      setPortalTransitPhase('breach');
      setScreenShake('heavy');
      engineRef.current.targetSpeed = 1200;
      engineRef.current.shockwaves.push(
        { r: 5, color: '#fff', alpha: 1 },
        { r: 80, color: '#00ffff', alpha: 0.8 },
        { r: 150, color: '#b026ff', alpha: 0.5 }
      );
    }, 1800);

    // 2500ms: FLASH — blinding white flash
    pushTimer(() => {
      setPortalTransitPhase('flash');
      setScreenShake('');
    }, 2500);

    // 3000ms: BLACKOUT — fade to black
    pushTimer(() => {
      setPortalTransitPhase('blackout');
      setWarpSpeed(false);
      engineRef.current.targetSpeed = 0.5;
    }, 3000);

    // 3500ms: NAVIGATE + phase arrival
    pushTimer(() => {
      setFleetPhase('arrival');
      router.push('/creative');
    }, 3500);
  }, [portalTransitPhase, router, setFleetPhase]);

  // ── NAV BUTTON CINEMATIC TRANSIT ─────────────────────────────────────
  const handleNavTransit = useCallback((href: string) => {
    if (navTransitPhase !== 'idle') return;
    navTimerRefs.current.forEach(clearTimeout);
    navTimerRefs.current = [];
    const pushTimer = (fn: () => void, ms: number) => {
      navTimerRefs.current.push(setTimeout(fn, ms));
    };

    // 0ms: ACTIVATE — sound + visual burst
    sfx?.play('navWarp');
    setNavTransitPhase('activate');
    setNavTransitTarget(href);
    setScreenShake('light');

    // 400ms: WARP — speed lines + shake
    pushTimer(() => {
      setNavTransitPhase('warp');
      setScreenShake('medium');
      setWarpSpeed(true);
      engineRef.current.targetSpeed = 600;
    }, 400);

    // 900ms: FLASH
    pushTimer(() => {
      setNavTransitPhase('flash');
      setScreenShake('');
    }, 900);

    // 1200ms: BLACKOUT
    pushTimer(() => {
      setNavTransitPhase('blackout');
      setWarpSpeed(false);
      engineRef.current.targetSpeed = 0.5;
    }, 1200);

    // 1600ms: NAVIGATE
    pushTimer(() => {
      router.push(href);
    }, 1600);
  }, [navTransitPhase, router]);

  // --- GOD-TIER CANVAS ENGINE (BLACKHOLE ACCRETION & WORMHOLE) ---
  useEffect(() => {
    if (!osBooted) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    const updateSize = () => { engineRef.current.width = canvas.width = window.innerWidth; engineRef.current.height = canvas.height = window.innerHeight; engineRef.current.cx = window.innerWidth / 2; engineRef.current.cy = window.innerHeight / 2; }; updateSize();
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        engineRef.current.rawX = e.touches[0].clientX; engineRef.current.rawY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        engineRef.current.rawX = (e as MouseEvent).clientX; engineRef.current.rawY = (e as MouseEvent).clientY;
      }
    };
    window.addEventListener('resize', updateSize); 
    window.addEventListener('mousemove', handleMouseMove as any, { passive: true });
    window.addEventListener('touchmove', handleMouseMove as any, { passive: true });
    window.addEventListener('touchstart', handleMouseMove as any, { passive: true });

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
    const t = setTimeout(() => setShowGate(true), 45000);
    return () => { 
      window.removeEventListener('resize', updateSize); 
      window.removeEventListener('mousemove', handleMouseMove as any); 
      window.removeEventListener('touchmove', handleMouseMove as any);
      window.removeEventListener('touchstart', handleMouseMove as any);
      cancelAnimationFrame(reqId); clearTimeout(t); 
    };
  }, [osBooted]);

  const activeData = activeShip !== null ? fleet.find(f => f.id === activeShip) : null;

  if (!osBooted) return <BootTerminal onComplete={() => setOsBooted(true)} />;

  return (
    <main className={`min-h-screen md:h-screen w-screen bg-[#010103] relative overflow-y-auto md:overflow-hidden font-sans text-slate-200 cursor-crosshair select-none transition-all duration-[1200ms] ${warpSpeed ? 'scale-[1.1] blur-[1px] brightness-125' : 'scale-100'} ${deployState !== 'idle' ? 'hue-rotate-[15deg] saturate-150' : ''}`}>
      
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

        /* SCREEN SHAKE CLASSES — GPU Accelerated */
        @keyframes shakeLight { 
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); } 
          25% { transform: translate3d(-2px, 2px, 0) rotate(0.5deg); } 
          75% { transform: translate3d(2px, -2px, 0) rotate(-0.5deg); } 
        }
        @keyframes shakeMedium { 
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); } 
          25% { transform: translate3d(-4px, 4px, 0) rotate(1deg); } 
          75% { transform: translate3d(4px, -4px, 0) rotate(-1deg); } 
        }
        @keyframes shakeHeavy { 
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); } 
          25% { transform: translate3d(-6px, 5px, 0) rotate(1.5deg); } 
          75% { transform: translate3d(5px, -6px, 0) rotate(-1.5deg); } 
        }
        .shake-light { animation: shakeLight 0.12s cubic-bezier(.36,.07,.19,.97) infinite; will-change: transform; backface-visibility: hidden; }
        .shake-medium { animation: shakeMedium 0.1s cubic-bezier(.36,.07,.19,.97) infinite; will-change: transform; backface-visibility: hidden; }
        .shake-heavy { animation: shakeHeavy 0.08s cubic-bezier(.36,.07,.19,.97) infinite; will-change: transform; backface-visibility: hidden; }

        /* === 6 DISTINCT CINEMATIC SHIP SEQUENCES — 5.0s === */
        @keyframes shipSeq-0 {
          0%, 48% { transform: translateY(0) scale(1); opacity:1; filter: contrast(1); }
          12%, 36% { transform: translateY(-3px) translateX(3px) scale(1.02); filter: contrast(1.5) hue-rotate(90deg); opacity: 0.8; }
          24% { transform: translateY(3px) translateX(-3px) scale(0.98); filter: contrast(1.5) hue-rotate(270deg); opacity: 1; }
          50%, 60% { transform: translateY(-30px) translateX(40px) scale(1.1) skewX(25deg); filter: contrast(2) hue-rotate(180deg); }
          65%, 75% { transform: translateY(-80px) translateX(-50px) scale(0.9) skewX(-25deg); filter: contrast(2) hue-rotate(-90deg); }
          82% { transform: translateY(-100px) scale(0.1); opacity:1; }
          90% { transform: translateY(-300px) scale(0.1, 8); opacity:0.5; }
          100% { transform: translateY(-600px) scale(0, 10); opacity:0; }
        }
        @keyframes shipSeq-1 {
          0%, 48% { transform: translateY(0) scale(1) rotate(0deg); box-shadow: 0 0 0px transparent; }
          24% { transform: translateY(-10px) scale(1.08) rotate(4deg); box-shadow: 0 0 40px rgba(176,38,255,0.4); }
          55% { transform: translateY(30px) scale(0.8) rotate(15deg); }
          75% { transform: translateY(-250px) translateX(150px) scale(1.5) rotate(-45deg); }
          85% { transform: translateY(-300px) translateX(200px) scale(1.8) rotate(-60deg); filter: brightness(2); }
          100% { transform: translateY(-600px) translateX(400px) scale(0.05) rotate(-180deg); opacity:0; filter: blur(10px); }
        }
        @keyframes shipSeq-2 {
          0%, 48% { transform: translateY(0) rotate(0deg); }
          24% { transform: translateY(-15px) rotate(15deg) scale(1.05); filter: drop-shadow(0 20px 30px #ff0844); }
          36% { transform: translateY(10px) rotate(-15deg) scale(1.05); filter: drop-shadow(0 -20px 30px #ff0844); }
          55% { transform: translateY(-100px) translateX(-120px) scale(1.2) rotate(360deg); }
          70% { transform: translateY(-200px) translateX(120px) scale(0.9) rotate(720deg); }
          85% { transform: translateY(-250px) translateX(0) scale(1.4, 0.8); }
          100% { transform: translateY(-800px) translateX(0) scale(0.5, 3); opacity:0; }
        }
        @keyframes shipSeq-3 {
          0%, 48% { transform: translateY(0) scale(1, 1); }
          40% { transform: translateY(50px) scale(1.15, 0.75); filter: drop-shadow(0 0 40px #00ff87); }
          60% { transform: translateY(-150px) scale(0.8, 1.8) translateX(40px); }
          75% { transform: translateY(-200px) scale(1.2, 1.2) translateX(-40px); }
          85% { transform: translateY(-250px) scale(1.1, 1.1) rotate(180deg); }
          100% { transform: translateY(-800px) scale(0.5) rotate(360deg); filter: blur(8px); opacity:0; }
        }
        @keyframes shipSeq-4 {
          0%, 48% { transform: translateY(0) scale(1, 1); filter: blur(0px); }
          24% { transform: translateY(20px) scale(1.1, 1.2); filter: blur(4px); }
          65% { transform: translateY(-150px) scale(0.3, 3); filter: blur(12px); opacity:0.8; }
          90% { transform: translateY(-300px) scale(0.1, 8); filter: blur(20px) brightness(2); opacity:0.5; }
          100% { transform: translateY(-1000px) scale(0, 15); filter: blur(30px) brightness(3); opacity:0; }
        }
        @keyframes shipSeq-5 {
          0% { transform: translateY(0) scale(1) rotate(0deg); filter: brightness(1); }
          48% { transform: translateY(0) scale(1.2) rotate(720deg); filter: brightness(2.5) drop-shadow(0 0 50px #ff007f); }
          65% { transform: translateY(30px) translateX(-40px) scale(1.3); filter: brightness(3) drop-shadow(0 0 80px #ff007f); }
          85% { transform: translateY(-200px) scale(1.1) rotate(0deg); }
          100% { transform: translateY(-900px) scale(0.8) rotate(0deg); opacity:0; }
        }
        
        .ship-rush-0 { animation: shipSeq-0 5.0s cubic-bezier(.23,1,.32,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }
        .ship-rush-1 { animation: shipSeq-1 5.0s cubic-bezier(.23,1,.32,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }
        .ship-rush-2 { animation: shipSeq-2 5.0s cubic-bezier(.23,1,.32,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }
        .ship-rush-3 { animation: shipSeq-3 5.0s cubic-bezier(.7,0,.3,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }
        .ship-rush-4 { animation: shipSeq-4 5.0s cubic-bezier(.4,0,.2,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }
        .ship-rush-5 { animation: shipSeq-5 5.0s cubic-bezier(.4,0,.2,1) forwards; will-change: transform, filter, opacity; backface-visibility: hidden; }

        /* PARTICLE DEBRIS — flies outward */
        @keyframes particleBurst {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--px),var(--py)) scale(0); opacity:0; }
        }
        .particle-burst { animation: particleBurst 1.2s ease-out forwards; }

        /* ASTEROID RUSH — flies across screen */
        @keyframes asteroidRush {
          0%   { transform: translate(var(--ax), var(--ay)) rotate(0deg) scale(1); opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { transform: translate(calc(var(--ax) * -1), calc(var(--ay) * -1.5)) rotate(var(--ar)) scale(.3); opacity:0; }
        }
        .asteroid-rush { animation: asteroidRush 1.6s linear forwards; }

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
          0%   { transform: scale(1.04) translate(-0.5%, -0.5%); }
          25%  { transform: scale(1.06) translate(0.3%, -0.3%); }
          50%  { transform: scale(1.08) translate(0.8%, 0.2%); }
          75%  { transform: scale(1.06) translate(-0.2%, 0.5%); }
          100% { transform: scale(1.04) translate(-0.5%, -0.5%); }
        }
        @keyframes gatePulse {
          0%   { opacity: 0.25; transform: scale(1); filter: brightness(1) hue-rotate(0deg); }
          25%  { opacity: 0.35; transform: scale(1.01); filter: brightness(1.1) hue-rotate(2deg); }
          50%  { opacity: 0.45; transform: scale(1.015) rotate(0.5deg); filter: brightness(1.25) hue-rotate(4deg); }
          75%  { opacity: 0.35; transform: scale(1.005) rotate(-0.3deg); filter: brightness(1.1) hue-rotate(1deg); }
          100% { opacity: 0.25; transform: scale(1); filter: brightness(1) hue-rotate(0deg); }
        }
        @keyframes bridgeGlow {
          0%   { filter: brightness(0.75) saturate(1.15); transform: scale(1); }
          25%  { filter: brightness(0.85) saturate(1.25); transform: scale(1.005); }
          50%  { filter: brightness(1.0) saturate(1.4); transform: scale(1.01); }
          75%  { filter: brightness(0.85) saturate(1.25); transform: scale(1.005); }
          100% { filter: brightness(0.75) saturate(1.15); transform: scale(1); }
        }
        /* Floating ship card enhancement */
        .ship-card-glow {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      filter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        .ship-card-glow:hover {
          transform: scale(1.04) translateY(-6px);
        }
        @keyframes fadeInPortal { 
          0% { opacity: 0; transform: scale(0.3) rotate(-5deg); filter: blur(10px); } 
          60% { opacity: 1; transform: scale(1.03) rotate(0.5deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); } 
        }
        .portal-enter { animation: fadeInPortal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes breathePortal { 
          0%, 100% { transform: scale(0.97); filter: brightness(1); } 
          50% { transform: scale(1.03); filter: brightness(1.3); } 
        }
        .portal-breathe { animation: breathePortal 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

        /* ═══════════════════════════════════════════════════════════════════
           PORTAL CINEMATIC TRANSIT — 5-PHASE VISUAL SPECTACLE
           ═══════════════════════════════════════════════════════════════════ */

        /* Phase 1: ACTIVATE — portal grows + rings spin faster + energy pulses */
        @keyframes portalActivate {
          0%   { transform: scale(1); filter: brightness(1) saturate(1); }
          30%  { transform: scale(1.4) rotate(5deg); filter: brightness(2) saturate(2) drop-shadow(0 0 60px cyan); }
          60%  { transform: scale(1.8) rotate(-3deg); filter: brightness(3) saturate(3) drop-shadow(0 0 100px white); }
          100% { transform: scale(2.5) rotate(0deg); filter: brightness(4) saturate(4) drop-shadow(0 0 150px cyan); }
        }
        .portal-activate {
          animation: portalActivate 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          will-change: transform, filter;
        }

        /* Single continuous portal scale animation: activate(0-0.6s) → grow(0.6-1.8s) → breach(1.8-2.5s) */
        @keyframes portalFullSequence {
          0%   { transform: scale(1); filter: brightness(1) saturate(1); }
          17%  { transform: scale(2.5) rotate(0deg); filter: brightness(4) saturate(4) drop-shadow(0 0 150px cyan); }
          35%  { transform: scale(5); filter: brightness(4.5) drop-shadow(0 0 180px white); }
          51%  { transform: scale(8); filter: brightness(5) drop-shadow(0 0 200px white); }
          60%  { transform: scale(12) rotate(10deg); filter: brightness(8) hue-rotate(90deg); }
          71%  { transform: scale(18) rotate(-5deg); filter: brightness(10) hue-rotate(180deg); }
          85%  { transform: scale(25); filter: brightness(12) hue-rotate(270deg); }
          100% { transform: scale(35); filter: brightness(15) hue-rotate(360deg); opacity: 0.8; }
        }
        .portal-full-sequence {
          animation: portalFullSequence 3s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          will-change: transform, filter, opacity;
          contain: layout style;
        }
        @keyframes breachGlitch {
          0%, 100% { clip-path: inset(0); transform: translateX(0); }
          10% { clip-path: inset(15% 0 60% 0); transform: translateX(-8px) skewX(2deg); }
          20% { clip-path: inset(50% 0 20% 0); transform: translateX(6px) skewX(-3deg); }
          30% { clip-path: inset(5% 0 80% 0); transform: translateX(-4px) skewX(1deg); }
          40% { clip-path: inset(70% 0 10% 0); transform: translateX(10px) skewX(-2deg); }
          50% { clip-path: inset(20% 0 40% 0); transform: translateX(-6px); }
          60% { clip-path: inset(0); transform: translateX(0); }
        }
        .breach-glitch { animation: breachGlitch 0.8s steps(1) infinite; }

        /* Chromatic aberration overlay */
        @keyframes chromaticShift {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-6px, 3px); }
          50%  { transform: translate(4px, -2px); }
          75%  { transform: translate(-3px, -4px); }
          100% { transform: translate(5px, 2px); }
        }
        .chromatic-red {
          position: fixed; inset: 0; z-index: 9996;
          background: rgba(255, 0, 0, 0.12);
          mix-blend-mode: screen;
          animation: chromaticShift 0.15s linear infinite;
          pointer-events: none;
          will-change: transform;
        }
        .chromatic-cyan {
          position: fixed; inset: 0; z-index: 9996;
          background: rgba(0, 255, 255, 0.12);
          mix-blend-mode: screen;
          animation: chromaticShift 0.15s linear infinite reverse;
          pointer-events: none;
          will-change: transform;
        }

        /* Phase 4: FLASH — blinding white explosion */
        @keyframes portalFlash {
          0%   { opacity: 0; visibility: visible; }
          10%  { opacity: 1; }
          60%  { opacity: 1; }
          100% { opacity: 0.95; }
        }
        .portal-flash-layer {
          position: fixed; inset: 0; z-index: 9999;
          background: radial-gradient(circle at 30% 30%, white, rgba(0,255,255,0.5), white);
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          will-change: opacity;
        }
        .portal-flash-layer.active {
          animation: portalFlash 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          visibility: visible;
        }

        /* Phase 5: BLACKOUT — smooth fade to absolute black */
        @keyframes portalBlackout {
          0%   { opacity: 0; visibility: visible; }
          100% { opacity: 1; }
        }
        .portal-blackout-layer {
          position: fixed; inset: 0; z-index: 99999;
          background: #000;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          will-change: opacity;
        }
        .portal-blackout-layer.active {
          animation: portalBlackout 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          visibility: visible;
        }

        /* Chromatic layers — always mounted, hidden by default */
        .chromatic-layer {
          position: fixed; inset: 0; z-index: 9996;
          mix-blend-mode: screen;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          will-change: transform;
          transition: opacity 0.15s ease;
        }
        .chromatic-layer.active {
          opacity: 1;
          visibility: visible;
        }
        .chromatic-layer.red {
          background: rgba(255, 0, 0, 0.12);
          animation: chromaticShift 0.15s linear infinite;
        }
        .chromatic-layer.cyan {
          background: rgba(0, 255, 255, 0.12);
          animation: chromaticShift 0.15s linear infinite reverse;
        }

        /* Pull darkening overlay — always mounted */
        .portal-darken-layer {
          position: fixed; inset: 0; z-index: 95;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.4s ease, background 0.4s ease;
          will-change: opacity;
        }
        .portal-darken-layer.pull {
          opacity: 1;
          visibility: visible;
          background: radial-gradient(circle at 30% 30%, transparent 10%, rgba(0,0,0,0.4) 70%);
        }
        .portal-darken-layer.breach {
          opacity: 1;
          visibility: visible;
          background: radial-gradient(circle at 30% 30%, transparent 10%, rgba(0,0,0,0.8) 70%);
        }

        /* Glitch overlay — always mounted */
        .portal-glitch-layer {
          position: fixed; inset: 0; z-index: 9997;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          background: linear-gradient(transparent 30%, rgba(0,255,255,0.05) 30.5%, transparent 31%, transparent 69%, rgba(176,38,255,0.05) 69.5%, transparent 70%);
          background-size: 100% 4px;
        }
        .portal-glitch-layer.active {
          opacity: 1;
          visibility: visible;
          animation: breachGlitch 0.8s steps(1) infinite;
        }

        /* Vortex particle spiral */
        @keyframes vortexSpin {
          0%   { transform: rotate(0deg) scale(1); opacity: 0.8; }
          50%  { transform: rotate(360deg) scale(0.3); opacity: 1; }
          100% { transform: rotate(720deg) scale(0); opacity: 0; }
        }
        .vortex-particle {
          position: absolute;
          border-radius: 50%;
          animation: vortexSpin 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Energy streaks rushing to center */
        @keyframes energyStreak {
          0%   { transform: translateX(var(--sx)) translateY(var(--sy)) scaleX(1); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateX(0) translateY(0) scaleX(3); opacity: 0; }
        }
        .energy-streak {
          position: absolute;
          height: 2px;
          border-radius: 2px;
          animation: energyStreak 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* 3D FLOATING ANIMATIONS */
        @keyframes titleFloat {
          0%   { transform: rotateX(2deg) rotateY(-1.5deg) translateY(0px); }
          15%  { transform: rotateX(1.5deg) rotateY(0deg) translateY(-3px); }
          30%  { transform: rotateX(0.5deg) rotateY(1.5deg) translateY(-6px); }
          45%  { transform: rotateX(-0.5deg) rotateY(2.5deg) translateY(-8px); }
          60%  { transform: rotateX(-1.5deg) rotateY(1deg) translateY(-5px); }
          75%  { transform: rotateX(-0.5deg) rotateY(-1.5deg) translateY(-3px); }
          90%  { transform: rotateX(1deg) rotateY(-2deg) translateY(-1px); }
          100% { transform: rotateX(2deg) rotateY(-1.5deg) translateY(0px); }
        }
        @keyframes hubFloat {
          0%   { transform: rotateX(1.2deg) rotateY(0deg) translateY(0px); }
          20%  { transform: rotateX(0.8deg) rotateY(0.5deg) translateY(-2px); }
          40%  { transform: rotateX(0.3deg) rotateY(0.7deg) translateY(-4px); }
          60%  { transform: rotateX(-0.2deg) rotateY(0deg) translateY(-3px); }
          80%  { transform: rotateX(0.5deg) rotateY(-0.5deg) translateY(-1px); }
          100% { transform: rotateX(1.2deg) rotateY(0deg) translateY(0px); }
        }
        @keyframes titleScanline {
          0%   { top: -10%; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes titleGlitch {
          0%, 92%, 100% { clip-path: inset(0); transform: translateX(0); opacity: 0.1; }
          93% { clip-path: inset(20% 0 60% 0); transform: translateX(-3px); opacity: 0.15; }
          95% { clip-path: inset(50% 0 10% 0); transform: translateX(2px); opacity: 0.12; }
          97% { clip-path: inset(10% 0 70% 0); transform: translateX(-1px); opacity: 0.08; }
          99% { clip-path: inset(60% 0 20% 0); transform: translateX(3px); opacity: 0.1; }
        }
        @keyframes ringOrbit {
          0%   { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes energyPulse {
          0%   { box-shadow: 0 0 15px rgba(0,242,254,0.15), inset 0 0 15px rgba(0,242,254,0.03); }
          25%  { box-shadow: 0 0 30px rgba(0,242,254,0.25), inset 0 0 25px rgba(0,242,254,0.05); }
          50%  { box-shadow: 0 0 50px rgba(0,242,254,0.4), 0 0 100px rgba(0,242,254,0.1), inset 0 0 35px rgba(0,242,254,0.08); }
          75%  { box-shadow: 0 0 30px rgba(0,242,254,0.25), inset 0 0 25px rgba(0,242,254,0.05); }
          100% { box-shadow: 0 0 15px rgba(0,242,254,0.15), inset 0 0 15px rgba(0,242,254,0.03); }
        }
        /* GPU acceleration hints for smooth compositing */
        .glitch-trans, .crt-overlay, .fleet-bg, .gate-bg, .bridge-bg {
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* ═══════════════════════════════════════════════════════════════════
           NAV BUTTON — CINEMATIC 3D HOLOGRAPHIC PANELS
           ═══════════════════════════════════════════════════════════════════ */
        @keyframes navPanelFloat {
          0%   { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
          25%  { transform: translateY(-8px) rotateY(2deg) rotateX(1deg); }
          50%  { transform: translateY(-4px) rotateY(-1deg) rotateX(-0.5deg); }
          75%  { transform: translateY(-10px) rotateY(-2deg) rotateX(1.5deg); }
          100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
        }
        @keyframes navOrbitalRing {
          0%   { transform: rotateX(75deg) rotateZ(0deg); }
          100% { transform: rotateX(75deg) rotateZ(360deg); }
        }
        @keyframes navOrbitalRing2 {
          0%   { transform: rotateX(60deg) rotateZ(0deg) rotateY(30deg); }
          100% { transform: rotateX(60deg) rotateZ(-360deg) rotateY(30deg); }
        }
        @keyframes navCoreRotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes navEnergyPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.15); }
        }
        @keyframes navScanline {
          0%   { transform: translateY(-20vh); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(20vh); opacity: 0; }
        }
        @keyframes navParticleOrbit {
          0%   { transform: rotate(0deg) translateX(var(--nav-orbit-r)) rotate(0deg); opacity: 0.8; }
          50%  { opacity: 1; }
          100% { transform: rotate(360deg) translateX(var(--nav-orbit-r)) rotate(-360deg); opacity: 0.8; }
        }
        @keyframes navActivatePulse {
          0%   { transform: scale(1); filter: brightness(1); }
          50%  { transform: scale(1.3); filter: brightness(3); }
          100% { transform: scale(0.8); filter: brightness(5); opacity: 0; }
        }
        @keyframes navWarpStretch {
          0%   { transform: scaleX(1) scaleY(1); filter: brightness(1); }
          100% { transform: scaleX(3) scaleY(0.3); filter: brightness(4); opacity: 0; }
        }
        .nav-panel-left {
          animation: navPanelFloat 6s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 800px;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          contain: layout style;
        }
        .nav-panel-right {
          animation: navPanelFloat 6s ease-in-out infinite 3s;
          transform-style: preserve-3d;
          perspective: 800px;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          contain: layout style;
        }
        .nav-panel-left:hover, .nav-panel-right:hover {
          animation-play-state: paused;
        }
        .nav-activate {
          animation: navActivatePulse 0.5s ease-out forwards !important;
          will-change: transform, filter, opacity;
        }
        .nav-warp-stretch {
          animation: navWarpStretch 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards !important;
          will-change: transform, filter, opacity;
        }

        /* Nav orbit elements — GPU-promoted */
        .nav-orbital-ring {
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          contain: layout style;
        }
        .nav-core-inner {
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Nav transit overlay layers */
        .nav-flash-layer {
          position: fixed; inset: 0; z-index: 9999;
          background: radial-gradient(circle at 50% 50%, white, rgba(0,200,255,0.5), white);
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          will-change: opacity;
        }
        .nav-flash-layer.active {
          animation: portalFlash 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          visibility: visible;
        }
        .nav-blackout-layer {
          position: fixed; inset: 0; z-index: 99999;
          background: #000;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          will-change: opacity;
        }
        .nav-blackout-layer.active {
          animation: portalBlackout 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          visibility: visible;
        }
      `}} />

      <div className="crt-overlay" />
      <FPSMonitor />

      {/* FIXED SIDE NAVIGATION BUTTONS — 3D HOLOGRAPHIC PANELS */}
      {osBooted && activeShip === null && !warpSpeed && (
        <>
          {/* ══════ LEFT: VŨ TRỤ GỐC ══════ */}
          <div
            className={`fixed bottom-6 left-4 md:bottom-auto md:left-6 md:top-[25%] md:-translate-y-1/2 z-[100] nav-panel-left cursor-pointer ${navTransitPhase === 'activate' && navTransitTarget === '/' ? 'nav-activate' : ''} ${navTransitPhase === 'warp' && navTransitTarget === '/' ? 'nav-warp-stretch' : ''}`}
            onClick={() => handleNavTransit('/')}
            onMouseEnter={() => sfx?.play('hover')}
          >
            <div className="group relative flex flex-col items-center gap-3">
              {/* Outer orbital system */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36" style={{ transformStyle: 'preserve-3d' }}>
                {/* Orbital ring 1 */}
                <div className="absolute inset-[-12px] md:inset-[-18px] rounded-full border border-cyan-400/30 nav-orbital-ring" style={{ animation: 'navOrbitalRing 8s linear infinite' }} />
                {/* Orbital ring 2 */}
                <div className="absolute inset-[-20px] md:inset-[-28px] rounded-full border border-cyan-300/15 border-dashed nav-orbital-ring" style={{ animation: 'navOrbitalRing2 12s linear infinite' }} />
                {/* Orbiting particle dots */}
                {[0, 1, 2].map(i => (
                  <div key={`orb-l-${i}`} className="absolute top-1/2 left-1/2 w-0 h-0 nav-orbital-ring" style={{ '--nav-orbit-r': `${48 + i * 16}px`, animation: `navParticleOrbit ${5 + i * 2}s linear infinite ${i * 0.8}s` } as React.CSSProperties}>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i === 0 ? 'bg-cyan-300' : i === 1 ? 'bg-white' : 'bg-blue-400'} shadow-[0_0_8px_currentColor]`} />
                  </div>
                ))}

                {/* Energy pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 nav-orbital-ring" style={{ animation: 'navEnergyPulse 3s ease-in-out infinite' }} />
                <div className="absolute inset-1 rounded-full border border-cyan-300/10 nav-orbital-ring" style={{ animation: 'navEnergyPulse 3s ease-in-out infinite 1s' }} />

                {/* Main core container */}
                <div className="absolute inset-0 rounded-full overflow-hidden border-2 md:border-[3px] border-cyan-400/70 bg-[#020810]/90 group-hover:border-cyan-200 group-hover:bg-cyan-950/60 transition-all duration-500 shadow-[0_0_40px_rgba(0,240,255,0.4),inset_0_0_30px_rgba(0,240,255,0.1)] group-hover:shadow-[0_0_80px_rgba(0,240,255,0.8),inset_0_0_50px_rgba(0,240,255,0.2)]">
                  {/* Conic gradient swirl */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(0,240,255,0.15),transparent,rgba(0,200,255,0.1),transparent)] mix-blend-screen nav-core-inner" style={{ animation: 'navCoreRotate 6s linear infinite' }} />
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.2)_0%,transparent_60%)] animate-pulse" />
                  {/* Scanline */}
                  <div className="absolute left-0 right-0 h-[1px] top-0 pointer-events-none bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent nav-core-inner" style={{ animation: 'navScanline 3s linear infinite' }} />
                  
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <ArrowLeft className="w-7 h-7 md:w-12 md:h-12 text-cyan-200 group-hover:text-white group-hover:-translate-x-3 transition-all duration-500 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
                      {/* Icon glow trail */}
                      <ArrowLeft className="absolute inset-0 w-7 h-7 md:w-12 md:h-12 text-cyan-400/30 blur-[6px] group-hover:-translate-x-3 transition-all duration-500" />
                    </div>
                  </div>

                  {/* Inner bright center point */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-cyan-200 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.8)] opacity-60 animate-pulse" />
                </div>

                {/* 3D depth shadow under the sphere */}
                <div className="absolute -bottom-2 md:-bottom-3 left-[10%] right-[10%] h-3 md:h-4 bg-cyan-500/10 rounded-full blur-lg" />
              </div>

              {/* Label with holographic style */}
              <div className="relative hidden sm:flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-[1px] bg-gradient-to-r from-transparent to-cyan-400/60" />
                  <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_cyan] animate-pulse" />
                  <div className="w-4 h-[1px] bg-gradient-to-l from-transparent to-cyan-400/60" />
                </div>
                <span className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-cyan-200/90 uppercase font-black drop-shadow-[0_0_12px_rgba(0,240,255,0.6)] group-hover:text-white group-hover:drop-shadow-[0_0_20px_rgba(0,240,255,1)] transition-all duration-300">Vũ Trụ Gốc</span>
                <span className="font-mono text-[7px] md:text-[8px] tracking-[0.3em] text-cyan-400/40 uppercase mt-0.5">ORIGIN UNIVERSE</span>
              </div>
            </div>
          </div>

          {/* ══════ RIGHT: HỆ HÀNH TINH ══════ */}
          <div
            className={`fixed bottom-6 right-4 md:bottom-auto md:right-6 md:top-[25%] md:-translate-y-1/2 z-[100] nav-panel-right cursor-pointer ${navTransitPhase === 'activate' && navTransitTarget === '/creative' ? 'nav-activate' : ''} ${navTransitPhase === 'warp' && navTransitTarget === '/creative' ? 'nav-warp-stretch' : ''}`}
            onClick={() => handleNavTransit('/creative')}
            onMouseEnter={() => sfx?.play('hover')}
          >
            <div className="group relative flex flex-col items-center gap-3">
              {/* Outer orbital system */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36" style={{ transformStyle: 'preserve-3d' }}>
                {/* Orbital ring 1 */}
                <div className="absolute inset-[-12px] md:inset-[-18px] rounded-full border border-purple-400/30 nav-orbital-ring" style={{ animation: 'navOrbitalRing 8s linear infinite reverse' }} />
                {/* Orbital ring 2 */}
                <div className="absolute inset-[-20px] md:inset-[-28px] rounded-full border border-purple-300/15 border-dashed nav-orbital-ring" style={{ animation: 'navOrbitalRing2 12s linear infinite reverse' }} />
                {/* Orbiting particle dots */}
                {[0, 1, 2].map(i => (
                  <div key={`orb-r-${i}`} className="absolute top-1/2 left-1/2 w-0 h-0 nav-orbital-ring" style={{ '--nav-orbit-r': `${48 + i * 16}px`, animation: `navParticleOrbit ${5 + i * 2}s linear infinite reverse ${i * 0.8}s` } as React.CSSProperties}>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i === 0 ? 'bg-purple-300' : i === 1 ? 'bg-white' : 'bg-fuchsia-400'} shadow-[0_0_8px_currentColor]`} />
                  </div>
                ))}

                {/* Energy pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 nav-orbital-ring" style={{ animation: 'navEnergyPulse 3s ease-in-out infinite 0.5s' }} />
                <div className="absolute inset-1 rounded-full border border-purple-300/10 nav-orbital-ring" style={{ animation: 'navEnergyPulse 3s ease-in-out infinite 1.5s' }} />

                {/* Main core container */}
                <div className="absolute inset-0 rounded-full overflow-hidden border-2 md:border-[3px] border-purple-400/70 bg-[#0a0215]/90 group-hover:border-purple-200 group-hover:bg-purple-950/60 transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.4),inset_0_0_30px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_80px_rgba(168,85,247,0.8),inset_0_0_50px_rgba(168,85,247,0.2)]">
                  {/* Conic gradient swirl */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent,rgba(168,85,247,0.15),transparent,rgba(200,100,255,0.1),transparent)] mix-blend-screen nav-core-inner" style={{ animation: 'navCoreRotate 6s linear infinite reverse' }} />
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2)_0%,transparent_60%)] animate-pulse" />
                  {/* Scanline */}
                  <div className="absolute left-0 right-0 h-[1px] top-0 pointer-events-none bg-gradient-to-r from-transparent via-purple-300/50 to-transparent nav-core-inner" style={{ animation: 'navScanline 3s linear infinite 1.5s' }} />
                  
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <Orbit className="w-7 h-7 md:w-12 md:h-12 text-purple-200 group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                      {/* Icon glow trail */}
                      <Orbit className="absolute inset-0 w-7 h-7 md:w-12 md:h-12 text-purple-400/30 blur-[6px] group-hover:rotate-[360deg] transition-all duration-700" />
                    </div>
                  </div>

                  {/* Inner bright center point */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-purple-200 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] opacity-60 animate-pulse" />
                </div>

                {/* 3D depth shadow under the sphere */}
                <div className="absolute -bottom-2 md:-bottom-3 left-[10%] right-[10%] h-3 md:h-4 bg-purple-500/10 rounded-full blur-lg" />
              </div>

              {/* Label with holographic style */}
              <div className="relative hidden sm:flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-[1px] bg-gradient-to-r from-transparent to-purple-400/60" />
                  <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_4px_purple] animate-pulse" />
                  <div className="w-4 h-[1px] bg-gradient-to-l from-transparent to-purple-400/60" />
                </div>
                <span className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-purple-200/90 uppercase font-black drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] group-hover:text-white group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,1)] transition-all duration-300">Hệ Hành Tinh</span>
                <span className="font-mono text-[7px] md:text-[8px] tracking-[0.3em] text-purple-400/40 uppercase mt-0.5">PLANET SYSTEM</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SPACE PORTAL (Lựa chọn 1) — CINEMATIC TRANSIT */}
      {showGate && activeShip === null && (
        <div className={`fixed top-[10%] md:top-[15%] left-1/2 -translate-x-1/2 md:left-[8%] md:translate-x-0 z-[90] pointer-events-none flex items-center justify-center scale-50 md:scale-100 origin-top md:origin-center mt-12 md:mt-0 ${portalTransitPhase !== 'idle' ? 'portal-full-sequence' : ''}`} style={{ contain: 'layout' }}>
          <div className={`${portalTransitPhase === 'idle' ? 'portal-enter' : ''}`}>
            <div className={`${portalTransitPhase === 'idle' ? 'portal-breathe' : ''}`}>
              <button onClick={handlePortalClick} className={`pointer-events-auto group relative flex items-center justify-center hover:scale-110 transition-transform duration-700 bg-transparent border-none cursor-pointer ${portalTransitPhase !== 'idle' ? 'pointer-events-none' : ''}`}>
                {/* Outer blinding rings */}
                <div className={`absolute w-[250px] h-[250px] md:w-[320px] md:h-[320px] rounded-full border-[6px] border-transparent border-t-cyan-300 border-b-cyan-300 shadow-[0_0_50px_rgba(0,255,255,0.8)] ${portalTransitPhase !== 'idle' ? 'animate-[spin_0.3s_linear_infinite]' : 'animate-[spin_4s_linear_infinite]'}`} />
                <div className={`absolute w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full border-[4px] border-transparent border-l-yellow-300 border-r-white shadow-[0_0_50px_rgba(255,255,255,0.8)] ${portalTransitPhase !== 'idle' ? 'animate-[spin_0.2s_linear_infinite_reverse]' : 'animate-[spin_6s_linear_infinite_reverse]'}`} />
                <div className={`absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-[2px] border-white/50 ${portalTransitPhase !== 'idle' ? 'animate-[ping_0.5s_infinite]' : 'animate-[ping_3s_infinite]'}`} />
                
                {/* Extra energy rings during transit */}
                {portalTransitPhase !== 'idle' && (
                  <>
                    <div className="absolute w-[340px] h-[340px] md:w-[440px] md:h-[440px] rounded-full border-[3px] border-transparent border-t-purple-400 border-b-blue-400 animate-[spin_0.4s_linear_infinite] shadow-[0_0_80px_rgba(168,85,247,0.6)]" />
                    <div className="absolute w-[380px] h-[380px] md:w-[500px] md:h-[500px] rounded-full border-[2px] border-transparent border-l-cyan-200 border-r-purple-200 animate-[spin_0.25s_linear_infinite_reverse] shadow-[0_0_60px_rgba(0,255,255,0.4)]" />
                  </>
                )}
                
                {/* Bright Core */}
                <div className={`w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full flex items-center justify-center relative overflow-hidden border-4 border-cyan-200 bg-cyan-900/30 ${portalTransitPhase === 'idle' ? 'backdrop-blur-sm transition-shadow duration-700' : ''} ${portalTransitPhase !== 'idle' ? 'shadow-[0_0_200px_rgba(255,255,255,1),0_0_300px_rgba(0,255,255,0.8)]' : 'shadow-[0_0_120px_rgba(0,255,255,1)] group-hover:shadow-[0_0_200px_rgba(255,255,255,1)]'}`}>
                  {/* Event horizon swirl - super bright */}
                  <div className={`absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.8),rgba(0,255,255,0.8),transparent)] mix-blend-screen ${portalTransitPhase !== 'idle' ? 'animate-[spin_0.2s_linear_infinite]' : 'animate-[spin_1.5s_linear_infinite]'}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_10%,rgba(0,240,255,0.8)_40%,transparent_80%)] opacity-80 animate-pulse" />
                  
                  {/* Blinding Center */}
                  <div className={`bg-white rounded-full ${portalTransitPhase !== 'idle' ? 'w-24 h-24 md:w-32 md:h-32 shadow-[0_0_120px_white,0_0_180px_cyan,0_0_250px_yellow] animate-[ping_0.4s_infinite]' : 'w-16 h-16 md:w-20 md:h-20 shadow-[0_0_80px_white,0_0_120px_cyan,0_0_150px_yellow] animate-[ping_1.5s_infinite]'}`} />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pt-[110px] md:pt-[140px]">
                     <span className="font-mono text-[10px] md:text-xs tracking-[0.4em] font-black text-black bg-cyan-300/90 px-3 py-1 rounded mb-1 shadow-[0_0_15px_cyan]">CỔNG DỊCH CHUYỂN</span>
                     <span className="font-sans text-xl md:text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_black]" style={{ textShadow: '0 0 15px black, 0 0 30px black' }}>Hệ Hành Tinh</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Vortex particles during transit — pre-computed positions, no box-shadow for GPU perf */}
          {(portalTransitPhase === 'pull' || portalTransitPhase === 'breach') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {portalVortexData.map((p, i) => (
                <div key={i} className="vortex-particle" style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: `calc(50% + ${p.x}px)`,
                  top: `calc(50% + ${p.y}px)`,
                  background: p.color,
                  animationDelay: `${i * 0.06}s`,
                }} />
              ))}
            </div>
          )}

          {/* Energy streaks rushing to center — pre-computed, reduced count */}
          {portalTransitPhase === 'breach' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {portalStreakData.map((s, i) => (
                <div key={`streak-${i}`} className="energy-streak" style={{
                  width: `${s.width}px`,
                  left: '50%',
                  top: '50%',
                  background: s.gradient,
                  transform: `rotate(${s.rotation}deg)`,
                  '--sx': `${s.sx}px`,
                  '--sy': `${s.sy}px`,
                  animationDelay: `${i * 0.04}s`,
                } as React.CSSProperties} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ PORTAL TRANSIT OVERLAY EFFECTS — ALWAYS MOUNTED, CLASS-TOGGLED ═══ */}
      <div className={`chromatic-layer red ${portalTransitPhase === 'breach' ? 'active' : ''}`} />
      <div className={`chromatic-layer cyan ${portalTransitPhase === 'breach' ? 'active' : ''}`} />
      <div className={`portal-darken-layer ${portalTransitPhase === 'pull' ? 'pull' : ''} ${portalTransitPhase === 'breach' ? 'breach' : ''}`} />
      <div className={`portal-glitch-layer ${portalTransitPhase === 'breach' ? 'active' : ''}`} />
      <div className={`portal-flash-layer ${portalTransitPhase === 'flash' ? 'active' : ''}`} />
      <div className={`portal-blackout-layer ${portalTransitPhase === 'blackout' ? 'active' : ''}`} />

      {/* ═══ NAV TRANSIT OVERLAY EFFECTS — ALWAYS MOUNTED, CLASS-TOGGLED ═══ */}
      <div className={`nav-flash-layer ${navTransitPhase === 'flash' ? 'active' : ''}`} />
      <div className={`nav-blackout-layer ${navTransitPhase === 'blackout' ? 'active' : ''}`} />

      {/* CORE CANVAS — 2D Blackhole Engine */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${warpSpeed ? 'warp-shake' : ''} ${screenShake ? `shake-${screenShake}` : ''}`}>
        <canvas ref={canvasRef} className="absolute inset-0 block" />
      </div>

      {/* 3D FLEET LAYER — Ships bay lơ lửng */}
      {osBooted && (
        <div className={`fixed inset-0 z-[1] pointer-events-auto ${warpSpeed ? 'warp-shake' : ''} ${activeShip !== null ? 'pointer-events-none' : ''} ${screenShake ? `shake-${screenShake}` : ''}`}>
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

      <div className={`relative z-20 w-full h-full flex flex-col transition-all duration-700 ease-in-out ${activeShip !== null || warpSpeed ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100 glitch-trans'}`}>
        
        <header className="p-4 md:p-6 flex justify-between items-start">
          <Link href="/" className="group flex items-center gap-4 cyber-clip bg-[#02050f]/60 backdrop-blur-md border border-white/10 px-6 py-2 hover:border-cyan-500 hover:bg-cyan-950/40 transition-colors" onMouseEnter={() => sfx?.play('hover')} onClick={() => sfx?.play('click')}>
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" /> <span className="font-mono text-xs tracking-widest text-slate-300 uppercase font-bold hidden sm:inline">Trang Chủ</span>
          </Link>
          {/* === 3D HOLOGRAPHIC TITLE BANNER — CINEMATIC === */}
          <div className="text-right" style={{ perspective: '600px' }}>
            <div className="relative inline-block" style={{ transformStyle: 'preserve-3d', animation: 'titleFloat 5s ease-in-out infinite' }}>

              {/* LAYER 0: Orbital rings behind the panel */}
              <div className="absolute -inset-12 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[120%] h-[120%] rounded-full border border-cyan-500/15" style={{ animation: 'ringOrbit 12s linear infinite', transform: 'rotateX(70deg)' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[140%] h-[140%] rounded-full border border-purple-500/10 border-dashed" style={{ animation: 'ringOrbit 20s linear infinite reverse', transform: 'rotateX(75deg) rotateZ(30deg)' }} />
                </div>
                {/* Orbiting dot */}
                <div className="absolute top-1/2 left-1/2" style={{ animation: 'ringOrbit 8s linear infinite' }}>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_12px_cyan,0_0_24px_cyan] -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translateX(calc(min(200px, 12vw)))' }} />
                </div>
              </div>

              {/* LAYER 1: Deep glow halo */}
              <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500/25 via-blue-600/35 to-purple-500/25 blur-3xl rounded-2xl" style={{ animation: 'energyPulse 3s ease-in-out infinite' }} />

              {/* LAYER 2: Main glass panel */}
              <div className="relative overflow-hidden rounded-2xl px-10 py-6 md:px-16 md:py-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,242,254,0.04) 100%)', backdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.15)', animation: 'energyPulse 3s ease-in-out infinite' }}>

                {/* Top neon edge */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_cyan,0_0_30px_rgba(0,242,254,0.4)]" />
                {/* Bottom neon edge */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_purple]" />
                {/* Left neon */}
                <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-cyan-400 via-blue-500/40 to-purple-500 shadow-[0_0_12px_cyan]" />
                {/* Right neon */}
                <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-b from-cyan-400 via-blue-500/40 to-purple-500 shadow-[0_0_12px_purple]" />

                {/* 3D thickness — bottom face */}
                <div className="absolute -bottom-3 left-3 right-3 h-3 rounded-b-xl" style={{ background: 'linear-gradient(to bottom, #0c1a30, #050a14)', borderLeft: '1px solid rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }} />
                {/* 3D thickness — right face */}
                <div className="absolute top-3 -right-2 bottom-3 w-2 rounded-r-lg" style={{ background: 'linear-gradient(to right, #0c1a30, #060c18)' }} />

                {/* Corner brackets */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400/70 rounded-tl shadow-[0_0_6px_cyan]" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400/70 rounded-tr shadow-[0_0_6px_cyan]" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-purple-400/70 rounded-bl shadow-[0_0_6px_purple]" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-purple-400/70 rounded-br shadow-[0_0_6px_purple]" />

                {/* Hologram scanline */}
                <div className="absolute left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.4), transparent)', animation: 'titleScanline 2.5s linear infinite' }} />

                {/* Circuit lines decoration */}
                <div className="absolute top-[30%] left-3 w-6 h-[1px] bg-cyan-500/30" />
                <div className="absolute top-[30%] left-9 w-1 h-1 rounded-full bg-cyan-400/50" />
                <div className="absolute bottom-[30%] right-3 w-6 h-[1px] bg-purple-500/30" />
                <div className="absolute bottom-[30%] right-9 w-1 h-1 rounded-full bg-purple-400/50" />

                {/* TITLE TEXT — 3 stacked layers for depth */}
                <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Shadow layer (deepest) */}
                  <h1 className="text-2xl md:text-5xl font-sans font-black uppercase tracking-[0.15em] text-cyan-900/30 select-none" aria-hidden="true" style={{ transform: 'translateZ(-8px) translateX(3px) translateY(3px)', position: 'absolute', inset: 0 }}>
                    Trạm Tốc Độ Cao
                  </h1>
                  {/* Glow layer (mid) */}
                  <h1 className="text-2xl md:text-5xl font-sans font-black uppercase tracking-[0.15em] text-cyan-400/20 select-none blur-[3px]" aria-hidden="true" style={{ transform: 'translateZ(-3px)', position: 'absolute', inset: 0 }}>
                    Trạm Tốc Độ Cao
                  </h1>
                  {/* Main text (front) */}
                  <h1 className="relative text-2xl md:text-5xl font-sans font-black uppercase tracking-[0.15em]" style={{ transform: 'translateZ(4px)', color: 'transparent', backgroundImage: 'linear-gradient(135deg, #a8edea 0%, #ffffff 40%, #d4c4fb 70%, #a8edea 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.4))' }}>
                    Trạm Tốc Độ Cao
                  </h1>
                  {/* Glitch overlay */}
                  <h1 className="text-2xl md:text-5xl font-sans font-black uppercase tracking-[0.15em] text-red-400/10 select-none" aria-hidden="true" style={{ transform: 'translateZ(6px)', position: 'absolute', inset: 0, animation: 'titleGlitch 6s step-end infinite', mixBlendMode: 'screen' }}>
                    Trạm Tốc Độ Cao
                  </h1>
                </div>

                {/* Subtitle row */}
                <div className="mt-3 flex items-center justify-end gap-3 relative" style={{ transform: 'translateZ(2px)' }}>
                  <div className="h-[1px] flex-1 max-w-16 bg-gradient-to-r from-transparent to-cyan-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan] animate-pulse" />
                  <span className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-cyan-300/80 uppercase">Exodus Command Station</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_purple] animate-pulse" />
                  <div className="h-[1px] flex-1 max-w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
                </div>

                {/* Status indicators */}
                <div className="mt-2 flex items-center justify-end gap-4 text-[8px] md:text-[10px] font-mono tracking-widest">
                  <span className="text-green-400/60 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400 inline-block shadow-[0_0_4px_#4ade80] animate-pulse" /> SYS.ONLINE</span>
                  <span className="text-cyan-400/40">|</span>
                  <span className="text-cyan-400/50">FLEET.READY</span>
                  <span className="text-cyan-400/40">|</span>
                  <span className="text-amber-400/50">SEC.LV5</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center pb-12 md:pb-4 w-full px-4 md:px-8 mt-2">
          
          {/* ===== 3D GLASSMORPHISM STATION HUB ===== */}
          <div className="relative w-full max-w-[1200px] overflow-visible" style={{ perspective: '1200px' }}>
            <div className="relative rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 overflow-hidden" style={{ transformStyle: 'preserve-3d', animation: 'hubFloat 6s ease-in-out infinite', background: 'linear-gradient(135deg, rgba(4,8,20,0.6) 0%, rgba(10,20,40,0.4) 50%, rgba(4,8,20,0.6) 100%)' }}>
              {/* === OUTER FRAME — 3D depth edges === */}
              {/* Top edge */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_cyan,0_0_30px_rgba(0,242,254,0.3)]" />
              {/* Bottom edge + thickness */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_purple]" />
              <div className="absolute -bottom-3 left-4 right-4 h-3 bg-gradient-to-b from-[#0a1628]/80 to-[#040810]/60 rounded-b-2xl border-x border-b border-white/5 backdrop-blur-sm" />
              {/* Left edge */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500/30 to-purple-500 shadow-[0_0_10px_rgba(0,242,254,0.5)]" />
              {/* Right edge */}
              <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500/30 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              
              {/* === CORNER BRACKETS (Tech Detail) === */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-lg shadow-[0_0_8px_cyan]" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-lg shadow-[0_0_8px_cyan]" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-purple-400/80 rounded-bl-lg shadow-[0_0_8px_purple]" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-purple-400/80 rounded-br-lg shadow-[0_0_8px_purple]" />
              
              {/* === GLASS REFLECTION (moving light sweep) === */}
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,rgba(255,255,255,0.03)_10%,transparent_20%)] animate-[spin_20s_linear_infinite]" />
              </div>
              
              {/* === BACKDROP BLUR + INNER GLOW === */}
              <div className="absolute inset-0 backdrop-blur-xl rounded-[2rem]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-[2rem]" />
              
              {/* === TECH GRID PATTERN === */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,242,254,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.02)_1px,transparent_1px)] bg-[size:100%_60px] pointer-events-none" />
              
              {/* === RADAR HUD ELEMENT (top-right corner) === */}
              <div className="absolute top-6 right-6 w-16 h-16 md:w-20 md:h-20 pointer-events-none z-20">
                <div className="absolute inset-0 rounded-full border border-cyan-500/30" />
                <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-4 rounded-full border border-cyan-500/10" />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent origin-left animate-[spin_3s_linear_infinite]" />
                </div>
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-cyan-400 rounded-full shadow-[0_0_6px_cyan] animate-pulse" />
              </div>
              
              {/* === STATUS BAR (top-left) === */}
              <div className="absolute top-6 left-6 flex items-center gap-2 z-20 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-green-400/70 uppercase">ONLINE</span>
                <div className="w-px h-3 bg-white/20 mx-1" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-cyan-400/50">FLEET: 6 UNITS</span>
              </div>

              {/* === TITLE AREA === */}
              <div className="relative z-10 text-center mb-6 md:mb-8 mt-2">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-cyan-200" style={{ textShadow: '0 0 40px rgba(0,242,254,0.3)' }}>
                  TRẠM CHỈ HUY
                </h2>
                <div className="mt-2 md:mt-4 flex items-center justify-center gap-3 font-mono text-cyan-400 text-xs md:text-sm tracking-[0.2em]">
                  <Target className="w-4 h-4 animate-pulse text-red-500" /> 
                  <span>KÍCH HOẠT PHI THUYỀN ĐỂ KHÁM PHÁ</span>
                  <Target className="w-4 h-4 animate-pulse text-red-500" />
                </div>
                {/* Underline glow */}
                <div className="mt-3 mx-auto w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_cyan]" />
              </div>

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full mx-auto">
            {fleet.map((ship, idx) => {
              const isRushing = rushingShipId === ship.id || activeShip === ship.id;
              const isOtherRushing = (rushingShipId !== null && rushingShipId !== ship.id) || (activeShip !== null && activeShip !== ship.id);
              return (
                <div key={ship.id} className={`flex justify-center transition-all duration-500 ${isOtherRushing ? 'scale-90 opacity-10 blur-sm pointer-events-none' : ''}`}>
                  <div
                    onClick={() => engageShip(ship.id)}
                    onPointerEnter={() => sfx?.play('hover')}
                    className={`group relative cursor-crosshair transition-all duration-300 ${isRushing ? '' : 'hover:scale-105 hover:z-50'}`}
                    style={{ '--theme': ship.hex } as React.CSSProperties}
                  >
                    {/* SPACESHIP BODY */}
                    <div className={`relative w-[130px] h-[160px] md:w-[160px] md:h-[200px] ${isRushing ? `ship-rush-${ship.id}` : ''}`} style={{ filter: `drop-shadow(0 0 ${isRushing ? 60 : 18}px ${ship.hex})`, transition: 'filter .3s' }}>
                      {/* Impact Particles — 40 debris pieces with mixed colors */}
                      {isRushing && impactParticles.map(p => (
                        <div key={p.id} className="particle-burst" style={{ position:'absolute', top:'40%', left:'50%', width:p.s, height:p.s, borderRadius: p.id % 3 === 0 ? '2px' : '50%', background:p.c, boxShadow:`0 0 10px ${p.c}`, '--px':`${p.x}px`, '--py':`${p.y}px`, animationDelay:`${p.d}s` } as React.CSSProperties} />
                      ))}
                      {/* Asteroids — rocky debris flying across */}
                      {isRushing && asteroids.map(a => (
                        <div key={a.id} className="asteroid-rush" style={{ position:'absolute', top:'30%', left:'50%', width:a.s, height:a.s, background:'linear-gradient(135deg,#888 0%,#333 100%)', borderRadius:'30% 70% 50% 40%', boxShadow:'inset -2px -2px 4px rgba(0,0,0,.6), 0 0 12px rgba(255,150,50,.3)', '--ax':`${a.x}px`, '--ay':`${a.y}px`, '--ar':`${a.r}deg`, animationDelay:`${a.d}s`, zIndex:30 } as React.CSSProperties} />
                      ))}
                      {/* 3D Ship Hull */}
                      <div className="w-full h-full relative" style={{ filter: `drop-shadow(0 15px 25px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${ship.hex}40)` }}>
                        {/* MAIN BODY */}
                        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: getClipPath(ship.shape) }}>
                          {/* Base Metal Texture */}
                          <div className="absolute inset-0 bg-gradient-to-b from-[#1e2336] via-[#0b0d17] to-[#040509]" />
                          
                          {/* 3D Lighting Highlight */}
                          <div className="absolute top-0 left-[-20%] w-[140%] h-[40%] bg-gradient-to-b from-white/30 to-transparent rotate-[-15deg] mix-blend-overlay" />
                          
                          {/* Hexagonal Tech Texture */}
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(60deg, ${ship.hex} 0, ${ship.hex} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-60deg, ${ship.hex} 0, ${ship.hex} 1px, transparent 1px, transparent 10px)` }} />

                          {/* INNER ARMOR PLATE */}
                          <div className="absolute top-[10%] bottom-[10%] left-[10%] right-[10%] bg-gradient-to-t from-black/80 to-transparent border-t border-white/20" style={{ clipPath: getClipPath(ship.shape) }} />

                          {/* COCKPIT */}
                          <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[25%] h-[20%] bg-[#0a0a0a] border border-white/10 shadow-[inset_0_-8px_15px_rgba(255,255,255,0.1)] rounded-t-3xl overflow-hidden z-10">
                            {/* Cockpit reflection */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
                            <div className="absolute top-[10%] left-[10%] w-[20%] h-[80%] bg-white/20 rounded-full blur-[2px] transform rotate-12" />
                          </div>

                          {/* ENERGY CORE / REACTOR */}
                          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[30%] aspect-square rounded-full flex items-center justify-center z-10">
                            <div className="absolute inset-0 rounded-full opacity-40 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700" style={{ backgroundColor: ship.hex, filter: `blur(12px)` }} />
                            <div className="absolute w-[60%] h-[60%] bg-white rounded-full blur-[2px] opacity-90 mix-blend-screen" />
                            <div className="absolute w-[80%] h-[80%] border border-white/30 rounded-full animate-[spin_4s_linear_infinite]" />
                          </div>

                          {/* WING VENTS / LIGHTS */}
                          <div className="absolute top-[40%] left-[5%] w-[10%] h-[30%] bg-gradient-to-r from-black to-transparent" />
                          <div className="absolute top-[40%] right-[5%] w-[10%] h-[30%] bg-gradient-to-l from-black to-transparent" />
                          <div className="absolute top-[45%] left-[8%] w-[2px] h-[20%] rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: ship.hex, color: ship.hex }} />
                          <div className="absolute top-[45%] right-[8%] w-[2px] h-[20%] rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: ship.hex, color: ship.hex }} />

                          {/* MAIN ENGINE GLOW */}
                          <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[50%] h-[30%] rounded-full opacity-40 group-hover:opacity-100 transition-all duration-300 z-0" style={{ backgroundColor: ship.hex, filter: `blur(20px)` }} />
                          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[30%] h-[10%] bg-white rounded-t-full blur-[3px] opacity-60 group-hover:opacity-100 transition-all duration-300 z-10" />
                        </div>
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

      </div>

      {/* ============================================================================ */}
      {/* LAYER 2: COMMAND HUD (ACTIVE STATE) */}
      {/* ============================================================================ */}
      {activeData && !warpSpeed && (
        <div className="fixed inset-0 z-50 overflow-y-auto lg:overflow-hidden flex flex-col lg:justify-center p-4 md:p-10 pb-24 lg:pb-10 glitch-trans">
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

          <div className={`w-full max-w-[1600px] h-auto lg:h-full flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 perspective-[1500px] transition-all duration-700 ${deployState === 'deployed' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
            
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