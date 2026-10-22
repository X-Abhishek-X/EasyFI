// MOCK DATA — portfolio list. Replace with GET /api/v1/portfolios.
import { portfolios } from './home';

export { portfolios };

export function findPortfolio(id: string) {
  return portfolios.find((p) => p.id === id) ?? null;
}
