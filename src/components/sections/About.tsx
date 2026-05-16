'use client';

import { Sparkles, ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Left content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-cyan-300" />
              <span className="uppercase text-sm tracking-[2px] font-medium text-white/70">Thanh Huy • 2003</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300">
              Kiến tạo không gian số<br />có trọng lực riêng
            </h2>

            <div className="max-w-2xl text-lg text-white/80 leading-relaxed space-y-6">
              <p>
                Từng là <span className="text-cyan-300">Backend Intern</span> chuyên RESTful APIs. 
                Tôi dùng <span className="text-purple-300">AI bứt tốc 10x</span> và <span className="text-cyan-300">Antigravity</span> làm ngôn ngữ thiết kế.
              </p>
              <p>
                Tôi không build website. Tôi kiến tạo <span className="font-medium text-white">không gian số có trọng lực riêng</span> – nơi mỗi pixel đều mang cảm giác bay lơ lửng.
              </p>
            </div>

            <div className="flex items-center gap-8 mt-12">
              <a
                href="#contact"
                className="group inline-flex items-center gap-3 px-8 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl text-lg font-medium transition-all hover:border-cyan-400"
              >
                Bắt đầu một dự án
                <ArrowRight className="w-5 h-5 group-active:translate-x-1 transition-transform" />
              </a>

              <div className="text-sm text-white/50">
                Hiện đang <span className="text-emerald-400 font-medium">AVAILABLE FOR PROJECTS</span>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="lg:col-span-5">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 h-full flex flex-col justify-center">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-2xl flex items-center justify-center text-3xl">🪐</div>
                  <div>
                    <div className="text-cyan-300 font-medium">Antigravity</div>
                    <div className="text-white/60 text-sm">Ngôn ngữ thiết kế chính</div>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-400/10 rounded-2xl flex items-center justify-center text-3xl">⚡</div>
                  <div>
                    <div className="text-purple-300 font-medium">AI × 10x</div>
                    <div className="text-white/60 text-sm">Tốc độ phát triển</div>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-400/10 rounded-2xl flex items-center justify-center text-3xl">🌌</div>
                  <div>
                    <div className="text-pink-300 font-medium">Neon Physics</div>
                    <div className="text-white/60 text-sm">Phong cách signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}