import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Thanh Huy | Creative Developer • 2003',
  description: 'Antigravity Portfolio - Không gian số có trọng lực riêng',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-black text-white overflow-x-hidden">
        <Navbar />
        {children}
      </body>
    </html>
  );
}