'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ValuePoint } from '@/components/types';
import { formatMoney, formatShortDate } from '@/lib/format';

export type ValueAreaChartProps = {
  points: ValuePoint[];
  /** Pixel height, or a CSS length such as '100%' to fill the parent. */
  height?: number | string;
  /** Show month ticks along the bottom. */
  showAxis?: boolean;
  /** Line color; defaults to brand green. Red when the range is negative if `trendColor`. */
  color?: string;
  ariaLabel?: string;
};

function monthTick(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
}

/** Green gradient area chart for portfolio value over time. */
export function ValueAreaChart({
  points,
  height = 140,
  showAxis = true,
  color = 'var(--brand)',
  ariaLabel = 'Value over time',
}: ValueAreaChartProps) {
  const id = useId().replace(/:/g, '');
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.08 || 1;
  // ~6 evenly spaced ticks
  const step = Math.max(1, Math.floor(points.length / 6));
  const ticks = points.filter((_, i) => i % step === 0).map((p) => p.date);

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.38} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min - pad, max + pad]} />
          <XAxis
            dataKey="date"
            hide={!showAxis}
            ticks={ticks}
            tickFormatter={monthTick}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line-strong)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--fg)',
            }}
            labelStyle={{ color: 'var(--muted)' }}
            labelFormatter={(l) => formatShortDate(String(l))}
            formatter={(v) => [formatMoney(Number(v)), 'Value']}
          />
          <Area
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#g${id})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: 'var(--surface)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
