import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Footer of every page (decisions 122–124): a short notice that The Wire is
 * not financial advice and prices may be late, plus a link to the full
 * notice at /legal. It reads no session, so it is prerendered with the layout.
 */
export default function SiteFooter() {
  const t = useTranslations("SiteFooter");

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t("notice")}</p>
        <Link href="/legal" className="shrink-0 text-body underline-offset-4 hover:text-fg hover:underline">
          {t("legal")}
        </Link>
      </div>
    </footer>
  );
}
