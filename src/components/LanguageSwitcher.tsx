"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * EN | ES toggle. Switching keeps you on the same page (/en/… ↔ /es/…),
 * and next-intl remembers the choice in a cookie for your next visit.
 */
export default function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex rounded-xl border border-line-strong p-0.5"
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => router.replace(pathname, { locale: l })}
            className={`rounded-[10px] px-2.5 py-1 text-xs font-medium uppercase transition-colors ${
              active ? "bg-fg text-bg" : "text-body hover:text-fg"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
