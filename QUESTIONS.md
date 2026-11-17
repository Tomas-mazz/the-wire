# Project kickoff questions

Each answer is recorded under its question (→ Answer:).

## 1. Goal and usage
1. What will the website be called?
   → Answer: **The Wire** (the name stays in English in both languages). It was originally "El Telegrama / The Wire", simplified when the style became futuristic.
2. Roughly how many people will use it?
   → Answer: Me and some friends. It starts basic, but must be ready to scale if it ever gets a lot of traffic.
3. Where will you view it most: phone, computer or both?
   → Answer: Both equally (responsive design).
4. What language should the news and site be in: Spanish, English or both?
   → Answer: Both, user-selectable. Defaults to the browser language.
   Implementation (step 3): language in the URL (`/es`, `/en`); `/` redirects based on the browser language. Library: next-intl.
5. When during the day will you open it (morning, all day)?
   → Answer: Several times a day. A single daily news update is still enough (prices are live).

## 2. Topics and news
6. Which topics for the first version? (stocks, crypto, programming, others?)
   → Answer: Stocks, Crypto, Programming and Economy/politics.
7. How many stories per topic per day is ideal?
   → Answer: 5 per topic: the 3 most important ones, large and prominent, plus 2 smaller extras below.
8. How long should the short summary be? And the "read more"?
   → Answer: 2–3 line summary. "Read more" shows 1 paragraph, 3 key points and the source link. No photos.
9. Any sources you like or want to avoid?
   → Answer: No preference. Reliable, free sources that can be read automatically (RSS or APIs).
10. Should news be global, from Argentina, from Denmark/Europe, or a mix?
    → Answer: Global for everyone, plus one country chosen by each user. Countries in v1: Argentina, United States and Spain/rest of Europe.
11. Keep old news (history) or only today's?
    → Answer: Keep everything. Browse by date plus keyword search (search comes in v2; data is stored from day one).
12. Does each user pick their topics, or does everyone see the same thing?
    → Answer: Each user picks, without an account. Saved in their browser.

## 3. Live prices (carousel)
13. Which stocks or indices in the stocks carousel?
    → Answer: US indices, big tech, Europe/Denmark and Argentina. It also adapts to the country each user selects.
14. Which cryptocurrencies?
    → Answer: Bitcoin, Ethereum and the top 10 by default. Each user can build their own list.
15. Are stock prices delayed by a few minutes OK, or do you need exact real time?
    → Answer: Delay is fine (free APIs). Crypto is real time (Binance).
16. Which currency for prices (USD, EUR, DKK, ARS)?
    → Answer: Each user chooses, with automatic conversion.
17. Is a ready-made widget OK (e.g. TradingView), or a 100% custom carousel?
    → Answer: 100% custom design.

## 4. Talks and events calendar
18. What kind of events interest you? (tech conferences, company earnings, central bank meetings, crypto events, others?)
    → Answer: All of them: company earnings, central banks/macro, tech conferences and crypto events.
19. Are events loaded automatically, added by hand, or both?
    → Answer: Automatic only (APIs, with AI picking what matters). It doesn't have to be a literal calendar: an interactive, easy-to-read view of what matters this week and the next two. Future idea: paid login to build your own calendar.
20. Do you want reminders before an event?
    → Answer: An "add to my calendar" button (Google Calendar / .ics file).

## 5. Chatbot
21. What should the chatbot do: explain today's news, answer general questions, or both?
    → Answer: First, questions about the news. In the future, also explain concepts.
22. Which AI (Claude, other)? Willing to pay a few dollars a month for the API?
    → Answer: Claude via API; I'll pay a few dollars a month. Future experiment: a local AI (Ollama) on a spare always-on computer.
23. Should the chatbot have a per-person message limit?
    → Answer: Yes, about 20 per day.

## 6. Visual style
> **Change (2026-11-11):** the "old stock exchange" style (paper tape, newspaper serif type) was replaced by a **futuristic, clean** style inspired by starknet.io. The full guide is in `STYLE.md`.

24. What image do you have in mind?
    → Answer: Futuristic and clean, like starknet.io (without copying it).
25. Only gray and black, or an accent color?
    → Answer: Only white and grays, no gradient. The only color is green/red for gains and losses.
26. Light paper-like background or dark?
    → Answer: Dark only (near-black). No light mode.
27. What typography?
    → Answer: A modern, clean sans-serif (Inter), and monospace for prices and numbers.
28. Any extra details?
    → Answer: A subtle background of tickers and numbers (AAPL, BTC, +1.2%…) in the hero, line icons per topic and subtle animations.
29. Any reference website or image you like?
    → Answer: starknet.io (overall style). From Yahoo Finance, the type of content but not the clutter: information should open up progressively.

## 7. Access and users
30. Is the site public, or password / login protected for your friends?
    → Answer: Public.
