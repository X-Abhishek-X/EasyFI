'use client';

import { ArrowLeftRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

export type FundOption = { ticker: string; name: string };

export type FundPickerProps = {
  options: FundOption[];
  a: string;
  b: string;
  className?: string;
};

/** Two fund selects; changing either updates ?a=&b= (keeps other params like ?mode=). */
export function FundPicker({ options, a, b, className }: FundPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const push = (next: { a: string; b: string }) => {
    const sp = new URLSearchParams(params?.toString());
    sp.set('a', next.a);
    sp.set('b', next.b);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const select = (label: string, value: string, other: string, onPick: (v: string) => void) => (
    <label className="relative block min-w-0 flex-1 sm:w-[240px] sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onPick(e.target.value)}
        className="h-10 w-full appearance-auto rounded-[10px] border border-line bg-surface pr-8 pl-3 text-[14px] text-fg focus:border-line-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-brand"
      >
        {options.map((o) => (
          <option key={o.ticker} value={o.ticker} disabled={o.ticker === other}>
            {o.ticker} · {o.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {select('First fund', a, b, (v) => push({ a: v, b }))}
      <button
        type="button"
        onClick={() => push({ a: b, b: a })}
        aria-label="Swap funds"
        title="Swap funds"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-fg"
      >
        <ArrowLeftRight aria-hidden className="h-4 w-4" />
      </button>
      {select('Second fund', b, a, (v) => push({ a, b: v }))}
    </div>
  );
}
