import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsBoard from "@/components/NewsBoard";
import { SAMPLE_NEWS } from "@/data/sample-news";
import { routing } from "@/i18n/routing";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Footer");

  return (
    <>
      <Header />
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
