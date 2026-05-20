"use client";

import { useSceneStore } from "@/lib/store";

export default function HologramModal() {
  const sunFocused = useSceneStore((s) => s.sunFocused);
  const setSunFocused = useSceneStore((s) => s.setSunFocused);

  if (!sunFocused) return null;

  return (
    <div
      onClick={() => setSunFocused(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "20vh",
        pointerEvents: "none",
        animation: "overlayPulse 1s cubic-bezier(0.25, 1, 0.5, 1) forwards",
      }}
    >
      <div
        className="hologram-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          pointerEvents: "auto",
          width: "min(520px, 90vw)",
          padding: "32px 36px",
          background: "linear-gradient(140deg, rgba(20,10,5,0.85), rgba(40,15,5,0.95))",
          border: "1px solid rgba(255,179,71,0.5)",
          borderTop: "4px solid #FFB347",
          borderBottom: "4px solid #FFB347",
          borderRadius: 6,
          boxShadow: "0 0 100px rgba(255,179,71,0.6), inset 0 0 40px rgba(255,179,71,0.2)",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: "#FFB347",
            marginBottom: 6,
          }}
        >
          ▸ STELLAR CORE // IDENTITY
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            margin: "0 0 8px",
            background: "linear-gradient(90deg, #FFD86B, #FF7A1F)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          THANH HUY 2003
        </h1>
        <div
          style={{
            fontSize: 14,
            color: "#FFD86B",
            marginBottom: 18,
            letterSpacing: 1,
          }}
        >
          Frontend Developer Intern
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            opacity: 0.9,
            marginBottom: 20,
          }}
        >
          Đam mê thiết kế UI/UX sáng tạo và ứng dụng tự động hóa AI.
          Khám phá điểm giao giữa thiết kế, công nghệ và trải nghiệm
          người dùng — nơi mỗi giao diện kể một câu chuyện.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            borderTop: "1px solid rgba(255,179,71,0.3)",
            paddingTop: 16,
            fontSize: 12,
          }}
        >
          {[
            ["Specialty", "UI/UX + AI"],
            ["Stack", "React, Next.js, R3F"],
            ["Year", "2003"],
            ["Status", "ACTIVE ★"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ opacity: 0.5 }}>{k}</div>
              <div style={{ color: "#FFB347", fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSunFocused(false)}
          style={{
            marginTop: 22,
            width: "100%",
            padding: "10px 0",
            background: "transparent",
            border: "1px solid #FFB347",
            color: "#FFB347",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "monospace",
            letterSpacing: 2,
            fontSize: 12,
          }}
        >
          [ CLOSE TRANSMISSION ]
        </button>
      </div>
      <style>{`
        @keyframes overlayPulse {
          0% { background: radial-gradient(circle at center, rgba(255,150,50,0.1), rgba(0,0,0,0.2)); backdrop-filter: blur(0px); }
          50% { background: radial-gradient(circle at center, rgba(255,150,50,0.3), rgba(0,0,0,0.9)); backdrop-filter: blur(12px); }
          100% { background: radial-gradient(circle at center, rgba(255,150,50,0.2), rgba(0,0,0,0.85)); backdrop-filter: blur(16px); }
        }

        @keyframes glitchEntrance {
          0% { opacity: 0; transform: scale(0.9) skewX(15deg); filter: hue-rotate(-90deg) contrast(200%); }
          15% { opacity: 1; transform: scale(1.05) skewX(-10deg); filter: hue-rotate(90deg) contrast(150%); }
          30% { transform: scale(0.97) skewX(5deg); filter: hue-rotate(-45deg); }
          45% { transform: scale(1.02) skewX(-2deg); filter: hue-rotate(45deg); }
          60% { transform: scale(1) skewX(0); filter: hue-rotate(0); }
          100% { transform: scale(1); filter: hue-rotate(0); opacity: 1; }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .hologram-modal {
          animation: glitchEntrance 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          position: relative;
          overflow: hidden;
        }

        .hologram-modal::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0) 100%
          );
          animation: scanline 2.5s linear infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
