# Style guide — The Wire

> Defined on 2026-11-11. Replaces the previous style ("old stock exchange", with paper tape and serif type).
> Reference: [starknet.io](https://www.starknet.io/) — take its spirit, don't copy it.

## The idea in one sentence
**Futuristic, dark and clean:** a near-black screen, large white type, lots of empty space and soft cards. The only color comes from numbers going up (green) or down (red).

## Principles
1. **Less is more.** On arrival you see only the essentials: headlines and prices. Everything else opens on tap ("read more", tabs, dropdowns). The opposite of Yahoo Finance, which shows everything at once.
2. **Color has meaning.** Three main colors (decision 83, palette "Amethyst"): **black** for the page, **deep violet** for borders and card tint, and **amethyst** for what you act on (primary buttons, active tabs, links, asset symbols, the logo's "WIRE") and for the hover light. Green/red are only for gains and losses, so the accent is never green or red. A glance is enough to read the market.
3. **Generous spacing.** Wide margins and gaps. If something feels cramped, there is too much content.
4. **Subtle motion.** Animations support the content and never distract.
5. **Readable in under 5 minutes.** Every design decision should help with that.

## Colors
Dark mode only. In code they are defined as CSS variables (*design tokens*): a single place to change a color for the whole site.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0B` | Page background (near-black) |
| `--surface` | `#140F1F` | Cards and panels (black with a hint of violet) |
| `--surface-hover` | `#1B1429` | Card on hover |
| `--line` | `#33204F` | **2nd color.** Deep violet borders |
| `--line-strong` | `#4A3170` | Inputs and outlined buttons |
| `--accent` | `#B57CFF` | **3rd color.** Amethyst (6.8:1 on black): primary buttons, active tabs, links, asset symbols, focus outline, hover light |
| `--accent-ink` | `#0B0714` | Text on accent backgrounds |
| `--text` | `#FFFFFF` | Headings |
| `--text-body` | `#CCCCCC` | Body text |
| `--text-muted` | `#8A8A8A` | Dates, sources, labels |
| `--up` | `#3DD68C` | Gain (price and ▲ arrow) |
| `--down` | `#FF5C5C` | Loss (price and ▼ arrow) |

No gradients, except the hover light on clickable cards (see Animation).

## Typography
- **Text and headings:** [Inter](https://fonts.google.com/specimen/Inter), a modern, clean sans-serif.
- **Prices and numbers:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), monospaced. Numbers don't "jump" when they change, because every digit has the same width.

| Element | Size (desktop / mobile) | Weight |
|---|---|---|
| Hero heading (H1) | 48px / 32px | 700 |
| Top story heading | 24px / 20px | 700 |
| Secondary story heading | 18px / 16px | 600 |
| Body | 16px | 400, line height 1.6 |
| Labels / metadata | 13px | 500, uppercase, slight letter spacing |

## Shapes and spacing
- **Border radius:** 24px for large cards, 16px for small cards, 12px for buttons and inputs, and pills (fully rounded) for topic tags.
- **Spacing:** multiples of 8px (8, 16, 24, 32, 48, 64). 64px or more between sections.
- **Max content width:** 1200px, centered. 16px side margins on mobile.
- **Borders:** always 1px with `--border`. No heavy shadows.

## Page elements

### Header
- Sticky at the top, semi-transparent `--bg` with blur (glass effect).
- "THE WIRE" logo in uppercase with letter spacing, plus language, country and currency selectors.
- Section links (Portfolio, News): the current one is white and bold with a 2px amethyst line on the header's bottom edge (decision 88); the others are muted.

### Prices in tables
- Price cell: the price, and under it the 24 h change (▲/▼ with green/red). A price not confirmed for 10 minutes turns muted with "⚠ Out of date · 10 minutes ago". An open position without a price says "No price" and is left out of totals, with a note under the table.
- "Set price" (amethyst link) under "No price" opens a small inline field; a manual price shows "✎ manual · 2 days ago · Edit" and is never marked out of date.
- A green dot plus "Live" while the crypto WebSocket is connected; otherwise "Prices update every 30 seconds".
- Under the table: sources (Binance, Finnhub, CoinGecko with a link, as CoinGecko's free plan requires) and "for information only, not advice".

### Portfolio sub-bar
- A sticky bar right under the site header with the tabs (Overview · Projects · Transactions) on the left and "+ Transaction" on the right (only "+" on phones).
- It is as wide as the content (max 1200px), not the whole screen like the site header, so it reads as the portfolio's own header.
- Tabs look like the header links: the active one is white and bold with a 2px amethyst line on the bar's bottom edge. No page title: the header already shows the section.

### Topic tabs
- Pill-shaped tabs with the topic icon, placed right above the news grid (moved out of the header in step 2 to keep the header clean on mobile).
- Selected tab: white background, black text. On mobile the row scrolls horizontally.

### Hero
- Today's date and a short heading, e.g. "What matters today".
- **Ticker background:** behind the heading, a grid of symbols and numbers (`AAPL 189.20 +1.2% · BTC 67,200 −0.4% · NVDA…`) in JetBrains Mono, very faint gray (5–8% opacity). It drifts very slowly and fades out toward the edges. This is the site's visual signature.

### Price carousel
- A horizontal strip that scrolls by itself, with ticker, price and change (green ▲ / red ▼).
- Pauses on hover or tap.
- When a price changes, the number flashes briefly in the matching color (0.6 s).

### News cards
- **3 top stories:** large cards (`--surface`, 24px radius) with topic tag, headline, 2–3 line summary and a "Read more" button.
- **2 secondary stories:** below, smaller and compact (headline and one line only).
- **"Read more":** the card expands in place with a smooth animation, showing 1 paragraph, 3 key points and "Read on [source] →".
- No photos. Each topic is identified by its **line icon**.

### Icons
- Thin line icons (1.5px stroke) from [Lucide](https://lucide.dev), in white or gray.
- Per topic: Stocks → `trending-up`, Crypto → `bitcoin`, Programming → `code`, Economy/politics → `landmark`.

### Buttons
- **Primary:** white background, black text, 12px radius.
- **Secondary:** transparent, `--border-strong` border and white text (like "Bridge" and "Earn" on Starknet).

## Animation (level: subtle)
- **Reveal on scroll:** cards rise 8px and fade in (0.4 s).
- **Card hover (clickable cards):** the background changes to `--surface-hover` and a short beam of `--accent` fades in (0.4 s) and travels around the border (one lap every 2.4 s). Class `glow-card` in `globals.css`. With "reduce motion" the whole border lights up instead, without movement.
- **Pointer:** everything clickable shows the pointing hand (buttons, links, tabs, selects, checkboxes); disabled buttons show "not allowed".
- **Carousel:** continuous, slow movement.
- **Ticker background:** drifts very slowly.
- **Accessibility:** if the user has "reduce motion" enabled (`prefers-reduced-motion`), everything that moves on its own is turned off.

## Accessibility
- Sufficient contrast: `#CCCCCC` text on `#0B0B0B` comfortably passes WCAG AA.
- Gains and losses are never shown by color alone: they also carry an arrow (▲/▼) and a sign (+/−), for color-blind users.
- Everything is keyboard-accessible, with a visible white focus outline.

## Don'ts
- No gradients other than the card hover light. The accent is never used for prices or gains/losses (those are green/red).
- No photos or 3D illustrations.
- Don't fill the screen with information: when in doubt, hide it behind "read more".
- No flashy animations that distract from reading.
