'use client';

import { useEffect, useRef, useState } from 'react';
import { Code2, Brain, Palette, Sparkles } from 'lucide-react';

const skillsData = [
  {
    category: 'Frontend',
    icon: Code2,
    items: [
      { name: 'Next.js 15', level: 95 },
      { name: 'React & TypeScript', level: 92 },
      { name: 'Tailwind CSS', level: 98 },
      { name: 'Shadcn/ui', level: 90 },
    ],
  },
  {
    category: 'Backend & AI',
    icon: Brain,
    items: [
      { name: 'RESTful APIs', level: 90 },
      { name: 'Node.js / Express', level: 85 },
      { name: 'AI Integration (10x speed)', level: 88 },
      { name: 'Prompt Engineering', level: 85 },
    ],
  },
  {
    category: 'Creative & Physics',
    icon: Palette,
    items: [
      { name: 'Antigravity Canvas', level: 85 },
      { name: 'Neon Motion Design', level: 95 },
      { name: 'Physics Simulation', level: 80 },
      { name: '3D Interaction', level: 75 },
    ],
  },
];

export default function Skills() {
  const [visibleSkills, setVisibleSkills] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const allIndexes = skillsData.flatMap((cat, catIndex) =>
            cat.items.map((_, i) => catIndex * 10 + i)
          );
          setVisibleSkills(allIndexes);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="py-24 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-300" />
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300" style={{ textShadow: '0 0 30px #67e8f9, 0 0 60px #a78bfa' }}>
              Skills
            </h2>
          </div>
          <p className="text-white/60 max-w-lg mx-auto text-lg">
            Những công cụ &amp; kỹ năng tôi dùng để kiến tạo không gian số có lực hút riêng
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {skillsData.map((category, catIndex) => {
            const Icon = category.icon;
            return (
              <div
                key={category.category}
                className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-cyan-400/40 hover:-translate-y-4 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-cyan-400/20 transition-colors">
                    <Icon className="w-9 h-9 text-cyan-300" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    {category.category}
                  </h3>
                </div>

                <div className="space-y-8">
                  {category.items.map((skill, index) => {
                    const skillId = catIndex * 10 + index;
                    const isVisible = visibleSkills.includes(skillId);
                    return (
                      <div key={skill.name} className="space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-white/90">{skill.name}</span>
                          <span className="text-cyan-300 tabular-nums">{skill.level}%</span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-3xl overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-3xl transition-all duration-1500 ease-out"
                            style={{
                              width: isVisible ? `${skill.level}%` : '0%',
                              boxShadow: isVisible ? '0 0 20px #67e8f9' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-20">
          {['Antigravity', 'Creative Coding', 'Neon Glow', 'Physics Canvas', 'RESTful', 'AI 10x', 'UI/UX Magic'].map((tag) => (
            <div
              key={tag}
              className="px-7 py-3 text-sm uppercase tracking-[1px] font-medium border border-white/30 text-white/70 rounded-3xl hover:border-purple-400 hover:text-purple-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}