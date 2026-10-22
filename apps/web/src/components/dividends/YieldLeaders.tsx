import { Card, CardHeader } from '@/components/ui/Card';
import { formatPercent } from '@/lib/format';
import { FREQUENCY_LABEL, type YieldLeader } from './types';

/** Highest-yielding funds you hold or watch, with payout frequency. */
export function YieldLeaders({ leaders, asOf }: { leaders: YieldLeader[]; asOf?: string | null }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Yield leaders" meta={asOf ? `trailing, as of ${asOf}` : undefined} />
      <ul className="mt-4 divide-y divide-line">
        {leaders.map((l) => (
          <li key={l.ticker} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[13px] font-bold text-fg">{l.ticker}</div>
              <div className="truncate text-[12px] text-muted">{l.name}</div>
            </div>
            <span className="text-[12px] text-faint">{FREQUENCY_LABEL[l.frequency]}</span>
            <span className="w-14 text-right text-[14px] font-semibold text-up">
              {formatPercent(l.yield)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
