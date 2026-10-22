import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, MISSING, trendClass } from '@/lib/format';
import { AsOf } from './AsOf';

export type StatDelta = {
  /** Fractional change, e.g. 0.182 for +18.2%. */
  value: number | null;
  /** Text after the delta, e.g. "past year". */
  label: string;
};

export type StatValueProps = {
  label: ReactNode;
  /** Money amount; null renders "—" (never $0). */
  value: number | null;
  /** Override formatted value (e.g. "2.9%"). */
  display?: string;
  deltas?: StatDelta[];
  /** Neutral trailing note, e.g. "3 portfolios". */
  note?: ReactNode;
  asOf?: string | null;
  size?: 'md' | 'lg';
  className?: string;
};

/** Big number + colored deltas (e.g. "$75,306 / +18.2% past year · 3 portfolios"). */
export function StatValue({
  label,
  value,
  display,
  deltas = [],
  note,
  asOf,
  size = 'lg',
  className,
}: StatValueProps) {
  const text = display ?? (value == null ? MISSING : formatMoney(value));
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[13px] text-muted">{label}</div>
      <div
        className={cn(
          'mt-1.5 font-semibold tracking-tight text-fg',
          size === 'lg' ? 'text-[32px] leading-9 sm:text-[34px]' : 'text-[26px] leading-8',
        )}
      >
        {text}
      </div>
      {deltas.length || note ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px]">
          {deltas.map((d, i) => (
            <span key={d.label} className={trendClass(d.value)}>
              {i > 0 ? <span className="mr-1.5 text-faint">·</span> : null}
              {formatPercent(d.value, { signed: true })} {d.label}
            </span>
          ))}
          {note ? (
            <span className="text-up">
              {deltas.length ? <span className="mr-1.5 text-faint">·</span> : null}
              {note}
            </span>
          ) : null}
        </div>
      ) : null}
      {asOf !== undefined ? <AsOf date={asOf} className="mt-1 block" /> : null}
    </div>
  );
}
