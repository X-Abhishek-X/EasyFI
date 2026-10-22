'use client';

import { Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MiniBar } from '@/components/ui/MiniBar';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, MISSING } from '@/lib/format';
import type { ConstellationHolding } from './types';

export type HoldingsSidePanelProps = {
  items: ConstellationHolding[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  className?: string;
};

const CONC = {
  high: { label: 'High', cls: 'text-[var(--sev-high-fg)]' },
  medium: { label: 'Medium', cls: 'text-[var(--sev-med-fg)]' },
  low: { label: 'Low', cls: 'text-muted' },
} as const;

/** Scrollable list of holding cards next to the constellation; the selected card is highlighted. */
export function HoldingsSidePanel({
  items,
  selectedKey,
  onSelect,
  className,
}: HoldingsSidePanelProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const max = Math.max(...items.map((i) => i.weight), 0.0001);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !selectedKey) return;
    const el = list.querySelector<HTMLElement>(`[data-key="${CSS.escape(selectedKey)}"]`);
    if (!el || list.scrollHeight <= list.clientHeight) return;
    const top = el.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
    }
  }, [selectedKey]);

  return (
    <aside
      aria-labelledby="holdings-panel-title"
      className={cn(
        'flex min-h-0 flex-col rounded-[var(--radius-card)] border border-line bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <h2 id="holdings-panel-title" className="text-[16px] font-semibold text-fg">
          Holdings
        </h2>
        <span title="Ranked by effective weight across every fund you own" className="text-faint">
          <Info aria-hidden className="h-3.5 w-3.5" />
          <span className="sr-only">Ranked by effective weight across every fund you own</span>
        </span>
      </div>
      <ul ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 pb-4">
        {items.map((h) => {
          const sel = h.key === selectedKey;
          const n = h.funds.length;
          return (
            <li key={h.key} data-key={h.key}>
              <button
                type="button"
                aria-pressed={sel}
                onClick={() => onSelect(h.key)}
                className={cn(
                  'block w-full rounded-[12px] border bg-surface-2 px-3.5 pt-3 pb-3.5 text-left transition-colors',
                  sel ? 'border-up/70 bg-surface-3' : 'border-line hover:border-line-strong',
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[14px] font-bold text-fg">{h.ticker}</span>
                    <span className="text-[11px] text-faint">
                      {h.direct ? 'Direct + ' : ''}
                      {n === 1 ? '1 ETF' : `${n} ETFs`}
                    </span>
                  </span>
                  <span className={cn('text-[12px] font-semibold', CONC[h.concentration].cls)}>
                    {CONC[h.concentration].label}
                  </span>
                </span>
                <span className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] text-fg">{h.name}</span>
                  <span className="text-[14px] font-semibold text-fg">
                    {formatPercent(h.weight)}
                  </span>
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-faint">{h.sector ?? MISSING}</span>
                  <span className="text-[11px] font-medium text-muted">
                    {h.value == null ? MISSING : formatMoney(h.value)}
                  </span>
                </span>
                <MiniBar className="mt-3" height={5} fraction={h.weight / max} color="var(--c3)" />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
