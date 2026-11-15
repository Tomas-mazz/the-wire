import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  /** Show the country / currency pills (news page only, placeholders until news resumes). */
  showNewsControls?: boolean;
}

/**
 * Sticky top bar with a glass effect (semi-transparent background + blur).
 * Shared by every section of The Wire: logo, section links and language switcher.
 */
export default function Header({ showNewsControls = false }: HeaderProps) {
  const t = useTranslations("Header");
  const placeholders = ["Global", "USD"];
  const links = [
    { href: "/portfolio", label: t("nav.portfolio") },
    { href: "/news", label: t("nav.news") },
  ] as const;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-5 sm:gap-8">
          <Link href="/" className="text-sm font-bold tracking-[0.3em] whitespace-nowrap text-fg">
            THE WIRE
          </Link>

          <nav aria-label={t("nav.label")} className="flex items-center gap-4 sm:gap-6">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted transition-colors hover:text-fg"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
