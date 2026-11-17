import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { setProjectArchived } from "@/app/[locale]/portfolio/actions";
import HoldingsTable, { holdingsFrom } from "@/components/portfolio/HoldingsTable";
import ProjectForm from "@/components/portfolio/ProjectForm";
import { card, secondaryButton } from "@/components/portfolio/styles";
import TransactionTable from "@/components/portfolio/TransactionTable";
import { computeCash } from "@/domain";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { formatUsd } from "@/lib/format";
import { getProject, getTimeZone, getTransactions, toLedger } from "@/lib/portfolio/data";
import { isUuid } from "@/lib/portfolio/parse";

const RECENT = 20;

/** One project: holdings, cash (if tracked), recent transactions, details and archive. */
export default async function ProjectPage({ params }: PageProps<"/[locale]/portfolio/projects/[id]">) {
  const t = await getTranslations("Portfolio");
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      {params.then(({ id }) => (
        <ProjectDetail id={id} />
      ))}
    </Suspense>
  );
}

async function ProjectDetail({ id }: { id: string }) {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const project = isUuid(id) ? await getProject(user.id, id) : null;
  if (!project) return <p className={card}>{t("notFound")}</p>;

  const [transactions, timeZone] = await Promise.all([
    getTransactions(user.id, { projectId: project.id }, 10_000),
    getTimeZone(user.id),
  ]);
  const { rows, problemSymbols } = holdingsFrom(transactions);
  const cash = project.trackCash ? computeCash(transactions.map(toLedger)) : null;
  const archived = Boolean(project.archivedAt);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/portfolio/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
          {t("projects.back")}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-fg">{project.name}</h2>
          {archived && (
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
              {t("projects.archivedBadge")}
            </span>
          )}
        </div>
        {project.description && <p className="mt-2 max-w-2xl text-body">{project.description}</p>}
      </div>

      {cash && (
        <div className={card}>
          <p className="text-[13px] font-medium tracking-wide text-muted uppercase">{t("projects.cash")}</p>
          <p className={`mt-2 font-mono text-2xl ${cash.isNegative ? "text-down" : "text-fg"}`}>
            {formatUsd(cash.balance, locale)}
          </p>
          {cash.isNegative && <p className="mt-2 text-sm text-down">{t("projects.cashNegative")}</p>}
        </div>
      )}

      {problemSymbols.length > 0 && (
        <p role="alert" className="rounded-xl border border-down/40 px-4 py-3 text-sm text-down">
          {t("overview.problems", { assets: problemSymbols.join(", ") })}
        </p>
      )}
      {rows.length > 0 && (
        <section aria-labelledby="project-holdings" className="space-y-4">
          <h3 id="project-holdings" className="text-lg font-semibold text-fg">
            {t("overview.holdingsTitle")}
          </h3>
          <HoldingsTable rows={rows} locale={locale} />
        </section>
      )}

      <section aria-labelledby="project-transactions" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="project-transactions" className="text-lg font-semibold text-fg">
            {t("projects.recent")}
          </h3>
          {!archived && (
            <Link href={`/portfolio/transactions/new?project=${project.id}`} className={secondaryButton}>
              <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
              {t("addTransaction")}
            </Link>
          )}
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted">{t("transactions.empty")}</p>
        ) : (
          <>
            <TransactionTable
              rows={transactions.slice(0, RECENT)}
              locale={locale}
              timeZone={timeZone ?? "UTC"}
            />
            {transactions.length > RECENT && (
              <Link
                href={`/portfolio/transactions?project=${project.id}`}
                className="inline-block text-sm text-fg underline-offset-4 hover:underline"
              >
                {t("projects.viewAll")}
              </Link>
            )}
          </>
        )}
      </section>

      <details className={card}>
        <summary className="cursor-pointer font-medium text-fg">{t("projects.edit")}</summary>
        <div className="mt-6">
          <ProjectForm project={project} />
        </div>
      </details>

      <form action={setProjectArchived.bind(null, project.id, !archived)} className="space-y-2">
        <button type="submit" className={secondaryButton}>
          {archived ? t("projects.unarchive") : t("projects.archive")}
        </button>
        {!archived && <p className="text-xs text-muted">{t("projects.archiveHint")}</p>}
      </form>
    </div>
  );
}
