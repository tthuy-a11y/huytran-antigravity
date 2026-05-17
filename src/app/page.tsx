'use client';

import { Sparkles, Rocket, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
      {/* Background subtle antigravity grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Title */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-cyan-300" />
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300">
              TRẦN THANH HUY
            </h1>
          </div>
          <p className="text-2xl text-white/70 max-w-2xl mx-auto">
            Chào mừng đến với không gian có trọng lực riêng của tôi
          </p>
        </div>

        {/* 2 Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1 - Sáng tạo đột phá */}
          <Link
            href="/creative"
            className="group relative bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-purple-400 rounded-3xl p-10 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
              <Rocket className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
              Bạn cần sự sáng tạo đột phá
            </h2>
            <p className="text-white/70 text-lg">
              Không gian vũ trụ với các hành tinh kỹ năng xoay quanh "Thanh Huy 2003"
            </p>
            <div className="mt-10 text-purple-400 text-sm font-medium flex items-center gap-2">
              KHÁM PHÁ VŨ TRỤ →
            </div>
          </Link>

          {/* Card 2 - Logic & Tốc độ */}
          <Link
            href="/system"
            className="group relative bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-cyan-400 rounded-3xl p-10 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-cyan-500/30"
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
              <Zap className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">
              Bạn mong muốn gọn gàng khoa học cùng tốc độ
            </h2>
            <p className="text-white/70 text-lg">
              Hệ thống logic tối ưu, tự động hóa và cải thiện hiệu suất công việc
            </p>
            <div className="mt-10 text-cyan-400 text-sm font-medium flex items-center gap-2">
              KHÁM PHÁ HỆ THỐNG →
            </div>
          </Link>
        </div>

        <p className="text-white/40 text-sm mt-16">
          Chọn một con đường • Sau 30 giây sẽ gợi ý con đường còn lại
        </p>
      </div>
    </main>
  );
}