import { getLocale, getTranslations } from "next-intl/server";
import { SAMPLE_NEWS } from "@/data/sample-news";
import type { Topic } from "@/data/types";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getProjects, getTransactions } from "@/lib/portfolio/data";
import HoldingsTable, { holdingsFrom } from "./HoldingsTable";
import { card, primaryButton } from "./styles";
import type { Section } from "./SummaryCards";

/** Which asset classes each section shows (decision 84). */
const CLASSES: Record<Section, readonly string[]> = {
  overview: ["stock", "etf", "crypto"],
  crypto: ["crypto"],
  stocks: ["stock", "etf"],
};

/** News topic of each section's News card; Overview takes the top story of any topic. */
const TOPIC: Record<Section, Topic | null> = { overview: null, crypto: "crypto", stocks: "stocks" };

/**
 * One portfolio section (Overview, Crypto or Stocks): summary cards, the
 * allocation donut and the holdings table, all filtered to the section.
 * Reads the session, so render it inside <Suspense>.
 */
export default async function SectionDashboard({ section }: { section: Section }) {
  const locale = await getLocale();
  // Verifies the session (or redirects to /login) before anything private renders.
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  // Creates the default project on the first visit (decision 80).
  await getProjects(user.id, t("defaultProject"));
  const all = await getTransactions(user.id, {}, 10_000);

  if (all.length === 0) {
    return (
      <div className={card}>
        <p className="text-body">{t("overview.empty")}</p>
        <Link href="/portfolio/transactions/new" className={`${primaryButton} mt-5`}>
          {t("overview.emptyCta")}
        </Link>
      </div>
    );
  }

  const transactions = all.filter((tx) => CLASSES[section].includes(tx.asset.assetClass));
  const { rows, problemSymbols } = holdingsFrom(transactions);

  if (rows.length === 0 && problemSymbols.length === 0) {
    return (
      <div className={card}>
        <p className="text-body">{t(section === "crypto" ? "dashboard.emptyCrypto" : "dashboard.emptyStocks")}</p>
        <Link href="/portfolio/transactions/new" className={`${primaryButton} mt-5`}>
          {t("overview.emptyCta")}
        </Link>
      </div>
    );
  }

  // The most important sample story until the news product returns (decision 87).
  const topic = TOPIC[section];
  const story = SAMPLE_NEWS[locale].find((n) => n.importance === "top" && (topic === null || n.topic === topic));

  return (
    <div className="space-y-4">
      {problemSymbols.length > 0 && (
        <p role="alert" className="rounded-xl border border-down/40 px-4 py-3 text-sm text-down">
          {t("overview.problems", { assets: problemSymbols.join(", ") })}
        </p>
      )}
      {rows.length > 0 && (
        <HoldingsTable
          rows={rows}
          dashboard={{ section, news: story ? { title: story.title } : null }}
          heading={
            <h2 id="holdings-title" className="text-xl font-bold text-fg">
              {t("overview.holdingsTitle")}
            </h2>
          }
        />
      )}
    </div>
  );
}
