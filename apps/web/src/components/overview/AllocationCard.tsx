'use client';

import { useState } from 'react';
import { Donut, DonutCenter } from '@/components/charts/Donut';
import type { AllocationData, AllocationMode } from '@/components/types';
import { AsOf } from '@/components/ui/AsOf';
import { Card } from '@/components/ui/Card';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { cn } from '@/lib/cn';
import { scoreClass } from '@/lib/palette';
import { AllocationLegend } from './AllocationLegend';

const MODE_LABEL: Record<AllocationMode, string> = {
  sector: 'Sector',
  holding: 'Holding',
  overlap: 'Overlap',
};

export type AllocationCardProps = {
  /** One dataset per available tab, in tab order. */
  data: AllocationData[];
  /** Diversification score 0–100 shown in the donut hole; null → "—". */
  diversificationScore: number | null;
  asOf: string | null;
  /** 'wide' = legend with bars + Today column (Home); 'compact' = two-column legend (Portfolio). */
  variant?: 'wide' | 'compact';
  className?: string;
};

/** Allocation donut with diversification score and legend; tabs switch Sector/Holding/Overlap. */
export function AllocationCard({
  data,
  diversificationScore,
  asOf,
  variant = 'wide',
  className,
}: AllocationCardProps) {
  const [mode, setMode] = useState<AllocationMode>(data[0]?.mode ?? 'sector');
  const current = data.find((d) => d.mode === mode) ?? data[0];
  const slices = current?.slices ?? [];
  const wide = variant === 'wide';

  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13px] font-medium text-muted">Allocation</h2>
          <AsOf date={asOf} className="hidden sm:inline" />
        </div>
        <SegmentedTabs
          label="Allocation breakdown"
          size="sm"
          value={mode}
          onChange={setMode}
          options={data.map((d) => ({ value: d.mode, label: MODE_LABEL[d.mode] }))}
        />
      </div>
      <div
        className={cn(
          'mt-4 flex flex-1 flex-col items-center gap-6 sm:flex-row',
          wide ? 'sm:items-center' : 'sm:items-center',
        )}
      >
        <Donut
          slices={slices}
          size={wide ? 148 : 100}
          thickness={wide ? 18 : 14}
          label={`${MODE_LABEL[mode]} allocation`}
          center={
            wide ? (
              <DonutCenter
                value={
                  <span className={scoreClass(diversificationScore)}>
                    {diversificationScore ?? '—'}
                  </span>
                }
                caption="/100 diversification"
              />
            ) : (
              <DonutCenter
                value={<span className="text-[20px]">{diversificationScore ?? '—'}</span>}
                caption="/100"
              />
            )
          }
        />
        <div className="w-full min-w-0 flex-1">
          <AllocationLegend
            slices={slices}
            variant={wide ? 'bars' : 'compact'}
            columnLabel={MODE_LABEL[mode]}
          />
        </div>
      </div>
      <AsOf date={asOf} className="mt-3 sm:hidden" />
    </Card>
  );
}
