# The Wire

News summaries without the overload. Stocks, crypto, programming and economy: the most important stories of the day in 2–3 lines, with live prices. Available in English and Spanish.

> Work in progress. See [`PLAN.md`](PLAN.md) for the roadmap and [`STYLE.md`](STYLE.md) for the design guide.

## Stack
Next.js + TypeScript · Tailwind CSS · next-intl (EN/ES) · Postgres · Vercel · Claude API

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in the keys
npm run dev                  # http://localhost:3000 (redirects to /en or /es)
```

## Translations
UI strings live in `messages/en.json` and `messages/es.json`. Add every new key to both files — TypeScript flags keys that are missing from `en.json`.

## Project docs
- [`IDEA.md`](IDEA.md): what it is and why
- [`QUESTIONS.md`](QUESTIONS.md): all product decisions
- [`STYLE.md`](STYLE.md): visual design guide
- [`PLAN.md`](PLAN.md): step-by-step roadmap
