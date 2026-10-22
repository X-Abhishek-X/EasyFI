import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HoldingsWorkspace } from '@/components/holdings/HoldingsWorkspace';
import { holdings, sampleCsv, tickerSuggestions } from '@/mocks/holdings';
import { findPortfolio } from '@/mocks/portfolios';

export const metadata: Metadata = { title: 'Manage holdings' };

export default async function HoldingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portfolio = findPortfolio(id);
  if (!portfolio) notFound();

  return (
    <HoldingsWorkspace
      breadcrumb={[
        { label: 'Portfolios', href: '/portfolios' },
        { label: portfolio.name, href: `/portfolios/${portfolio.id}` },
        { label: 'Holdings' },
      ]}
      subtitle={`${portfolio.name} · ${holdings.length} lines · USD`}
      holdings={holdings}
      asOf={portfolio.asOf}
      suggestions={tickerSuggestions}
      csvSample={sampleCsv}
      exportName={portfolio.id}
    />
  );
}
