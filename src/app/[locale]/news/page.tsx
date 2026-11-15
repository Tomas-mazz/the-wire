import { getLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsBoard from "@/components/NewsBoard";
import { SAMPLE_NEWS } from "@/data/sample-news";

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Footer");

  return (
    <>
      <Header showNewsControls />
      <main className="flex-1">
        <Hero />
        <NewsBoard items={SAMPLE_NEWS[locale]} />
      </main>
      <footer className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-8 text-xs text-muted sm:px-6">
          {t("note")}
        </p>
      </footer>
    </>
  );
}
