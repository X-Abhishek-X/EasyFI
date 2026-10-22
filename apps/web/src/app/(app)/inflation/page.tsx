import type { Metadata } from 'next';
import { CpiDriversCard } from '@/components/inflation/CpiDriversCard';
import { CpiHeadlineCard } from '@/components/inflation/CpiHeadlineCard';
import { PurchasingPowerCalculator } from '@/components/inflation/PurchasingPowerCalculator';
import { PageHeader } from '@/components/shell/PageHeader';
import { cpi, cpiCategories } from '@/mocks/inflation';

export const metadata: Metadata = { title: 'Inflation' };

export default function InflationPage() {
  return (
    <>
      <PageHeader
        title="Inflation"
        subtitle="How fast prices rise, and what that does to your savings."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <CpiHeadlineCard cpi={cpi} />
        <CpiDriversCard categories={cpiCategories} />
      </div>
      <div className="mt-5">
        <PurchasingPowerCalculator />
      </div>
    </>
  );
}
