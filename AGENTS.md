# Instructions for AI assistants

**Status (2026-11-15):** The Wire is now an **investment tracker** (a ledger, not a broker). The news product is paused. The spec, data model and milestones are in `PLAN.md` ("Investment tracker"), and decisions 41–73 are in `QUESTIONS.md`. Done so far: P1 (landing) and **M1 (accounts)**. **Next: M2, the portfolio math** in `src/domain` with decimal.js + Vitest. For any new product decision, ask the user; don't decide for them.

**Repo language:** everything committed is in **English**: commits, branch names, PR titles, README, docs, code, comments, tests and config. Talk to the user in **Spanish**. The UI is bilingual (ES/EN): add every new string to both `messages/en.json` and `messages/es.json`.

**Working with the user:**
- The user is learning to program: explain what you do and why, in simple terms.
- When the user is unsure, explain the options simply (pros and cons) and let them choose.
- Record new product decisions in `QUESTIONS.md` and keep `PLAN.md` up to date.
- Git: commit at the end of each step **without asking** (small, conventional messages). **Never push** until the user says so. No force-push, no git config changes, no secrets.

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
- Session checks live only in `src/lib/auth.ts` (`getOptionalUser`, `requireUser`). They call `connection()` and verify with `getClaims()`. Anything that reads the session must render inside `<Suspense>`.
- Supabase clients: `src/lib/supabase/server.ts` (server code) and `src/lib/supabase/proxy.ts` (session refresh). Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
- Database changes go in `supabase/migrations/*.sql` (the user runs them in the Supabase SQL Editor). Every user table gets Row Level Security.
- The default Supabase email template sends a PKCE link that only works in the browser where it was requested; `/auth/callback` also accepts `token_hash` for when custom SMTP is set up (M8).

**Project docs:** `IDEA.md` (what and why) · `QUESTIONS.md` (decisions) · `STYLE.md` (design guide) · `PLAN.md` (roadmap and tracker spec).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
