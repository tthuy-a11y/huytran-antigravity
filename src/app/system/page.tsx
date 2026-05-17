'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Zap, Database, GitBranch, Cpu, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function SystemPage() {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuggestion(true), 30000);
    return () => clearTimeout(timer);
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
    <main className="min-h-screen bg-[#05060f] relative overflow-hidden">
      {/* Background circuit grid + subtle glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#112233_1px,transparent_1px),linear-gradient(to_bottom,#112233_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay về trang chọn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300">
              NEURAL LOGIC NEXUS
            </h1>
          </div>
        </div>

        <h2 className="text-3xl font-semibold text-center text-white/90 mb-16">
          Tiềm năng tối đa khi khai thác hết Antigravity Ultra + Claude
        </h2>

        {/* Neural Nodes Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="group relative bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-cyan-400 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/30"
              >
                {/* Main Core Node */}
                <button
                  onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center shadow-inner shadow-cyan-500/50 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-white">{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-cyan-300 transition-all duration-300 ${expanded === section.id ? 'rotate-180 scale-110' : ''}`}
                  />
                </button>

                {/* Branching Neural Fibers + Sub-items */}
                {expanded === section.id && (
                  <div className="px-8 pb-8 pt-2 border-t border-white/10 relative">
                    {/* Fake neural fiber line (CSS root feel) */}
                    <div className="absolute left-12 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse" />
                    
                    <ul className="space-y-6 pl-8">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-4 text-white/80 text-[15px] leading-relaxed relative animate-in fade-in slide-in-from-left-6 duration-500"
                          style={{ animationDelay: `${i * 90}ms` }}
                        >
                          {/* Small data particle dot */}
                          <div className="absolute -left-6 top-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22f0ff] animate-[ping_1.5s_infinite]" />
                          {/* Fiber connection indicator */}
                          <span className="text-cyan-400 text-2xl leading-none mt-0.5">⟡</span>
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

        {/* Tóm tắt */}
        <div className="mt-20 max-w-2xl mx-auto text-center">
          <div className="bg-white/10 border border-cyan-400/30 rounded-3xl px-10 py-8">
            <p className="text-2xl font-medium text-white">
              Bạn có thể trở thành <span className="text-cyan-300">"AI Operator"</span>
            </p>
            <p className="text-white/70 mt-3">
              Người duy nhất trong công ty có khả năng cải thiện hiệu suất mạnh mẽ, 
              làm được việc của cả 3–4 nhân viên thông qua tư duy hệ thống và tự động hóa.
            </p>
          </div>
        </div>

        {/* Suggestion Banner */}
        {showSuggestion && (
          <div className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl px-8 py-4 flex items-center gap-4 shadow-2xl">
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