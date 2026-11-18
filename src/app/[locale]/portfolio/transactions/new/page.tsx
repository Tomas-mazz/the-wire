import { Suspense } from "react";
import { FileUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { card } from "@/components/portfolio/styles";
import TransactionForm from "@/components/portfolio/TransactionForm";
import { requireUser } from "@/lib/auth";
import { getAssets, getProjects, getTimeZone } from "@/lib/portfolio/data";
import { FormSkeleton } from "@/components/portfolio/Skeletons";

/** New transaction. `?project=<id>` preselects a project (from the project page). */
export default async function NewTransactionPage({
  searchParams,
}: PageProps<"/[locale]/portfolio/transactions/new">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      {searchParams.then((params) => (
        <NewTransaction project={typeof params.project === "string" ? params.project : ""} />
      ))}
    </Suspense>
  );
}

async function NewTransaction({ project }: { project: string }) {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const [projects, assets, timeZone] = await Promise.all([
    getProjects(user.id, t("defaultProject")),
    getAssets(),
    getTimeZone(user.id),
  ]);
  const active = projects.filter((p) => !p.archivedAt);
  // If every project is archived, still offer them rather than an empty select.
  const choices = (active.length > 0 ? active : projects).map(({ id, name }) => ({ id, name }));
  const projectId = choices.some((p) => p.id === project) ? project : choices[0].id;

  return (
    <section aria-labelledby="new-transaction" className={`${card} max-w-3xl`}>
      <h2 id="new-transaction" className="text-xl font-bold text-fg">
        {t("transactionForm.newTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted">{t("transactionForm.intro")}</p>
      <Link
        href="/portfolio/transactions/import"
        className="mt-4 mb-8 flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-accent hover:bg-surface-hover"
      >
        <FileUp size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-accent" />
        <span>
          <span className="font-medium text-fg">{t("transactionForm.importTitle")}</span>{" "}
          <span className="text-muted">{t("transactionForm.importHint")}</span>
        </span>
      </Link>
      <TransactionForm
        transactionId={null}
        projects={choices}
        assets={assets}
        timeZone={timeZone}
        initial={{
          projectId,
          type: "buy",
          assetId: "",
          executedAt: "",
          quantity: "",
          unitPrice: "",
          fee: "",
          broker: "",
          note: "",
        }}
      />
    </section>
  );
}
