# EasyFI — Design Spec

Date: 2026-10-22 · Status: approved-by-default (user asked to skip further questions)

## 1. Goal

Portfolio look-through app for the owner and friends (non-commercial, invite-only). Feature parity with SimpliFi (see `docs/research/simplifi/FEATURES.md`) plus extras. Web first; Flutter app later consumes the same API.

Success = a friend can sign up with an invite code, add or import holdings, and the next morning see true exposure, overlap, income and inflation context, and ask the AI Explorer questions — all on free-tier hosting.

## 2. Principles

1. **All business logic lives in `packages/core`** — pure TypeScript functions, no I/O, no framework imports. Everything else is a thin adapter.
2. **API-first.** Web UI talks to `/api/v1` exactly like Flutter will. If the web can do it, the API can do it.
3. **Test-first.** Every core function has unit tests with fixture data before implementation. No real network or LLM in tests — fakes behind interfaces.
4. **Free tier only.** No paid service is required to run the app.
5. **As-of dates on every number.** Data is EOD and may lag; UI says so.

## 3. Stack

| Concern | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript `strict` everywhere |
| Web | Next.js (App Router), Tailwind CSS, shadcn/ui, Recharts, d3-force (constellation) |
| API | Next.js Route Handlers under `/api/v1/*`; zod schemas → OpenAPI 3.1 via `@asteasolutions/zod-to-openapi` |
| Client | Typed fetch client generated from OpenAPI (`openapi-typescript` + `openapi-fetch`); TanStack Query in UI |
| DB | Supabase Postgres (free), accessed only via Drizzle ORM |
| Auth | Supabase Auth (email+password, magic link, Google). API accepts `Authorization: Bearer <supabase JWT>` (Flutter) or Supabase SSR cookie (web) |
| Market data | Tiingo free (EOD prices, dividends, IEX last) |
| ETF holdings | SEC EDGAR N-PORT-P filings (free; quarterly, ~60-day lag) |
| Inflation | BLS Public Data API v2 (CPI-U headline + categories) |
| LLM | OpenRouter (model configurable via env) behind `LLMProvider` interface |
| Tests | Vitest (unit + integration), PGlite for DB tests, Playwright for e2e |
| Lint/format | ESLint + Prettier, `tsc --noEmit` |
| CI | GitHub Actions: lint, typecheck, test, build on every push |
| Nightly job | GitHub Actions cron → `pnpm job:nightly` |
| Hosting | Vercel Hobby (web+API), Supabase free (DB+Auth+Storage) |

## 4. Repo layout

```
apps/
  web/                 Next.js app: UI pages + /api/v1 route handlers (thin)
packages/
  core/                Pure domain logic (look-through, overlap, scores, dividends, inflation, CSV parse, ticker normalize)
  contracts/           zod request/response schemas + OpenAPI generator (shared by API, web client, Flutter codegen)
  db/                  Drizzle schema, migrations, repositories
  services/            Use-cases: load from repos → call core → return contract DTOs. Auth-scoped by userId
  data-sources/        Tiingo, SEC EDGAR, BLS, OpenRouter clients + interfaces + fakes
  jobs/                Nightly job entrypoints (prices, holdings refresh, dividends, CPI, keep-alive)
  test-fixtures/       Sample ETF holdings (VOO, QQQ, SCHD, VGT, VTI…), prices, dividends
docs/
```

Dependency rule (enforced by eslint `import/no-restricted-paths`): `core` imports nothing internal. `services` → `core`, `db`, `data-sources`, `contracts`. `apps/web` → `services`, `contracts` only.

## 5. Data model (Drizzle, Postgres)

User-owned (every row has `user_id`, every query filters by it):
- `profiles` (id = auth user id, display_name, base_currency='USD', theme)
- `portfolios` (id, user_id, name, type: actual|hypothetical|watchlist, created_at)
- `holdings` (id, portfolio_id, ticker, account_type: taxable|trad_ira|roth_ira|401k|roth_401k|other, shares, cost_basis, statement_value, statement_date, statement_kind, tags text[])
- `cash_balances` (portfolio_id, amount)
- `explorer_threads`, `explorer_messages`
- `alerts` (later), `goals` (later)

Shared market data:
- `securities` (ticker PK, name, type: stock|etf|mutual_fund|mmf|crypto|bond|other, sector, industry, cik, series_id, expense_ratio)
- `prices_eod` (ticker, date, close, adj_close) — retention 2 years, only tickers held by someone or in seeded ETF list
- `fund_holdings` (fund_ticker, as_of, constituent_ticker, name, weight, asset_class) — keep latest + previous snapshot only
- `dividends` (ticker, ex_date, pay_date, amount)
- `cpi_series` (series_id, period, value)
- `invites` (code, max_uses, used)

Storage budget: target < 300 MB of the 500 MB free tier.

**Security:** Supabase exposes tables over its Data API. Enable RLS on every table with **no policies** (deny all for `anon`/`authenticated`); the app connects as a server-side role via Drizzle. Service-role key never reaches the browser.

