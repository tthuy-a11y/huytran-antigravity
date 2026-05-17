'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const skills = [
  { name: "AI Agentic & Tự động hóa", desc: "Google Antigravity Ultra Expert, Multi-Agent OpenClaw", color: "cyan" },
  { name: "Phát triển Web Sáng tạo", desc: "Generative Design & UI/UX nổi bật", color: "purple" },
  { name: "Prompt Engineering", desc: "AI Art & Tạo hình ảnh, ý tưởng thiết kế sáng tạo", color: "pink" },
  { name: "Creative Coding", desc: "Physics Animation & Interactive Experience", color: "emerald" },
  { name: "Experimental UI/UX", desc: "Motion Design & Micro-interactions", color: "amber" },
  { name: "Food Web Project", desc: "Full-task Developer (02/2026 – Hiện tại)", color: "violet" },
  { name: "Backend Developer Intern", desc: "Ayden Company (11/2024 – 05/2025)", color: "rose" },
];

export default function CreativePage() {
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuggestion(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay về trang chọn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-300" />
            <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
              SÁNG TẠO ĐỘT PHÁ
            </h1>
          </div>
        </div>

        {/* Solar System Container */}
        <div className="relative h-[700px] flex items-center justify-center mx-auto max-w-4xl">
          {/* Mặt trời trung tâm */}
          <div className="absolute z-10 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center shadow-[0_0_80px_#facc15] animate-pulse">
            <div className="text-center">
              <div className="text-3xl font-black text-black tracking-tighter">THANH HUY</div>
              <div className="text-xl font-bold text-black/90">2003</div>
            </div>
          </div>

          {/* Các tiểu hành tinh xoay quanh */}
          {skills.map((skill, index) => {
            const angle = (index * (360 / skills.length)) + 30;
            return (
              <div
                key={skill.name}
                className={`absolute w-28 h-28 rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl flex flex-col items-center justify-center text-center p-4 transition-all hover:scale-110 hover:border-${skill.color}-400`}
                style={{
                  transform: `rotate(${angle}deg) translateX(260px) rotate(-${angle}deg)`,
                  animation: `orbit ${25 + index * 3}s linear infinite`,
                }}
              >
                <div className={`text-3xl mb-2 text-${skill.color}-300`}>★</div>
                <div className="font-semibold text-white text-sm leading-tight">{skill.name}</div>
                <div className="text-white/60 text-xs mt-1 line-clamp-2">{skill.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Suggestion Banner */}
        {showSuggestion && (
          <div className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl px-8 py-4 flex items-center gap-4 shadow-2xl">
            <span className="text-white/80">Hãy xem lựa chọn còn lại</span>
            <Link
              href="/system"
              className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-6 py-3 rounded-3xl font-medium hover:brightness-110 transition-all"
            >
              Chuyển sang Logic & Tốc độ →
            </Link>
          </div>
        )}
      </div>

      {/* CSS Animation cho orbit */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(260px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(260px) rotate(-360deg); }
        }
      `}</style>
    </main>
  );
}