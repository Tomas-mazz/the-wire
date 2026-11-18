import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import ImportFlow from "@/components/portfolio/ImportFlow";
import { FormSkeleton } from "@/components/portfolio/Skeletons";
import { requireUser } from "@/lib/auth";
import { getProjects, getTimeZone } from "@/lib/portfolio/data";

/** M7: import transactions from a broker file (decisions 103–108). */
export default function ImportPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Import />
    </Suspense>
  );
}

async function Import() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const t = await getTranslations("Portfolio");

  const [projects, timeZone] = await Promise.all([getProjects(user.id, t("defaultProject")), getTimeZone(user.id)]);
  const active = projects.filter((p) => !p.archivedAt);
  // If every project is archived, still offer them rather than an empty select.
  const choices = (active.length > 0 ? active : projects).map(({ id, name }) => ({ id, name }));

  return <ImportFlow projects={choices} defaultProjectId={choices[0].id} timeZone={timeZone} />;
}
