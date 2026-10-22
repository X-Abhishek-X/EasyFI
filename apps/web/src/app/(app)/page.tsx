import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { AskBar } from '@/components/home/AskBar';
import { InsightRow } from '@/components/home/InsightList';
import { MarketContextStrip } from '@/components/home/MarketContextStrip';
import { PortfolioRiskCard } from '@/components/home/PortfolioRiskCard';
import { AllocationCard } from '@/components/overview/AllocationCard';
import { ValueCard } from '@/components/overview/ValueCard';
import { PageHeader } from '@/components/shell/PageHeader';
import { LinkButton } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/Card';
import { HOME_RANGES } from '@/components/ui/RangeTabs';
import {
  allocation,
  askSuggestions,
  insights,
  marketContext,
  overview,
  portfolios,
} from '@/mocks/home';

export default function HomePage() {
  const byRisk = [...portfolios].sort(
    (a, b) => (a.diversificationScore ?? 0) - (b.diversificationScore ?? 0),
  );
  return (
    <>
      <PageHeader
        title="Welcome back"
        subtitle="Here is what your portfolios own once every fund is opened up."
        actions={
          <LinkButton href="/portfolios?new=1" variant="primary">
            <Plus aria-hidden className="h-4 w-4" /> New portfolio
          </LinkButton>
        }
      />

      <AskBar suggestions={askSuggestions} />

      <p className="mt-6 mb-3 text-[13px] text-muted">
        Overview <span className="text-faint">·</span> All portfolios
      </p>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <ValueCard
          title="Total tracked value"
          value={overview.totalValue}
          note={`${overview.portfolioCount} portfolios`}
          series={overview.series}
          ranges={HOME_RANGES}
          defaultRange="1Y"
          asOf={overview.asOf}
        />
        <AllocationCard
          data={allocation}
          diversificationScore={overview.diversificationScore}
          asOf={overview.asOf}
        />
      </div>

      <section aria-labelledby="h-portfolios" className="mt-9">
        <SectionHeading
          id="h-portfolios"
          title={
            <>
              Your portfolios <span className="font-normal text-muted">· sorted by risk</span>
            </>
          }
          action={
            <Link href="/portfolios" className="inline-flex items-center gap-1 hover:text-fg">
              View all ({portfolios.length}) <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {byRisk.map((p) => (
            <PortfolioRiskCard key={p.id} portfolio={p} href={`/portfolios/${p.id}`} />
          ))}
        </div>
      </section>

      <section aria-labelledby="h-insights" className="mt-9">
        <SectionHeading
          id="h-insights"
          title="Exposure insights"
          action={
            <Link href="/explorer" className="inline-flex items-center gap-1 hover:text-fg">
              See all <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <InsightRow insights={insights} />
      </section>

      <section aria-labelledby="h-market" className="mt-9">
        <SectionHeading id="h-market" title="Market context" />
        <MarketContextStrip quotes={marketContext} />
      </section>
    </>
  );
}
