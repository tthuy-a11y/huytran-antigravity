'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // === SCROLL EFFECT: thu nhỏ + blur mạnh hơn ===
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '#about' },
    { name: 'Skills', href: '#skills' },
    { name: 'Projects', href: '#projects' },
    { name: 'Journey', href: '#journey' },
    { name: 'Contact', href: '#contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href; // sau này bạn có thể thay bằng scroll spy nếu muốn
  };

  // Hide navbar entirely on the landing page, creative page, and system page
  if (pathname === '/' || pathname === '/creative' || pathname === '/system') return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-4 bg-black/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl'
            : 'py-8 bg-transparent backdrop-blur-md'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          {/* LOGO - Thanh Huy neon */}
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="group flex items-center gap-2 text-3xl font-bold tracking-tighter transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-7 h-7 text-cyan-300 group-hover:animate-pulse" />
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300"
              style={{
                textShadow:
                  '0 0 10px #67e8f9, 0 0 20px #67e8f9, 0 0 40px #a78bfa',
              }}
            >
              Thanh Huy
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-10 text-sm uppercase tracking-widest font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`relative py-2 transition-all duration-300 group ${
                  isActive(link.href)
                    ? 'text-cyan-300'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {/* Physics lift + neon glow */}
                <span className="relative z-10 inline-block transition-all duration-300 group-hover:-translate-y-0.5 group-active:scale-95">
                  {link.name}
                </span>

                {/* Neon underline + glow */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 ${
                    isActive(link.href)
                      ? 'w-full shadow-[0_0_12px_#67e8f9]'
                      : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE - Available badge + Hamburger */}
          <div className="flex items-center gap-4">
            {/* Badge giống hero */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-white/30 bg-transparent text-white/90 hover:border-cyan-400/70 hover:text-cyan-300 transition-all"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              AVAILABLE FOR PROJECTS
            </Button>

            {/* Hamburger Button dùng shadcn/ui */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden text-white hover:bg-white/10 hover:text-cyan-300 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU - Slide-in animation đẹp */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[999] md:hidden bg-black/95 backdrop-blur-3xl pt-24 transition-all duration-500"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="flex flex-col items-center justify-center h-full gap-10 text-3xl font-light tracking-widest"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`transition-all duration-300 hover:text-cyan-300 hover:scale-110 ${
                  isActive(link.href) ? 'text-cyan-300' : 'text-white/90'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* CTA trong mobile menu */}
            <Button
              onClick={() => setIsMobileOpen(false)}
              className="mt-12 px-12 py-7 text-xl font-medium bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110 transition-all"
            >
              Khám phá không gian
            </Button>
          </div>
        </div>
      )}
    </>
  );
}