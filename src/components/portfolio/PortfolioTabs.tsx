"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Overview · Projects · Transactions. The active tab follows the URL.
 * Reading the URL is runtime data on dynamic routes, so the layout renders
 * this inside <Suspense> with <TabList pathname={null} /> as the fallback.
 */
export default function PortfolioTabs() {
  return <TabList pathname={usePathname()} />;
}

export function TabList({ pathname }: { pathname: string | null }) {
  const t = useTranslations("Portfolio.tabs");
  const tabs = [
    { href: "/portfolio", label: t("overview"), active: pathname === "/portfolio" },
    {
      href: "/portfolio/projects",
      label: t("projects"),
      active: Boolean(pathname?.startsWith("/portfolio/projects")),
    },
    {
      href: "/portfolio/transactions",
      label: t("transactions"),
      active: Boolean(pathname?.startsWith("/portfolio/transactions")),
    },
  ] as const;

  return (
    // Underlined tabs, like the site header; the row scrolls sideways on small phones.
    <nav aria-label={t("label")} className="h-full min-w-0 overflow-x-auto">
      <ul className="flex h-full gap-5 sm:gap-7">
        {tabs.map((tab) => (
          <li key={tab.href} className="h-full">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              // Active tab: white and bold with a 2px amethyst line on the bar's
              // bottom edge (an inset shadow, so the text never moves).
              className={`flex h-full items-center text-sm whitespace-nowrap transition-colors ${
                tab.active
                  ? "font-semibold text-fg shadow-[inset_0_-2px_0_var(--color-accent)]"
                  : "text-muted hover:text-fg"
              }`}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
