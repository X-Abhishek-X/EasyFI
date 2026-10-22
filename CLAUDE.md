# EasyFI

Portfolio look-through app (web now, Flutter later). For owner + invited friends, free-tier hosting only.

- Spec: `docs/specs/2026-10-22-easyfi-design.md`
- Plan / loop goal: `docs/PLAN.md` — follow its Loop protocol
- Reference product research: `docs/research/simplifi/FEATURES.md` (do not copy their branding, copy, or assets)

## Rules

- All business logic in `packages/core` as pure functions. Route handlers and pages stay thin.
- Web UI uses `/api/v1` via the generated client — never imports `db` or `services` directly from client components.
- Every new endpoint: zod schema in `packages/contracts`, appears in OpenAPI.
- Every query on user data filters by `user_id`.
- TDD: failing test first. No live network or LLM calls in tests — use fakes in `packages/data-sources`.
- Never show a missing price as $0; show as-of dates on market numbers.
- `pnpm verify` must pass before every commit.

## Commands

- `pnpm dev` — run web app
- `pnpm verify` — lint + typecheck + test + build
- `pnpm test --filter @easyfi/core` — test one package
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle migrations
- `pnpm job:nightly` — run nightly ingestion locally
