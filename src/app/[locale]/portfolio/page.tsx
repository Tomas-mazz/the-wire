import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SectionDashboard from "@/components/portfolio/SectionDashboard";

/** Overview tab: everything the user holds, crypto and stocks (M6). */
export default async function OverviewPage() {
  const t = await getTranslations("Portfolio");
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      <SectionDashboard section="overview" />
    </Suspense>
  );
}
