import { cn } from '@/lib/cn';

/** Thin horizontal progress bar. `fraction` is 0–1 of the track (clamped). */
export function MiniBar({
  fraction,
  color = 'var(--c1)',
  className,
  height = 4,
  label,
}: {
  fraction: number;
  color?: string;
  className?: string;
  height?: number;
  label?: string;
}) {
  const w = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-track', className)}
      style={{ height }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export type StackSegment = { key: string; fraction: number; color: string; label?: string };

/** Segmented bar (allocation strip or per-ETF contribution). Fractions are of the full track. */
export function SegmentBar({
  segments,
  height = 6,
  className,
  label,
  gap = true,
}: {
  segments: StackSegment[];
  height?: number;
  className?: string;
  label?: string;
  gap?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full overflow-hidden rounded-full bg-track',
        gap && 'gap-[2px]',
        className,
      )}
      style={{ height }}
      role="img"
      aria-label={
        label ??
        segments.map((s) => `${s.label ?? s.key} ${(s.fraction * 100).toFixed(1)}%`).join(', ')
      }
    >
      {segments.map((s) => (
        <div
          key={s.key}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ width: `${Math.max(0, s.fraction) * 100}%`, background: s.color }}
          title={s.label ? `${s.label} ${(s.fraction * 100).toFixed(1)}%` : undefined}
        />
      ))}
    </div>
  );
}
