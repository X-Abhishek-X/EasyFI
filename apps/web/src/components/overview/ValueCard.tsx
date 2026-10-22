'use client';

import { useState } from 'react';
import { ValueAreaChart } from '@/components/charts/ValueAreaChart';
import type { ValuePoint } from '@/components/types';
import { Card } from '@/components/ui/Card';
import { RangeTabs, type RangeKey } from '@/components/ui/RangeTabs';
import { AsOf } from '@/components/ui/AsOf';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, MISSING, trendClass } from '@/lib/format';

export type RangeSeries = {
  points: ValuePoint[];
  /** Change over the range, fraction. */
  change: number | null;
  /** e.g. "past year", "past month". */
  changeLabel: string;
};

export type ValueCardProps = {
  title: string;
  /** Current total value; null → "—". */
  value: number | null;
  /** Today's change (fraction) shown after the range change, optional. */
  changeToday?: number | null;
  /** Neutral trailing note, e.g. "3 portfolios". */
  note?: string;
  series: Partial<Record<RangeKey, RangeSeries>>;
  ranges: RangeKey[];
  defaultRange: RangeKey;
  asOf: string | null;
  /** 'tall' = chart under the number (Home); 'split' = chart beside it (Portfolio). */
  layout?: 'tall' | 'split';
  className?: string;
};

/** "Total tracked value" / "Portfolio value" card with range tabs and an area chart. */
export function ValueCard({
  title,
  value,
  changeToday,
  note,
  series,
  ranges,
  defaultRange,
  asOf,
  layout = 'tall',
  className,
}: ValueCardProps) {
  const [range, setRange] = useState<RangeKey>(defaultRange);
  const s = series[range];
  const delta = s ? (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px]">
      <span className={trendClass(s.change)}>
        {formatPercent(s.change, { signed: true })} {s.changeLabel}
      </span>
      {changeToday !== undefined ? (
        <>
          <span className="text-faint">·</span>
          <span className={trendClass(changeToday)}>
            {formatPercent(changeToday, { signed: true })} today
          </span>
        </>
      ) : null}
      {note ? (
        <>
          <span className="text-faint">·</span>
          <span className="text-up">{note}</span>
        </>
      ) : null}
    </div>
  ) : null;

  const big = (
    <div className="mt-2 text-[32px] leading-9 font-semibold tracking-[-0.02em] text-fg sm:text-[34px]">
      {value == null ? MISSING : formatMoney(value)}
    </div>
  );

  return (
    <Card className={cn('flex flex-col !pb-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted">{title}</h2>
        {layout === 'tall' ? <RangeTabs ranges={ranges} value={range} onChange={setRange} /> : null}
      </div>
      {layout === 'tall' ? (
        <>
          {big}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            {delta}
            <AsOf date={asOf} />
          </div>
          <div className="-mx-1 mt-2 min-h-[112px] flex-1">
            {s ? <ValueAreaChart points={s.points} height="100%" /> : null}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {big}
            {delta}
            <AsOf date={asOf} className="mt-2 block" />
          </div>
          <div className="w-full sm:-mt-6 sm:w-[46%]">
            <RangeTabs
              ranges={ranges}
              value={range}
              onChange={setRange}
              className="mb-1 sm:justify-end"
            />
            {s ? <ValueAreaChart points={s.points} height={84} showAxis={false} /> : null}
          </div>
        </div>
      )}
    </Card>
  );
}