31. Does each person need their own account (to save topics and favorites)?
    → Answer: Not in v1: preferences are saved in the browser. In the future, paid login for a personal calendar.

## 8. Technical
32. Which languages or frameworks do you know or want to learn with this project?
    → Answer: HTML/CSS/JS, React and Next.js, with TypeScript, plus Tailwind CSS. Intermediate level.
33. Something simple without a database at first, or full setup from the start?
    → Answer: A simple database from the start (free cloud Postgres: Supabase or Neon).
34. Where do you want to host it? Custom domain?
    → Answer: Vercel. Custom domain later.
35. What time should news update each day? (Denmark time)
    → Answer: 08:00.
36. Do you use GitHub? Store the project there?
    → Answer: Yes, public repo. API keys are never committed. Everything in the repo (code, commits, README, docs) is in English.

## 9. Scope and timing
37. What's the minimum the first version needs for you to start using it?
    → Answer: Summarized news by topic, the custom price carousel and country/currency/topic selection.
38. How much time per week can you dedicate?
    → Answer: Under 5 hours.
39. How much are you willing to spend per month (APIs, hosting, domain)?
    → Answer: USD 0–5.
40. How will you know the site works well for you?
    → Answer: I get informed in under 5 minutes, I open it every day, and it runs on its own.

## 10. Portfolio (decided 2026-11-14)
41. What happens to the news site?
    → Answer: Paused. The code stays in the repo to resume later.
42. What is the new project?
    → Answer: A personal investment portfolio under the same brand (The Wire). I log my stock and crypto buys and sells and see how much I have invested, my profit and the % of each asset (donut chart), with live prices.
43. Same app or a separate project?
    → Answer: Same Next.js app and Vercel deploy, as a new section (`/portfolio`). It shares the design, fonts, languages and header.
44. Who can see the portfolio and where is the data stored?
    → Answer: Only me, with login. Data lives in a cloud database so it syncs between phone and computer.
45. Database and login provider?
    → Answer: Supabase (Postgres + Auth). Row Level Security so each row is only readable by its owner. (This also settles question 33: Supabase over Neon.)
46. What does the home page show?
    → Answer: A The Wire landing with two cards: Portfolio (active) and News ("coming soon").
47. Display currency?
    → Answer: USD by default, with a selector to switch currency (converted with daily exchange rates).
48. Which assets?
    → Answer: Crypto and US stocks/ETFs. Any stock or crypto I own can be added (symbol search).
49. What does each buy/sell record store?
    → Answer: Asset, side (buy/sell), quantity, price, date, fee and broker/exchange.

## 11. Investment tracker spec (decided 2026-11-15)
The portfolio grows into a full investment tracker (a ledger, not a broker: no orders, no wallet connect, no trading APIs). This section refines decisions 41–49.
50. Users?
    → Answer: Every user creates their own account. Login (Supabase Auth: magic link) is built first, before the tracker. Replaces 44 ("only me").
51. What is it for?
    → Answer: See my diversification and my average buy price (e.g. BTC), and whether I'm up (green) or down (red), in money and %.
52. Current holdings to load?
    → Answer: BTC, NVIDIA, AMD, Tesla, GoPro, Google.
53. How are holdings organized?
    → Answer: In "projects" (like photo albums): the user creates and names as many as they want, each with its own transactions. Optional fields: description, default broker, strategy, horizon, tags. Projects can be archived without losing history.
54. Views?
    → Answer: A main overview of everything (totals and diversification %), plus separate views per asset class (crypto only, stocks only) and per project.
55. Base currency?
    → Answer: USD for everyone in v1. Other currencies later.
56. Transfers between projects?
    → Answer: No. A sale is logged as a sell.
57. Assets?
    → Answer: US stocks/ETFs and all cryptos in v1; non-US stocks maybe later. Stablecoins count as cash. Fractional quantities are supported.
58. Missing or delisted price?
    → Answer: The user can enter the price manually.
59. Data entry?
    → Answer: Manual entry first. Right after, in v1: import from a screenshot, PDF or broker statement/CSV (Nordnet, Binance, Coinbase…), parsed by Claude (Haiku) and always shown in a review table before saving. This is also how the initial history gets loaded.
60. Cost basis method?
    → Answer: Weighted average cost only. No FIFO, no tax report.
61. Fees?
    → Answer: Optional field. When entered, buy fees add to cost basis and sell fees reduce proceeds.
62. Dividends and staking rewards?
    → Answer: Yes, in v1.
63. Stock splits?
    → Answer: Not in v1: trades are entered with the split-adjusted numbers the broker shows today. A "split" transaction type comes in v2.
64. Prices?
    → Answer: Crypto live via Binance (CoinGecko fallback), US stocks via Finnhub free tier (up to 15 min delay is fine). Latest prices are stored; daily price history comes with insights.
