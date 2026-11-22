import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import { card } from "@/components/portfolio/styles";
import { FormSkeleton } from "@/components/portfolio/Skeletons";
import SettingsForm from "@/components/settings/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getSettingsForm } from "@/lib/settings/data";
import { isLocale } from "@/lib/settings/parse";

/**
 * Settings (M8, decisions 110–112): language, country and time zone. Opened
 * from the account menu; src/proxy.ts sends visitors without a session to /login.
 */
export default async function SettingsPage() {
  const t = await getTranslations("Settings");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-fg">{t("title")}</h1>
          <p className="mt-3 mb-8 text-body">{t("intro")}</p>
        </div>
        <Suspense fallback={<FormSkeleton />}>
          <Settings />
        </Suspense>
      </main>
    </>
  );
}

async function Settings() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const { countries, initial } = await getSettingsForm(user.id, isLocale(locale) ? locale : "en");

  return (
    <section className={`${card} max-w-xl`}>
      <SettingsForm countries={countries} initial={initial} />
    </section>
  );
}
