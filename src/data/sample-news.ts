import type { Locale } from "next-intl";
import type { NewsItem } from "./types";
import { SAMPLE_NEWS_EN } from "./sample-news.en";
import { SAMPLE_NEWS_ES } from "./sample-news.es";

/** Sample stories per UI language (same ids in both). Replaced by real data in step 5. */
export const SAMPLE_NEWS: Record<Locale, NewsItem[]> = {
  en: SAMPLE_NEWS_EN,
  es: SAMPLE_NEWS_ES,
};
