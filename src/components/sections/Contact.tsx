'use client';

import { Mail, Code2, Link, Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cảm ơn bạn! Tin nhắn đã được gửi (demo). Trong production mình sẽ kết nối email thực.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-black border-t border-white/10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Info */}
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-cyan-300" />
              <h2 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                Liên hệ
              </h2>
            </div>

            <p className="text-2xl text-white/80 max-w-md mb-12">
              Muốn cùng mình kiến tạo một không gian số có trọng lực riêng?
            </p>

            <div className="space-y-8">
              <a href="mailto:your.email@example.com" className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
                  <Mail className="w-7 h-7 text-cyan-300" />
                </div>
                <div>
                  <div className="text-white/70">Email</div>
                  <div className="text-lg text-white group-hover:text-cyan-300 transition-colors">huy@thanhhuy.dev</div>
                </div>
              </a>

              <a href="#" className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center group-hover:bg-purple-400/20 transition-colors">
                  <Code2 className="w-7 h-7 text-purple-300" />
                </div>
                <div>
                  <div className="text-white/70">GitHub</div>
                  <div className="text-lg text-white group-hover:text-purple-300 transition-colors">@thanhhuy</div>
                </div>
              </a>

              <a href="#" className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center group-hover:bg-pink-400/20 transition-colors">
                  <Link className="w-7 h-7 text-pink-300" />
                </div>
                <div>
                  <div className="text-white/70">LinkedIn</div>
                  <div className="text-lg text-white group-hover:text-pink-300 transition-colors">Thanh Huy</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tên của bạn</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 focus:border-cyan-400 rounded-3xl px-6 py-5 text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="Thanh Huy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 focus:border-cyan-400 rounded-3xl px-6 py-5 text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="ban@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Tin nhắn</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full bg-black/50 border border-white/20 focus:border-cyan-400 rounded-3xl px-6 py-5 text-white placeholder-white/40 focus:outline-none transition-all resize-none"
                  placeholder="Mình muốn hợp tác về..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-7 bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110 text-xl font-medium rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
              >
                GỬI TIN NHẮN
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}