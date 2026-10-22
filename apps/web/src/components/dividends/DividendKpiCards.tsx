import { AsOf } from '@/components/ui/AsOf';
import { Card } from '@/components/ui/Card';
import { formatMoney, formatPercent, trendClass } from '@/lib/format';
import type { DividendKpis } from './types';

/** Three headline cards: trailing 12 months, portfolio yield, next 30 days. */
export function DividendKpiCards({ kpis }: { kpis: DividendKpis }) {
  const items = [
    {
      label: 'Trailing 12 months',
      value: formatMoney(kpis.trailing12m),
      foot: (
        <span className={trendClass(kpis.trailing12mChange)}>
          {formatPercent(kpis.trailing12mChange, { signed: true })} vs prior year
        </span>
      ),
    },
    {
      label: 'Portfolio yield',
      value: formatPercent(kpis.portfolioYield),
      foot: <span className="text-muted">On tracked market value</span>,
    },
    {
      label: 'Next 30 days',
      value: formatMoney(kpis.next30Days),
      foot: <span className="text-muted">Estimated distributions</span>,
    },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {items.map((k) => (
        <Card key={k.label} className="sm:!px-7 sm:!py-6">
          <h2 className="text-[13px] font-medium text-muted">{k.label}</h2>
          <p className="mt-2.5 text-[34px] leading-none font-semibold tracking-[-0.02em] text-fg">
            {k.value}
          </p>
          <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[13px]">
            {k.foot}
            <AsOf date={kpis.asOf} />
          </p>
        </Card>
      ))}
    </div>
  );
}
