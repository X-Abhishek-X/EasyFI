import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shell/PageHeader';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = { title: 'Help' };

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What does look-through mean?',
    a: 'Every fund you hold is opened up and its holdings are added to yours. If VOO and QQQM both own Apple, your Apple exposure is the sum of both slices plus any shares you hold directly.',
  },
  {
    q: 'How is the diversification score calculated?',
    a: 'It starts at 100 and drops as more of your money sits in fewer companies after look-through. Below 20 is very concentrated, 20–59 is moderate, 60 and up is broad.',
  },
  {
    q: 'When is a holding marked High concentration?',
    a: 'When one company is 5% or more of the portfolio after look-through. Medium starts at 2%.',
  },
  {
    q: 'Why does a price show a dash instead of a number?',
    a: 'We have no recent price for it, for example a collective trust or a stable value fund. EasyFI never shows a missing price as $0, so the line is marked Unpriced and left out of value totals.',
  },
  {
    q: 'How fresh is the data?',
    a: 'Prices update every night after the market closes. Fund holdings come from issuer files or SEC filings and can be up to a quarter old. Every number shows its as-of date.',
  },
  {
    q: 'Can I import from my broker?',
    a: 'Yes. On a portfolio’s holdings page, choose Import CSV and paste or upload an export from Fidelity, Schwab, Vanguard or a generic ticker/shares file.',
  },
  {
    q: 'Is this investment advice?',
    a: 'No. EasyFI is an educational research tool. It shows what you own; it does not tell you what to buy or sell.',
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Help"
        subtitle="Answers to common questions about how EasyFI reads your portfolio."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card padded={false} className="divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-medium text-fg">
                {f.q}
                <span aria-hidden className="text-faint transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </Card>
        <Card as="aside" className="h-fit">
          <h2 className="text-[15px] font-semibold text-fg">Still stuck?</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Ask the Investment Explorer a question in plain English, or message the person who
            invited you.
          </p>
          <Link
            href="/explorer"
            className="mt-4 inline-block text-[13px] font-medium text-up hover:underline"
          >
            Open Investment Explorer
          </Link>
        </Card>
      </div>
    </>
  );
}
