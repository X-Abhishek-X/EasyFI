import type { Metadata } from 'next';
import { DividendKpiCards } from '@/components/dividends/DividendKpiCards';
import { HoldingsIncomeTable } from '@/components/dividends/HoldingsIncomeTable';
import { IncomeCalendar } from '@/components/dividends/IncomeCalendar';
import { YieldLeaders } from '@/components/dividends/YieldLeaders';
import { PageHeader } from '@/components/shell/PageHeader';
import {
  DIVIDENDS_AS_OF,
  dividendKpis,
  holdingsIncome,
  incomeCalendar,
  yieldLeaders,
} from '@/mocks/dividends';

export const metadata: Metadata = { title: 'Dividends' };

export default function DividendsPage() {
  return (
    <>
      <PageHeader title="Dividends" subtitle="Income paid and expected across your portfolios" />
      <DividendKpiCards kpis={dividendKpis} />
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <IncomeCalendar months={incomeCalendar} />
        <YieldLeaders leaders={yieldLeaders} asOf={DIVIDENDS_AS_OF} />
      </div>
      <div className="mt-5">
        <HoldingsIncomeTable rows={holdingsIncome} />
      </div>
    </>
  );
}
