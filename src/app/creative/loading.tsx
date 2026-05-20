// Instant route-transition skeleton — rendered by Next.js while page chunk loads.
// Pure CSS animation (no JS) → appears immediately when user clicks the link.

export default function CreativeLoading() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0a0218 0%, #000004 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
        color: '#26e6ff',
      }}
    >
      <style>{`
        @keyframes cl-pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        @keyframes cl-spin  { to { transform: rotate(360deg); } }
        @keyframes cl-dots  { 0%,20% { content: '.'; } 40% { content: '..'; } 60%,100% { content: '...'; } }
        @keyframes cl-scan  { 0% { transform: translateY(-120%); } 100% { transform: translateY(120%); } }
        .cl-dots::after    { content: '.'; animation: cl-dots 1.2s infinite steps(3); display: inline-block; width: 1.2em; text-align: left; }
        .cl-scanline       { position: absolute; left:0; right:0; height: 3px; background: linear-gradient(90deg, transparent, rgba(38,230,255,0.45), transparent); animation: cl-scan 2.4s linear infinite; }
        .cl-ring           { width: 64px; height: 64px; border-radius: 50%; border: 2px solid transparent; border-top-color: #26e6ff; border-right-color: #c026d3; animation: cl-spin 1.1s linear infinite; box-shadow: 0 0 30px rgba(38,230,255,0.4); }
        .cl-label          { animation: cl-pulse 1.4s ease-in-out infinite; letter-spacing: 0.4em; font-size: 13px; }
      `}</style>

      <div className="cl-scanline" style={{ top: '15%' }} />
      <div className="cl-scanline" style={{ top: '60%', animationDelay: '1.2s' }} />

      <div className="cl-ring" />
      <div className="cl-label" style={{ marginTop: 28 }}>
        ĐANG KẾT NỐI HỆ HÀNH TINH<span className="cl-dots" />
      </div>
      <div style={{ marginTop: 12, fontSize: 10, opacity: 0.4, letterSpacing: '0.5em' }}>
        ━━━ ANTIGRAVITY OS v2.6 ━━━
      </div>
    </main>
  );
}
