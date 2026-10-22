import type { ReactNode } from 'react';
import { Sidebar } from '@/components/shell/Sidebar';
import { mockUser } from '@/mocks/user';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="md:flex">
      <Sidebar user={mockUser} />
      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6 md:px-8 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
