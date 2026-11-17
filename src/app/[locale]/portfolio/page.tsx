import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import HoldingsTable, { holdingsFrom } from "@/components/portfolio/HoldingsTable";
import { card, primaryButton } from "@/components/portfolio/styles";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getProjects, getTransactions } from "@/lib/portfolio/data";

/** Overview tab: everything the user holds. Dashboards with prices come in M5–M6. */
export default async function OverviewPage() {
  const t = await getTranslations("Portfolio");
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const locale = await getLocale();
  // Verifies the session (or redirects to /login) before anything private renders.
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  // Creates the default project on the first visit (decision 80).
  await getProjects(user.id, t("defaultProject"));
  const transactions = await getTransactions(user.id, {}, 10_000);

  if (transactions.length === 0) {
    return (
      <div className={card}>
        <p className="text-body">{t("overview.empty")}</p>
        <Link href="/portfolio/transactions/new" className={`${primaryButton} mt-5`}>
          {t("overview.emptyCta")}
        </Link>
      </div>
    );
  }

  const { rows, problemSymbols } = holdingsFrom(transactions);

  return (
    <section aria-labelledby="holdings-title" className="space-y-4">
      <h2 id="holdings-title" className="text-xl font-bold text-fg">
        {t("overview.holdingsTitle")}
      </h2>
      {problemSymbols.length > 0 && (
        <p role="alert" className="rounded-xl border border-down/40 px-4 py-3 text-sm text-down">
          {t("overview.problems", { assets: problemSymbols.join(", ") })}
        </p>
      )}
      {rows.length > 0 && <HoldingsTable rows={rows} locale={locale} />}
    </section>
  );
}
