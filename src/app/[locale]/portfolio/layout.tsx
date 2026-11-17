import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import PortfolioTabs, { TabList } from "@/components/portfolio/PortfolioTabs";
import { primaryButton } from "@/components/portfolio/styles";
import { Link } from "@/i18n/navigation";

/**
 * Shared frame of every portfolio page: title, "+ Transaction" and the tabs.
 * It reads no session, so it is prerendered; each page checks the user
 * itself inside <Suspense>.
 */
export default async function PortfolioLayout({ children }: LayoutProps<"/[locale]/portfolio">) {
  const t = await getTranslations("Portfolio");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-fg sm:text-5xl">{t("heading")}</h1>
            <p className="mt-3 text-body">{t("intro")}</p>
          </div>
          <Link
            href="/portfolio/transactions/new"
            aria-label={t("addTransactionLabel")}
            className={primaryButton}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            {t("addTransaction")}
          </Link>
        </div>
        <div className="mt-8">
          <Suspense fallback={<TabList pathname={null} />}>
            <PortfolioTabs />
          </Suspense>
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </>
  );
}
