import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/PageHeader';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';

export const metadata: Metadata = { title: "What's new" };

const ENTRIES: { date: string; title: string; tag: 'New' | 'Improved' | 'Fixed'; body: string }[] =
  [
    {
      date: '2026-10-22',
      title: 'Light theme',
      tag: 'New',
      body: 'Switch between dark and light from the sidebar or Settings. The choice sticks on this device.',
    },
    {
      date: '2026-10-15',
      title: 'Constellation view',
      tag: 'New',
      body: 'See every fund as a hub and every company it holds as a point. Shared companies sit between the funds that own them.',
    },
    {
      date: '2026-10-08',
      title: 'CSV import from Fidelity, Schwab and Vanguard',
      tag: 'Improved',
      body: 'Broker exports are detected automatically and previewed before anything is saved.',
    },
    {
      date: '2026-10-01',
      title: 'Unpriced holdings no longer count as $0',
      tag: 'Fixed',
      body: 'Holdings without a price now show a dash and an Unpriced label, and are left out of totals.',
    },
  ];

const TONE = { New: 'brand', Improved: 'info', Fixed: 'low' } as const;

export default function WhatsNewPage() {
  return (
    <>
      <PageHeader title="What's new" subtitle="Recent changes to EasyFI." />
      <ol className="relative max-w-3xl space-y-4 border-l border-line pl-6">
        {ENTRIES.map((e) => (
          <li key={e.title} className="relative">
            <span
              aria-hidden
              className="absolute top-6 -left-[29px] h-2.5 w-2.5 rounded-full border-2 border-bg bg-brand"
            />
            <Card as="article">
              <div className="flex flex-wrap items-center gap-3">
                <time dateTime={e.date} className="text-[12px] text-faint">
                  {e.date}
                </time>
                <Pill tone={TONE[e.tag]}>{e.tag}</Pill>
              </div>
              <h2 className="mt-2 text-[15px] font-semibold text-fg">{e.title}</h2>
              <p className="mt-1 max-w-[68ch] text-[14px] leading-relaxed text-muted">{e.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
