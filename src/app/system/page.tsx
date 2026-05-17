'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';

export default function SystemPage() {
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuggestion(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    {
      title: "Tăng tốc độ làm việc văn phòng",
      items: [
        "Soạn thảo báo cáo, email, đề xuất, biên bản họp một cách nhanh chóng và chuyên nghiệp",
        "Phân tích dữ liệu lớn, tạo bảng biểu và insight ngay lập tức",
        "Lên kế hoạch dự án, timeline và phân công công việc tự động",
        "Tạo slide trình bày chuyên nghiệp từ ý tưởng thô"
      ]
    },
    {
      title: "Quản lý tệp & thông tin",
      items: [
        "Tự động sắp xếp, phân loại và lưu trữ file theo quy tắc thông minh",
        "Trích xuất thông tin từ hợp đồng, hóa đơn, CV và tài liệu scan",
        "Xây dựng Knowledge Base cá nhân/công ty để hỏi đáp nhanh mọi thông tin cũ",
        "Tìm kiếm thông tin xuyên suốt file, email, Notion, Drive chỉ bằng câu hỏi tiếng Việt"
      ]
    },
    {
      title: "Xây dựng hệ thống & tự động hóa",
      items: [
        "Xây dựng tool nội bộ (dashboard quản lý nhân sự, kho hàng, khách hàng) một cách nhanh chóng",
        "Tạo form đăng ký, hệ thống phê duyệt tự động và bot trả lời khách hàng",
        "Tích hợp API để tự động hóa toàn bộ quy trình làm việc",
        "Xây dựng mini web/app nội bộ (quản lý dự án, chấm công, báo cáo realtime)"
      ]
    },
    {
      title: "Lập trình & phát triển",
      items: [
        "Code website, tool và script end-to-end một cách tự động",
        "Tối ưu và sửa lỗi code với tốc độ cao",
        "Tạo prototype sản phẩm mới nhanh chóng và hiệu quả"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#0a0a1f] relative overflow-hidden">
      {/* Background deep space */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#112233_1px,transparent_1px),linear-gradient(to_bottom,#112233_1px,transparent_1px)] bg-[size:90px_90px] opacity-30" />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay về trang chọn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-300" />
            <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
              LOGIC & TỐC ĐỘ
            </h1>
          </div>
        </div>

        <h2 className="text-3xl font-semibold text-center text-white/90 mb-12">
          Tiềm năng tối đa khi khai thác hết Antigravity Ultra + Claude
        </h2>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {sections.map((section, index) => (
            <div
              key={index}
              className="group bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-cyan-400 rounded-3xl p-8 transition-all hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-6">
                <Folder className="w-8 h-8 text-cyan-300 group-hover:text-cyan-400 transition-colors" />
                <h3 className="text-2xl font-semibold text-white">{section.title}</h3>
              </div>
              <ul className="space-y-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80 text-[15px]">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tóm tắt nổi bật */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
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