## 6. Core domain (`packages/core`)

Pure functions, each with fixture-based tests:
- `normalizeTicker` — share classes (BRK.B/BRK-B), MMF→cash, crypto symbol collisions
- `lookThrough(holdings, fundHoldings, prices)` → effective exposure per company = direct + Σ(fund value × weight); per-source breakdown; unresolved slice
- `foldBy(exposures, 'company'|'sector'|'industry'|'asset')`
- `concentration(exposure)` → high (≥5% operating company) | medium (in ≥2 funds) | low
- `diversificationScore(exposures)` → 0–100 (based on HHI of effective exposures, excluding unresolved slice)
- `overlap(fundA, fundB)` → shared holdings, overlap-by-weight (Σ min(wA,wB))
- `exposureInsights(portfolio)` → ranked insight list with severity
- `constellationGraph(exposures)` → nodes (fund hubs, holdings) + edges
- `portfolioValueSeries(holdings, prices)` → replay current shares over past EOD closes
- `dividendSummary(holdings, dividends, prices)` → TTM, yield, yield on cost, next-30-day estimate, 12-month projection, payout frequency detection
- `purchasingPower({amount, contribution, inflation, growth, years})`
- `parseBrokerCsv(text, format)` → holdings (Fidelity, Schwab, Vanguard, generic)
- `whatIf(portfolio, addTicker, amount)` → sector shift + new overlap (powers Explorer + simulator)
- `feeDrag(portfolio)` → blended expense ratio, $/yr

## 7. API (`/api/v1`)

All endpoints JSON, zod-validated, documented at `/api/v1/openapi.json`. Errors: `{ error: { code, message } }` with proper HTTP status.

- `GET /me`, `PATCH /me`
- `GET|POST /portfolios`, `GET|PATCH|DELETE /portfolios/:id`
- `GET|POST /portfolios/:id/holdings`, `PATCH|DELETE /holdings/:id`, `POST /portfolios/:id/import` (CSV)
- `GET /portfolios/:id/lookthrough?fold=company|sector|industry|asset`
- `GET /portfolios/:id/constellation`
- `GET /portfolios/:id/value-series?range=7d|1m|3m|ytd|1y|max`
- `GET /home` (aggregate: total value, allocation, portfolios sorted by risk, insights, movers)
- `GET /compare?a=VOO&b=QQQ` (also portfolio ids)
- `GET /dividends?portfolio=all|:id`
- `GET /inflation`, `POST /inflation/purchasing-power`
- `GET /securities/search?q=`, `GET /securities/:ticker`
- `POST /explorer/threads`, `POST /explorer/threads/:id/messages` (streamed)
- `POST /whatif`

## 8. AI Investment Explorer

- LLM receives tools that call `services` functions: `get_portfolio_lookthrough`, `compare_funds`, `what_if_add`, `search_funds_holding(ticker)`, `get_dividends`.
- Answers = short text + structured blocks (`table`, `sector_shift`) rendered by UI and Flutter.
- System prompt forces: educational, not advice; cite as-of dates; never invent numbers (only from tool results).
- Rate limit per user/day (default 30) to stay inside OpenRouter free limits.
- Tests use `FakeLLMProvider` with scripted tool calls; eval set of ~20 questions run manually.

## 9. Nightly job (GitHub Actions cron, 02:00 UTC weekdays)

1. Collect tickers in use + seeded ETF list.
2. Fetch EOD prices + dividends from Tiingo (respect free limits; batch, retry with backoff).
3. Refresh fund holdings from SEC N-PORT when a newer filing exists.
4. Monthly: refresh CPI from BLS.
5. Prune price history > 2 years.
6. Write `job_runs` row (status, counts, errors) — also keeps Supabase project active.

Job is idempotent; failures for one ticker do not fail the run.

## 10. UI

Dark-first with light toggle, own brand (no SimpliFi assets). Sidebar: Home, Explorer, Portfolios, Compare, Dividends, Inflation, Settings. Responsive to phone width. Pages mirror research screenshots in function, not look.

## 11. Error handling

- Missing price → holding marked Unpriced, excluded from change, never shown as $0.
- Fund without look-through → shown as unresolved slice, excluded from scores, UI says why.
- External API failure → last good data served with its as-of date.
- All API input validated by zod; unknown fields rejected.

## 12. Testing strategy

- `core`: ≥90% line coverage, fixture-driven, property tests for weights summing ≤100%.
- `db`/`services`: integration tests on PGlite with migrations applied.
- `data-sources`: recorded-response fixtures; no live calls in CI.
- API: contract tests validate responses against zod schemas.
- e2e (Playwright): sign-up with invite → create portfolio → add VOO+QQQ → see look-through → ask Explorer (fake LLM).
- `pnpm verify` = lint + typecheck + test + build. Must pass before every commit.

## 13. Out of scope (v1)

Paid brokerage linking (SnapTrade), billing, non-USD/Toronto listings, real-time prices, Flutter app (separate later project consuming this API).
