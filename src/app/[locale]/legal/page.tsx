import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";

/** Where people write to have their account deleted (decision 125). */
const CONTACT_EMAIL = "tomasmazzucco11@gmail.com";

/** Sections of the notice, in order (decision 123). */
const SECTIONS = ["advice", "data", "method", "privacy"] as const;

/**
 * Legal notice (M8, decisions 122–125): not financial advice, price sources
 * and delays, how the numbers are calculated, and data and privacy. Linked
 * from the footer of every page; public, so it is prerendered.
 */
export default async function LegalPage() {
  const t = await getTranslations("Legal");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-fg">{t("title")}</h1>
        <p className="mt-2 text-xs text-muted">{t("updated")}</p>
        <p className="mt-6 text-body">{t("intro")}</p>

        {SECTIONS.map((key) => (
          <section key={key} aria-labelledby={`legal-${key}`} className="mt-10">
            <h2 id={`legal-${key}`} className="text-lg font-semibold text-fg">
              {t(`sections.${key}.title`)}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-body">
              {(t.raw(`sections.${key}.paragraphs`) as string[]).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {key === "privacy" && (
                <p>
                  {t.rich("sections.privacy.contact", {
                    email: CONTACT_EMAIL,
                    mail: (chunks) => (
                      <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline-offset-4 hover:underline">
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              )}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
