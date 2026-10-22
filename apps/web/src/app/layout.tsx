import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { themeInitScript } from '@/lib/theme';
import './globals.css';

const ui = Geist({ subsets: ['latin'], variable: '--font-ui', display: 'swap' });
const code = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-code',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'EasyFI', template: '%s · EasyFI' },
  description: 'See what your portfolio really owns.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070b12' },
    { media: '(prefers-color-scheme: light)', color: '#f3f5f9' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${ui.variable} ${code.variable}`}
    >
      <head>
        {/* Applies the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
