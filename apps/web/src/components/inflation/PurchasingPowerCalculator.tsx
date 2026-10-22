'use client';

import { type ChangeEvent, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, TextInput } from '@/components/ui/Field';
import { formatMoney } from '@/lib/format';
import type { PurchasingPowerInput, PurchasingPowerPoint } from './types';

/**
 * Display-only preview so the form responds instantly. The canonical calculation will come from
 * packages/core via /api/v1 (pass `project` to swap it in).
 */
export function previewProjection(i: PurchasingPowerInput): PurchasingPowerPoint[] {
  const out: PurchasingPowerPoint[] = [];
  let nominal = i.amount;
  let contributed = i.amount;
  for (let y = 0; y <= i.years; y++) {
    if (y > 0) {
      for (let m = 0; m < 12; m++) {
        nominal = nominal * (1 + i.growthRate / 12) + i.monthlyContribution;
        contributed += i.monthlyContribution;
      }
    }
    out.push({
      year: y,
      nominal: Math.round(nominal),
      real: Math.round(nominal / (1 + i.inflationRate) ** y),
      contributed: Math.round(contributed),
    });
  }
  return out;
}

const DEFAULTS: PurchasingPowerInput = {
  amount: 75_000,
  monthlyContribution: 500,
  inflationRate: 0.029,
  growthRate: 0.06,
  years: 20,
};

type FormState = Record<keyof PurchasingPowerInput, string>;

function toForm(i: PurchasingPowerInput): FormState {
  return {
    amount: String(i.amount),
    monthlyContribution: String(i.monthlyContribution),
    inflationRate: String(+(i.inflationRate * 100).toFixed(2)),
    growthRate: String(+(i.growthRate * 100).toFixed(2)),
    years: String(i.years),
  };
}

function parse(f: FormState): PurchasingPowerInput | null {
  const n = (s: string) => Number(s.replace(/[$,%\s]/g, ''));
  const v = {
    amount: n(f.amount),
    monthlyContribution: n(f.monthlyContribution),
    inflationRate: n(f.inflationRate) / 100,
    growthRate: n(f.growthRate) / 100,
    years: Math.round(n(f.years)),
  };
  if (Object.values(v).some((x) => !Number.isFinite(x)) || v.years < 1 || v.years > 60) return null;
  return v;
}

export function PurchasingPowerCalculator({
  initial = DEFAULTS,
  project = previewProjection,
}: {
  initial?: PurchasingPowerInput;
  project?: (i: PurchasingPowerInput) => PurchasingPowerPoint[];
}) {
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const input = parse(form);
  const points = input ? project(input) : [];
  const last = points[points.length - 1];

  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card>
      <CardHeader title="Purchasing power" meta="What your money is worth in today's dollars" />
      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <form
          className="grid grid-cols-2 gap-4 lg:grid-cols-1"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Starting amount ($)" className="col-span-2 lg:col-span-1">
            <TextInput inputMode="decimal" value={form.amount} onChange={set('amount')} />
          </Field>
          <Field label="Monthly contribution ($)" className="col-span-2 lg:col-span-1">
            <TextInput
              inputMode="decimal"
              value={form.monthlyContribution}
              onChange={set('monthlyContribution')}
            />
          </Field>
          <Field label="Inflation (%/yr)">
            <TextInput
              inputMode="decimal"
              value={form.inflationRate}
              onChange={set('inflationRate')}
            />
          </Field>
          <Field label="Growth (%/yr)">
            <TextInput inputMode="decimal" value={form.growthRate} onChange={set('growthRate')} />
          </Field>
          <Field label="Years" hint="1 to 60" className="col-span-2 lg:col-span-1">
            <TextInput inputMode="numeric" value={form.years} onChange={set('years')} />
          </Field>
        </form>

        <div className="min-w-0">
          {input && last ? (
            <>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[13px] text-muted">In {input.years} years</dt>
                  <dd className="mt-0.5 text-[22px] font-semibold text-fg">
                    {formatMoney(last.nominal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">In today&apos;s dollars</dt>
                  <dd className="mt-0.5 text-[22px] font-semibold text-up">
                    {formatMoney(last.real)}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-[13px] text-muted">Lost to inflation</dt>
                  <dd className="mt-0.5 text-[22px] font-semibold text-warn">
                    {formatMoney(last.nominal - last.real)}
                  </dd>
                </div>
              </dl>
              <div
                className="mt-5 h-[260px]"
                role="img"
                aria-label="Nominal versus inflation-adjusted value by year"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="pp-real" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--faint)', fontSize: 11 }}
                      tickFormatter={(y) => `Y${y}`}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tick={{ fill: 'var(--faint)', fontSize: 11 }}
                      tickFormatter={(v) => formatMoney(Number(v), { compact: true })}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line-strong)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--fg)',
                      }}
                      labelFormatter={(y) => `Year ${y}`}
                      formatter={(v, name) => [formatMoney(Number(v)), String(name)]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area
                      name="Nominal"
                      dataKey="nominal"
                      type="monotone"
                      stroke="var(--c1)"
                      strokeWidth={2}
                      fill="none"
                      isAnimationActive={false}
                    />
                    <Area
                      name="Today's dollars"
                      dataKey="real"
                      type="monotone"
                      stroke="var(--brand)"
                      strokeWidth={2}
                      fill="url(#pp-real)"
                      isAnimationActive={false}
                    />
                    <Area
                      name="Contributed"
                      dataKey="contributed"
                      type="monotone"
                      stroke="var(--c-other)"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="none"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-[13px] text-muted">
              Enter numbers in every field, with years between 1 and 60, to see the projection.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
