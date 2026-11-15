# Roadmap — The Wire

Decisions: `QUESTIONS.md`. Style: `STYLE.md`. Each step ends in something you can see or test, and gets reviewed on mobile and desktop before moving on.

**Stack:** Next.js (App Router) + TypeScript · Tailwind CSS · Postgres in the cloud (Supabase or Neon) · Vercel · GitHub (public repo) · Claude API (low-cost model, Haiku) for summaries.
**Stack (tracker):** Supabase (Postgres + Auth) for data and login · decimal.js for exact math · Vitest for tests.
**Constraints:** under 5 h/week · USD 0–5/month.
**Language:** everything in the repo (code, comments, commits, docs) is in English. The UI is bilingual (ES/EN).

## Investment tracker — current focus
A personal investment **ledger and analytics** app under The Wire brand (decisions 41–70 in `QUESTIONS.md`). Users record what they already did at their real brokers; the app shows holdings, average cost, live prices, P/L and allocation. **Out of scope, always:** placing orders, broker/exchange trading APIs, wallet connect, personalized financial advice.

P1. ✅ **Landing + routes:** The Wire home with Portfolio and News cards; sample news moved to `/news`; placeholder `/portfolio`.

### Product
- **Accounts:** every user signs up (Supabase Auth: email magic link, no Google). All data is private to its owner.
- **Projects ("albums"):** user-created, named groups of transactions (e.g. "Retirement", "Short term"). Optional description, default broker, strategy, horizon, tags. Can be archived.
- **Views:** Overview (everything) · Crypto only · Stocks only · one project. Every view shows the same blocks, filtered.
- **Assets:** US stocks/ETFs and any crypto. Stablecoins (USDT, USDC…) are cash. Fractional quantities. Manual price when no provider has one.
- **Transactions (source of truth):** buy, sell, deposit, withdrawal, dividend, reward (staking/airdrop). Fields: date-time, quantity, unit price, optional fee, broker, note, source (manual / csv / ai). USD only in v1.
- **Insights (v2):** educational statistics on held assets with methodology + disclaimer. Never "you should buy".

### Portfolio math (`src/domain`, pure TypeScript, decimal.js, unit-tested)
Transactions of one asset in one project are replayed in order (`executed_at`, then `created_at`):
- **Buy:** `quantity += q` · `costBasis += q × price + fee` → `avgCost = costBasis / quantity`
- **Sell:** `realized += q × price − fee − q × avgCost` · `costBasis −= q × avgCost` · `quantity −= q` (average cost unchanged). Selling more than held is rejected.
- **Reward:** `quantity += q` at zero cost (lowers the average).
- **Dividend:** adds to `income` (and to cash when the project tracks cash).
- **Unrealized** = `quantity × lastPrice − costBasis` · **%** = `unrealized / costBasis`
- **Total P/L** = `realized + income + unrealized` · **Allocation %** = `marketValue / total marketValue`
- **Cash (opt-in per project):** deposit +, withdrawal −, buy − (total + fee), sell + (total − fee), dividend +. Negative cash shows a warning, not a block.
- Rounding only at display time. Missing price → the position shows "no price" and is left out of totals, with a visible note.

### Data model (Supabase Postgres, Row Level Security on every user table)
| Table | Key columns |
|---|---|
| `profiles` | `user_id`, `display_name`, `locale`, `time_zone`, `country` |
| `projects` | `id`, `user_id`, `name`, `description`, `default_broker`, `strategy`, `horizon`, `tags text[]`, `track_cash`, `archived_at` |
| `assets` (shared catalogue) | `id`, `symbol`, `name`, `asset_class` (stock / etf / crypto / cash), `exchange`, `quote_currency`, `provider_refs jsonb` |
| `transactions` | `id`, `user_id`, `project_id`, `asset_id`, `type`, `quantity numeric`, `unit_price numeric`, `fee numeric`, `currency`, `executed_at timestamptz`, `broker`, `note`, `source`, `created_at`, `updated_at` |
| `transaction_events` (audit trail) | `id`, `transaction_id`, `user_id`, `action` (create / update / delete), `before jsonb`, `after jsonb`, `at` |
| `manual_prices` | `user_id`, `asset_id`, `price`, `as_of` |
| `latest_prices` | `asset_id`, `price`, `day_change_pct`, `as_of`, `source` |
| `daily_prices` (v2) | `asset_id`, `date`, `open`, `high`, `low`, `close` |

### Screens
1. **Landing** (done) · 2. **Sign in / sign up** · 3. **Overview:** total value, invested, P/L (money and %, green/red with ▲/▼), day change, allocation donut, top winners/losers, holdings table · 4. **Crypto / Stocks** views (same layout) · 5. **Project view** + create/edit/archive · 6. **Asset detail:** position per project, avg cost, its transactions · 7. **Transactions:** list with filters (project, asset, type, dates) + add/edit/delete form with asset search · 8. **Import:** upload screenshot/PDF/CSV → review table → confirm · 9. **Settings:** language, country/time zone, CSV export · 10. **Insights** (v2).
Holdings table columns: asset, quantity, avg cost, last price, market value, unrealized P/L, allocation %. Every screen has empty, loading and error states, and stale prices show their age.