65. Insights?
    → Answer: In v2, for every crypto (and stock) the user holds: as complete as possible without overloading the screen. Methodology and a short disclaimer on each insight panel, full disclaimer in the footer. Never phrased as advice.
66. Numbers and dates?
    → Answer: Exact decimals (Postgres `numeric` + decimal.js, never floats). Dates stored in UTC and shown in the user's time zone, selectable by country in settings.
67. Offline?
    → Answer: Not needed.
68. Export?
    → Answer: CSV export in v1.
69. Design?
    → Answer: Same dark, clean style, plus a subtle blue glow when hovering cards. Charts in v1 (allocation donut). Desktop-first with a good mobile version.
70. Workflow?
    → Answer: Commit at the end of each step without asking. Don't push until the user says so.
71. Sign in with Google?
    → Answer: No. Email magic link only (decided 2026-11-15).
72. Editing the Supabase auth email template?
    → Answer: Not possible without custom SMTP on the free plan. Keep the default email for now (the link must be opened in the same browser). Set up custom SMTP in M8.
73. How is the session shown?
    → Answer: In the header, like most sites: a person icon + "Sign in" when signed out; a round avatar with the user's initial when signed in, opening a menu with the email, Portfolio and Sign out.
74. Fee on a reward (staking/airdrop)?
    → Answer: Optional. When entered, it is added to the cost basis; without it the reward costs 0 (decided 2026-11-17).
75. Dividend income: gross or net of fees/withholding?
    → Answer: Gross. The fee or withholding is still counted in total fees, and the cash balance receives the net amount that actually arrives (decided 2026-11-17).
76. Totals when an open position has no price?
    → Answer: Its market value, cost basis and unrealized P/L are left out (with a visible note), but its realized P/L and dividends still count, since they do not depend on a price (decided 2026-11-17).
77. Node.js version?
    → Answer: Node 22 (`.nvmrc`), required by Vitest 5 and Supabase (decided 2026-11-17).
78. How do database migrations reach Supabase?
    → Answer: Automatically. The Supabase GitHub integration ("Deploy to production") applies new files in `supabase/migrations` when they are merged to `main`. No more pasting into the SQL Editor. The profiles migration was made idempotent because it had been applied by hand (decided 2026-11-17).
79. Who maintains the shared asset catalogue?
    → Answer: Any signed-in user can read it and add a missing asset (e.g. from the search in M4); nobody can edit or delete assets from the app. Duplicates (same class, symbol and exchange) are rejected by the database (decided 2026-11-17).
80. First project?
    → Answer: Created automatically ("Main" / "Principal") on the first visit, and can be renamed. A transaction always has a project (decided 2026-11-17).
81. Asset search before price providers (M5)?
    → Answer: M4 searches the shared catalogue and lets the user add a missing asset by hand (symbol, name, kind: stock / ETF / crypto). Provider search comes in M5 (decided 2026-11-17).
82. Portfolio screen layout?
    → Answer: Tabs under /portfolio: Overview · Projects · Transactions, each project with its own page, and a "+ Transaction" button always visible (decided 2026-11-17).
83. Colors?
    → Answer: Three main colors, palette "Amethyst": black #0B0B0B (page), deep violet #33204F (borders, card tint #140F1F) and amethyst #B57CFF (primary buttons, active tabs, links, asset symbols, focus, hover light). Clickable cards get a beam of light that travels around the border on hover, and everything clickable shows the pointing hand. Chosen over blue and other violet options shown side by side. Replaces the plain white accents and the soft blue glow of decision 69 (decided 2026-11-17).
84. Portfolio sections?
    → Answer: Three: Overview (all investments), Crypto (all coins, BTC first) and Stocks. Each has 4 compact summary cards on top, an allocation donut, and more detail below to be defined later (decided 2026-11-17).
85. Which summary cards?
    → Answer: Overview: current value, total P/L, today's change, news. Crypto: BTC average buy price, BTC P/L, total crypto value, news. Stocks: total stocks value, stocks P/L, best and worst of the day, news. Average buy price is shown for BTC only for now (decided 2026-11-17).
86. Green or red card numbers?
    → Answer: All numbers on a section's cards follow that section's result: green in profit, red at a loss. For Crypto it is the BTC price against the BTC average buy price (decided 2026-11-17).
87. News card while the news product is paused?
    → Answer: Shows the most important sample story (short headline + "Open →") in all three sections; real news, by topic, comes later (decided 2026-11-17).
88. Portfolio header?
    → Answer: Highlight the current section in the site header (Portfolio / News), remove the "Portfolio · Your stocks and crypto…" title block, and move the tabs and "+ Transaction" button to a better place. Chosen from options shown side by side: the active link gets an amethyst underline on the header's edge (over a pill or a bigger link), and the tabs plus "+ Transaction" go in a left sidebar that becomes a row on small screens (over a toolbar row, a sticky sub-bar or tabs inside the header). Done before M5 as step S2 (decided 2026-11-17).
