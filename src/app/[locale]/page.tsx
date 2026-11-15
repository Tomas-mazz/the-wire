import { ChartPie, Newspaper } from "lucide-react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SectionCard from "@/components/SectionCard";
import TickerBackground from "@/components/TickerBackground";
import { routing } from "@/i18n/routing";

/** The Wire home: brand hero + one card per section (Portfolio active, News paused). */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Landing");

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-line">
          <TickerBackground />
          <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-[13px] font-medium tracking-[0.3em] text-muted uppercase">
              The Wire
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold text-fg sm:text-5xl">
              {t("tagline")}
            </h1>
            <p className="mt-4 max-w-xl text-body">{t("intro")}</p>
          </div>
        </section>

        <section
          aria-label={t("sectionsLabel")}
          className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-6 md:py-16"
        >
          <SectionCard
            href="/portfolio"
            icon={ChartPie}
            title={t("portfolioTitle")}
            description={t("portfolioDescription")}
            cta={t("open")}
          />
          <SectionCard
            href="/news"
            icon={Newspaper}
            title={t("newsTitle")}
            description={t("newsDescription")}
            cta={t("open")}
            badge={t("paused")}
            muted
          />
        </section>
      </main>
    </>
  );
}
