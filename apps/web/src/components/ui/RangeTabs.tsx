'use client';

import { cn } from '@/lib/cn';

export type RangeKey = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'MAX';
export const HOME_RANGES: RangeKey[] = ['1D', '1M', '1Y'];
export const PORTFOLIO_RANGES: RangeKey[] = ['7D', '1M', '3M', 'YTD', '1Y', 'MAX'];

/** Compact chart range selector (1D / 1M / 1Y …). */
export function RangeTabs({
  ranges,
  value,
  onChange,
  className,
}: {
  ranges: RangeKey[];
  value: RangeKey;
  onChange: (r: RangeKey) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Chart range"
      className={cn('flex items-center gap-0.5', className)}
    >
      {ranges.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r)}
            className={cn(
              'h-6 rounded-md px-2 text-[11px] font-medium transition-colors',
              active ? 'bg-surface-3 font-semibold text-fg' : 'text-faint hover:text-fg',
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
