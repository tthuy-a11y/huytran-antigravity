'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { audioEngine } from '@/app/creative/lib/audioEngine';

export function TransitionSkeleton() {
  const [logProgress, setLogProgress] = useState<number>(0);

  // Play high-tech synchronized audio events
  useEffect(() => {
    // 1. Initial tactical warp/glitch swoosh + rapid beep on mount
    audioEngine.playCue('data-beep', { volume: 0.6, rate: 2.1 });
    audioEngine.playCue('laser', { volume: 0.5, rate: 1.45 });

    // 2. Systems target lock chirp
    const timer1 = setTimeout(() => {
      audioEngine.playCue('planet-discover', { volume: 0.85, rate: 1.8 });
    }, 450);

    // 3. Telemetry connection confirmation chime
    const timer2 = setTimeout(() => {
      audioEngine.playCue('glass-shatter', { volume: 0.65, rate: 1.5 });
    }, 950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Update diagnostic logs progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setLogProgress((prev) => (prev < 100 ? prev + 8 : 100));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
      className="absolute inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center overflow-hidden font-mono text-cyan-300"
    >
      {/* 1. Deep Space CRT Scanlines and vignette */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.28] mix-blend-screen"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(34,211,238,0.2) 0px, rgba(34,211,238,0.2) 1.5px, transparent 1.5px, transparent 4px)',
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,20,40,0.15) 0%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* 2. Rapid Laser/Glitch Screen Swipe Overlay (Horizontal bars that flash) */}
      <motion.div
        initial={{ top: '-10%', opacity: 0.9 }}
        animate={{ top: '110%', opacity: 0 }}
        transition={{ duration: 0.85, ease: 'easeInOut' }}
        className="absolute left-0 right-0 h-[28px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(180deg, transparent, #22d3ee, #ffffff, #c084fc, transparent)',
          boxShadow: '0 0 45px rgba(34,211,238,0.9), 0 0 20px rgba(192,132,252,0.6)',
          filter: 'blur(1.5px)',
        }}
      />

      {/* Dynamic Glitch Band */}
      <motion.div
        animate={{
          opacity: [0.15, 0.7, 0.05, 0.45, 0.0],
          scaleY: [1, 2.5, 0.5, 1.8, 1],
          y: [0, -100, 200, -50, 0],
        }}
        transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-x-0 h-4 bg-cyan-500/10 pointer-events-none mix-blend-screen"
        style={{ filter: 'blur(3px)' }}
      />

      {/* 3. Center Holographic Tactical HUD */}
      <div className="relative flex items-center justify-center w-80 h-80 mb-8 select-none pointer-events-none">
        {/* Outer Ring with rotating tick dash */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          className="absolute w-72 h-72 border border-dashed border-cyan-400/40 rounded-full flex items-center justify-center"
        >
          <div className="absolute top-0 w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee]" />
        </motion.div>

        {/* Middle Ring with reverse spin */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute w-56 h-56 border border-cyan-500/20 rounded-full flex items-center justify-center"
        >
          <div className="absolute left-0 w-3 h-[1px] bg-purple-400" />
          <div className="absolute right-0 w-3 h-[1px] bg-purple-400" />
        </motion.div>

        {/* Tech crosshairs */}
        <div className="absolute w-48 h-48 flex items-center justify-center opacity-40">
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
        </div>

        {/* Core pulsing diamond */}
        <motion.div
          animate={{ scale: [0.94, 1.08, 0.94], rotate: [45, 135, 45], opacity: [0.7, 1.0, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 border border-cyan-300 bg-cyan-400/10 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]"
        />

        {/* Outer Hexagon corners for high-end look */}
        <div className="absolute w-64 h-64 border border-cyan-400/10 rounded-[12%] rotate-12" />
        <div className="absolute w-64 h-64 border border-cyan-400/10 rounded-[12%] -rotate-12" />
      </div>

      {/* 4. Console Logs & Progress Section */}
      <div className="relative text-center z-10 max-w-sm px-6">
        <motion.p
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="font-mono tracking-[8px] text-cyan-200 text-lg font-bold uppercase select-none drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        >
          SYNCING COGNITIVE SYSTEM
        </motion.p>
        
        {/* Holographic boot status logs */}
        <div className="mt-4 h-16 font-mono text-[11px] text-cyan-400/70 select-none text-left space-y-1 bg-black/45 p-3 rounded-md border border-cyan-500/15 backdrop-blur-sm min-w-[280px]">
          {logProgress >= 15 && <div className="animate-pulse">● [SECURE] LINKING PORTAL NODE TH2003... OK</div>}
          {logProgress >= 45 && <div>● [FLEET] ACQUIRING TACTICAL ORBITAL DATA... OK</div>}
          {logProgress >= 75 && <div>● [CAMERA] ENGAGING INTERACTIVE CONTROLS... 100%</div>}
          {logProgress === 100 && <div className="text-cyan-300 font-bold">● [STATUS] TACTICAL INTERFACE ONLINE. WELCOME.</div>}
        </div>

        {/* Cybernetic Progress Bar */}
        <div className="mt-6 w-72 h-[3px] bg-cyan-950/60 rounded-full overflow-hidden border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400"
            style={{ width: `${logProgress}%` }}
            transition={{ type: 'spring', stiffness: 80 }}
          />
        </div>
        
        <div className="mt-2 text-[10px] text-cyan-500/60 tracking-wider">
          PORTAL ADDR: 0x7E3_TH2003 // VOLTAGE SECURE
        </div>
      </div>
    </motion.div>
  );
}

