import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SectionDashboard from "@/components/portfolio/SectionDashboard";

/** Stocks tab: US stocks and ETFs (M6). */
export default async function StocksPage() {
  const t = await getTranslations("Portfolio");
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      <SectionDashboard section="stocks" />
    </Suspense>
  );
}
