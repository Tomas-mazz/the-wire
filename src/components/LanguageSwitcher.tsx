"use client";

import { useLocale, useTranslations } from "next-intl";
import { rememberLocale } from "@/app/[locale]/settings/actions";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * EN | ES toggle. Switching keeps you on the same page (/en/… ↔ /es/…),
 * and next-intl remembers the choice in a cookie for your next visit. For a
 * signed-in user it is also saved as their language (decision 111).
 *
 * The current URL is read only on click. Reading it while rendering
 * (usePathname) would make every dynamic route, e.g. /portfolio/projects/[id],
 * wait for runtime data before showing the header.
 */
export default function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();

  function switchTo(next: (typeof routing.locales)[number]) {
    const { pathname, search } = window.location;
    // "/es/portfolio" → "/portfolio"; next-intl adds the new locale back.
    const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
    router.replace(`${path}${search}`, { locale: next });
    // Fire and forget: does nothing for visitors, and a failure only means
    // the saved language stays as it was.
    if (next !== locale) void rememberLocale(next).catch(() => {});
  }

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
            onClick={() => switchTo(l)}
            className={`rounded-[10px] px-2.5 py-1 text-xs font-medium uppercase transition-colors ${
              active ? "bg-accent text-accent-ink" : "text-body hover:text-fg"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
