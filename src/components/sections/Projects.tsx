'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, Github, Sparkles } from 'lucide-react';

const projectsData = [
  {
    id: 1,
    title: 'Antigravity Portfolio',
    desc: 'Portfolio cá nhân với physics canvas, neon glow và hiệu ứng kéo thả khối chữ. Xây dựng hoàn toàn bằng Next.js 15 + Tailwind.',
    tech: ['Next.js 15', 'TypeScript', 'Tailwind', 'Physics Canvas'],
    link: '#',
    github: '#',
    color: 'cyan',
  },
  {
    id: 2,
    title: 'RESTful AI Dashboard',
    desc: 'Dashboard quản lý API tốc độ 10x với AI integration. Tích hợp Antigravity visualization cho dữ liệu thời gian thực.',
    tech: ['Next.js', 'Node.js', 'RESTful API', 'AI'],
    link: '#',
    github: '#',
    color: 'purple',
  },
  {
    id: 3,
    title: 'Neon Physics Playground',
    desc: 'Thư viện tương tác vật lý neon – kéo thả, va chạm, hover glow. Được dùng trong nhiều dự án creative coding.',
    tech: ['React', 'Canvas', 'Physics', 'Framer Motion'],
    link: '#',
    github: '#',
    color: 'pink',
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="projects" ref={sectionRef} className="py-24 relative overflow-hidden bg-black">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Heading neon */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-300" />
            <h2
              className="text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300"
              style={{ textShadow: '0 0 30px #67e8f9, 0 0 60px #a78bfa' }}
            >
              Projects
            </h2>
          </div>
          <p className="text-white/60 max-w-lg mx-auto text-lg">
            Những không gian số tôi đã kiến tạo – mỗi dự án đều mang trọng lực riêng
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project) => (
            <div
              key={project.id}
              className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-400/40 hover:-translate-y-6 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500"
            >
              {/* Project visual placeholder */}
              <div className={`h-56 bg-gradient-to-br from-${project.color}-900/30 to-black flex items-center justify-center border-b border-white/10 relative overflow-hidden`}>
                <div className="text-8xl font-black text-white/10 group-hover:text-white/20 transition-colors tracking-tighter">
                  {project.title.split(' ')[0]}
                </div>
                {/* Neon accent */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${project.color}-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-semibold text-white tracking-tight mb-3 group-hover:text-cyan-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
                  {project.desc}
                </p>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tech.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-1 text-xs uppercase tracking-widest font-medium border border-white/30 text-white/70 rounded-3xl hover:border-purple-400 hover:text-purple-300 transition-all"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <Link
                    href={project.link}
                    className="inline-flex items-center gap-2 text-cyan-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    Xem dự án
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href={project.github}
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View more button */}
        <div className="text-center mt-16">
          <Link
            href="#"
            className="inline-flex items-center gap-3 px-10 py-5 text-lg font-medium border border-white/30 hover:border-cyan-400 hover:text-cyan-300 rounded-3xl transition-all group"
          >
            Khám phá tất cả dự án
            <span className="text-2xl group-active:rotate-45 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}