import type { MarketQuote } from '@/components/types';
import { AsOf } from '@/components/ui/AsOf';
import { cn } from '@/lib/cn';
import { formatPercent, trendClass } from '@/lib/format';

/** Horizontal ticker strip: TICKER · name · daily change. Scrolls inside itself on phones. */
export function MarketContextStrip({ quotes }: { quotes: MarketQuote[] }) {
  const asOf = quotes.find((q) => q.asOf)?.asOf ?? null;
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface">
      <ul className="scroll-x no-scrollbar flex gap-0 px-2 py-4 sm:py-5">
        {quotes.map((q, i) => (
          <li
            key={q.ticker}
            className={cn(
              'flex min-w-[220px] flex-1 items-baseline gap-2.5 px-4 text-[13px]',
              i > 0 && 'border-l border-line',
            )}
          >
            <span className="font-mono text-[13px] font-bold text-fg">{q.ticker}</span>
            <span className="min-w-0 flex-1 truncate text-muted">{q.name}</span>
            <span className={cn('font-medium', trendClass(q.change))}>
              {formatPercent(q.change, { digits: 2, signed: true })}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-6 py-2">
        <AsOf date={asOf} prefix="Daily change, close of" />
      </div>
    </div>
  );
}
