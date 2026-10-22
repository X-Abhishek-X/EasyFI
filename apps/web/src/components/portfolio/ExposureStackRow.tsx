'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import type { ExposureRow } from '@/components/types';
import { buttonClass } from '@/components/ui/Button';
import { SegmentBar } from '@/components/ui/MiniBar';
import { SeverityPill } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, MISSING } from '@/lib/format';
import { fundColor } from '@/lib/palette';

export type ExposureStackRowProps = {
  row: ExposureRow;
  /** Weight that fills the full bar track (usually the largest row's weight). */
  scale: number;
  /** Ordered source tickers (funds + "DIRECT") used for stable colors. */
  sourceOrder: readonly string[];
  /** Link for "Open in Constellation" (company fold only). */
  constellationHref?: string;
  /** Link for "Open stock page" (company fold only). */
  stockHref?: string;
  defaultOpen?: boolean;
};

/** "Direct + 2 ETFs" / "5 ETFs" / "Direct only". */
export function sourcesLabel(row: ExposureRow) {
  const direct = row.sources.some((s) => s.sourceTicker === 'DIRECT');
  const n = row.sources.filter((s) => s.sourceTicker !== 'DIRECT').length;
  const etfs = n === 1 ? '1 ETF' : `${n} ETFs`;
  if (direct && n === 0) return 'Direct only';
  return direct ? `Direct + ${etfs}` : etfs;
}

/**
 * One look-through row: identity, effective weight, and a bar split by the funds
 * (and direct position) that contribute it. Expands to the per-fund breakdown.
 */
export function ExposureStackRow({
  row,
  scale,
  sourceOrder,
  constellationHref,
  stockHref,
  defaultOpen = false,
}: ExposureStackRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const sub = row.ticker
    ? [row.sector, row.industry].filter(Boolean).join(' · ')
    : (row.sector ?? `${row.sources.length} sources`);

  return (
    <li
      className={cn(
        'rounded-[12px] border bg-surface transition-colors',
        open ? 'border-line-strong' : 'border-line hover:border-line-strong',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'grid w-full items-center gap-x-4 gap-y-2 rounded-[12px] px-4 py-3.5 text-left sm:px-5',
          "grid-cols-[14px_minmax(0,1fr)_auto] [grid-template-areas:'chev_tick_wt'_'._main_main']",
          "sm:grid-cols-[14px_104px_minmax(0,1fr)_92px_84px] sm:[grid-template-areas:'chev_tick_main_pill_wt']",
        )}
      >
        <ChevronRight
          aria-hidden
          className={cn(
            'h-4 w-4 text-faint transition-transform [grid-area:chev]',
            open && 'rotate-90',
          )}
        />
        <span className="min-w-0 [grid-area:tick]">
          <span className="block truncate font-mono text-[14px] font-bold text-fg">
            {row.ticker ?? row.name}
          </span>
          <span className="mt-0.5 block text-[11px] text-faint">{sourcesLabel(row)}</span>
        </span>
        <span className="min-w-0 [grid-area:main]">
          {row.ticker ? (
            <span className="block truncate text-[14px] font-semibold text-fg">{row.name}</span>
          ) : null}
          <span className="block truncate text-[11px] text-muted">{sub}</span>
          <SegmentBar
            className="mt-2"
            height={6}
            gap={false}
            label={`${row.ticker ?? row.name} exposure by source: ${row.sources
              .map(
                (s) =>
                  `${s.sourceTicker === 'DIRECT' ? 'direct' : s.sourceTicker} ${formatPercent(s.contribution, { digits: 2 })}`,
              )
              .join(', ')}`}
            segments={row.sources.map((s) => ({
              key: s.sourceTicker,
              label: s.sourceTicker,
              fraction: scale > 0 ? s.contribution / scale : 0,
              color: fundColor(s.sourceTicker, sourceOrder),
            }))}
          />
        </span>
        <span className="hidden justify-center [grid-area:pill] sm:flex">
          <SeverityPill level={row.concentration} />
        </span>
        <span className="text-right [grid-area:wt]">
          <span className="block text-[15px] font-semibold text-fg">
            {formatPercent(row.weight, { digits: 2 })}
          </span>
          <span className="block text-[12px] font-semibold text-muted">
            {row.value == null ? MISSING : formatMoney(row.value)}
          </span>
          <SeverityPill level={row.concentration} className="mt-1 sm:hidden" />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-line px-4 pt-4 pb-5 sm:px-5 sm:pl-[52px]"
      >
        <h4 className="mb-2.5 text-[12px] font-medium text-faint">Contribution by source</h4>
        <ul className="space-y-2">
          {row.sources.map((s) => (
            <li
              key={s.sourceTicker}
              className="grid grid-cols-[14px_56px_minmax(0,1fr)_auto] items-center gap-x-3 text-[13px] sm:grid-cols-[14px_64px_minmax(0,1fr)_110px_64px]"
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border-2"
                style={{ borderColor: fundColor(s.sourceTicker, sourceOrder) }}
              />
              <span className="font-mono text-[12.5px] font-bold text-fg">
                {s.sourceTicker === 'DIRECT' ? 'Direct' : s.sourceTicker}
              </span>
              <span className="truncate text-muted">{s.sourceName}</span>
              <span className="hidden text-right text-muted sm:block">
                {s.weightInFund == null ? (
                  <span className="text-faint">Owned outright</span>
                ) : (
                  <>
                    {formatPercent(s.weightInFund)} <span className="text-faint">in ETF</span>
                  </>
                )}
              </span>
              <span className="text-right font-semibold text-fg">
                {formatPercent(s.contribution, { digits: 2 })}
              </span>
            </li>
          ))}
        </ul>
        {constellationHref || stockHref ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {constellationHref ? (
              <Link href={constellationHref} className={buttonClass('secondary', 'sm')}>
                Open in Constellation <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            {stockHref ? (
              <Link href={stockHref} className={buttonClass('secondary', 'sm')}>
                Open stock page <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
