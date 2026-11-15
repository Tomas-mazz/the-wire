# Roadmap — The Wire

Decisions: `QUESTIONS.md`. Style: `STYLE.md`. Each step ends in something you can see or test, and gets reviewed on mobile and desktop before moving on.

**Stack:** Next.js (App Router) + TypeScript · Tailwind CSS · Postgres in the cloud (Supabase or Neon) · Vercel · GitHub (public repo) · Claude API (low-cost model, Haiku) for summaries.
**Stack (portfolio):** Supabase (Postgres + Auth) for data and login.
**Constraints:** under 5 h/week · USD 0–5/month.
**Language:** everything in the repo (code, comments, commits, docs) is in English. The UI is bilingual (ES/EN).

## Portfolio — current focus
Personal stock and crypto portfolio under The Wire brand (decisions 41–49 in `QUESTIONS.md`). Lives in the same app at `/portfolio`, private behind login.

P1. **Landing + routes:** The Wire home with two cards (Portfolio active, News "coming soon"); move the sample news page to `/news`.
P2. **Supabase + login:** Supabase project, env vars in Vercel, login page, `/portfolio` protected; sign-ups disabled so only my account exists.
P3. **Database:** `transactions` table (owner, symbol, asset type stock/crypto, side buy/sell, quantity, price, fee, broker, date) with Row Level Security.
P4. **Log trades:** form to add, edit and delete buys/sells, with symbol search for any US stock/ETF or crypto; trades list.
P5. **Portfolio math:** holdings from trades (average cost), total invested, profit in money and %, and a donut chart with the % of each asset.
P6. **Live prices:** crypto via Binance WebSocket; US stocks via a free API (Finnhub, to be evaluated). Profit updates live.
P7. **Currency selector:** USD by default, other currencies converted with daily exchange rates.
P8. **Polish and one week of real use.**

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
