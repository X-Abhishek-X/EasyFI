-- Spec §5 security: RLS on every table with NO policies => deny-all for Supabase anon/authenticated.
-- The app connects server-side as the table owner / service role, which bypasses RLS.
-- Any new table must be added here (or in a later migration); tests assert this.
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cash_balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cpi_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dividends" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "explorer_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "explorer_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fund_holdings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fund_sector_weights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "holdings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "llm_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "portfolios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prices_eod" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "securities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "share_links" ENABLE ROW LEVEL SECURITY;
