"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at center, #0a0518, #02030a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFB347",
        fontFamily: "monospace",
        letterSpacing: 4,
        fontSize: 12,
        zIndex: 0,
      }}
    >
      <div>▸ INITIALIZING ANTIGRAV ENGINE...</div>
    </div>
  ),
});

export default function SceneCanvasClient() {
  return <SceneCanvas />;
}
