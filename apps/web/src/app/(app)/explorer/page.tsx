import type { Metadata } from 'next';
import { ExplorerChat } from '@/components/explorer/ExplorerChat';
import { cannedReply, explorerSuggestions } from '@/mocks/explorer';

export const metadata: Metadata = { title: 'Investment Explorer' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ExplorerPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return (
    <>
      <h1 className="sr-only">Investment Explorer</h1>
      {/* -mb-16 cancels the shell's bottom padding so the input sits at the viewport bottom. */}
      <ExplorerChat
        key={q ?? ''}
        initialQuery={q}
        suggestions={explorerSuggestions}
        cannedReply={cannedReply}
        className="-mb-16 min-h-[calc(100dvh-5.5rem)] md:min-h-[calc(100dvh-2rem)] lg:min-h-[calc(100dvh-2rem)]"
      />
    </>
  );
}
