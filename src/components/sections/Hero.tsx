'use client';

/**
 * Hero.tsx - Antigravity Portfolio
 * ----------------------------------
 * Hero section với Physics Canvas nền (Matter.js)
 * - Floating tech-stack bodies có thể drag & drop
 * - Neon glow effect
 * - Zero gravity (Antigravity feel)
 * - Responsive + Strict Mode safe
 */

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// ============================================================
// CONFIG
// ============================================================
const FLOATING_WORDS = [
  { text: 'Next.js', color: '#00D9FF' },
  { text: 'AI', color: '#FF00E5' },
  { text: 'Physics', color: '#00FF9D' },
  { text: 'Backend', color: '#FFD600' },
  { text: 'Creative', color: '#FF6B00' },
  { text: 'RESTful', color: '#9D4EDD' },
  { text: 'Antigravity', color: '#00D9FF' },
  { text: '10x', color: '#FF00E5' },
];

// Tạo polygon points cho body (dùng để render text trên canvas)
type WordBody = Matter.Body & {
  customLabel?: string;
  customColor?: string;
  width?: number;
  height?: number;
};

// ============================================================
// PHYSICS CANVAS COMPONENT
// ============================================================
function PhysicsCanvas() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<WordBody[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const container = sceneRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ---------- ENGINE ----------
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }, // ANTIGRAVITY
      enableSleeping: false,
    });
    engineRef.current = engine;

    // ---------- RENDER ----------
    const render = Matter.Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // ---------- BOUNDARY WALLS (invisible) ----------
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      render: { visible: false },
    };
    const walls = [
      Matter.Bodies.rectangle(width / 2, -25, width, 50, wallOptions),
      Matter.Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions),
      Matter.Bodies.rectangle(-25, height / 2, 50, height, wallOptions),
      Matter.Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions),
    ];
    Matter.World.add(engine.world, walls);

    // ---------- FLOATING WORD BODIES ----------
    const bodies: WordBody[] = FLOATING_WORDS.map((word, i) => {
      const w = Math.max(80, word.text.length * 14 + 32);
      const h = 48;
      const x = (width / (FLOATING_WORDS.length + 1)) * (i + 1);
      const y = height / 2 + (Math.random() - 0.5) * height * 0.5;

      const body = Matter.Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: 12 },
        restitution: 0.9,
        frictionAir: 0.02,
        friction: 0,
        density: 0.001,
        render: {
          fillStyle: 'rgba(15, 15, 25, 0.6)',
          strokeStyle: word.color,
          lineWidth: 2,
        },
      }) as WordBody;

      body.customLabel = word.text;
      body.customColor = word.color;
      body.width = w;
      body.height = h;

      // Random initial velocity → cảm giác lơ lửng
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);

      return body;
    });
    bodiesRef.current = bodies;
    Matter.World.add(engine.world, bodies);

    // ---------- MOUSE CONTROL (drag & drop) ----------
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Cho phép scroll page khi mouse-wheel trên canvas
    mouse.element.removeEventListener(
      'wheel',
      (mouse as unknown as { mousewheel: EventListener }).mousewheel,
    );

    // ---------- CUSTOM RENDER: text + neon glow ----------
    const renderText = () => {
      const ctx = render.context;
      ctx.save();

      bodies.forEach((body) => {
        if (!body.customLabel || !body.customColor) return;

        const { x, y } = body.position;
        const angle = body.angle;

        // Neon glow
        ctx.shadowColor = body.customColor;
        ctx.shadowBlur = 20;

        // Text
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = body.customColor;
        ctx.font = '600 16px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(body.customLabel, 0, 0);
        ctx.rotate(-angle);
        ctx.translate(-x, -y);
      });

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(renderText);
    };

    // ---------- RUNNER + RENDER START ----------
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);
    renderText();

    // ---------- RESIZE HANDLER ----------
    const handleResize = () => {
      if (!container || !renderRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      render.options.width = newWidth;
      render.options.height = newHeight;
      Matter.Render.setPixelRatio(render, window.devicePixelRatio || 1);

      // Update wall positions
      Matter.Body.setPosition(walls[0], { x: newWidth / 2, y: -25 });
      Matter.Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + 25 });
      Matter.Body.setPosition(walls[2], { x: -25, y: newHeight / 2 });
      Matter.Body.setPosition(walls[3], { x: newWidth + 25, y: newHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    // ============================================================
    // CLEANUP - bắt buộc cho React Strict Mode
    // ============================================================
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
      bodiesRef.current = [];
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

// ============================================================
// HERO SECTION
// ============================================================
export default function Hero() {
  const [mounted, setMounted] = useState(false);

  // Tránh hydration mismatch + đảm bảo canvas chỉ mount client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#0A0A0F]">
      {/* Radial gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,217,255,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,0,229,0.06),transparent_60%)]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* PHYSICS CANVAS - z-0 */}
      <div className="absolute inset-0 z-[1]">
        {mounted && <PhysicsCanvas />}
      </div>

      {/* CONTENT - z-10 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20 pointer-events-none">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/70 tracking-wider uppercase">
              Available for projects
            </span>
          </div>

          {/* Tiêu đề lớn */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              Thanh Huy
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-white/80 tracking-wide">
            Creative Developer{' '}
            <span className="text-cyan-400 mx-2">•</span>
            <span className="text-white/60">2003</span>
          </p>

          {/* Manifesto */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-white/60">
            Từng là{' '}
            <span className="text-white/90 font-medium">
              Backend Intern
            </span>{' '}
            chuyên RESTful APIs. Tôi dùng{' '}
            <span className="text-cyan-400 font-medium">AI bứt tốc 10x</span>{' '}
            và{' '}
            <span className="text-fuchsia-400 font-medium">Antigravity</span>{' '}
            làm ngôn ngữ thiết kế. Tôi không build website. Tôi kiến tạo{' '}
            <span className="text-white/90 italic">
              không gian số có trọng lực riêng
            </span>
            .
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 pointer-events-auto">
            <Button
              size="lg"
              className="group relative bg-white text-black hover:bg-white/90 font-semibold px-8 h-12 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(0,217,255,0.3)] hover:shadow-[0_0_50px_rgba(0,217,255,0.5)]"
            >
              Khám phá không gian
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/5 font-medium px-6 h-12 rounded-full"
            >
              Xem dự án
            </Button>
          </div>

          {/* Hint */}
          <p className="text-xs text-white/30 tracking-wider uppercase pt-8 pointer-events-none">
            ↓ Kéo thả các khối chữ để cảm nhận Antigravity
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent z-[5] pointer-events-none" />
    </section>
  );
}