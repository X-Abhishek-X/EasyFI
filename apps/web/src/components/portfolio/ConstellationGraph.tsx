'use client';

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { useMemo } from 'react';
import type { FundRef } from '@/components/types';
import { cn } from '@/lib/cn';
import { fundColor } from '@/lib/palette';
import type { ConstellationHolding } from './types';

export type ConstellationGraphProps = {
  funds: FundRef[];
  holdings: ConstellationHolding[];
  /** Ordered source tickers for stable fund colors. */
  sourceOrder: readonly string[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Keys that match the current search; others are dimmed. null = no filter. */
  matchKeys?: ReadonlySet<string> | null;
  className?: string;
};

const W = 760;
const H = 640;
const CX = W / 2;
const CY = H / 2 - 18;

type SimNode = SimulationNodeDatum & { id: string; r: number; hub: boolean };
type SimLink = SimulationLinkDatum<SimNode> & { fund: string; multi: boolean };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function nodeRadius(h: ConstellationHolding) {
  if (h.concentration === 'high') return 11;
  if (h.labeled) return 8;
  return h.concentration === 'medium' ? 5 : 3.5;
}

/** Deterministic force layout: fund hubs pinned on an ellipse, holdings pulled between them. */
function layout(funds: FundRef[], holdings: ConstellationHolding[]) {
  const hubPos = new Map<string, { x: number; y: number }>();
  funds.forEach((f, i) => {
    const a = Math.PI * 1.05 + (i * 2 * Math.PI) / funds.length;
    hubPos.set(f.ticker, { x: CX + Math.cos(a) * 235, y: CY + Math.sin(a) * 200 });
  });

  const nodes: SimNode[] = funds.map((f) => {
    const p = hubPos.get(f.ticker)!;
    return { id: `fund:${f.ticker}`, r: 24, hub: true, x: p.x, y: p.y, fx: p.x, fy: p.y };
  });
  const links: SimLink[] = [];
  holdings.forEach((h, i) => {
    const hubs = h.funds
      .map((t) => hubPos.get(t))
      .filter((p): p is { x: number; y: number } => !!p);
    const mx = hubs.reduce((s, p) => s + p.x, 0) / (hubs.length || 1);
    const my = hubs.reduce((s, p) => s + p.y, 0) / (hubs.length || 1);
    // single-fund holdings start outward from their hub; shared ones start between hubs
    const ang = i * 2.399;
    const out = hubs.length <= 1 ? 90 : 18;
    const dx = hubs.length <= 1 ? mx - CX : 0;
    const dy = hubs.length <= 1 ? my - CY : 0;
    const len = Math.hypot(dx, dy) || 1;
    nodes.push({
      id: h.key,
      r: nodeRadius(h),
      hub: false,
      x: mx + (dx / len) * out * 0.6 + Math.cos(ang) * out * 0.5,
      y: my + (dy / len) * out * 0.6 + Math.sin(ang) * out * 0.5,
    });
    h.funds.forEach((t) => {
      if (hubPos.has(t))
        links.push({ source: h.key, target: `fund:${t}`, fund: t, multi: h.funds.length > 1 });
    });
  });

  forceSimulation<SimNode>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => (l.multi ? 120 : 80 + ((l.index ?? 0) % 5) * 14))
        .strength((l) => (l.multi ? 0.12 : 0.8)),
    )
    .force(
      'charge',
      forceManyBody<SimNode>()
        .strength((d) => (d.hub ? -260 : d.r >= 8 ? -90 : -28))
        .distanceMax(220),
    )
    .force(
      'collide',
      forceCollide<SimNode>((d) => d.r + (d.hub ? 16 : d.r >= 8 ? 15 : 6)).iterations(2),
    )
    .stop()
    .tick(320);

  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const x = Math.min(W - 24, Math.max(24, n.x ?? CX));
    const y = Math.min(H - 64, Math.max(24, n.y ?? CY));
    pos.set(n.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return pos;
}

function stars(count: number) {
  const r = rng(42);
  return Array.from({ length: count }, (_, i) => ({
    i,
    x: Math.round(r() * W * 10) / 10,
    y: Math.round(r() * H * 10) / 10,
    r: Math.round((0.4 + r() * 0.9) * 100) / 100,
    o: Math.round((0.15 + r() * 0.5) * 100) / 100,
  }));
}

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = 0.12;
  return `M${a.x} ${a.y} Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${b.x} ${b.y}`;
}

const CONC_LABEL = { high: 'high concentration', medium: 'moderate', low: 'low' } as const;

/**
 * Constellation view: funds are glowing hubs, holdings are nodes linked to every fund that
 * holds them. Shape/color encode concentration. Click (or Enter on) a labeled node to select.
 */
