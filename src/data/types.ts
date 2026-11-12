/** The four news topics available in v1. */
export type Topic = "stocks" | "crypto" | "programming" | "economy";

/** Display metadata for each topic, in tab order. */
export const TOPICS: { id: Topic; label: string }[] = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "programming", label: "Programming" },
  { id: "economy", label: "Economy" },
];

/**
 * One summarized news story.
 * Each topic gets 5 per day: 3 "top" stories and 2 "secondary" ones.
 */
export interface NewsItem {
  id: string;
  topic: Topic;
  importance: "top" | "secondary";
  title: string;
  /** Short summary, 2–3 lines. */
  summary: string;
  /** Content shown when the card is expanded ("Read more"). */
  details: {
    paragraph: string;
    keyPoints: [string, string, string];
  };
  source: {
    name: string;
    url: string;
  };
  /** ISO 8601 timestamp, e.g. "2026-11-12T07:00:00Z". */
  publishedAt: string;
}
