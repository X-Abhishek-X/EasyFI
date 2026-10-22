import type { AllocationSlice } from '@/components/types';
import { MiniBar } from '@/components/ui/MiniBar';
import { cn } from '@/lib/cn';
import { formatPercent, trendClass } from '@/lib/format';
import { seriesColor } from '@/lib/palette';

export type LegendVariant = 'bars' | 'compact' | 'bars-no-change';

/**
 * Legend rows for a donut: dot · label · mini bar · weight · today change.
 * Bars are scaled to the largest slice so small slices stay visible.
 */
export function AllocationLegend({
  slices,
  variant = 'bars',
  columnLabel = 'Sector',
  className,
}: {
  slices: AllocationSlice[];
  variant?: LegendVariant;
  columnLabel?: string;
  className?: string;
}) {
  const max = Math.max(...slices.map((s) => s.weight), 0.0001);

  if (variant === 'compact') {
    return (
      <ul
        className={cn(
          'grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
          className,
        )}
      >
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: seriesColor(i, s.label) }}
            />
            <span className="min-w-0 flex-1 truncate text-fg">{s.label}</span>
            {s.changeToday !== undefined ? (
              <span className={cn('shrink-0 text-right text-[12px]', trendClass(s.changeToday))}>
                {formatPercent(s.changeToday, { signed: true })}
              </span>
            ) : null}
            <span className="w-9 shrink-0 text-right font-semibold text-fg">
              {formatPercent(s.weight, { digits: 0 })}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const showChange = variant === 'bars';
  return (
    <table className={cn('w-full text-[13px]', className)}>
      <thead>
        <tr className="text-left text-[11px] text-faint">
          <th scope="col" className="pb-2 font-normal">
            {columnLabel}
          </th>
          <th scope="col" className="hidden pb-2 font-normal sm:table-cell">
            Weight
          </th>
          <th scope="col" className="pb-2 text-right font-normal sm:sr-only">
            Weight
          </th>
          {showChange ? (
            <th scope="col" className="pb-2 text-right font-normal">
              Today
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {slices.map((s, i) => {
          const color = seriesColor(i, s.label);
          return (
            <tr key={s.key}>
              <th scope="row" className="py-[5px] pr-3 text-left font-normal">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="truncate text-fg">{s.label}</span>
                </span>
              </th>
              <td className="hidden w-[38%] py-[5px] pr-3 sm:table-cell">
                <MiniBar fraction={s.weight / max} color={color} />
              </td>
              <td className="w-12 py-[5px] text-right font-semibold text-fg">
                {formatPercent(s.weight, { digits: 0 })}
              </td>
              {showChange ? (
                <td className={cn('w-16 py-[5px] text-right', trendClass(s.changeToday))}>
                  {formatPercent(s.changeToday, { signed: true })}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
