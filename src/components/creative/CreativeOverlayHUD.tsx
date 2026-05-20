'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ChevronLeft, Zap, Orbit, ArrowLeft, X } from 'lucide-react';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';

export interface Planet {
  name: string;
  code: string;
  description: string;
  stats?: {
    Power: number;
    Sync: number;
    Stability: number;
  };
}

interface CreativeOverlayHUDProps {
  activePlanet: Planet | null;
  setActivePlanet: (planet: Planet | null) => void;
  playSound?: (type: string) => void;
}

export default function CreativeOverlayHUD({
  activePlanet,
  setActivePlanet,
  playSound = () => {},
}: CreativeOverlayHUDProps) {

  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);
  const isAnyModalOpen = !!activePlanet || !!focusedPlanetId;

  // ESC key handler — đồng bộ với Web Speech & sound engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePlanet) {
        playSound('abort');
        setActivePlanet(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePlanet, setActivePlanet, playSound]);

  // Pause / Resume orbit logic — delay 320ms để khớp exit animation Framer Motion
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (activePlanet) {
      document.documentElement.classList.add('system-paused');
    } else {
      timeoutId = setTimeout(() => {
        document.documentElement.classList.remove('system-paused');
      }, 320);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.documentElement.classList.remove('system-paused');
    };
  }, [activePlanet]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 md:p-8 overflow-hidden pb-6 md:pb-8">

      {/* ===== TOP BAR: LOGO SPACE + AUTHOR PANEL ===== */}
      <div className="flex justify-between items-start w-full relative z-10">

        {/* Chỗ dành cho Logo (bên trái) */}
        <div className="pointer-events-auto w-10 md:w-12 flex-shrink-0" />

        {/* AUTHOR PANEL — chỉ hiện khi KHÔNG có modal */}
        <AnimatePresence>
          {!isAnyModalOpen && (
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-[280px] md:max-w-sm bg-black/70 backdrop-blur-3xl border border-orange-400/30 p-3 sm:p-4 md:p-6 rounded-3xl shadow-[0_0_40px_rgba(249,115,22,0.3)]"
            >
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter">TRẦN THANH HUY</h2>
              <p className="text-cyan-400 text-[10px] sm:text-xs font-mono tracking-[2px] mb-3 md:mb-4">[CREATOR-2003]</p>

              <div className="border-l-2 border-orange-500 pl-3 md:pl-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
                &quot;Frontend Developer Intern khám phá điểm giao giữa thiết kế, công nghệ và AI.
                Mỗi hành tinh đại diện cho một mảnh ghép trong vũ trụ kỹ năng —{' '}
                <span className="text-cyan-400 italic">hover &amp; click để khám phá.</span>&quot;
              </div>

              <Link
                href="/"
                onClick={() => playSound('click')}
                className="mt-8 flex w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold tracking-widest rounded-2xl items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.4)] group"
              >
                <ArrowLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
                RỜI KHỎI HỆ HÀNH TINH
                <Orbit className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== CENTRAL MODAL — PLANET DETAIL ===== */}
      <AnimatePresence>
        {activePlanet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md pointer-events-auto"
            onClick={() => {
              playSound('abort');
              setActivePlanet(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#050b14]/95 border border-cyan-400/40 rounded-3xl shadow-[0_0_60px_rgba(34,211,238,0.25)] flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* HEADER */}
              <div className="shrink-0 px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-4 md:pb-5 border-b border-cyan-400/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{activePlanet.name}</h3>
                    <p className="font-mono text-cyan-400 text-xs md:text-sm tracking-widest">[{activePlanet.code}]</p>
                  </div>
                  <button
                    onClick={() => {
                      playSound('abort');
                      setActivePlanet(null);
                    }}
                    className="touch-safe p-2 flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-900/30 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </div>
              </div>

              {/* SCROLLABLE BODY — flex-1 min-h-0 giải quyết triệt để text dài */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 md:py-6 custom-scrollbar text-gray-200 text-sm md:text-[15px] leading-relaxed">
                <p className="whitespace-pre-wrap mb-10">{activePlanet.description}</p>

                {/* STATS BARS — stagger animation + neon glow */}
                {activePlanet.stats && (
                  <div className="space-y-6">
                    {Object.entries(activePlanet.stats).map(([label, value], index) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-mono mb-3">
                          <span className="uppercase text-cyan-400 tracking-widest">{label}</span>
                          <span className="text-white font-bold">{value}%</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{
                              duration: 1.2,
                              delay: 0.1 + index * 0.18,
                              ease: 'easeOut',
                            }}
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 shadow-[0_0_12px_rgba(34,211,238,0.6)] relative"
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full blur-sm opacity-70" />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="shrink-0 px-4 sm:px-6 md:px-8 py-4 md:py-8 border-t border-cyan-400/20">
                <button
                  onClick={() => {
                    playSound('deploy');
                    setActivePlanet(null);
                  }}
                  className="w-full py-5 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all active:scale-95 group"
                >
                  RỜI KHỎI QUỸ ĐẠO
                  <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />
                </button>
                <p className="text-center text-white/30 text-xs font-mono tracking-widest mt-5">
                  ESC • CLICK NGOÀI ĐỂ ĐÓNG
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM NAV — 2 NÚT ĐIỀU HƯỚNG ===== */}
      <div className="flex justify-between items-end w-full mt-auto relative z-10">

        {/* LEFT: VŨ TRỤ GỐC */}
        <Link
          href="/"
          onClick={() => playSound('click')}
          className="pointer-events-auto group flex items-center gap-3 px-5 py-3 bg-black/60 backdrop-blur-xl border border-white/20 hover:border-cyan-400 rounded-2xl transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
          <div className="hidden sm:block">
            <span className="block text-[10px] text-white/40 tracking-widest">QUAY LẠI</span>
            <span className="text-sm font-bold text-gray-300 group-hover:text-white">VŨ TRỤ GỐC</span>
          </div>
        </Link>

        {/* RIGHT: TRẠM TỐC ĐỘ — nhấp nháy + shimmer */}
        <Link
          href="/system"
          onClick={() => playSound('warp')}
          className="pointer-events-auto group relative flex items-center gap-4 px-6 py-4 bg-cyan-950/80 backdrop-blur-3xl border-2 border-cyan-400/60 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.7)] hover:border-cyan-300 transition-all animate-pulse hover:animate-none"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent -translate-x-full group-hover:animate-shimmer" />

          <div className="hidden sm:flex flex-col items-end relative z-10">
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest mb-0.5">[ LỰA CHỌN 02 ]</span>
            <span className="text-lg font-black text-cyan-300 group-hover:text-white">TRẠM TỐC ĐỘ</span>
          </div>

          <span className="text-xs font-bold tracking-widest text-cyan-400 group-hover:text-white transition-colors sm:hidden relative z-10">TỐC ĐỘ</span>

          <div className="p-3 bg-cyan-400/10 border border-cyan-400 rounded-2xl group-hover:bg-cyan-400 group-hover:text-black transition-all relative z-10">
            <Rocket className="w-7 h-7 text-cyan-400 group-hover:text-black transition-transform group-active:rotate-45" />
          </div>
        </Link>
      </div>
    </div>
  );
}
