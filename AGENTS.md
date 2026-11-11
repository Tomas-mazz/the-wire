# Instructions for AI assistants

**Status (2026-11-11):** the definition phase is complete. All kickoff questions are answered and the user approved starting development. Build step by step following `PLAN.md`, respecting `STYLE.md`. For any new decision, ask the user — don't decide for them.

**Repo language:** everything committed to the repository is written in **English**: commit messages, README, docs, code (variable and function names, comments) and config files. Talk to the user in **Spanish**. User-facing UI text is bilingual (ES/EN).

**Working with the user:**
- The user is learning to program: explain what you do and why.
- When the user is unsure, explain the options simply (pros and cons) and let them choose.
- Record new product decisions in `QUESTIONS.md` and keep `PLAN.md` up to date.

**Project docs:** `IDEA.md` (what and why) · `QUESTIONS.md` (decisions) · `STYLE.md` (design guide) · `PLAN.md` (roadmap).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
