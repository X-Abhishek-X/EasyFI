import type { ReactNode } from 'react';
import { seriesColor } from '@/lib/palette';

export type DonutSlice = { key: string; label: string; weight: number; color?: string };

/**
 * Pure-SVG donut (server-renderable). Slices are drawn clockwise from 12 o'clock
 * with a small gap; `center` renders inside the hole.
 */
export function Donut({
  slices,
  size = 150,
  thickness = 22,
  center,
  label,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
  label: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + Math.max(0, x.weight), 0) || 1;
  const gap = slices.length > 1 ? Math.min(3, c * 0.006) : 0;
  const offsets = slices.reduce<number[]>((acc, x, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1]! + (Math.max(0, slices[i - 1]!.weight) / total) * c);
    return acc;
  }, []);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={thickness}
        />
        {slices.map((s, i) => {
          const len = (Math.max(0, s.weight) / total) * c;
          const dash = Math.max(0, len - gap);
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color ?? seriesColor(i, s.label)}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-(offsets[i] ?? 0)}
            >
              <title>{`${s.label} ${(s.weight * 100).toFixed(1)}%`}</title>
            </circle>
          );
        })}
      </svg>
      {center ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      ) : null}
    </div>
  );
}

/** Standard center content: big number + small caption. */
export function DonutCenter({ value, caption }: { value: ReactNode; caption: ReactNode }) {
  return (
    <>
      <span className="text-[26px] leading-none font-semibold tracking-tight text-fg">{value}</span>
      <span className="mt-1 max-w-[70%] text-[10.5px] leading-tight text-muted">{caption}</span>
    </>
  );
}
