'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ExposureRow, FoldBy, FundRef, LookThroughView } from '@/components/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConstellationView } from './ConstellationView';
import { ExposureStackList } from './ExposureStackList';
import type { ConstellationHolding } from './types';

export type LookThroughBodyProps = {
  basePath: string;
  fold: FoldBy;
  view: LookThroughView;
  rows: ExposureRow[];
  funds: FundRef[];
  holdings: ConstellationHolding[];
  sourceOrder: readonly string[];
  /** Ticker to focus/open on load (?focus=). */
  focus?: string | null;
};

const PLACEHOLDER: Record<FoldBy, string> = {
  company: 'Search by ticker or name…',
  sector: 'Search sectors…',
  industry: 'Search industries…',
};

/** Search + Display controls, then the Stack list or the Constellation view. */
export function LookThroughBody({
  basePath,
  fold,
  view,
  rows,
  funds,
  holdings,
  sourceOrder,
  focus = null,
}: LookThroughBodyProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? rows.filter((r) =>
            [r.ticker, r.name, r.sector, r.industry].some((v) => v?.toLowerCase().includes(q)),
          )
        : rows,
    [rows, q],
  );

  return (
    <div className="mt-3">
      <div className="mb-4 flex gap-3">
        <SearchInput
          className="flex-1"
          label="Filter holdings"
          placeholder={view === 'constellation' ? PLACEHOLDER.company : PLACEHOLDER[fold]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="secondary"
          className="h-10"
          disabled
          title="Display options are coming soon"
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          <span className="hidden sm:inline">Display</span>
          <span className="sr-only sm:hidden">Display options</span>
        </Button>
      </div>

      {view === 'constellation' ? (
        <ConstellationView
          funds={funds}
          holdings={holdings}
          sourceOrder={sourceOrder}
          initialKey={focus}
          query={query}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`Nothing matches “${query.trim()}”`}
          body="Try a ticker like NVDA, a company name, or a sector."
          action={
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ExposureStackList
          rows={filtered}
          sourceOrder={sourceOrder}
          openKey={focus ?? undefined}
          constellationHref={(t) => `${basePath}?view=constellation&focus=${encodeURIComponent(t)}`}
          stockHref={(t) =>
            `/explorer?q=${encodeURIComponent(`Tell me about ${t} and which of my funds hold it`)}`
          }
        />
      )}
    </div>
  );
}
