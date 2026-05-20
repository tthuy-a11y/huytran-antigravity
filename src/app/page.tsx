'use client';

import { useEffect, useState, useRef } from 'react';
import { Sparkles, Rocket, Zap } from 'lucide-react';
import Link from 'next/link';
import IntroCinematic from '@/components/IntroCinematic';

// ============================================================
// CANVAS STARFIELD BACKGROUND
// ============================================================
function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      stars.forEach((s) => {
        const twinkle =
          0.4 + 0.6 * Math.abs(Math.sin(time * s.twinkleSpeed + s.twinklePhase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * twinkle})`;
        ctx.fill();

        if (s.r > 1.2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(120, 200, 255, ${0.05 * twinkle})`;
          ctx.fill();
        }

        s.y -= s.speed;
        if (s.y < -5) {
          s.y = h + 5;
          s.x = Math.random() * w;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}

// ============================================================
// MAIN LANDING PAGE
// ============================================================
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // STATE QUẢN LÝ INTRO
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Nếu đã xem trong session này thì bỏ qua intro
    if (typeof window !== 'undefined' && sessionStorage.getItem('antigravity_intro_seen')) {
      setIntroDone(true);
    }
  }, []);

  // Timer gợi ý — chỉ chạy sau khi intro hoàn tất
  useEffect(() => {
    if (!introDone) return;
    const timer = setTimeout(() => setShowSuggestion(true), 30000);
    return () => clearTimeout(timer);
  }, [introDone]);

  const handleIntroComplete = () => {
    setIntroDone(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('antigravity_intro_seen', 'true');
    }
  };

  return (
    <>
      {/* ===== LAYER INTRO CINEMATIC — đè lên tất cả ===== */}
      {mounted && !introDone && (
        <IntroCinematic onComplete={handleIntroComplete} />
      )}

      {/* ===== TRANG CHỦ GỐC VỚI REVEAL EFFECT 1400ms ===== */}
      <main
        className={`min-h-screen bg-[#020008] overflow-hidden relative flex flex-col items-center justify-center selection:bg-cyan-500/30 transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          introDone
            ? 'opacity-100 scale-100 blur-0'
            : 'opacity-0 scale-90 blur-[25px] pointer-events-none'
        }`}
      >
        {/* StarfieldCanvas chỉ render sau khi intro xong — tiết kiệm GPU */}
        {mounted && introDone && <StarfieldCanvas />}

        {/* ===== AMBIENT GLOW LAYERS ===== */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,242,254,0.07)_0%,transparent_70%)] blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(176,38,255,0.06)_0%,transparent_70%)] blur-[80px]" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(255,8,68,0.04)_0%,transparent_70%)] blur-[100px]" />
        </div>

        {/* ===== SUBTLE GRID ===== */}
        <div
          className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* ===== MAIN CONTENT ===== */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* ===== HERO TITLE: TRẦN THANH HUY ===== */}
          <div className="mb-8 animate-[fadeSlideDown_1.2s_ease-out_both]">
            <div className="inline-flex items-center gap-4 mb-5">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-cyan-300 animate-[sparkleRotate_3s_ease-in-out_infinite]" />
              <h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase"
                style={{ fontFamily: "'Orbitron', 'Space Grotesk', sans-serif" }}
              >
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-400 animate-[gradientShift_6s_ease-in-out_infinite] [background-size:200%_200%] drop-shadow-[0_0_40px_rgba(0,242,254,0.3)]">
                  TRẦN THANH HUY
                </span>
              </h1>
            </div>
          </div>

          {/* ===== WELCOME SUBTITLE ===== */}
          <div className="mb-16 animate-[fadeSlideUp_1.4s_ease-out_0.3s_both]">
            <p className="relative inline-block text-lg sm:text-xl md:text-2xl font-light tracking-[0.08em] text-white/80 italic">
              <span className="text-cyan-400/60 mr-3 text-3xl font-extralight animate-[pulseGlow_2s_ease-in-out_infinite]">
                ✦
              </span>
              <span className="relative">
                Chào mừng đến với
                <span className="text-white font-medium not-italic"> không gian </span>
                có
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400 font-semibold not-italic">
                  {' '}
                  trọng lực riêng{' '}
                </span>
                của tôi
                <span className="absolute -bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              </span>
              <span className="text-purple-400/60 ml-3 text-3xl font-extralight animate-[pulseGlow_2s_ease-in-out_infinite_0.5s]">
                ✦
              </span>
            </p>
          </div>

          {/* ===== TWO PATHWAY CARDS ===== */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-4xl mx-auto mb-14 animate-[fadeSlideUp_1.6s_ease-out_0.6s_both]">
            {/* Card 1 - Sáng tạo đột phá */}
            <Link
              href="/creative"
              onMouseEnter={() => setHoveredCard('creative')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white/[0.03] backdrop-blur-2xl border rounded-3xl p-9 md:p-10 transition-all duration-700 hover:-translate-y-5 ${
                hoveredCard === 'creative'
                  ? 'border-purple-400/60 shadow-[0_0_60px_rgba(168,85,247,0.2),0_30px_80px_rgba(0,0,0,0.5)]'
                  : hoveredCard === 'system'
                    ? 'border-white/5 opacity-50 scale-[0.97]'
                    : 'border-white/10 hover:border-purple-400/40 hover:shadow-[0_0_50px_rgba(168,85,247,0.15),0_25px_60px_rgba(0,0,0,0.4)]'
              }`}
            >
              <div className="absolute -top-[1px] -left-[1px] w-20 h-20 bg-gradient-to-br from-purple-500/30 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -bottom-[1px] -right-[1px] w-20 h-20 bg-gradient-to-tl from-pink-500/20 to-transparent rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="absolute -top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:-top-6 md:-right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <div className="relative w-8 h-8 flex items-center justify-center" style={{ perspective: '200px' }}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_white]" />
                  <div className="absolute w-9 h-9 border border-white/50 rounded-full animate-[spin_4s_linear_infinite]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg)' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-100 rounded-full shadow-[0_0_8px_white]" style={{ transform: 'rotateX(-60deg)' }} />
                  </div>
                  <div className="absolute w-6 h-6 border border-white/30 rounded-full animate-[spin_2.5s_linear_infinite_reverse]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(70deg) rotateY(20deg)' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_6px_white]" style={{ transform: 'rotateY(-20deg) rotateX(-70deg)' }} />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors duration-500 leading-tight">
                Bạn cần sự sáng tạo đột phá
              </h2>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                Không gian vũ trụ với các hành tinh kỹ năng xoay quanh &ldquo;Thanh
                Huy 2003&rdquo;
              </p>
              <div className="mt-8 text-purple-400 text-sm font-semibold flex items-center gap-2 tracking-wider uppercase group-hover:gap-4 transition-all duration-500">
                KHÁM PHÁ VŨ TRỤ
                <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </Link>

            {/* Card 2 - Logic & Tốc độ */}
            <Link
              href="/system"
              onMouseEnter={() => setHoveredCard('system')}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white/[0.03] backdrop-blur-2xl border rounded-3xl p-9 md:p-10 transition-all duration-700 hover:-translate-y-5 ${
                hoveredCard === 'system'
                  ? 'border-cyan-400/60 shadow-[0_0_60px_rgba(0,242,254,0.2),0_30px_80px_rgba(0,0,0,0.5)]'
                  : hoveredCard === 'creative'
                    ? 'border-white/5 opacity-50 scale-[0.97]'
                    : 'border-white/10 hover:border-cyan-400/40 hover:shadow-[0_0_50px_rgba(0,242,254,0.15),0_25px_60px_rgba(0,0,0,0.4)]'
              }`}
            >
              <div className="absolute -top-[1px] -right-[1px] w-20 h-20 bg-gradient-to-bl from-cyan-500/30 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -bottom-[1px] -left-[1px] w-20 h-20 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="absolute -top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:-top-6 md:-right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(0,242,254,0.4)]">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white relative z-10 drop-shadow-[0_0_10px_white]" />
                  <Rocket className="w-3.5 h-3.5 text-blue-200 absolute top-2 left-2 -rotate-45 drop-shadow-[0_0_5px_cyan]" />
                  <Rocket className="w-3 h-3 text-cyan-200 absolute bottom-2 right-2 rotate-[135deg] drop-shadow-[0_0_5px_white]" />
                  <Rocket className="w-2.5 h-2.5 text-white absolute top-3 right-1.5 rotate-12 opacity-80" />
                  <Rocket className="w-2.5 h-2.5 text-cyan-100 absolute bottom-2.5 left-2 -rotate-[60deg] opacity-80" />
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-cyan-200 transition-colors duration-500 leading-tight">
                Bạn mong muốn gọn gàng khoa học cùng tốc độ
              </h2>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                Hệ thống logic tối ưu, tự động hóa và cải thiện hiệu suất công
                việc
              </p>
              <div className="mt-8 text-cyan-400 text-sm font-semibold flex items-center gap-2 tracking-wider uppercase group-hover:gap-4 transition-all duration-500">
                KHÁM PHÁ HỆ THỐNG
                <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </Link>
          </div>

          {/* ===== GUIDE TEXT with shimmer + shake animation ===== */}
          <div className="animate-[fadeSlideUp_1.8s_ease-out_1s_both]">
            <div className="relative inline-block mt-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-40 animate-[pulseGlow_3s_ease-in-out_infinite]" />
              <p
                className="relative text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.08em] uppercase animate-[shimmerPulse_3s_ease-in-out_infinite,gentleShake_4s_ease-in-out_infinite] z-10"
                style={{ textShadow: '0 0 30px rgba(0,242,254,0.8), 0 4px 10px rgba(0,0,0,0.8)' }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300">
                  Chọn 1 và cùng tôi khám phá
                </span>
                <span className="absolute -bottom-4 left-[5%] right-[5%] h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[pulseWidth_3s_ease-in-out_infinite] shadow-[0_0_20px_#00f2fe]" />
              </p>
            </div>

            {/* 30s auto-suggestion */}
            {showSuggestion && (
              <div className="mt-6 animate-[fadeSlideUp_0.8s_ease-out_both]">
                <p className="text-sm text-white/50 animate-[gentleShake_3s_ease-in-out_infinite]">
                  💡 Thử khám phá{' '}
                  {hoveredCard === 'creative' ? (
                    <Link
                      href="/system"
                      className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300 transition-colors"
                    >
                      Hệ Thống Logic
                    </Link>
                  ) : (
                    <Link
                      href="/creative"
                      className="text-purple-400 underline underline-offset-4 hover:text-purple-300 transition-colors"
                    >
                      Vũ Trụ Sáng Tạo
                    </Link>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== KEYFRAME ANIMATIONS ===== */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700;800;900&display=swap');

          @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-30px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50%       { background-position: 100% 50%; }
          }

          @keyframes sparkleRotate {
            0%, 100% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 8px rgba(0,242,254,0.6)); }
            25%       { transform: rotate(15deg) scale(1.15); filter: drop-shadow(0 0 16px rgba(0,242,254,0.9)); }
            50%       { transform: rotate(-5deg) scale(1.05); filter: drop-shadow(0 0 12px rgba(168,85,247,0.8)); }
            75%       { transform: rotate(8deg) scale(1.1); filter: drop-shadow(0 0 14px rgba(0,242,254,0.7)); }
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: 0.5; transform: scale(1); filter: drop-shadow(0 0 4px currentColor); }
            50%       { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px currentColor); }
          }

          @keyframes shimmerPulse {
            0%, 100% { opacity: 0.85; filter: brightness(1); }
            50%       { opacity: 1; filter: brightness(1.3); }
          }

          @keyframes gentleShake {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-2px) translateY(-1px); }
            20% { transform: translateX(2px) translateY(1px); }
            30% { transform: translateX(-1px) translateY(-0.5px); }
            40% { transform: translateX(1px) translateY(0.5px); }
            50% { transform: translateX(0) translateY(0); }
          }

          @keyframes pulseWidth {
            0%, 100% { opacity: 0.3; transform: scaleX(0.6); }
            50%       { opacity: 0.8; transform: scaleX(1); }
          }
        `}</style>
      </main>
    </>
  );
}
