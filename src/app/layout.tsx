import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WarpCanvasWrapper } from '@/components/canvas/WarpCanvasWrapper';
import CommanderTransmission from '@/components/CommanderTransmission';

export const metadata: Metadata = {
  title: 'Thanh Huy | Creative Developer • 2003',
  description: 'Antigravity Portfolio - Không gian số có trọng lực riêng',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#010204',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#010204] text-white overflow-x-hidden">
        {/* TẦNG 3D GLOBAL — tắt tự động trên các route có Canvas riêng */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <WarpCanvasWrapper />
        </div>

        {/* TẦNG DOM — nội dung thực tế */}
        <div className="relative z-10">
          {children}
        </div>

        <CommanderTransmission />
      </body>
    </html>
  );
}
