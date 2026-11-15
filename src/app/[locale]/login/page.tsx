import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthErrorNotice from "@/components/auth/AuthErrorNotice";
import LoginForm from "@/components/auth/LoginForm";
import Header from "@/components/Header";
import { routing } from "@/i18n/routing";

/** Sign in or create an account (same flow). Signed-in users are sent to /portfolio by src/proxy.ts. */
export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Login");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-fg">{t("title")}</h1>
        <p className="mt-3 mb-8 text-body">{t("intro")}</p>
        <Suspense fallback={null}>
          <AuthErrorNotice />
        </Suspense>
        <LoginForm />
      </main>
    </>
  );
}
