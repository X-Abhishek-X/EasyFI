import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AllocationCard } from '@/components/overview/AllocationCard';
import { ValueCard } from '@/components/overview/ValueCard';
import { LookThroughBody } from '@/components/portfolio/LookThroughBody';
import { LookThroughToolbar } from '@/components/portfolio/LookThroughToolbar';
import { PageHeader } from '@/components/shell/PageHeader';
import type { FoldBy, LookThroughView } from '@/components/types';
import { LinkButton } from '@/components/ui/Button';
import { PORTFOLIO_RANGES } from '@/components/ui/RangeTabs';
import { formatIsoDate } from '@/lib/format';
import {
  constellationHoldings,
  funds,
  getPortfolioDetail,
  portfolioAllocation,
  portfolioSeries,
  rowsByFold,
  sourceOrder,
} from '@/mocks/portfolio';

type Params = Promise<{ id: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: getPortfolioDetail(id)?.name ?? 'Portfolio' };
}

export default async function PortfolioPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const p = getPortfolioDetail(id);
  if (!p) notFound();

  const foldParam = one(sp.fold);
  const fold: FoldBy = foldParam === 'sector' || foldParam === 'industry' ? foldParam : 'company';
  const view: LookThroughView = one(sp.view) === 'constellation' ? 'constellation' : 'stack';
  const focus = one(sp.focus) ?? null;
  const basePath = `/portfolios/${p.id}`;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Portfolios', href: '/portfolios' }, { label: p.name }]}
        title={p.name}
        subtitle={`${p.holdingsCount} holdings · ${p.currency} · updated ${formatIsoDate(p.asOf)}`}
        actions={
          <>
            <LinkButton href={`/compare?a=${encodeURIComponent(p.id)}`} variant="secondary">
              Compare with…
            </LinkButton>
            <LinkButton href={`${basePath}/holdings`} variant="primary">
              <Plus aria-hidden className="h-4 w-4" /> Manage holdings
            </LinkButton>
          </>
        }
      />

      {view === 'stack' ? (
        <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <ValueCard
            title="Portfolio value"
            value={p.totalValue}
            changeToday={p.changeToday}
            series={portfolioSeries}
            ranges={PORTFOLIO_RANGES}
            defaultRange="1M"
            asOf={p.asOf}
            layout="split"
          />
          <AllocationCard
            data={portfolioAllocation}
            diversificationScore={p.diversificationScore}
            asOf={p.asOf}
            variant="compact"
          />
        </div>
      ) : null}

      <section aria-label="Look-through exposure">
        <LookThroughToolbar basePath={basePath} fold={fold} view={view} />
        <LookThroughBody
          basePath={basePath}
          fold={fold}
          view={view}
          rows={rowsByFold[fold]}
          funds={funds}
          holdings={constellationHoldings}
          sourceOrder={sourceOrder}
          focus={focus}
        />
      </section>
    </>
  );
}
