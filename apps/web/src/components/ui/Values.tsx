import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, MISSING, trendClass } from '@/lib/format';
import { UnpricedPill } from './Pill';

/** Money; null → "—" + Unpriced pill (unless `quiet`). */
export function Money({
  value,
  cents,
  quiet,
  className,
}: {
  value: number | null | undefined;
  cents?: boolean;
  quiet?: boolean;
  className?: string;
}) {
  if (value == null || !Number.isFinite(value)) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span aria-label="No price">{MISSING}</span>
        {quiet ? null : <UnpricedPill />}
      </span>
    );
  }
  return <span className={className}>{formatMoney(value, { cents })}</span>;
}

/** Percent from a fraction. `delta` colors it green/red and adds a sign. */
export function Percent({
  value,
  digits = 1,
  delta,
  className,
}: {
  value: number | null | undefined;
  digits?: number;
  delta?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(delta && trendClass(value), className)}>
      {formatPercent(value, { digits, signed: delta })}
    </span>
  );
}
