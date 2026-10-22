import { Copy, Link2, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Switch } from '@/components/settings/Switch';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { PageHeader } from '@/components/shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { MiniBar } from '@/components/ui/MiniBar';
import { Pill } from '@/components/ui/Pill';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { formatIsoDate, formatMoney, formatPercent } from '@/lib/format';
import { alertPrefs, goals, invites, shareLinks } from '@/mocks/settings';
import { mockUser } from '@/mocks/user';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, appearance, sharing and alerts." />
      <div className="space-y-5">
        <SettingsSection
          id="s-profile"
          title="Profile"
          description="Shown to friends you share portfolios with."
        >
          <form className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <TextInput
                name="displayName"
                defaultValue={mockUser.displayName}
                autoComplete="name"
              />
            </Field>
            <Field label="Email" hint="Used to sign in. Contact the owner to change it.">
              <TextInput value={mockUser.email} readOnly aria-readonly className="text-muted" />
            </Field>
            <Field label="Base currency">
              <Select name="currency" defaultValue="USD">
                <option value="USD">USD — US dollar</option>
              </Select>
            </Field>
            <div className="flex items-end sm:justify-end">
              <Button type="submit" variant="primary">
                Save profile
              </Button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          id="s-appearance"
          title="Appearance"
          description="Dark is the default. Your choice is saved on this device."
        >
          <ThemeToggle variant="switch" />
        </SettingsSection>

        <SettingsSection
          id="s-invites"
          title="Invite codes"
          description="EasyFI is invite-only. Each code works once and signs a friend up with their own private data."
        >
          <ul className="divide-y divide-line rounded-xl border border-line">
            {invites.map((i) => (
              <li key={i.code} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
                <code className="font-mono text-[13px] font-bold text-fg">{i.code}</code>
                {i.redeemedBy ? (
                  <Pill tone="low">Used by {i.redeemedBy}</Pill>
                ) : (
                  <Pill tone="brand">Unused</Pill>
                )}
                <span className="ml-auto text-faint">created {formatIsoDate(i.createdAt)}</span>
                {!i.redeemedBy ? (
                  <Button size="sm" variant="ghost" aria-label={`Copy ${i.code}`}>
                    <Copy aria-hidden className="h-3.5 w-3.5" /> Copy
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            Need more codes? Ask the owner of this EasyFI instance.
          </p>
        </SettingsSection>

        <SettingsSection
          id="s-share"
          title="Share links"
          description="Read-only snapshots of a portfolio. Anyone with the link can view weights and look-through, not account details."
        >
          {shareLinks.length ? (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {shareLinks.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[13px]"
                >
                  <Link2 aria-hidden className="h-4 w-4 text-faint" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-fg">{s.portfolioName}</div>
                    <div className="truncate text-faint">{s.url}</div>
                  </div>
                  <span className="text-muted">
                    {s.views} views · expires {s.expiresAt ? formatIsoDate(s.expiresAt) : 'never'}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Revoke link for ${s.portfolioName}`}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" /> Revoke
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-[13px] text-muted">Create a link from a portfolio&apos;s page.</p>
        </SettingsSection>

        <SettingsSection
          id="s-alerts"
          title="Alerts"
          description="Sent by email. Nothing is sent unless you turn it on."
        >
          <div className="divide-y divide-line">
            {alertPrefs.map((a) => (
              <Switch
                key={a.key}
                name={a.key}
                label={a.label}
                description={a.description}
                defaultChecked={a.enabled}
              />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          id="s-goals"
          title="Goals"
          description="Track progress toward a number that matters to you."
        >
          <ul className="space-y-5">
            {goals.map((g) => {
              const frac = g.current == null ? 0 : g.current / g.target;
              return (
                <li key={g.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-fg">{g.label}</span>
                    <span className="text-muted">
                      {formatMoney(g.current)} of {formatMoney(g.target)}
                      {g.targetDate ? ` by ${g.targetDate.slice(0, 4)}` : ''}
                    </span>
                  </div>
                  <MiniBar
                    className="mt-2"
                    height={6}
                    fraction={frac}
                    color="var(--brand)"
                    label={`${formatPercent(frac)} reached`}
                  />
                  <div className="mt-1 text-[12px] text-faint">{formatPercent(frac)} reached</div>
                </li>
              );
            })}
          </ul>
          <form className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
            <Field label="New goal">
              <TextInput name="label" placeholder="e.g. House down payment" />
            </Field>
            <Field label="Target ($)">
              <TextInput name="target" inputMode="decimal" placeholder="60,000" />
            </Field>
            <Button type="submit" variant="secondary">
              Add goal
            </Button>
          </form>
        </SettingsSection>
      </div>
    </>
  );
}
