import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Sticky top bar with a glass effect (semi-transparent background + blur).
 * The country / currency pills are visual placeholders until step 8.
 */
export default function Header() {
  const t = useTranslations("Header");
  const placeholders = ["Global", "USD"];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-[0.3em] text-fg">
          THE WIRE
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {placeholders.map((label) => (
            <span
              key={label}
              title={t("comingSoon")}
              className="rounded-xl border border-line-strong px-3 py-1.5 text-xs font-medium text-body"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
