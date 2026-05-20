"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCinematicStore } from '@/app/creative/lib/cinematicStore';
import { useFleetStore } from '@/store/useFleetStore';
import { audioEngine } from '@/app/creative/lib/audioEngine';
import { AnimatePresence, motion } from 'framer-motion';
import CreativeOverlayHUD, { type Planet } from '@/components/creative/CreativeOverlayHUD';

const CinematicDirector = dynamic(
  () => import('./CinematicDirector').then((mod) => mod.CinematicDirector),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono tracking-[4px] text-sm animate-pulse">
          INITIALIZING UNIVERSE...
        </div>
      </div>
    ),
  }
);

export default function CreativePage() {
  const hasEnteredSystem = useCinematicStore((s) => s.hasEnteredSystem);
  const focusedPlanetId = useCinematicStore((s) => s.focusedPlanetId);
  const isAnyModalOpen = focusedPlanetId !== null;

  // Planet modal state cho CreativeOverlayHUD
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);

  // playSound — bridge sang creative audioEngine
  const playSound = (type: string) => {
    try {
      if (type === 'click') audioEngine.playSfx('click');
      // 'warp', 'abort', 'deploy' không có SfxId tương ứng — silent fallback
    } catch {
      // audio chưa init — bỏ qua
    }
  };

  // Arrival sync: log ship docking khi warp sequence hoàn tất
  const flightPhase = useFleetStore((s) => s.flightPhase);
  const currentShip = useFleetStore((s) => s.currentShip);
  useEffect(() => {
    if (flightPhase === 'arrival' && currentShip) {
      console.log(`Ship ${currentShip} successfully docked into Cosmic Odyssey!`);
    }
  }, [flightPhase, currentShip]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* 3D Cinematic Sequence */}
      <CinematicDirector />

      <AnimatePresence>
        {hasEnteredSystem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {/* Hướng dẫn lơ lửng 3 ô — ẩn khi có planet sidebar */}
            <div className={`instruction-container transition-opacity duration-500 ${isAnyModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="instruction-box box-drag">
                <svg className="icon-drag" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
                <span>DRAG TO ORBIT</span>
              </div>
              <div className="instruction-box box-scroll">
                <svg className="icon-scroll" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="7"/><path className="scroll-wheel" d="M12 6v4"/>
                </svg>
                <span>SCROLL TO ZOOM</span>
              </div>
              <div className="instruction-box box-click">
                <svg className="icon-click" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>
                </svg>
                <span>CLICK PLANETS</span>
              </div>
            </div>

            {/* CreativeOverlayHUD — author panel + điều hướng + planet modal */}
            <CreativeOverlayHUD
              activePlanet={activePlanet}
              setActivePlanet={setActivePlanet}
              playSound={playSound}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .corner-btn {
          position: fixed;
          bottom: 40px;
          z-index: 50;
          font-family: monospace;
          font-size: 13px;
          letter-spacing: 3px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          padding: 14px 28px;
          background: rgba(5, 5, 10, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .corner-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: all 0.6s ease;
        }

        .corner-btn:hover::before {
          left: 100%;
        }

        @keyframes blink-cyan {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 229, 255, 0.2); border-left-color: #00E5FF; }
          50% { box-shadow: 0 0 22px rgba(0, 229, 255, 0.85); border-left-color: #fff; }
        }
        @keyframes float-instruction {
          0%, 100% { transform: translateX(-50%) translateY(0); box-shadow: 0 0 10px rgba(255,255,255,0.1); }
          50% { transform: translateX(-50%) translateY(8px); box-shadow: 0 0 25px rgba(255,255,255,0.3); }
        }

        .instruction-container {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          display: flex;
          flex-direction: row;
          gap: 12px;
          pointer-events: auto;
          animation: float-instruction 3.5s ease-in-out infinite;
        }
        @media (min-width: 768px) {
          .instruction-container {
            top: 40px;
            bottom: auto;
          }
        }

        .instruction-container:hover {
          animation-play-state: paused;
        }

        .instruction-box {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 1px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .instruction-box {
            font-size: 11px;
            letter-spacing: 2px;
            padding: 10px 20px;
            gap: 10px;
          }
        }

        .instruction-box span {
          display: none;
        }
        @media (min-width: 768px) {
          .instruction-box span {
            display: inline;
          }
        }

        .box-drag {
          color: #00E5FF;
          border-color: rgba(0, 229, 255, 0.3);
          background: rgba(0, 229, 255, 0.05);
        }
        .box-drag:hover {
          background: rgba(0, 229, 255, 0.15);
          border-color: rgba(0, 229, 255, 0.6);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
          transform: translateY(-3px);
        }

        .box-scroll {
          color: #FF2EC4;
          border-color: rgba(255, 46, 196, 0.3);
          background: rgba(255, 46, 196, 0.05);
        }
        .box-scroll:hover {
          background: rgba(255, 46, 196, 0.15);
          border-color: rgba(255, 46, 196, 0.6);
          box-shadow: 0 0 20px rgba(255, 46, 196, 0.3);
          transform: translateY(-3px);
        }

        .box-click {
          color: #FFB347;
          border-color: rgba(255, 179, 71, 0.3);
          background: rgba(255, 179, 71, 0.05);
        }
        .box-click:hover {
          background: rgba(255, 179, 71, 0.15);
          border-color: rgba(255, 179, 71, 0.6);
          box-shadow: 0 0 20px rgba(255, 179, 71, 0.3);
          transform: translateY(-3px);
        }

        .instruction-box svg {
          opacity: 0.9;
        }

        @keyframes drag-motion {
          0% { transform: translateX(-3px) scale(1); }
          25% { transform: translateX(-3px) scale(0.85) rotate(-10deg); }
          75% { transform: translateX(3px) scale(0.85) rotate(10deg); }
          100% { transform: translateX(3px) scale(1); }
        }
        .icon-drag { animation: drag-motion 1.8s alternate infinite ease-in-out; }

        @keyframes scroll-wheel {
          0% { transform: translateY(-2px); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
        .scroll-wheel { animation: scroll-wheel 1.5s infinite linear; }

        @keyframes bounce-mouse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .icon-scroll { animation: bounce-mouse 2s infinite ease-in-out; }

        @keyframes click-action {
          0%, 100% { transform: scale(1) translate(0, 0); filter: drop-shadow(0 0 0px rgba(255,179,71,0)); }
          50% { transform: scale(0.75) translate(-2px, -2px); filter: drop-shadow(0 0 8px rgba(255,179,71,0.8)); }
        }
        .icon-click { transform-origin: top left; animation: click-action 1.2s infinite; }
      `}</style>
    </main>
  );
}
