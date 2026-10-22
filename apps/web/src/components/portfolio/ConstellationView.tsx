'use client';

import { useMemo, useState } from 'react';
import type { FundRef } from '@/components/types';
import { ConstellationGraph } from './ConstellationGraph';
import { HoldingsSidePanel } from './HoldingsSidePanel';
import type { ConstellationHolding } from './types';

export type ConstellationViewProps = {
  funds: FundRef[];
  holdings: ConstellationHolding[];
  sourceOrder: readonly string[];
  /** Ticker/key selected on load (e.g. from ?focus=NVDA). */
  initialKey?: string | null;
  /** Lower-cased search text; filters the panel and dims non-matching nodes. */
  query?: string;
};

function matches(h: ConstellationHolding, q: string) {
  return (
    h.ticker.toLowerCase().includes(q) ||
    h.name.toLowerCase().includes(q) ||
    (h.sector ?? '').toLowerCase().includes(q)
  );
}

/** Graph + side panel with shared selection state. */
export function ConstellationView({
  funds,
  holdings,
  sourceOrder,
  initialKey = null,
  query = '',
}: ConstellationViewProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialKey ?? holdings.find((h) => h.labeled)?.key ?? null,
  );
  const q = query.trim().toLowerCase();
  const matchKeys = useMemo(
    () => (q ? new Set(holdings.filter((h) => matches(h, q)).map((h) => h.key)) : null),
    [holdings, q],
  );

  const panelItems = useMemo(() => {
    const base = holdings
      .filter((h) => (matchKeys ? matchKeys.has(h.key) : h.labeled))
      .sort((a, b) => b.weight - a.weight);
    const sel = holdings.find((h) => h.key === selectedKey);
    // an unlabeled node picked in the graph gets its card pinned to the top
    if (sel && !base.includes(sel)) return [sel, ...base];
    return base;
  }, [holdings, matchKeys, selectedKey]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ConstellationGraph
        funds={funds}
        holdings={holdings}
        sourceOrder={sourceOrder}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        matchKeys={matchKeys}
      />
      <div className="relative min-h-[420px] lg:min-h-0">
        <HoldingsSidePanel
          className="max-h-[560px] lg:absolute lg:inset-0 lg:max-h-none"
          items={panelItems}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      </div>
    </div>
  );
}
