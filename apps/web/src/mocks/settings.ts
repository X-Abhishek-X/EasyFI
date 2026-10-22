// MOCK DATA — Settings. Replace with GET /api/v1/me, /invites, /share-links, /alerts, /goals.
import type { AlertPref, Goal, InviteCode, ShareLink } from '@/components/settings/types';

export const invites: InviteCode[] = [
  { code: 'EASY-7Q4K-2M9P', redeemedBy: 'Nolan R.', createdAt: '2026-08-02' },
  { code: 'EASY-H3VX-8LTD', redeemedBy: null, createdAt: '2026-09-14' },
];

export const shareLinks: ShareLink[] = [
  {
    id: 's1',
    portfolioName: 'Growth Tilt',
    url: 'https://easyfi.app/s/3fa9c1',
    createdAt: '2026-09-20',
    expiresAt: '2026-10-20',
    views: 4,
  },
];

export const alertPrefs: AlertPref[] = [
  {
    key: 'concentration',
    label: 'Concentration crosses 5%',
    description: 'When one company passes 5% of a portfolio after look-through.',
    enabled: true,
  },
  {
    key: 'dividend-paid',
    label: 'Dividend paid',
    description: 'A short note when a distribution lands.',
    enabled: false,
  },
  {
    key: 'ex-div',
    label: 'Ex-dividend in 3 days',
    description: 'Reminder before a holding goes ex-dividend.',
    enabled: true,
  },
  {
    key: 'weekly',
    label: 'Weekly summary',
    description: 'Every Monday: value change, new insights, upcoming income.',
    enabled: false,
  },
];

export const goals: Goal[] = [
  {
    id: 'fi',
    label: 'Financial independence number',
    target: 1_250_000,
    current: 75_306,
    targetDate: '2045-01-01',
  },
  {
    id: 'income',
    label: 'Yearly dividend income',
    target: 12_000,
    current: 2_184,
    targetDate: null,
  },
];
