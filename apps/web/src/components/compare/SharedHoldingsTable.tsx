import { Card } from '@/components/ui/Card';
import { formatPercent } from '@/lib/format';
import type { SharedHolding } from './types';

export type SharedHoldingsTableProps = {
  tickerA: string;
  tickerB: string;
  holdings: SharedHolding[];
  /** Total companies held by both funds (may exceed rows shown). */
  sharedCount: number;
  /** Sum over shared names of min(weightA, weightB), fraction. */
  overlapByWeight: number | null;
};

/** Companies held by both funds with each fund's weight and a combined bar. */
export function SharedHoldingsTable({
  tickerA,
  tickerB,
  holdings,
  sharedCount,
  overlapByWeight,
}: SharedHoldingsTableProps) {
  const combined = holdings.map((h) => (h.weightA ?? 0) + (h.weightB ?? 0));
  const max = Math.max(...combined, 0.0001);
  return (
    <Card padded={false} className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <h2 className="text-[17px] font-semibold text-fg">Shared holdings</h2>
          <span className="text-[13px] text-muted">{sharedCount} companies appear in both</span>
        </div>
        <span className="text-[13px] font-medium text-up">
          Overlap by weight: {formatPercent(overlapByWeight, { digits: 0 })}
        </span>
      </div>
      <div className="scroll-x mt-4 px-5 pb-4 sm:px-6">
        <table className="w-full min-w-[720px] text-[13px]">
          <caption className="sr-only">
            Companies held by both {tickerA} and {tickerB}, with weight in each fund
          </caption>
          <thead>
            <tr className="border-b border-line-strong text-left text-[12px] text-faint">
              <th scope="col" className="w-[13%] pb-3 font-normal">
                Ticker
              </th>
              <th scope="col" className="pb-3 font-normal">
                Name
              </th>
              <th scope="col" className="pb-3 font-normal">
                Sector
              </th>
              <th scope="col" className="w-[9%] pb-3 text-right font-normal">
                {tickerA}
              </th>
              <th scope="col" className="w-[10%] pb-3 text-right font-normal">
                {tickerB}
              </th>
              <th scope="col" className="w-[18%] pb-3 pl-8 font-normal">
                Combined
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={h.ticker} className="border-b border-line/60 last:border-0">
                <th scope="row" className="py-[11px] text-left font-mono font-bold text-fg">
                  {h.ticker}
                </th>
                <td className="py-[11px] text-fg">{h.name}</td>
                <td className="py-[11px] text-muted">{h.sector ?? '—'}</td>
                <td className="py-[11px] text-right text-c1">{formatPercent(h.weightA)}</td>
                <td className="py-[11px] text-right text-c5">{formatPercent(h.weightB)}</td>
                <td className="py-[11px] pl-8">
                  <div className="h-[5px] w-full overflow-hidden rounded-full bg-track" aria-hidden>
                    <div
                      className="h-full rounded-full bg-c3"
                      style={{ width: `${((combined[i] ?? 0) / max) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
