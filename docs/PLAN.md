# EasyFI — Build Plan (loop goal)

Spec: `docs/specs/2026-10-22-easyfi-design.md`. Research: `docs/research/simplifi/`.

## Loop protocol

Each iteration:
1. Pick the **first unchecked** task below.
2. Write failing test(s) first, then implement until green.
3. Run `pnpm verify` (lint + typecheck + test + build). Fix until it passes.
4. Tick the box (`- [x]`), add a one-line note if something non-obvious happened.
5. Commit with a conventional message (`feat(core): ...`).
6. If blocked (missing secret, external decision), write it under **Blocked** and move to the next task.

Stop when every box is ticked or only blocked tasks remain.

## M0 — Scaffold
- [x] pnpm + Turborepo monorepo with `apps/web` and packages listed in spec §4; TS strict; shared tsconfig/eslint/prettier
  - Note: TypeScript pinned to 5.9.3 and ESLint to 9.x — typescript-eslint does not support TS 7, eslint-plugin-import/react not yet on ESLint 10. Packages are source-only (exports `./src/index.ts`, transpiled by Next).
- [ ] Vitest configured per package; `pnpm verify` script at root
- [ ] ESLint boundary rules enforcing spec §4 dependency rule (test: a forbidden import fails lint)
- [ ] GitHub Actions CI running `pnpm verify`
- [ ] `.env.example` listing every env var (Supabase URL/keys, DATABASE_URL, TIINGO_TOKEN, SEC_USER_AGENT, BLS_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL, INVITE_CODES)

## M1 — Core domain (pure, fixtures)
- [ ] `test-fixtures`: VOO, QQQ, SCHD, VGT, VTI holdings (top ~50 each + realistic sectors), prices, dividends
- [ ] `normalizeTicker`
- [ ] `lookThrough` + per-source breakdown + unresolved slice
- [ ] `foldBy` (company/sector/industry/asset)
- [ ] `concentration` + `diversificationScore`
- [ ] `overlap`
- [ ] `exposureInsights`
- [ ] `constellationGraph`
- [ ] `portfolioValueSeries`
- [ ] `dividendSummary` (TTM, yield, YoC, next 30d, projection, frequency)
- [ ] `purchasingPower`
- [ ] `parseBrokerCsv` (generic + Fidelity + Schwab + Vanguard)
- [ ] `whatIf`, `feeDrag`

## M2 — Database, auth, API foundation
- [ ] Drizzle schema per spec §5 + migrations; RLS-enabled-no-policies migration
- [ ] PGlite test harness (fresh migrated DB per test file)
- [ ] Repositories with user scoping (test: user A cannot read user B's portfolio)
- [ ] `contracts` zod schemas + OpenAPI generation at `/api/v1/openapi.json`
- [ ] Auth middleware: Supabase JWT (Bearer) + SSR cookie; invite-code sign-up gate
- [ ] Error envelope + zod validation helper
- [ ] Endpoints: `/me`, portfolios CRUD, holdings CRUD, CSV import
- [ ] Generated typed client package used by web

## M3 — Data ingestion
- [ ] `data-sources` interfaces + fakes: PriceSource, HoldingsSource, DividendSource, CpiSource, LLMProvider
- [ ] Tiingo client (EOD, dividends, IEX last) with recorded fixtures
- [ ] SEC EDGAR N-PORT client: ticker→series lookup, parse holdings XML, map CUSIP→ticker
- [ ] BLS CPI client
- [ ] Securities search + seed of popular ETFs
- [ ] Nightly job (spec §9) + `job_runs` table + GitHub Actions cron workflow

## M4 — Web app: shell, home, portfolio
- [ ] App shell: sidebar, dark/light theme, responsive, auth pages (sign in/up with invite)
- [ ] Portfolios list + create/edit
- [ ] Holdings page: table (Overview/Returns/Income/Look-through views), add side panel, CSV import, tags, filters, export CSV
- [ ] Portfolio page: value chart, allocation donut + diversification score, Stack view (expand per-ETF contribution)
- [ ] Home: total value, allocation, portfolios sorted by risk, exposure insights, movers
- [ ] Playwright e2e: invite sign-up → portfolio → VOO+QQQ → look-through visible

## M5 — Compare + Constellation
- [ ] `/compare` API + page (sector donuts, shared holdings, overlap %)
- [ ] Constellation API + d3-force view with side panel

## M6 — Dividends
- [ ] `/dividends` API + page (KPI cards, income calendar, projection, yield leaders, holdings table)

## M7 — Inflation
- [ ] `/inflation` API + page (CPI snapshot, category drivers, purchasing-power calculator)

## M8 — AI Investment Explorer
- [ ] OpenRouter `LLMProvider` + tool-calling loop over services; per-user daily limit
- [ ] Explorer API (threads, streamed messages, structured blocks)
- [ ] Explorer page + Home ask bar + "Ask why" links from insights
- [ ] Fake-LLM tests + `docs/explorer-evals.md` with 20 eval questions

## M9 — Extras
- [ ] What-if simulator page (add fund → sector shift, overlap)
- [ ] Fee drag card on portfolio
- [ ] FI goal tracker (target number, progress, projection)
- [ ] Alerts (email via Supabase/Resend free): concentration threshold, upcoming dividend
- [ ] Shareable read-only snapshot link
- [ ] Help + What's new pages, feedback form (Supabase Storage screenshot)

## M10 — Deploy
- [ ] Vercel project + env vars documented in `docs/DEPLOY.md`
- [ ] Supabase project setup steps + migration command documented
- [ ] Smoke test on production URL

## Blocked
(none yet)
