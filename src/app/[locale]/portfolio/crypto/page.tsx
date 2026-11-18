import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SectionDashboard from "@/components/portfolio/SectionDashboard";

/** Crypto tab: every coin, with BTC's average buy price and P/L first (M6). */
export default async function CryptoPage() {
  const t = await getTranslations("Portfolio");
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      <SectionDashboard section="crypto" />
    </Suspense>
  );
}