export function ConstellationGraph({
  funds,
  holdings,
  sourceOrder,
  selectedKey,
  onSelect,
  matchKeys = null,
  className,
}: ConstellationGraphProps) {
  const pos = useMemo(() => layout(funds, holdings), [funds, holdings]);
  const starField = useMemo(() => stars(120), []);
  const selected = holdings.find((h) => h.key === selectedKey) ?? null;
  const selectedFunds = new Set(selected?.funds ?? []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] border border-line',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full select-none"
        role="group"
        aria-label={`Constellation of ${holdings.length} holdings across ${funds.length} funds`}
      >
        <defs>
          <radialGradient id="cg-space" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="var(--space-bg-1)" />
            <stop offset="100%" stopColor="var(--space-bg-2)" />
          </radialGradient>
          <filter id="cg-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          {funds.map((f) => (
            <radialGradient key={f.ticker} id={`cg-hub-${f.ticker}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f5f7ff" />
              <stop offset="70%" stopColor="#dfe5ff" />
              <stop offset="100%" stopColor={fundColor(f.ticker, sourceOrder)} />
            </radialGradient>
          ))}
        </defs>
        <rect width={W} height={H} fill="url(#cg-space)" />
        <g aria-hidden>
          {starField.map((s) => (
            <circle key={s.i} cx={s.x} cy={s.y} r={s.r} fill="var(--muted)" opacity={s.o} />
          ))}
        </g>

        {/* links */}
        <g aria-hidden fill="none">
          {holdings.flatMap((h) => {
            const a = pos.get(h.key);
            if (!a) return [];
            const isSel = h.key === selectedKey;
            const dim = matchKeys ? !matchKeys.has(h.key) : false;
            return h.funds.map((t) => {
              const b = pos.get(`fund:${t}`);
              if (!b) return null;
              return (
                <path
                  key={`${h.key}-${t}`}
                  d={curve(b, a)}
                  stroke={fundColor(t, sourceOrder)}
                  strokeWidth={isSel ? 2.2 : h.labeled ? 1.4 : 0.9}
                  opacity={dim ? 0.06 : isSel ? 1 : selectedKey ? 0.28 : 0.5}
                />
              );
            });
          })}
        </g>

        {/* fund hubs */}
        {funds.map((f) => {
          const p = pos.get(`fund:${f.ticker}`);
          if (!p) return null;
          const color = fundColor(f.ticker, sourceOrder);
          const active = selectedFunds.has(f.ticker);
          return (
            <g key={f.ticker} transform={`translate(${p.x} ${p.y})`}>
              <title>{`${f.ticker} · ${f.name}`}</title>
              <circle r={34} fill={color} opacity={active ? 0.55 : 0.32} filter="url(#cg-glow)" />
              <circle r={22} fill={`url(#cg-hub-${f.ticker})`} stroke={color} strokeWidth={3} />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={11.5}
                fontWeight={700}
                fill="#0b1020"
                className="font-mono"
              >
                {f.ticker}
              </text>
            </g>
          );
        })}

        {/* holdings */}
        {holdings.map((h) => {
          const p = pos.get(h.key);
          if (!p) return null;
          const isSel = h.key === selectedKey;
          const dim = matchKeys ? !matchKeys.has(h.key) : false;
          const r = nodeRadius(h);
          const fill =
            h.concentration === 'high'
              ? 'var(--down)'
              : h.concentration === 'medium'
                ? 'var(--c4)'
                : h.labeled
                  ? 'var(--sev-low-fg)'
                  : 'var(--c-other)';
          const label = `${h.ticker}, ${h.name}, ${CONC_LABEL[h.concentration]}, ${(h.weight * 100).toFixed(1)}% of portfolio`;
          return (
            <g
              key={h.key}
              transform={`translate(${p.x} ${p.y})`}
              opacity={dim ? 0.18 : 1}
              role={h.labeled ? 'button' : undefined}
              tabIndex={h.labeled ? 0 : undefined}
              aria-label={h.labeled ? label : undefined}
              aria-pressed={h.labeled ? isSel : undefined}
              className="cursor-pointer outline-none [&:focus-visible>.cg-focus]:opacity-100"
              onClick={() => onSelect(h.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(h.key);
                }
              }}
            >
              <title>{label}</title>
              {/* larger invisible hit area */}
              <circle r={Math.max(r + 5, 9)} fill="transparent" />
              <circle
                className="cg-focus"
                r={r + 6}
                fill="none"
                stroke="var(--brand)"
                strokeWidth={2}
                opacity={isSel ? 1 : 0}
              />
              {h.concentration === 'high' ? (
                <path
                  d={`M0 ${-r} L${r * 0.95} ${r * 0.72} L${-r * 0.95} ${r * 0.72} Z`}
                  fill={fill}
                  stroke="#fff"
                  strokeOpacity={0.85}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              ) : (
                <circle
                  r={r}
                  fill={fill}
                  stroke={h.labeled ? '#fff' : 'none'}
                  strokeOpacity={0.7}
                  strokeWidth={1.2}
                />
              )}
              {h.labeled ? (
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize={10.5}
                  fontWeight={700}
                  fill="var(--fg)"
                  stroke="var(--space-bg-2)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {h.ticker}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <ul
        aria-label="Legend"
        className="m-3 flex sm:absolute sm:m-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-surface/85 px-3 py-2 text-[11px] text-muted backdrop-blur sm:bottom-4 sm:left-4 sm:text-[12px]"
      >
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-full border-2 border-c1" />
          ETF (color = fund)
        </li>
        <li className="flex items-center gap-1.5">
          <svg aria-hidden width="11" height="10" viewBox="0 0 11 10">
            <path d="M5.5 0 L11 10 L0 10 Z" fill="var(--down)" />
          </svg>
          High concentration
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-c4" />
          Moderate
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--sev-low-fg)]" />
          Low
        </li>
      </ul>
    </div>
  );
}
