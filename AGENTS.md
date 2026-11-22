# Instructions for AI assistants

**Status (2026-11-18):** The Wire is now an **investment tracker** (a ledger, not a broker). The news product is paused. The spec, data model and milestones are in `PLAN.md` ("Investment tracker"), and decisions 41–109 are in `QUESTIONS.md`. Done and merged to `main`: P1 (landing), **M1** (accounts), **M2** (portfolio math in `src/domain`, `npm test`), **M3** (database, RLS, audit trail), **M4** (projects + transactions), the **Amethyst palette** (decision 83), **S2** (portfolio header), **M5** (live prices; decisions 81, 89–91), **M6** (Overview · Crypto · Stocks dashboards; P/L switch starts on Total, decisions 92–99 and 109), **S3** ("Hide amounts" and "Copy summary", decisions 100–101) and **M7** (CSV import from Nordnet, Binance, Coinbase and the The Wire template, decisions 102–108; PRs #10–#13). `main` is up to date: start each new step on a fresh branch from `main`. **Next: M8** (settings + polish, see `PLAN.md`): first ask the user which part to start with. AI import of screenshots/PDFs and the chatbot are v2. Use Node 22 (`nvm use`; a plain shell may still be on Node 20). For any new product decision, ask the user; don't decide for them.

**Repo language:** everything committed is in **English**: commits, branch names, PR titles, README, docs, code, comments, tests and config. Talk to the user in **Spanish**. The UI is bilingual (ES/EN): add every new string to both `messages/en.json` and `messages/es.json`.

**Working with the user:**
- The user is learning to program: explain what you do and why, in simple terms.
- When the user is unsure, explain the options simply (pros and cons) and let them choose.
- Record new product decisions in `QUESTIONS.md` and keep `PLAN.md` up to date.
- Git: work on a feature branch (e.g. `feat/m2-portfolio-math`), never directly on `main`. Commit at the end of each step **without asking** (small, conventional messages). **Never push** until the user says so; when pushing, push the branch and the user merges it with a Pull Request on GitHub. No force-push, no git config changes, no secrets.

**Product rules (hard constraints):**
- Never build order placement, broker/exchange trading APIs or wallet connect.
- Never give personalized financial advice in product copy. Insights are educational, with methodology and a disclaimer.
- Login is an email magic link only (no Google, no passwords).

**Engineering rules:**
- Keep layers apart: `src/domain` (pure portfolio math, no React or network) · `src/market-data` (price providers behind one interface) · `src/app` + `src/components` (UI).
- Money and quantities: never JS floats. Use Postgres `numeric` and decimal.js; round only for display.
- Cost basis and P/L math must be unit-tested (Vitest), with the formulas briefly documented in code comments.
- Dates: store UTC, display in the user's time zone.
- Look up current docs before using a library or API; never invent endpoints.

**How this codebase works (Next.js 16 with `cacheComponents`):**
- `app/[locale]/layout.tsx` is the **root layout**. Read the locale with `next/root-params` (`src/i18n/request.ts` does it for next-intl). Pages must **not** await `params` for the locale; use `getLocale()` / `getTranslations()`. Unmatched URLs render `app/global-not-found.tsx`.
- `src/proxy.ts` (formerly middleware) runs next-intl first, then refreshes the Supabase session and does optimistic redirects (`/portfolio` needs a session; `/login` with a session goes to `/portfolio`).
- Session checks live only in `src/lib/auth.ts` (`getOptionalUser`, `requireUser`). They call `connection()` and verify with `getClaims()`. Anything that reads the session must render inside `<Suspense>`. So must anything that reads `params`, `searchParams` or `usePathname()` on a dynamic route (the portfolio tabs use a `<Suspense>` fallback; the language switcher reads the URL only on click).
- Portfolio code: `src/lib/portfolio/data.ts` (server-only reads; numeric columns are selected as `::text` because PostgREST sends `numeric` as JSON numbers), `src/lib/portfolio/parse.ts` (pure form parsing, tested), `src/app/[locale]/portfolio/actions.ts` (Server Actions: check the session with `getActionUser()`, take the locale as an argument because `next/root-params` is unavailable in actions, and return typed values on error because React 19 resets forms).
- Supabase clients: `src/lib/supabase/server.ts` (server code), `src/lib/supabase/proxy.ts` (session refresh) and `src/lib/supabase/admin.ts` (secret key, bypasses RLS; only for writing the `latest_prices` cache). Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus server-only `SUPABASE_SECRET_KEY`, `FINNHUB_API_KEY`, `COINGECKO_API_KEY`, `TIINGO_API_KEY` (see `.env.example`). The admin client also writes the shared `price_history` cache.
- Prices: `src/market-data` (providers, pure and tested), `src/lib/prices/service.ts` (cache + refresh), `src/app/api/prices/route.ts` (signed-in only), `src/components/portfolio/LiveHoldings.tsx` (WebSocket + 30 s polling in the browser).
- Import (M7): `src/lib/import/` holds pure readers (`nordnet.ts`, `binance.ts`, `coinbase.ts`, `template.ts`; `index.ts` detects the broker), `review.ts` (pure statuses and USD conversion) and `server.ts` (server-only: ECB rates, asset lookup, earlier imports, saving with `external_id = "<broker>:<id>"`). The action is `src/app/[locale]/portfolio/transactions/import/actions.ts`; the file is read again on confirm and never stored. Readers are tested with made-up rows shaped like the real exports: never commit a user's export (they hold personal ids such as the CPR). Free price APIs cut bursts of calls (Finnhub answers 429): wrap provider calls that run in a loop in `retryTransient` (`src/market-data/http.ts`). Never guess a broker format: ask for a real file.
- Amounts and quantities on screen are wrapped in `<Private>` (`src/components/portfolio/Private.tsx`) so "Hide amounts" can mask them with CSS (`html[data-privacy="on"]`, set by an inline script in the root layout). Percentages and market prices are not wrapped.
- Don't run `next build` while the user's `next dev` is running: both write to `.next` and the dev server can get stuck serving stale CSS. If that happens: stop the dev server, delete the `.next` folder and start it again.
- Database changes go in `supabase/migrations/<timestamp>_<name>.sql`. The Supabase GitHub integration applies new migrations automatically when they are merged to `main` (each file runs in one transaction; no `create index concurrently`). Never change the schema in the SQL Editor (it breaks the migration history), and never edit a migration after it is merged: add a new one. Every user table gets Row Level Security.
- The default Supabase email template sends a PKCE link that only works in the browser where it was requested; `/auth/callback` also accepts `token_hash` for when custom SMTP is set up (M8).

**Deploy:** production is https://the-wire-seven.vercel.app (Vercel, auto-deploys `main`). Vercel env vars: the two `NEXT_PUBLIC_SUPABASE_*` values as type "Config" (public by design); server-only keys (`SUPABASE_SECRET_KEY`, `FINNHUB_API_KEY`, `COINGECKO_API_KEY`, `TIINGO_API_KEY`, later `ANTHROPIC_API_KEY`) go as "Secret" without the `NEXT_PUBLIC_` prefix. Supabase → Authentication → URL Configuration: Site URL is the production URL; redirect URLs are `https://the-wire-seven.vercel.app/**`, `http://localhost:3000/**` and `http://localhost:3100/**`.

**Design:** colors are tokens in `src/app/globals.css` (black `bg`, deep violet `line`, amethyst `accent` + `accent-ink`; green/red only for gains/losses). Use `bg-accent text-accent-ink` for primary actions, `glow-card` on clickable cards (border light on hover), and the shared classes in `src/components/portfolio/styles.ts`. Every clickable element gets the pointer cursor (base rule in `globals.css`). For visual choices, show the user options side by side (e.g. a preview HTML page) before deciding.

**Project docs:** `IDEA.md` (what and why) · `QUESTIONS.md` (decisions) · `STYLE.md` (design guide) · `PLAN.md` (roadmap and tracker spec).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
