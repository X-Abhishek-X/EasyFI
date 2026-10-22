import type { Metadata } from 'next';
import { Suspense } from 'react';
import { sectorColorMap } from '@/components/compare/colors';
import { CompareFundCard, CompareTopHoldingsCard } from '@/components/compare/CompareFundCard';
import { FundPicker } from '@/components/compare/FundPicker';
import { SharedHoldingsTable } from '@/components/compare/SharedHoldingsTable';
import type { CompareMode } from '@/components/compare/types';
import { PageHeader } from '@/components/shell/PageHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { compareFunds, getMockComparison } from '@/mocks/compare';

export const metadata: Metadata = { title: 'Compare' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const mode: CompareMode = one(sp.mode) === 'holdings' ? 'holdings' : 'sector';
  const { fundA, fundB, shared, sharedCount, overlapByWeight } = getMockComparison(
    (one(sp.a) ?? 'VOO').toUpperCase(),
    (one(sp.b) ?? 'QQQ').toUpperCase(),
  );
  const colors = sectorColorMap([fundA, fundB]);
  const href = (m: CompareMode) => `/compare?a=${fundA.ticker}&b=${fundB.ticker}&mode=${m}`;
  const sharedTickers = new Set(shared.map((h) => h.ticker));

  return (
    <>
      <PageHeader
        title="Compare"
        subtitle={`${fundA.ticker} vs ${fundB.ticker} · ${mode === 'sector' ? 'sector weights' : 'top holdings'}`}
        actions={
          <SegmentedTabs
            label="Compare by"
            value={mode}
            options={[
              { value: 'sector', label: 'Sector', href: href('sector') },
              { value: 'holdings', label: 'Holdings', href: href('holdings') },
            ]}
          />
        }
      />

      <Suspense fallback={<div className="mb-5 h-10" />}>
        <FundPicker
          className="mb-5"
          options={compareFunds.map((f) => ({ ticker: f.ticker, name: f.name }))}
          a={fundA.ticker}
          b={fundB.ticker}
        />
      </Suspense>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {mode === 'sector' ? (
          <>
            <CompareFundCard fund={fundA} colors={colors} />
            <CompareFundCard fund={fundB} colors={colors} />
          </>
        ) : (
          <>
            <CompareTopHoldingsCard fund={fundA} color="var(--c1)" sharedTickers={sharedTickers} />
            <CompareTopHoldingsCard fund={fundB} color="var(--c5)" sharedTickers={sharedTickers} />
          </>
        )}
      </div>

      <SharedHoldingsTable
        tickerA={fundA.ticker}
        tickerB={fundB.ticker}
        holdings={shared}
        sharedCount={sharedCount}
        overlapByWeight={overlapByWeight}
      />
    </>
  );
}
