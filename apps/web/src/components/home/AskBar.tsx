'use client';

import { CornerDownLeft, Sparkle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';

export type AskBarProps = {
  suggestions: string[];
  placeholder?: string;
  className?: string;
};

/** Question box that hands off to the Investment Explorer (/explorer?q=…). */
export function AskBar({
  suggestions,
  placeholder = 'Ask about your portfolio, a company, or an ETF…',
  className,
}: AskBarProps) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const go = (text: string) => {
    const t = text.trim();
    if (t) router.push(`/explorer?q=${encodeURIComponent(t)}`);
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
      className={cn(
        'flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-2 lg:flex-row lg:items-center',
        className,
      )}
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
        <Sparkle aria-hidden className="h-[18px] w-[18px] shrink-0 fill-up text-up" />
        <span className="sr-only">Ask EasyFI</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full min-w-0 bg-transparent text-[14px] text-fg placeholder:text-faint focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-2">
        <ul className="no-scrollbar scroll-x flex flex-1 gap-2" aria-label="Suggested questions">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => go(s)}
                className="h-8 rounded-full border border-line-strong px-4 text-[13px] whitespace-nowrap text-fg hover:bg-surface-2"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="submit"
          aria-label="Ask"
          className="inline-flex h-8 w-12 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-fg hover:bg-surface-3"
        >
          <CornerDownLeft aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
