# The Wire

A personal **investment tracker**: record the stocks, ETFs and crypto you already bought at your real brokers, group them into projects, and see your holdings, average cost, live prices, profit/loss and diversification. Available in English and Spanish.

It is a ledger, not a broker: there is no trading, order placement or wallet connect, and nothing in the app is financial advice. The original news-summary product is paused (sample page at `/news`).

> Work in progress. See [`PLAN.md`](PLAN.md) for the spec and milestones and [`STYLE.md`](STYLE.md) for the design guide.

## Stack
Next.js 16 (App Router, Cache Components) + TypeScript · Tailwind CSS · next-intl (EN/ES) · Supabase (Postgres + Auth) · Vercel

## Run locally
1. Install dependencies: `npm install` (Node.js 22+ recommended).
2. Create a Supabase project and copy `.env.example` to `.env.local`, filling in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run every file in `supabase/migrations/` (in order) in the Supabase SQL Editor.
4. In Supabase → Authentication → URL Configuration, add `http://localhost:3000/**` to the redirect URLs.
5. `npm run dev` → http://localhost:3000 (redirects to `/en` or `/es`).

## Project structure
- `src/app/[locale]/`: pages (root layout, landing, login, portfolio, news)
- `src/app/auth/`: auth server actions and the magic-link callback route
- `src/lib/auth.ts`: who is signed in (the only place that checks the session)
- `src/lib/supabase/`: Supabase clients
- `src/proxy.ts`: language routing + session refresh + auth redirects
- `supabase/migrations/`: database schema (SQL)
- `messages/`: UI strings in English and Spanish

## Translations
UI strings live in `messages/en.json` and `messages/es.json`. Add every new key to both files; TypeScript flags keys that are missing from `en.json`.

## Project docs
- [`IDEA.md`](IDEA.md): what it is and why
- [`QUESTIONS.md`](QUESTIONS.md): all product decisions
- [`STYLE.md`](STYLE.md): visual design guide
- [`PLAN.md`](PLAN.md): tracker spec and step-by-step roadmap
