CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"threshold" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_balances" (
	"portfolio_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cpi_series" (
	"series_id" text NOT NULL,
	"period" text NOT NULL,
	"value" double precision NOT NULL,
	CONSTRAINT "cpi_series_series_id_period_pk" PRIMARY KEY("series_id","period")
);
--> statement-breakpoint
CREATE TABLE "dividends" (
	"ticker" text NOT NULL,
	"ex_date" date NOT NULL,
	"pay_date" date,
	"amount" double precision NOT NULL,
	CONSTRAINT "dividends_ticker_ex_date_pk" PRIMARY KEY("ticker","ex_date")
);
--> statement-breakpoint
CREATE TABLE "explorer_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"blocks" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explorer_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"screenshot_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_holdings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fund_holdings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"fund_ticker" text NOT NULL,
	"as_of" date NOT NULL,
	"constituent_ticker" text,
	"name" text NOT NULL,
	"weight" double precision NOT NULL,
	"asset_bucket" text,
	"sector" text,
	"industry" text
);
--> statement-breakpoint
CREATE TABLE "fund_sector_weights" (
	"fund_ticker" text NOT NULL,
	"as_of" date NOT NULL,
	"sector" text NOT NULL,
	"weight" double precision NOT NULL,
	CONSTRAINT "fund_sector_weights_fund_ticker_as_of_sector_pk" PRIMARY KEY("fund_ticker","as_of","sector")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_amount" double precision,
	"annual_expenses" double precision,
	"withdrawal_rate" double precision,
	"monthly_contribution" double precision,
	"expected_growth" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"ticker" text NOT NULL,
	"account_type" text DEFAULT 'taxable' NOT NULL,
	"shares" double precision NOT NULL,
	"cost_basis" double precision,
	"statement_value" double precision,
	"statement_date" date,
	"statement_kind" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"code" text PRIMARY KEY NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'nightly' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"counts" jsonb,
	"errors" jsonb
);
--> statement-breakpoint
CREATE TABLE "llm_usage" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "llm_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'actual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices_eod" (
	"ticker" text NOT NULL,
	"date" date NOT NULL,
	"close" double precision NOT NULL,
	"adj_close" double precision,
	CONSTRAINT "prices_eod_ticker_date_pk" PRIMARY KEY("ticker","date")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"ticker" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"sector" text,
	"industry" text,
	"cik" text,
	"series_id" text,
	"expense_ratio" double precision,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cash_balances" ADD CONSTRAINT "cash_balances_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explorer_messages" ADD CONSTRAINT "explorer_messages_thread_id_explorer_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."explorer_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_user_id_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cash_balances_user_id_idx" ON "cash_balances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "explorer_messages_thread_id_idx" ON "explorer_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "explorer_messages_user_id_idx" ON "explorer_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "explorer_threads_user_id_idx" ON "explorer_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fund_holdings_fund_as_of_idx" ON "fund_holdings" USING btree ("fund_ticker","as_of");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "holdings_user_id_idx" ON "holdings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "holdings_portfolio_id_idx" ON "holdings" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX "holdings_ticker_idx" ON "holdings" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "job_runs_started_at_idx" ON "job_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "portfolios_user_id_idx" ON "portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prices_eod_date_idx" ON "prices_eod" USING btree ("date");--> statement-breakpoint
CREATE INDEX "share_links_user_id_idx" ON "share_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "share_links_portfolio_id_idx" ON "share_links" USING btree ("portfolio_id");