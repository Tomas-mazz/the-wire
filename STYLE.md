# Style guide — The Wire

> Defined on 2026-11-11. Replaces the previous style ("old stock exchange", with paper tape and serif type).
> Reference: [starknet.io](https://www.starknet.io/) — take its spirit, don't copy it.

## The idea in one sentence
**Futuristic, dark and clean:** a near-black screen, large white type, lots of empty space and soft cards. The only color comes from numbers going up (green) or down (red).

## Principles
1. **Less is more.** On arrival you see only the essentials: headlines and prices. Everything else opens on tap ("read more", tabs, dropdowns). The opposite of Yahoo Finance, which shows everything at once.
2. **Color has meaning.** No decorative colors: white and grays for everything, and green/red only for gains and losses. A glance is enough to read the market.
3. **Generous spacing.** Wide margins and gaps. If something feels cramped, there is too much content.
4. **Subtle motion.** Animations support the content and never distract.
5. **Readable in under 5 minutes.** Every design decision should help with that.

## Colors
Dark mode only. In code they are defined as CSS variables (*design tokens*): a single place to change a color for the whole site.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0B` | Page background (near-black) |
| `--surface` | `#161616` | Cards and panels |
| `--surface-hover` | `#1F1F1F` | Card on hover |
| `--border` | `rgba(255,255,255,0.08)` | Thin, almost invisible borders |
| `--border-strong` | `rgba(255,255,255,0.20)` | Outlined buttons, focus |
| `--text` | `#FFFFFF` | Headings |
| `--text-body` | `#CCCCCC` | Body text |
| `--text-muted` | `#8A8A8A` | Dates, sources, labels |
| `--up` | `#3DD68C` | Gain (price and ▲ arrow) |
| `--down` | `#FF5C5C` | Loss (price and ▼ arrow) |

No gradients.

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
- **Card hover:** background changes to `--surface-hover` and the border lightens slightly.
- **Carousel:** continuous, slow movement.
- **Ticker background:** drifts very slowly.
- **Accessibility:** if the user has "reduce motion" enabled (`prefers-reduced-motion`), everything that moves on its own is turned off.

## Accessibility
- Sufficient contrast: `#CCCCCC` text on `#0B0B0B` comfortably passes WCAG AA.
- Gains and losses are never shown by color alone: they also carry an arrow (▲/▼) and a sign (+/−), for color-blind users.
- Everything is keyboard-accessible, with a visible white focus outline.

## Don'ts
- No gradients or accent colors.
- No photos or 3D illustrations.
- Don't fill the screen with information: when in doubt, hide it behind "read more".
- No flashy animations that distract from reading.
