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
- **Reward:** `quantity += q` at zero cost (lowers the average). An optional fee is added to the cost basis.
- **Dividend:** `income += q × price` (gross; the fee only counts in total fees). Cash receives the net amount.
- **Unrealized** = `quantity × lastPrice − costBasis` · **%** = `unrealized / costBasis`
- **Total P/L** = `realized + income + unrealized` · **Allocation %** = `marketValue / total marketValue`
- **Cash (opt-in per project):** deposit +, withdrawal −, buy − (total + fee), sell + (total − fee), dividend +. Negative cash shows a warning, not a block.
- Rounding only at display time. Missing price → the position shows "no price" and its value, cost and unrealized P/L are left out of totals, with a visible note; its realized P/L and dividends still count.

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
1. **Landing** (done) · 2. **Sign in / sign up** · 3. **Overview / Crypto / Stocks sections** (see M6): each starts with a row of 4 summary cards (the last one is News), then an allocation donut, then more detail below (to be defined) · 4. *(merged into 3)* · 5. **Project view** + create/edit/archive · 6. **Asset detail:** position per project, avg cost, its transactions · 7. **Transactions:** list with filters (project, asset, type, dates) + add/edit/delete form with asset search · 8. **Import:** upload screenshot/PDF/CSV → review table → confirm · 9. **Settings:** language, country/time zone, CSV export · 10. **Insights** (v2).
Holdings table columns: asset, quantity, avg cost, last price, market value, unrealized P/L, allocation %. Every screen has empty, loading and error states, and stale prices show their age.

### Architecture and providers
- `src/domain` portfolio math (no React, no network) · `src/market-data` providers behind one interface (`getQuotes`, `searchAssets`) · `src/lib/prices` server cache · `src/app` UI · data access in server code only.
- **Crypto (decision 89):** Binance public market data (`data-api.binance.vision`, `GET /api/v3/ticker/24hr`, no key; 6000 weight/min per IP), then CoinGecko `/simple/price` for whatever Binance can't price (free Demo key optional: 100 calls/min, 10,000/month, attribution required). Pairs are `<SYMBOL>USDT` unless `provider_refs.binance` says otherwise; USDT stands in for USD. Binance blocks some regions (HTTP 451), possibly Vercel's US servers, which is why CoinGecko is there.
- **US stocks/ETFs:** Finnhub `/quote` (free: 60 calls/min, US only, personal use), one call per symbol.
- **Live (decision 90):** in the browser, crypto follows Binance's 1-second mini ticker over a WebSocket (`wss://data-stream.binance.vision`); the page also polls `GET /api/prices` (signed-in only) every 30 s, which serves the cache.
- **Cache:** `latest_prices`, written only by the server with `SUPABASE_SECRET_KEY`. Refreshed when older than 20 s (crypto) / 30 s (stocks). A price not confirmed for 10 minutes is shown as out of date with its age; without the secret key prices still show but are not cached.
- **AI import:** a server route sends the file to Claude Haiku, validates the output against a schema and returns rows for review. Nothing is saved until the user confirms. Uploaded files are not stored.
- API keys live only in server env vars (Vercel), never in the browser or git.

