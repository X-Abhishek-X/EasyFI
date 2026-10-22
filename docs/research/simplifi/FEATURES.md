# SimpliFi teardown (scraped 2026-10-22)

Source: https://simplifinow.co (Vite + React SPA, dark UI). Raw page text in this folder; screenshots in `screenshots/` (original SVG mocks + rendered PNG).

Reference only — EasyFI should use its own name, logo, copy and visual design.

## Stack signals (from Security/Help pages)

- Auth: Clerk · Payments: Stripe · Brokerage link: SnapTrade (read-only) · Market data: Tiingo (EOD + IEX last)
- Hosting: AWS (RDS Postgres in private subnet, Secrets Manager) · Analytics: Amplitude
- ETF holdings: curated issuer files + SEC N-PORT filings fallback (quarterly, ~60-day lag)
- Pricing: $15/mo or $153/yr, single plan. Web only, no native app.

## Screens

| Screen | Screenshot | What it shows |
|---|---|---|
| Home | `home.png` | Ask bar w/ suggested prompts, total tracked value chart (1D/1M/1Y), allocation donut w/ diversification score (Sector/Holding/Overlap tabs), portfolios sorted by risk, exposure insights (High/Medium severity + "Ask why"), market context ticker strip |
| Portfolio — Stack | `look-through.png` | Value chart (7D…MAX), allocation, Company/Sector/Industry fold, holdings ranked by effective exposure; each bar split by contributing ETF; expand row → per-ETF contribution; concentration badge |
| Portfolio — Constellation | `constellation.png` | Force graph: ETFs = hubs, holdings = nodes, shared stocks linked; node shape/color = concentration; side panel of top holdings |
| Compare | `compare.png` | Two funds side by side: sector donuts, shared holdings table, overlap-by-weight % |
| Investment Explorer | `explorer.png` | AI chat grounded in fund DB; answers with sector shift + shared-holdings table; disclaimer |
| Dividends | `dividends.png` | TTM income, portfolio yield, next-30-day estimate, income calendar, yield leaders |

## Feature list

### Portfolios & holdings
- Multiple portfolios per user; types: Actual, Hypothetical, Watchlist
- Holdings page: add/edit/delete, cash edit, side-panel "Add and add another"
- Account types per line: Taxable, Traditional IRA, Roth IRA, 401(k), Roth 401(k), Other
- Add by ticker, dollars or shares; CUSIP/ISIN lookup; paste-friendly number parsing ("$1,234.50")
- Statement-value lines for unpriced assets (collective trusts, stable value, Treasuries, CDs, options)
- Tags (growth, value…) with tag filters and tag totals
- Holdings table views: Overview, Returns, Income, Look-through; sortable, column picker, totals, bulk delete/tag, CSV export
- Filters: ETF, Mutual fund, Stock, Cash, Bonds, Crypto
- Cross-portfolio Holdings tab (one row per fund, expand per portfolio)

### Look-through & risk
- Effective exposure per company = direct + via funds; "held by N funds"
- Fold by Company / Sector / Industry; Assets view (Stocks, Bonds, Cash, Commodities, Crypto)
- Stack view and Constellation view
- Concentration labels (≥5% = concentrated), overlap labels, diversification score /100
- Exposure insights ("NVDA is 9.1% of everything you own — all through 5 ETFs")
- Data hygiene: share-class normalization (BRK.B), money-market → cash, ADR matching, fund-of-funds, index mutual funds mapped to equivalent ETF book (FXAIX→IVV)
- Explains when look-through is unavailable and excludes that slice from scores

### Compare
- Fund vs fund (or portfolio): sector weights, shared holdings, overlap by weight

### Investment Explorer (AI)
- Plain-English Q&A grounded in fund/holdings DB, returns structured tables
- Suggested prompts; "Ask why" deep links from insights; disclaimer, not advice

### Dividends / income
- TTM income vs prior year, yield, yield on cost, next-30-day estimate
- Income calendar (received + 12-month projection), click month for detail
- Payout frequency detection (Monthly + specials, Annual)
- Income concentration warnings; % of income column

### Inflation
- CPI snapshots and category drivers
- Purchasing-power calculator (amount, contribution, inflation rate, growth rate → future & real value)

### Market data
- Nightly EOD pricing + look-through refresh; IEX last for intraday movers
- As-of dates on every number; daily mover; market context strip
- Value chart replays current shares over past EOD closes

### Accounts & ops
- Read-only brokerage linking (SnapTrade), per-account → portfolio mapping, reconnect banner, last-synced date
- Settings, Manage billing, Feedback form w/ screenshot, Help, Changelog
- Mobile-responsive (swipe hint on wide tables)

## Ideas to add in EasyFI (not on SimpliFi)
- Native Flutter app (they have none) — API-first from day one
- Import via CSV from major brokers (cheaper than SnapTrade)
- Rebalancing simulator / "what-if" add-a-fund before buying
- Expense-ratio drag: blended fee across portfolio, fee overlap waste
- Geographic / currency exposure look-through
- Alerts (push/email): concentration crosses threshold, dividend paid, ex-div upcoming
- Goal tracking (FI number, savings rate) — fits the "EasyFI" name
- Shareable read-only portfolio snapshot link
- Light theme toggle
