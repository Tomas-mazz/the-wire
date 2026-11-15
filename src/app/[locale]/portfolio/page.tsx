import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";

/** Private portfolio. The header renders instantly; the content waits for the session check. */
export default async function PortfolioPage() {
  const t = await getTranslations("Portfolio");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
          <PortfolioContent />
        </Suspense>
      </main>
    </>
  );
}

async function PortfolioContent() {
  const locale = await getLocale();
  // Verifies the session (or redirects to /login) before anything private renders.
  await requireUser(locale);
  const t = await getTranslations("Portfolio");

  return (
    <>
      <h1 className="text-3xl font-bold text-fg sm:text-5xl">{t("heading")}</h1>
      <p className="mt-4 max-w-xl text-body">{t("intro")}</p>
      <p className="mt-8 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
        {t("placeholder")}
      </p>
    </>
  );
}