### Architecture and providers
- `src/domain` portfolio math (no React, no network) · `src/market-data` providers behind one interface (`searchAssets`, `getQuotes`, `subscribe`) · `src/app` UI · data access in server code only.
- **Crypto:** Binance (WebSocket for live prices, klines for history), CoinGecko fallback. **US stocks:** Finnhub free tier, polled every 15–60 s while the page is open. Exact endpoints and free-tier limits are checked in the current docs before building M5.
- Latest prices are cached in `latest_prices` so a provider outage shows the last known price with its age, not an empty screen.
- **AI import:** a server route sends the file to Claude Haiku, validates the output against a schema and returns rows for review. Nothing is saved until the user confirms. Uploaded files are not stored.
- API keys live only in server env vars (Vercel), never in the browser or git.

### Milestones (v1)
- **M1. ✅ Accounts:** Supabase project, env vars, sign up/in with an email magic link, `profiles` (migration `20261115120000_profiles.sql`), protected `/portfolio`, account menu in the header (avatar with initial + sign out). Locale read via `next/root-params`.
- **M2. Portfolio math:** `src/domain` with decimal.js + Vitest tests for buy/sell/fees/rewards/dividends/cash/edge cases.
- **M3. Database:** tables above (except `daily_prices`), RLS policies, audit trail trigger.
- **M4. Projects + transactions:** create/edit/archive projects, add/edit/delete transactions, asset search, transactions list with filters.
- **M5. Prices + holdings:** provider interface, Binance + Finnhub, cached prices, holdings table with live P/L and stale/missing states.
- **M6. Dashboards:** Overview, Crypto, Stocks and project views, allocation donut, top winners/losers, blue hover glow.
- **M7. Import:** CSV (Nordnet, Binance, Coinbase) and AI screenshot/PDF import with review table.
- **M8. Settings + polish:** language, country/time zone, CSV export, disclaimers, custom SMTP for auth emails (editable template that works across devices, higher email limit), one week of real use.

### Later
- **v2:** daily price history, insights (seasonality by day of month/week and month of year, drawdowns, volatility), portfolio value chart, split transactions, display currencies with FX, non-US stocks, quick DCA entry.
- **v3:** benchmarks (SPY, BTC), time-weighted / money-weighted returns, price alerts.

### Housekeeping
- Upgrade local Node.js from 20 to 22+ (Supabase deprecates Node 20).

### Risks
- **Wrong numbers** → domain isolated and unit-tested; check results against real broker statements.
- **Free APIs change limits or terms** → provider interface, cached prices, honest "stale" UI, manual price fallback.
- **AI import misreads a file** → mandatory review table; nothing saved without confirmation.
- **Privacy** → RLS on every table, keys server-side, no stored uploads.
- **Supabase free tier pauses after 7 days idle** → acceptable while testing; add a daily ping if needed.
- **Budget (USD 0–5) and time (<5 h/week)** → free tiers, Haiku for imports, small milestones.

## News — paused
Paused on 2026-11-14 in favor of the portfolio. Steps 1–3 are done; resume at step 4.

## Version 1 — the minimum to start using it
1. ✅ **Project setup:** GitHub repo, Next.js + TypeScript project, first Vercel deploy (https://the-wire-gamma.vercel.app) and `.env.example`.
2. ✅ **Base design (no real data):** CSS color tokens, Inter + JetBrains Mono fonts, header, hero with ticker background, 3+2 news cards with "read more", using sample news (per `STYLE.md`).
3. ✅ **Bilingual:** ES/EN UI strings, browser language detection and a language switcher (next-intl, `/en` and `/es` URLs, `src/proxy.ts`).
4. **Database:** Postgres and a news table (date, topic, country, importance, ES/EN text, source link). History is stored from day one.
5. **Daily pipeline:** Vercel cron (07:00 UTC ≈ 08:00 in Denmark) → read RSS feeds by topic and country → Claude picks 3+2 and summarizes in ES/EN → save to the database. If Vercel's limits aren't enough, use GitHub Actions.
6. **Show real news:** topic tabs and country selector.
7. **Custom carousel:** live crypto (Binance WebSocket), delayed stocks (free API, to be evaluated) and currency conversion.
8. **Preferences:** topics, country, currency and crypto list saved in `localStorage`.
9. **Polish and one week of real use.**

## Version 2
10. History by date + keyword search.

## Version 3
11. Events agenda for the next 1–2 weeks + export to calendar (.ics).
12. Claude chatbot about the day's news (20 messages per person per day).

## Future
- Local AI (Ollama) on a spare computer, exposed via Cloudflare Tunnel.
- Paid login for a personal calendar. Custom domain.
