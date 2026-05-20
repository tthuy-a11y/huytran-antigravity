'use client';

import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Cpu, Layers, Globe, DatabaseZap, TerminalSquare, Sun } from 'lucide-react';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';
import { PLANETS, SUN_DATA } from '@/lib/planets-data';

const ICON_MAP: Record<string, any> = {
  'nexus-01': Cpu,
  'uix-99': Layers,
  'front-0': Globe,
  'back-1': DatabaseZap,
  'dev-core': TerminalSquare,
  'sun-core': Sun,
};

const STAT_COLORS = [
  'from-cyan-400 to-white',
  'from-purple-400 to-white',
  'from-emerald-400 to-white',
];

export const InteractiveUI = React.memo(function InteractiveUI() {
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);
  const focusPlanet = useCinematicStore((s) => s.focusPlanet);
  const resetCamera = useCinematicStore((s) => s.resetCamera);

  const focusedPlanet = useMemo(
    () => {
      if (focusedPlanetId === 'sun-core') return SUN_DATA;
      return PLANETS.find((p) => p.id === focusedPlanetId);
    },
    [focusedPlanetId]
  );

  const isMuted = useCinematicStore((s) => s.isMuted);
  const toggleMute = useCinematicStore((s) => s.toggleMute);

  // ESC để đóng modal
  useEffect(() => {
    if (!focusedPlanetId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') focusPlanet(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedPlanetId, focusPlanet]);

  if (!hasEnteredSystem) return null;

  const Icon = focusedPlanet ? (ICON_MAP[focusedPlanet.id] || Zap) : Zap;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none text-white font-sans">
      {/* Top Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-4 pointer-events-auto">
        <div className="font-bold text-xl tracking-[0.2em]">THANH HUY</div>
        <div className="h-[1px] w-12 bg-white/30" />
        <div className="font-light tracking-[0.3em] text-white/50 text-sm">2003</div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 pointer-events-auto flex gap-4">
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      {/* Hint ESC khi đang xem chi tiết hành tinh */}
      <AnimatePresence>
        {focusedPlanet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] text-xs font-mono text-white/60 tracking-[1px] flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-2xl pointer-events-none"
          >
            <span>ESC</span>
            <span className="text-white/30">•</span>
            <span>CLICK NGOÀI ĐỂ ĐÓNG</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focusedPlanet && (
          <>
            {/* Backdrop bên trái: click để đóng, gradient mờ không che planet */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => focusPlanet(null)}
              className="fixed inset-0 z-[1090] pointer-events-auto bg-gradient-to-l from-black/60 via-black/10 to-transparent"
            />

            {/* RIGHT SIDEBAR — glassmorphism 480px, không che planet */}
            <motion.aside
              key="sidebar-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 180 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 right-0 z-[1100] h-full w-full md:w-[460px] lg:w-[480px] flex flex-col pointer-events-auto bg-black/70 backdrop-blur-3xl border-l shadow-[-40px_0_120px_rgba(0,0,0,0.85)]"
              style={{
                borderLeftColor: `${focusedPlanet.color}66`,
                boxShadow: `-40px 0 120px rgba(0,0,0,0.85), inset 0 0 60px ${focusedPlanet.color}1a`,
              }}
            >
              {/* HEADER */}
              <div className="relative shrink-0 px-6 md:px-8 py-6 border-b border-white/10 overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-40 h-40 opacity-25 blur-3xl rounded-full pointer-events-none"
                  style={{ background: focusedPlanet.color }}
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: `${focusedPlanet.color}1f`,
                        borderColor: `${focusedPlanet.color}80`,
                        boxShadow: `0 0 24px ${focusedPlanet.color}55`,
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: focusedPlanet.color }} />
                    </div>
                    <div className="min-w-0">
                      <h2
                        className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight truncate"
                        style={{ textShadow: `0 0 18px ${focusedPlanet.color}aa` }}
                      >
                        {focusedPlanet.name}
                      </h2>
                      <p className="font-mono text-[11px] text-white/60 tracking-[0.25em] mt-1">
                        <span
                          className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 mr-2"
                          style={{ color: focusedPlanet.color }}
                        >
                          [{focusedPlanet.code}]
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => focusPlanet(null)}
                    aria-label="Đóng"
                    className="shrink-0 w-10 h-10 flex items-center justify-center text-white/60 hover:text-red-300 hover:bg-red-500/15 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* BODY — cuộn nội bộ */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-7 space-y-8">
                {/* Description */}
                <p
                  className="text-[15px] text-white/90 leading-relaxed font-light border-l-2 pl-5"
                  style={{ borderColor: focusedPlanet.color }}
                >
                  "{focusedPlanet.description}"
                </p>

                {/* Stats hoặc Contact */}
                {focusedPlanet.contact ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/45">
                      Liên hệ
                    </div>
                    {focusedPlanet.contact.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3.5 border border-white/5 hover:border-cyan-400/40 hover:bg-white/5 transition-all group"
                      >
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 group-hover:text-cyan-300/70 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[14px] font-bold text-white truncate ml-3 group-hover:text-cyan-300 transition-colors">
                          {item.value}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : focusedPlanet.stats.length > 0 ? (
                  <div className="space-y-5">
                    <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/45">
                      Thông số lõi
                    </div>
                    {focusedPlanet.stats.map((stat, idx) => (
                      <div key={stat.label}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/55">
                            {stat.label}
                          </span>
                          <span className="text-[15px] font-bold text-white tracking-wide">
                            {stat.value}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${STAT_COLORS[idx % STAT_COLORS.length]}`}
                            initial={{ width: 0 }}
                            animate={{ width: stat.level ? `${stat.level}%` : '100%' }}
                            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 * idx }}
                            style={{ boxShadow: '0 0 10px currentColor' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Details */}
                {focusedPlanet.details && focusedPlanet.details.length > 0 && (
                  <div className="space-y-4">
                    {focusedPlanet.details.map((paragraph, idx) => (
                      <p key={idx} className="text-white/65 text-[14px] leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

                {/* Technologies */}
                {focusedPlanet.technologies && focusedPlanet.technologies.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono text-white/45 mb-3 tracking-[0.25em] uppercase">
                      Core Technologies
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {focusedPlanet.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-mono border backdrop-blur-xl"
                          style={{
                            borderColor: `${focusedPlanet.color}40`,
                            backgroundColor: `${focusedPlanet.color}10`,
                            color: focusedPlanet.color,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="shrink-0 p-5 md:p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <button
                  onClick={() => focusPlanet(null)}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm text-black transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: focusedPlanet.color,
                    boxShadow: `0 0 24px ${focusedPlanet.color}55`,
                  }}
                >
                  Rời khỏi quỹ đạo
                  <Zap className="w-4 h-4 ml-1" fill="currentColor" />
                </button>
                <p className="text-center text-[10px] text-white/35 mt-3 font-mono tracking-[0.2em]">
                  ESC • CLICK NGOÀI ĐỂ ĐÓNG
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
