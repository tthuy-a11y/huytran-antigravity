'use client';

import { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowLeft, Zap, Database, GitBranch, Cpu, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function SystemPage() {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuggestion(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  // Canvas starfield + shooting meteors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number; y: number; size: number; speed: number }[] = [];
    const meteors: { x: number; y: number; length: number; speed: number }[] = [];

    // Tạo sao lấp lánh
    for (let i = 0; i < 800; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Vẽ sao lấp lánh
      ctx.fillStyle = 'rgba(224, 242, 255, 0.95)';
      stars.forEach((star) => {
        const alpha = Math.sin(Date.now() * star.speed / 300) * 0.5 + 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1;

      // Thiên thạch bay
      if (Math.random() < 0.03) {
        meteors.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 12 + 8,
        });
      }

      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      meteors.forEach((meteor, i) => {
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.length, meteor.y + meteor.length * 0.6);
        ctx.stroke();

        meteor.x += meteor.speed;
        meteor.y += meteor.speed * 0.6;

        if (meteor.x > canvas.width + 100) meteors.splice(i, 1);
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const sections = [
    {
      id: 0,
      icon: Zap,
      title: "Tăng tốc độ làm việc văn phòng",
      items: [
        "Soạn thảo báo cáo, email, đề xuất, biên bản họp một cách nhanh chóng và chuyên nghiệp",
        "Phân tích dữ liệu lớn, tạo bảng biểu và insight ngay lập tức",
        "Lên kế hoạch dự án, timeline và phân công công việc tự động",
        "Tạo slide trình bày chuyên nghiệp từ ý tưởng thô"
      ]
    },
    {
      id: 1,
      icon: Database,
      title: "Quản lý tệp & thông tin",
      items: [
        "Tự động sắp xếp, phân loại và lưu trữ file theo quy tắc thông minh",
        "Trích xuất thông tin từ hợp đồng, hóa đơn, CV và tài liệu scan",
        "Xây dựng Knowledge Base cá nhân/công ty để hỏi đáp nhanh mọi thông tin cũ",
        "Tìm kiếm thông tin xuyên suốt file, email, Notion, Drive chỉ bằng câu hỏi tiếng Việt"
      ]
    },
    {
      id: 2,
      icon: GitBranch,
      title: "Xây dựng hệ thống & tự động hóa",
      items: [
        "Xây dựng tool nội bộ (dashboard quản lý nhân sự, kho hàng, khách hàng) một cách nhanh chóng",
        "Tạo form đăng ký, hệ thống phê duyệt tự động và bot trả lời khách hàng",
        "Tích hợp API để tự động hóa toàn bộ quy trình làm việc",
        "Xây dựng mini web/app nội bộ (quản lý dự án, chấm công, báo cáo realtime)"
      ]
    },
    {
      id: 3,
      icon: Cpu,
      title: "Lập trình & phát triển",
      items: [
        "Code website, tool và script end-to-end một cách tự động",
        "Tối ưu và sửa lỗi code với tốc độ cao",
        "Tạo prototype sản phẩm mới nhanh chóng và hiệu quả"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#02040b] relative overflow-hidden">
      {/* Canvas vũ trụ */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Gradient overlay cho chiều sâu */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/10 z-10" />

      <div className="relative z-20 max-w-screen-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay về trang chọn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 drop-shadow-2xl">
              LOGIC &amp; TỐC ĐỘ
            </h1>
          </div>
        </div>

        {/* Tiêu đề mới */}
        <h2 className="text-3xl font-semibold text-center text-white/90 mb-16 tracking-wide">
          Khai thác tối đa tiềm năng của hệ thống và nâng cao hiệu suất của các công cụ
        </h2>

        {/* Neural Nodes - Floating 3D Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto perspective-[1200px]">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="group relative bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-cyan-400 rounded-3xl overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-cyan-500/40 hover:-translate-y-2 hover:rotate-[1deg] preserve-3d"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Main Core */}
                <button
                  onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center shadow-[0_0_25px_-5px] shadow-cyan-400 group-hover:shadow-cyan-300 transition-shadow">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-white">{section.title}</span>
                  </div>
                  <ChevronDown className={`w-6 h-6 text-cyan-300 transition-transform duration-500 ${expanded === section.id ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded - Tua/Tia bay ra + sub-items */}
                {expanded === section.id && (
                  <div className="px-8 pb-8 pt-2 border-t border-white/10 relative">
                    {/* Glow burst layer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 animate-pulse pointer-events-none" />

                    <ul className="space-y-5 pl-6 relative">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-4 text-white/85 text-[15px] leading-relaxed relative animate-in fade-in slide-in-from-left-8 duration-500"
                          style={{ animationDelay: `${i * 70}ms` }}
                        >
                          {/* Tua / Tia energy ray */}
                          <div className="absolute -left-6 top-3 w-px h-8 bg-gradient-to-b from-transparent via-cyan-300 to-transparent animate-[pulse_1.2s_infinite]" />
                          <div className="w-3 h-3 mt-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_4px] shadow-cyan-400 flex-shrink-0 animate-ping" />
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tóm tắt mới */}
        <div className="mt-20 max-w-2xl mx-auto text-center">
          <div className="bg-white/10 border border-cyan-400/30 rounded-3xl px-10 py-8 backdrop-blur-3xl">
            <p className="text-2xl font-medium text-white">
              Cải thiện chất lượng làm việc và giúp tăng trưởng vượt trội
            </p>
          </div>
        </div>

        {/* Suggestion Banner */}
        {showSuggestion && (
          <div className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl px-8 py-4 flex items-center gap-4 shadow-2xl z-50">
            <span className="text-white/80">Hãy xem lựa chọn còn lại</span>
            <Link
              href="/creative"
              className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-6 py-3 rounded-3xl font-medium hover:brightness-110 transition-all"
            >
              Chuyển sang Sáng tạo đột phá →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}