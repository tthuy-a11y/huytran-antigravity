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

  // Retain last focused planet for AnimatePresence exit animations
  const [lastPlanetId, setLastPlanetId] = React.useState<string | null>(null);
  useEffect(() => {
    if (focusedPlanetId) setLastPlanetId(focusedPlanetId);
  }, [focusedPlanetId]);

  const focusedPlanet = useMemo(
    () => {
      const idToUse = focusedPlanetId || lastPlanetId;
      if (!idToUse) return undefined;
      if (idToUse === 'sun-core') return SUN_DATA;
      return PLANETS.find((p) => p.id === idToUse);
    },
    [focusedPlanetId, lastPlanetId]
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

  const itemVariants: any = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } }
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none text-white font-sans">
      {/* Top Branding */}
      <div className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-auto max-w-[280px] md:max-w-[340px]">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-[0.2em]">THANH HUY</div>
          <div className="h-[1px] w-12 bg-white/30" />
          <div className="font-light tracking-[0.3em] text-white/50 text-sm">2003</div>
        </div>
        
        {/* Intro Text */}
        <div className="border-l-2 border-orange-500 pl-3 md:pl-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
          &quot;Frontend Developer Intern khám phá điểm giao giữa thiết kế, công nghệ và AI.
          Mỗi hành tinh đại diện cho một mảnh ghép trong vũ trụ kỹ năng —{' '}
          <span className="text-cyan-400 italic">hover &amp; click để khám phá.</span>&quot;
        </div>
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
        {!!focusedPlanetId && focusedPlanet && (
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

      {/* Backdrop bên trái: click để đóng, gradient mờ không che planet */}
      <AnimatePresence>
        {!!focusedPlanetId && focusedPlanet && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => focusPlanet(null)}
            className="fixed inset-0 z-[1090] pointer-events-auto bg-gradient-to-l from-black/60 via-black/10 to-transparent"
          />
        )}
      </AnimatePresence>

      {/* RIGHT SIDEBAR — glassmorphism 480px, không che planet */}
      <AnimatePresence>
        {!!focusedPlanetId && focusedPlanet && (
          <motion.aside
            key="sidebar-panel"
            variants={{
              hidden: { x: '100%', opacity: 0, filter: 'blur(10px)' },
              visible: { 
                x: 0, opacity: 1, filter: 'blur(0px)',
                transition: { type: 'spring', damping: 25, stiffness: 180, staggerChildren: 0.08, delayChildren: 0.1 }
              },
              exit: { x: '100%', opacity: 0, filter: 'blur(10px)', transition: { duration: 0.4, ease: 'easeInOut' } }
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="fixed top-4 right-4 bottom-28 md:top-6 md:right-6 md:bottom-32 z-[1100] w-full max-w-[calc(100%-32px)] md:w-[420px] lg:w-[460px] flex flex-col pointer-events-auto rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-black/60 backdrop-blur-3xl"
            style={{
              boxShadow: `-20px 0 80px rgba(0,0,0,0.8), inset 0 0 80px ${focusedPlanet.color}15, 0 0 0 1px ${focusedPlanet.color}33`,
            }}
          >
            {/* Animated Hex/Grid Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `linear-gradient(${focusedPlanet.color} 1px, transparent 1px), linear-gradient(90deg, ${focusedPlanet.color} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: 'center center'
              }}
            />
            {/* Ambient Top Glow */}
            <motion.div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none"
              style={{ background: focusedPlanet.color, opacity: 0.4 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* HEADER */}
            <motion.div variants={itemVariants} className="relative shrink-0 px-6 pt-6 pb-5 border-b border-white/5">
              {/* Sci-fi Deco Top-Right */}
              <div className="absolute top-4 right-6 flex flex-col items-end gap-1 pointer-events-none opacity-40">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: focusedPlanet.color }} 
                      animate={{ opacity: [0.2, 1, 0.2] }} 
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} 
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] tracking-[0.3em]">SYS.ACTIVE</span>
              </div>

              <div className="relative flex items-center gap-4 mt-2">
                {/* Icon Container with multi-layered rotation */}
                <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border border-dashed opacity-50"
                    style={{ borderColor: focusedPlanet.color }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-1 rounded-full border opacity-30"
                    style={{ borderTopColor: focusedPlanet.color, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: focusedPlanet.color }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  />
                  <div
                    className="relative w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md shadow-lg"
                    style={{ boxShadow: `0 0 20px ${focusedPlanet.color}40, inset 0 0 10px ${focusedPlanet.color}40` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: focusedPlanet.color, filter: `drop-shadow(0 0 8px ${focusedPlanet.color})` }} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <motion.h2
                    className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none break-words"
                    style={{
                      color: '#ffffff',
                      textShadow: `0 0 20px ${focusedPlanet.color}80, 0 0 40px ${focusedPlanet.color}40`
                    }}
                  >
                    {focusedPlanet.name}
                  </motion.h2>
                  <p className="font-mono text-[10px] tracking-[0.3em] mt-2 text-white/50 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: focusedPlanet.color, boxShadow: `0 0 8px ${focusedPlanet.color}` }} />
                    ID // {focusedPlanet.code}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-8 relative z-10"
              style={{
                maskImage: 'linear-gradient(180deg, black 0%, black 95%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 95%, transparent 100%)',
              }}>
              
              {/* Description */}
              <motion.div variants={itemVariants} className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: focusedPlanet.color, boxShadow: `0 0 12px ${focusedPlanet.color}` }} />
                <p className="text-[15px] text-white/80 leading-relaxed font-light pl-5">
                  <span className="text-white/40 text-lg leading-none font-serif mr-1">"</span>
                  {focusedPlanet.description}
                  <span className="text-white/40 text-lg leading-none font-serif ml-1">"</span>
                </p>
              </motion.div>

              {/* Stats / Contact */}
              {focusedPlanet.contact ? (
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Giao thức Liên lạc</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  {focusedPlanet.contact.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center justify-between bg-white/[0.02] rounded-xl px-5 py-4 border border-white/5 hover:bg-white/[0.05] transition-all group overflow-hidden"
                      style={{ borderLeftColor: focusedPlanet.color, borderLeftWidth: '2px' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-white/[0.05] transition-all" />
                      <span className="relative text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 group-hover:text-white/80 transition-colors">
                        {item.label}
                      </span>
                      <span className="relative text-[14px] font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors" style={{ textShadow: `0 0 10px ${focusedPlanet.color}00` }}>
                        {item.value}
                      </span>
                    </a>
                  ))}
                </motion.div>
              ) : focusedPlanet.stats.length > 0 ? (
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Phân tích Lõi</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  {focusedPlanet.stats.map((stat, idx) => (
                    <div key={stat.label} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
                          {stat.label}
                        </span>
                        <span className="text-[14px] font-mono font-bold text-white tracking-wider" style={{ color: focusedPlanet.color, textShadow: `0 0 10px ${focusedPlanet.color}66` }}>
                          {stat.value}
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className="absolute top-0 bottom-0 left-0 rounded-full"
                          style={{ 
                            background: `linear-gradient(90deg, transparent 0%, ${focusedPlanet.color} 100%)`,
                            boxShadow: `0 0 10px ${focusedPlanet.color}80` 
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: stat.level ? `${stat.level}%` : '100%' }}
                          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 + 0.15 * idx }}
                        />
                        {/* Glow tip */}
                        <motion.div
                          className="absolute top-0 bottom-0 w-2 bg-white rounded-full blur-[2px]"
                          initial={{ left: 0, opacity: 0 }}
                          animate={{ left: stat.level ? `calc(${stat.level}% - 8px)` : 'calc(100% - 8px)', opacity: 1 }}
                          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 + 0.15 * idx }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : null}

              {/* Details */}
              {focusedPlanet.details && focusedPlanet.details.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                  {focusedPlanet.details.map((paragraph, idx) => (
                    <p key={idx} className="text-white/60 text-[14px] leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </motion.div>
              )}

              {/* Technologies */}
              {focusedPlanet.technologies && focusedPlanet.technologies.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Công nghệ</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {focusedPlanet.technologies.map((tech, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider border relative group overflow-hidden cursor-default"
                        style={{
                          borderColor: `${focusedPlanet.color}40`,
                          backgroundColor: `${focusedPlanet.color}10`,
                          color: '#ffffff',
                        }}
                      >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        <span className="relative z-10" style={{ textShadow: `0 0 8px ${focusedPlanet.color}80` }}>{tech}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* FOOTER */}
            <motion.div variants={itemVariants} className="relative shrink-0 px-6 py-5 bg-black/40 border-t border-white/5 backdrop-blur-xl flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] text-white/30 font-mono tracking-[0.3em] uppercase">Trạng thái</span>
                <span className="text-[11px] font-bold text-cyan-300/80 tracking-widest uppercase">ĐÃ KẾT NỐI</span>
              </div>
              
              <motion.button
                onClick={() => focusPlanet(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all overflow-hidden group"
                style={{
                  backgroundColor: `${focusedPlanet.color}15`,
                  border: `1px solid ${focusedPlanet.color}50`,
                  color: '#ffffff',
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <Zap className="w-4 h-4 relative z-10" style={{ color: focusedPlanet.color, filter: `drop-shadow(0 0 5px ${focusedPlanet.color})` }} />
                <span className="relative z-10" style={{ textShadow: `0 0 10px ${focusedPlanet.color}80` }}>Rời quỹ đạo</span>
              </motion.button>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
});
