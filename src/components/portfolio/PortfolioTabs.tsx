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
    // A vertical menu in the sidebar on large screens; a scrollable row on small ones.
    <nav aria-label={t("label")} className="min-w-0 overflow-x-auto lg:overflow-visible">
      <ul className="flex gap-1 lg:flex-col">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              // Active tab: tinted background plus an amethyst bar (below on
              // small screens, on the left in the sidebar).
              className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                tab.active
                  ? "bg-surface-hover font-semibold text-fg shadow-[inset_0_-2px_0_var(--color-accent)] lg:shadow-[inset_2px_0_0_var(--color-accent)]"
                  : "text-body hover:bg-surface hover:text-fg"
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
