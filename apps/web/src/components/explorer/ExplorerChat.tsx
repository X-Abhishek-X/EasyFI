'use client';

import { SendHorizontal, Sparkle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '@/components/shell/Logo';
import { cn } from '@/lib/cn';
import { ChatBlockView } from './blocks';
import type { AssistantMessage, ChatMessage } from './types';

export type ExplorerChatProps = {
  /** Question from ?q= — sent automatically on load. */
  initialQuery?: string;
  suggestions: string[];
  /** MOCK: canned answer returned for any question until the API exists. */
  cannedReply: Omit<AssistantMessage, 'id'>;
  className?: string;
};

let seq = 0;
const nextId = () => `m${++seq}`;

/** Investment Explorer chat: user bubbles, assistant cards with structured blocks, pinned input. */
export function ExplorerChat({
  initialQuery,
  suggestions,
  cannedReply,
  className,
}: ExplorerChatProps) {
  const initial = initialQuery?.trim();
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initial ? [{ id: 'q0', role: 'user', text: initial }] : [],
  );
  const [pending, setPending] = useState(Boolean(initial));
  const [draft, setDraft] = useState('');
  const lastRef = useRef<HTMLLIElement>(null);
  const userSent = useRef(false);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      setMessages((m) => [...m, { ...cannedReply, id: nextId() }]);
      setPending(false);
    }, 650);
    return () => clearTimeout(t);
  }, [pending, cannedReply]);

  // After the user asks something, bring the newest message into view (not on the ?q= load).
  useEffect(() => {
    if (userSent.current) lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages.length]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    userSent.current = true;
    setMessages((m) => [...m, { id: nextId(), role: 'user', text: t }]);
    setDraft('');
    setPending(true);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex-1" aria-live="polite">
        {messages.length === 0 && !pending ? (
          <div className="mx-auto flex max-w-xl flex-col items-center pt-[12vh] text-center">
            <LogoMark size={40} />
            <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.015em] text-fg">
              Ask about any fund or company
            </h2>
            <p className="mt-2 text-[14px] text-muted">
              Answers come from fund holdings data, with tables you can check line by line.
            </p>
            <ul
              className="mt-6 flex flex-wrap justify-center gap-2"
              aria-label="Suggested questions"
            >
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="h-9 rounded-full border border-line-strong px-4 text-[13px] text-fg hover:bg-surface-2"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-6 pt-2">
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <li
                  key={m.id}
                  ref={idx === messages.length - 1 ? lastRef : undefined}
                  className="flex scroll-mt-20 justify-end"
                >
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-3 px-4 py-2.5 text-[14px] text-fg sm:max-w-[70%]">
                    <span className="sr-only">You: </span>
                    {m.text}
                  </p>
                </li>
              ) : (
                <li
                  key={m.id}
                  ref={idx === messages.length - 1 ? lastRef : undefined}
                  className="flex scroll-mt-20 gap-3"
                >
                  <span className="mt-1 hidden sm:block">
                    <LogoMark size={28} />
                  </span>
                  <article className="min-w-0 flex-1 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
                    <span className="sr-only">EasyFI: </span>
                    <p className="max-w-[68ch] text-[15px] leading-[1.6] text-fg">{m.text}</p>
                    <div className="mt-5 space-y-4">
                      {m.blocks.map((b, i) => (
                        <ChatBlockView key={`${m.id}-${i}`} block={b} />
                      ))}
                    </div>
                  </article>
                </li>
              ),
            )}
            {pending ? (
              <li className="flex gap-3" aria-label="EasyFI is answering">
                <span className="mt-1 hidden sm:block">
                  <LogoMark size={28} />
                </span>
                <div className="flex h-12 items-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface px-5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </div>
              </li>
            ) : null}
          </ol>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 bg-gradient-to-t from-bg from-70% to-transparent px-4 pt-6 pb-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-3"
        >
          <label className="relative flex min-w-0 flex-1 items-center">
            <span className="sr-only">Ask the Investment Explorer</span>
            <Sparkle
              aria-hidden
              className="pointer-events-none absolute left-4 h-4 w-4 fill-up text-up"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Compare SCHD and VOO, or find ETFs heavy in NVIDIA"
              className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-[14px] text-fg placeholder:text-faint focus:border-line-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-brand"
            />
          </label>
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || pending}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink hover:bg-brand-hover disabled:opacity-60"
          >
            <SendHorizontal aria-hidden className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2.5 text-[12px] text-faint">
          Educational research, not investment, tax, or legal advice.
        </p>
      </div>
    </div>
  );
}
