// MOCK DATA — Inflation page. Replace with GET /api/v1/inflation/cpi.
import type { CpiCategory, CpiSnapshot } from '@/components/inflation/types';

export const cpi: CpiSnapshot = {
  period: '2026-09',
  yoy: 0.029,
  mom: 0.002,
  coreYoy: 0.031,
  asOf: '2026-10-15',
  history: [
    { period: '2025-10', yoy: 0.031 },
    { period: '2025-11', yoy: 0.03 },
    { period: '2025-12', yoy: 0.032 },
    { period: '2026-01', yoy: 0.033 },
    { period: '2026-02', yoy: 0.031 },
    { period: '2026-03', yoy: 0.028 },
    { period: '2026-04', yoy: 0.027 },
    { period: '2026-05', yoy: 0.026 },
    { period: '2026-06', yoy: 0.027 },
    { period: '2026-07', yoy: 0.028 },
    { period: '2026-08', yoy: 0.03 },
    { period: '2026-09', yoy: 0.029 },
  ],
};

export const cpiCategories: CpiCategory[] = [
  { key: 'shelter', label: 'Shelter', yoy: 0.042, weight: 0.36 },
  { key: 'transport-svc', label: 'Transportation services', yoy: 0.038, weight: 0.064 },
  { key: 'medical', label: 'Medical care services', yoy: 0.033, weight: 0.067 },
  { key: 'food-away', label: 'Food away from home', yoy: 0.035, weight: 0.056 },
  { key: 'food-home', label: 'Food at home', yoy: 0.019, weight: 0.08 },
  { key: 'apparel', label: 'Apparel', yoy: 0.004, weight: 0.025 },
  { key: 'vehicles', label: 'New vehicles', yoy: -0.006, weight: 0.044 },
  { key: 'energy', label: 'Energy', yoy: -0.021, weight: 0.065 },
];
