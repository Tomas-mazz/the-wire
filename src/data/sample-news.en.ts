import type { NewsItem } from "./types";

/*
 * SAMPLE DATA for step 2 (design only). These stories are made up.
 * Source links point to each outlet's home page, not to real articles.
 * Replaced by real AI-summarized news in step 5.
 */
export const SAMPLE_NEWS_EN: NewsItem[] = [
  // ── Stocks ────────────────────────────────────────────
  {
    id: "stocks-1",
    topic: "stocks",
    importance: "top",
    title: "Chipmakers lead a broad rally as AI demand forecasts rise",
    summary:
      "Semiconductor stocks pushed major US indices higher after several firms raised their outlook for data-center spending through next year.",
    details: {
      paragraph:
        "Investors rotated back into chip stocks after a quiet week, betting that demand for AI hardware will stay strong. Analysts warned that valuations are already high and that any slowdown in cloud spending could reverse the move quickly.",
      keyPoints: [
        "Chip index up more than 2% on the day",
        "Data-center spending outlooks revised upward",
        "Analysts flag stretched valuations",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T06:30:00Z",
  },
  {
    id: "stocks-2",
    topic: "stocks",
    importance: "top",
    title: "European markets close mixed as luxury stocks slip",
    summary:
      "Gains in banks and energy were offset by weakness in luxury brands after softer sales figures from Asia.",
    details: {
      paragraph:
        "The pan-European index ended roughly flat. Luxury groups fell on concerns about slowing demand in Asia, while banks rose on expectations that interest rates will stay higher for longer.",
      keyPoints: [
        "Luxury sector down on weak Asian sales",
        "Banks benefit from rate expectations",
        "Main European index flat overall",
      ],
    },
    source: { name: "Financial Times", url: "https://www.ft.com" },
    publishedAt: "2026-11-12T06:10:00Z",
  },
  {
    id: "stocks-3",
    topic: "stocks",
    importance: "top",
    title: "Retail giant beats earnings estimates and lifts guidance",
    summary:
      "Shares jumped in pre-market trading after the company reported stronger online sales and raised its full-year forecast.",
    details: {
      paragraph:
        "The retailer credited faster delivery and a growing advertising business for the beat. Management said holiday demand looks healthy but warned about cost pressure from logistics.",
      keyPoints: [
        "Online sales grew double digits",
        "Full-year guidance raised",
        "Logistics costs remain a risk",
      ],
    },
    source: { name: "CNBC", url: "https://www.cnbc.com" },
    publishedAt: "2026-11-12T05:45:00Z",
  },
  {
    id: "stocks-4",
    topic: "stocks",
    importance: "secondary",
    title: "Argentine ADRs extend gains on reform optimism",
    summary: "Bank and energy ADRs rose for a third straight session.",
    details: {
      paragraph:
        "Investors continued to price in progress on economic reforms, lifting Argentine shares listed in New York.",
      keyPoints: [
        "Third consecutive day of gains",
        "Banks and energy lead",
        "Reform agenda drives sentiment",
      ],
    },
    source: { name: "Bloomberg", url: "https://www.bloomberg.com" },
    publishedAt: "2026-11-12T05:20:00Z",
  },
  {
    id: "stocks-5",
    topic: "stocks",
    importance: "secondary",
    title: "Oil majors dip as crude prices ease",
    summary: "Energy stocks fell slightly as oil retreated from recent highs.",
    details: {
      paragraph:
        "Crude prices eased on signs of higher supply, weighing on large oil producers.",
      keyPoints: [
        "Crude down about 1%",
        "Supply expected to rise",
        "Energy sector slightly negative",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T05:00:00Z",
  },

  // ── Crypto ────────────────────────────────────────────
  {
    id: "crypto-1",
    topic: "crypto",
    importance: "top",
    title: "Bitcoin holds steady as ETF inflows slow",
    summary:
      "Bitcoin traded in a narrow range while daily inflows into spot ETFs dropped to their lowest level in weeks.",
    details: {
      paragraph:
        "After a strong month, demand from ETF buyers has cooled. Traders say the market is waiting for clearer signals on interest rates before the next big move.",
      keyPoints: [
        "Price range-bound for three days",
        "ETF inflows at multi-week low",
        "Rate outlook is the next catalyst",
      ],
    },
    source: { name: "CoinDesk", url: "https://www.coindesk.com" },
    publishedAt: "2026-11-12T06:40:00Z",
  },
  {
    id: "crypto-2",
    topic: "crypto",
    importance: "top",
    title: "Ethereum network upgrade enters final testing",
    summary:
      "Developers launched the last public test network for the upcoming upgrade, which aims to cut transaction costs for layer-2 networks.",
    details: {
      paragraph:
        "If testing goes smoothly, the upgrade could ship on mainnet within a few months. Node operators are being asked to update their software ahead of time.",
      keyPoints: [
        "Final testnet now live",
        "Lower fees for layer-2 networks",
        "Mainnet date not yet confirmed",
      ],
    },
    source: { name: "The Block", url: "https://www.theblock.co" },
    publishedAt: "2026-11-12T06:00:00Z",
  },
  {
    id: "crypto-3",
    topic: "crypto",
    importance: "top",
    title: "EU regulators publish new guidance for stablecoin issuers",
    summary:
      "The guidance clarifies reserve requirements and reporting rules for companies issuing euro- and dollar-backed stablecoins.",
    details: {
      paragraph:
        "The document fills gaps left by the original regulation and sets deadlines for issuers to comply. Industry groups welcomed the clarity but said some rules may be costly for smaller players.",
      keyPoints: [
        "Stricter reserve reporting",
        "Compliance deadlines set",
        "Smaller issuers worried about costs",
      ],
    },
    source: { name: "CoinDesk", url: "https://www.coindesk.com" },
    publishedAt: "2026-11-12T05:30:00Z",
  },
  {
    id: "crypto-4",
    topic: "crypto",
    importance: "secondary",
    title: "Solana transaction volume hits a monthly high",
    summary: "On-chain activity rose on the back of new trading apps.",
    details: {
      paragraph:
        "Daily transactions on Solana reached their highest level this month, driven by decentralized trading apps.",
      keyPoints: [
        "Monthly high in transactions",
        "Driven by trading apps",
        "Fees remain low",
      ],
    },
    source: { name: "Decrypt", url: "https://decrypt.co" },
    publishedAt: "2026-11-12T05:10:00Z",
  },
  {
    id: "crypto-5",
    topic: "crypto",
    importance: "secondary",
    title: "Major exchange adds new euro trading pairs",
    summary: "European users get more direct euro markets.",
    details: {
      paragraph:
        "The exchange expanded its euro offering, reducing the need to convert through dollar stablecoins.",
      keyPoints: [
        "New EUR pairs listed",
        "Aimed at European users",
        "Lower conversion costs",
      ],
    },
    source: { name: "The Block", url: "https://www.theblock.co" },
    publishedAt: "2026-11-12T04:50:00Z",
  },

  // ── Programming ───────────────────────────────────────
  {
    id: "programming-1",
    topic: "programming",
    importance: "top",
    title: "Major JavaScript framework ships faster server rendering",
    summary:
      "The new release cuts server rendering time and simplifies data caching, with an automated tool to help migrate existing apps.",
    details: {
      paragraph:
        "The team focused on performance and developer experience. Early benchmarks show noticeably faster page loads, and the migration tool handles most breaking changes automatically.",
      keyPoints: [
        "Faster server rendering",
        "Simpler caching model",
        "Automated migration tool included",
      ],
    },
    source: { name: "The Verge", url: "https://www.theverge.com" },
    publishedAt: "2026-11-12T06:20:00Z",
  },
  {
    id: "programming-2",
    topic: "programming",
    importance: "top",
    title: "Developer survey: TypeScript keeps growing in popularity",
    summary:
      "A large annual survey shows TypeScript adoption rising again, with most new web projects now starting with static types.",
    details: {
      paragraph:
        "Respondents said catching errors before running code was the main reason to switch. The survey also highlighted growing use of AI coding assistants across all experience levels.",
      keyPoints: [
        "TypeScript adoption up again",
        "Most new web projects use types",
        "AI assistants widely adopted",
      ],
    },
    source: { name: "InfoQ", url: "https://www.infoq.com" },
    publishedAt: "2026-11-12T05:50:00Z",
  },
  {
    id: "programming-3",
    topic: "programming",
    importance: "top",
    title: "Popular open-source database releases a major version",
    summary:
      "The update brings faster queries, better JSON support and improved replication for high-traffic apps.",
    details: {
      paragraph:
        "Maintainers highlighted performance gains on large datasets and new tools for monitoring. Managed cloud providers are expected to offer the new version within weeks.",
      keyPoints: [
        "Faster queries on large tables",
        "Improved JSON features",
        "Cloud providers to follow soon",
      ],
    },
    source: { name: "Ars Technica", url: "https://arstechnica.com" },
    publishedAt: "2026-11-12T05:15:00Z",
  },
  {
    id: "programming-4",
    topic: "programming",
    importance: "secondary",
    title: "Browser vendors agree on new CSS layout features",
    summary: "Upcoming features will work the same across all major browsers.",
    details: {
      paragraph:
        "Browser teams aligned on a set of CSS features to ship together, reducing compatibility issues for developers.",
      keyPoints: [
        "Cross-browser agreement",
        "New layout capabilities",
        "Fewer compatibility hacks",
      ],
    },
    source: { name: "Smashing Magazine", url: "https://www.smashingmagazine.com" },
    publishedAt: "2026-11-12T04:40:00Z",
  },
  {
    id: "programming-5",
    topic: "programming",
    importance: "secondary",
    title: "Security patch released for a widely used logging library",
    summary: "Maintainers urge users to update as soon as possible.",
    details: {
      paragraph:
        "A vulnerability was fixed in a popular logging package. Projects that depend on it should upgrade to the latest version.",
      keyPoints: [
        "Vulnerability fixed",
        "Upgrade recommended",
        "No known active exploits",
      ],
    },
    source: { name: "BleepingComputer", url: "https://www.bleepingcomputer.com" },
    publishedAt: "2026-11-12T04:30:00Z",
  },

  // ── Economy ───────────────────────────────────────────
  {
    id: "economy-1",
    topic: "economy",
    importance: "top",
    title: "US inflation cools slightly, raising hopes for rate cuts",
    summary:
      "Consumer prices rose less than expected last month, strengthening the case for the central bank to lower rates early next year.",
    details: {
      paragraph:
        "Lower energy and used-car prices helped bring inflation down. Economists cautioned that services inflation remains sticky, so policymakers are likely to move carefully.",
      keyPoints: [
        "Inflation below expectations",
        "Rate-cut hopes increase",
        "Services prices still elevated",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T06:50:00Z",
  },
  {
    id: "economy-2",
    topic: "economy",
    importance: "top",
    title: "European Central Bank signals a pause in policy changes",
    summary:
      "Officials suggested rates will stay unchanged for now as growth in the eurozone remains weak but stable.",
    details: {
      paragraph:
        "Several policymakers said they want more data before deciding the next step. Markets now expect no change at the next meeting.",
      keyPoints: [
        "Rates expected to hold",
        "Eurozone growth weak but stable",
        "Decision depends on new data",
      ],
    },
    source: { name: "Financial Times", url: "https://www.ft.com" },
    publishedAt: "2026-11-12T06:05:00Z",
  },
  {
    id: "economy-3",
    topic: "economy",
    importance: "top",
    title: "Argentina reports a lower monthly inflation figure",
    summary:
      "Monthly inflation slowed again, continuing a downward trend that the government attributes to fiscal discipline.",
    details: {
      paragraph:
        "The new figure was below analyst expectations. Economists said the trend is positive but that wages and consumption are still recovering.",
      keyPoints: [
        "Monthly inflation slowed",
        "Below analyst expectations",
        "Consumption still recovering",
      ],
    },
    source: { name: "Bloomberg", url: "https://www.bloomberg.com" },
    publishedAt: "2026-11-12T05:40:00Z",
  },
  {
    id: "economy-4",
    topic: "economy",
    importance: "secondary",
    title: "Spain's unemployment rate falls to a multi-year low",
    summary: "Tourism and services drove job creation.",
    details: {
      paragraph:
        "Spain added jobs for another quarter, led by tourism and services, pushing unemployment to its lowest level in years.",
      keyPoints: [
        "Unemployment at multi-year low",
        "Tourism leads hiring",
        "Services sector strong",
      ],
    },
    source: { name: "El País", url: "https://elpais.com" },
    publishedAt: "2026-11-12T05:05:00Z",
  },
  {
    id: "economy-5",
    topic: "economy",
    importance: "secondary",
    title: "Global trade volumes edge higher",
    summary: "Shipping data points to a modest recovery in trade.",
    details: {
      paragraph:
        "Container shipping volumes rose slightly, suggesting global trade is stabilizing after a weak period.",
      keyPoints: [
        "Shipping volumes up slightly",
        "Trade stabilizing",
        "Recovery still modest",
      ],
    },
    source: { name: "The Economist", url: "https://www.economist.com" },
    publishedAt: "2026-11-12T04:45:00Z",
  },
];
