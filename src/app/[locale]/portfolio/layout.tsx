import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import PortfolioTabs, { TabList } from "@/components/portfolio/PortfolioTabs";
import { primaryButton } from "@/components/portfolio/styles";
import { Link } from "@/i18n/navigation";

/**
 * Shared frame of every portfolio page (decision 88): a sticky sub-bar right
 * under the site header with the tabs and "+ Transaction". It is only as wide
 * as the content (the site header spans the whole screen), so it reads as the
 * portfolio's own header. It reads no session, so it is prerendered; each
 * page checks the user itself inside <Suspense>.
 */
export default async function PortfolioLayout({ children }: LayoutProps<"/[locale]/portfolio">) {
  const t = await getTranslations("Portfolio");

  return (
    <>
      <Header active="portfolio" />
      <div className="sticky top-16 z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/80 backdrop-blur-md">
          <Suspense fallback={<TabList pathname={null} />}>
            <PortfolioTabs />
          </Suspense>
          <Link
            href="/portfolio/transactions/new"
            aria-label={t("addTransactionLabel")}
            className={`${primaryButton} shrink-0 px-3 py-2`}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            {/* On phones only the "+" shows, so everything fits on one line. */}
            <span className="hidden sm:inline">{t("addTransaction")}</span>
          </Link>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* The site header already says where we are, so the title is for screen readers only. */}
        <h1 className="sr-only">{t("heading")}</h1>
        {children}
      </main>
    </>
  );
}
