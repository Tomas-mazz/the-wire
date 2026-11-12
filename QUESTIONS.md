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