### Milestones (v1)
- **M1. ✅ Accounts:** Supabase project, env vars, sign up/in with an email magic link, `profiles` (migration `20261115120000_profiles.sql`), protected `/portfolio`, account menu in the header (avatar with initial + sign out). Locale read via `next/root-params`.
- **M2. ✅ Portfolio math:** `src/domain` (`computePosition`, `valuePosition`, `summarize`, `allocation`, `computeCash`) with decimal.js + Vitest tests for buy/sell/fees/rewards/dividends/cash/edge cases. Run with `npm test`.
- **M3. ✅ Database:** tables above (except `daily_prices`), RLS policies, audit trail trigger (migration `20261117120000_portfolio_tables.sql`). Transactions can only point to a project of the same user; the shared `assets` catalogue can be read and extended by signed-in users but not edited; `latest_prices` is read-only for users (written server-side in M5).
- **M4. ✅ Projects + transactions:** tabs Overview · Projects · Transactions under `/portfolio`; create/edit/archive projects (a default project is created on the first visit); add/edit/delete transactions with fields per type, asset search over the shared catalogue plus manual add; transactions list with filters (project, asset, type, dates) in the URL; Overview shows holdings per asset (quantity, average cost, invested, realized P/L, dividends) without prices. Every save or delete replays the ledger with `src/domain`, so a sell can never exceed the holding. Ambiguous numbers such as "1.500" are rejected. Pending: a signed-in manual test by the user (create, edit, delete, oversell error, filters, archive).
- **S1. ✅ Visual identity:** Amethyst palette (black, deep violet borders, amethyst accent), border light on clickable cards, pointer cursor everywhere (decision 83, `STYLE.md`).
- **S2. ✅ Portfolio header cleanup:** done with an underlined active header link and a sticky content-width sub-bar (decision 88). Pending: a signed-in look by the user. Original scope: the header link of the current section (Portfolio / News) is clearly highlighted; remove the "Portfolio · Your stocks and crypto, with live prices" title block; find a better place for the Overview · Projects · Transactions tabs and the "+ Transaction" button (show layout options side by side first).
- **M5. ✅ Prices + holdings:** `src/market-data` (Binance → CoinGecko for crypto, Finnhub for stocks, tested with fake responses), server cache in `latest_prices` + `GET /api/prices`, holdings table with price and 24 h change, value, unrealized P/L, allocation, totals, live crypto over WebSocket, "no price" and "out of date" states, source attribution. Pending: the user adds `SUPABASE_SECRET_KEY`, `FINNHUB_API_KEY` and (optional) `COINGECKO_API_KEY` locally and in Vercel; check in production whether Binance answers from Vercel (otherwise CoinGecko covers it); signed-in manual test. Provider asset search is done (Finnhub `/search?exchange=US` + CoinGecko `/search`, `GET /api/assets/search`; a picked result saves its provider id in `assets.provider_refs`). Manual prices are done too (decision 91).
- **M6. Dashboards:** three sections, each with a row of 4 compact cards on top (in the style of the palette preview), then an allocation donut, then more detail below (to be defined later):
  - **Overview** (crypto + stocks): Current value · Total P/L ($ and %) · Today's change (24 h) · News. Donut: share of each holding in the whole portfolio.
  - **Crypto** (BTC first): BTC average buy price (next to the current price) · BTC P/L · Total crypto value · Crypto news. Donut: share of each coin. Average buy price is BTC only for now.
  - **Stocks:** Total stocks value · Stocks P/L · Best and worst of the day · Stocks news. Donut: share of each stock/ETF.
  - **Color rule:** the numbers on a section's cards turn green when that section is in profit and red when at a loss (Overview: total P/L; Crypto: BTC price vs BTC average buy price; Stocks: stocks P/L).
  - **News card:** headline of the most important story, very short, plus "Open →" to the story. Uses the sample news until the news product returns.
  - Project views and top winners/losers stay; cards use the `glow-card` hover light.
- **M7. Import:** CSV (Nordnet, Binance, Coinbase) and AI screenshot/PDF import with review table.
- **M8. Settings + polish:** language, country/time zone, CSV export, disclaimers, custom SMTP for auth emails (editable template that works across devices, higher email limit), one week of real use.

### Later
- **v2:** daily price history, insights (seasonality by day of month/week and month of year, drawdowns, volatility), portfolio value chart, split transactions, display currencies with FX, non-US stocks, quick DCA entry.
- **v3:** benchmarks (SPY, BTC), time-weighted / money-weighted returns, price alerts.

### Housekeeping
- ✅ Upgrade local Node.js from 20 to 22+ (`.nvmrc`; done 2026-11-17).

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
1. ✅ **Project setup:** GitHub repo, Next.js + TypeScript project, first Vercel deploy (https://the-wire-seven.vercel.app) and `.env.example`.
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
