import Link from 'next/link';
import type { PortfolioSummary } from '@/components/types';
import { SegmentBar } from '@/components/ui/MiniBar';
import { Pill } from '@/components/ui/Pill';
import { formatMoney, formatPercent, MISSING } from '@/lib/format';
import { scoreClass, seriesColor } from '@/lib/palette';

const TYPE_LABEL = {
  actual: 'Actual',
  hypothetical: 'Hypothetical',
  watchlist: 'Watchlist',
} as const;

export type PortfolioRiskCardProps = {
  portfolio: PortfolioSummary;
  href: string;
  showType?: boolean;
};

/** Portfolio summary: name, value, holdings + top holding, mix strip, diversification score. */
export function PortfolioRiskCard({ portfolio: p, href, showType }: PortfolioRiskCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-[15px] font-semibold text-fg group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {p.name}
        </h3>
        <span className="text-[15px] font-semibold text-fg">
          {p.totalValue == null ? MISSING : formatMoney(p.totalValue)}
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
        <span>
          {p.holdingsCount} {p.holdingsCount === 1 ? 'holding' : 'holdings'}
        </span>
        {p.topHolding ? (
          <>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>
              top: {p.topHolding.ticker} {formatPercent(p.topHolding.weight)}
            </span>
          </>
        ) : null}
        {showType ? (
          <Pill tone="neutral" className="ml-1 h-5 px-2 text-[11px] font-medium">
            {TYPE_LABEL[p.type]}
          </Pill>
        ) : null}
      </p>
      <SegmentBar
        className="mt-5"
        height={5}
        segments={p.mix.map((s, i) => ({
          key: s.key,
          label: s.label,
          fraction: s.weight,
          color: seriesColor(i, s.label),
        }))}
      />
      <p className="mt-5 flex items-center gap-4 text-[13px]">
        <span className="text-muted">Diversification</span>
        <span className={`font-semibold ${scoreClass(p.diversificationScore)}`}>
          {p.diversificationScore ?? MISSING}/100
        </span>
      </p>
    </Link>
  );
}
