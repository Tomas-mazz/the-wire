import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AccountMenu, { AccountMenuSkeleton } from "./auth/AccountMenu";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  /** Show the country / currency pills (news page only, placeholders until news resumes). */
  showNewsControls?: boolean;
  /** Section the visitor is in; its link gets an amethyst underline (decision 88). */
  active?: "portfolio" | "news";
}

/**
 * Sticky top bar with a glass effect (semi-transparent background + blur).
 * Shared by every section of The Wire: logo, section links, language switcher
 * and account menu. Only the account menu depends on the visitor, so it streams
 * in behind <Suspense> while the rest of the header is prerendered.
 */
export default function Header({ showNewsControls = false, active }: HeaderProps) {
  const t = useTranslations("Header");
  const placeholders = ["Global", "USD"];
  const links = [
    { key: "portfolio", href: "/portfolio", label: t("nav.portfolio") },
    { key: "news", href: "/news", label: t("nav.news") },
  ] as const;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 self-stretch sm:gap-8">
          <Link href="/" className="text-sm font-bold tracking-[0.2em] whitespace-nowrap text-fg sm:tracking-[0.3em]">
            THE <span className="text-accent">WIRE</span>
          </Link>

          <nav aria-label={t("nav.label")} className="flex items-center gap-3 self-stretch sm:gap-6">
            {links.map(({ key, href, label }) => (
              <Link
                key={key}
                href={href}
                aria-current={active === key ? "page" : undefined}
                // The active link is white and bold, with a 2px amethyst line
                // drawn on the header's bottom edge (an inset shadow, so the
                // text does not move when the section changes).
                className={`flex h-full items-center text-sm transition-colors ${
                  active === key
                    ? "font-semibold text-fg shadow-[inset_0_-2px_0_var(--color-accent)]"
                    : "text-muted hover:text-fg"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          {showNewsControls &&
            placeholders.map((label) => (
              <span
                key={label}
                title={t("comingSoon")}
                // Hidden on small phones so the header never overflows.
                className="hidden rounded-xl border border-line-strong px-3 py-1.5 text-xs font-medium text-body sm:inline"
              >
                {label}
              </span>
            ))}
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
