import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/shell/Logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(600px 300px at 50% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 70%)',
        }}
      />
      <Link href="/" aria-label="EasyFI home" className="relative mb-8">
        <Logo />
      </Link>
      <div className="relative w-full max-w-[400px]">{children}</div>
    </main>
  );
}
