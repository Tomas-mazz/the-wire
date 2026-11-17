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
    <nav aria-label={t("label")} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`block rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                tab.active
                  ? "bg-accent font-semibold text-accent-ink"
                  : "border border-line-strong text-body hover:border-accent hover:text-fg"
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
