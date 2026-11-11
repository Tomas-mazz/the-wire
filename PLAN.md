# Roadmap — The Wire

Decisions: `QUESTIONS.md`. Style: `STYLE.md`. Each step ends in something you can see or test, and gets reviewed on mobile and desktop before moving on.

**Stack:** Next.js (App Router) + TypeScript · Tailwind CSS · Postgres in the cloud (Supabase or Neon) · Vercel · GitHub (public repo) · Claude API (low-cost model, Haiku) for summaries.
**Constraints:** under 5 h/week · USD 0–5/month.
**Language:** everything in the repo (code, comments, commits, docs) is in English. The UI is bilingual (ES/EN).

## Version 1 — the minimum to start using it
1. ✅ **Project setup:** GitHub repo, Next.js + TypeScript project, first Vercel deploy (https://the-wire-gamma.vercel.app) and `.env.example`.
2. **Base design (no real data):** CSS color tokens, Inter + JetBrains Mono fonts, header, hero with ticker background, 3+2 news cards with "read more", using sample news (per `STYLE.md`).
3. **Bilingual:** ES/EN UI strings, browser language detection and a language switcher.
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
