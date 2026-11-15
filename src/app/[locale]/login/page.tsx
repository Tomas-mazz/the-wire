import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AuthErrorNotice from "@/components/auth/AuthErrorNotice";
import LoginForm from "@/components/auth/LoginForm";
import Header from "@/components/Header";

/** Sign in or create an account (same flow). Signed-in users are sent to /portfolio by src/proxy.ts. */
export default async function LoginPage() {
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
