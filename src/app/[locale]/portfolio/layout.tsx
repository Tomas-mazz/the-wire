import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import PortfolioTabs, { TabList } from "@/components/portfolio/PortfolioTabs";
import { primaryButton } from "@/components/portfolio/styles";
import { Link } from "@/i18n/navigation";

/**
 * Shared frame of every portfolio page (decision 88): a sidebar with
 * "+ Transaction" and the tabs on the left (a row on top on small screens),
 * and the page on the right. It reads no session, so it is prerendered; each
 * page checks the user itself inside <Suspense>.
 */
export default async function PortfolioLayout({ children }: LayoutProps<"/[locale]/portfolio">) {
  const t = await getTranslations("Portfolio");

  return (
    <>
      <Header active="portfolio" />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:py-10">
        {/* The site header already says where we are, so the title is for screen readers only. */}
        <h1 className="sr-only">{t("heading")}</h1>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <aside className="flex items-center gap-3 border-b border-line pb-4 lg:sticky lg:top-26 lg:w-48 lg:shrink-0 lg:flex-col lg:items-stretch lg:self-start lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
            <Link
              href="/portfolio/transactions/new"
              aria-label={t("addTransactionLabel")}
              className={`${primaryButton} shrink-0`}
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              {t("addTransaction")}
            </Link>
            <Suspense fallback={<TabList pathname={null} />}>
              <PortfolioTabs />
            </Suspense>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  );
}
