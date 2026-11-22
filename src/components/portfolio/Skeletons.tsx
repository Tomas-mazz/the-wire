import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { sectionStory } from "./SectionDashboard";
import { bone, card, summaryCard, summaryGrid, summaryLabel, summaryNewsCard } from "./styles";
import type { Section } from "./SummaryCards";

/*
 * Loading skeletons for the portfolio pages: grey blocks in the shape of
 * what is coming, so the page never shows a bare "Loading…". Anything that
 * does not depend on the user's data (card titles, the sample story) is
 * shown right away. These are Suspense fallbacks, so they must not read the
 * session or the URL.
 */

/** Wrapper that tells screen readers the page is loading. */
async function Loading({ children, className }: { children: React.ReactNode; className?: string }) {
  const t = await getTranslations("Portfolio");
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t("loading")}</span>
      {children}
    </div>
  );
}

/** A table of grey rows. */
export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line" aria-hidden="true">
      <div className="flex gap-6 border-b border-line bg-surface px-3 py-3.5">
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className={`${bone} h-3 flex-1`} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-line px-3 py-4 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className={`${bone} h-3.5 flex-1 ${c === 0 ? "max-w-40" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card titles of each section, in order (the 4th card is always News). */
const CARD_LABELS = {
  overview: ["currentValue", "pnl", "today"],
  crypto: ["btcPrice", "btcAvg", "cryptoValue"],
  stocks: ["stocksValue", "stocksPnl", "bestWorst"],
} as const satisfies Record<Section, readonly string[]>;

/** Overview / Crypto / Stocks while loading: real card titles and story, grey numbers, chart, donut and table. */
export async function SectionSkeleton({ section }: { section: Section }) {
  const locale = await getLocale();
  const t = await getTranslations("Portfolio");
  const story = sectionStory(section, locale);

  return (
    <Loading className="space-y-3">
      <div className={summaryGrid}>
        {CARD_LABELS[section].map((key) => (
          <div key={key} className={summaryCard}>
            <span className={summaryLabel}>{t(`dashboard.${key}`)}</span>
            <div aria-hidden="true">
              <div className={`${bone} mt-2 h-4 w-3/4 sm:mt-2.5 sm:h-6 lg:h-7`} />
              <div className={`${bone} mt-2 h-2.5 w-1/2 sm:h-3`} />
            </div>
          </div>
        ))}
        {/* The sample story does not depend on the user, so it is shown right away. */}
        <Link href="/news" className={`${summaryCard} ${summaryNewsCard} glow-card transition-colors hover:bg-surface-hover`}>
          <span className={summaryLabel}>{t("dashboard.news")}</span>
          <span>
            <span className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-fg">
              {story?.title ?? t("dashboard.newsNone")}
            </span>
            <span className="mt-1.5 block text-[13px] text-accent">{t("dashboard.newsOpen")}</span>
          </span>
        </Link>
      </div>

      {/* Same frame as the loaded page: chart on the left, allocation on the right (decision 116). */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-fg">{t("dashboard.chart.title")}</h2>
              <div aria-hidden="true">
                <div className={`${bone} mt-2 h-7 w-36`} />
                <div className={`${bone} mt-2 h-3 w-48`} />
              </div>
            </div>
            <div className={`${bone} h-7 w-48 rounded-xl`} aria-hidden="true" />
          </div>
          <div className={`${bone} mt-4 h-[220px] w-full rounded-xl`} aria-hidden="true" />
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold text-fg">{t("dashboard.allocation")}</h2>
          <div className="flex flex-col items-center gap-6" aria-hidden="true">
            <div className="size-40 shrink-0 animate-pulse rounded-full border-[14px] border-line/45" />
            <div className="grid w-full gap-4">
              {[0.9, 0.55, 0.3].map((width) => (
                <div key={width} className="flex items-center gap-3">
                  <div className={`${bone} size-3 rounded-full`} />
                  <div className={`${bone} h-3.5 w-12`} />
                  <div className="h-2 flex-1">
                    <div className={`${bone} h-2 rounded-full`} style={{ width: `${width * 100}%` }} />
                  </div>
                  <div className={`${bone} h-3.5 w-12`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-7">
        <h2 className="text-xl font-bold text-fg">{t("overview.holdingsTitle")}</h2>
        <div className={`${bone} h-3 w-48`} aria-hidden="true" />
        <TableSkeleton rows={4} columns={7} />
      </div>
    </Loading>
  );
}

/** Projects tab while loading: three grey project cards. */
export async function ProjectsSkeleton() {
  return (
    <Loading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} space-y-3`}>
            <div className={`${bone} h-5 w-2/3`} />
            <div className={`${bone} h-3 w-full`} />
            <div className={`${bone} h-3 w-1/3`} />
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Transactions tab while loading: the filter row and the table. */
export async function TransactionsSkeleton() {
  return (
    <Loading className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end" aria-hidden="true">
        {[2, 1, 1, 1, 1].map((span, i) => (
          <div key={i} className={span === 2 ? "lg:col-span-2" : undefined}>
            <div className={`${bone} h-3 w-20`} />
            <div className={`${bone} mt-2 h-11 w-full rounded-xl`} />
          </div>
        ))}
      </div>
      <TableSkeleton rows={8} columns={7} />
    </Loading>
  );
}

/** A form while loading (new / edit transaction). */
export async function FormSkeleton() {
  return (
    <Loading>
      <div className={`${card} max-w-3xl space-y-6`} aria-hidden="true">
        <div className={`${bone} h-6 w-48`} />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <div className={`${bone} h-3 w-24`} />
              <div className={`${bone} mt-2 h-11 w-full rounded-xl`} />
            </div>
          ))}
        </div>
        <div className={`${bone} h-10 w-36 rounded-xl`} />
      </div>
    </Loading>
  );
}

/** One project while loading: back link, title, holdings and transactions. */
export async function ProjectDetailSkeleton() {
  return (
    <Loading className="space-y-10">
      <div aria-hidden="true">
        <div className={`${bone} h-3.5 w-24`} />
        <div className={`${bone} mt-5 h-7 w-56`} />
      </div>
      <TableSkeleton rows={3} columns={7} />
      <TableSkeleton rows={5} columns={6} />
    </Loading>
  );
}
