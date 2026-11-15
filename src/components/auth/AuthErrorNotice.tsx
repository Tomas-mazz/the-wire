"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Shows why the user came back to the login page (?error=link | google).
 * Reads the URL, so the page renders it inside <Suspense>.
 */
export default function AuthErrorNotice() {
  const t = useTranslations("Login");
  const error = useSearchParams().get("error");
  if (error !== "link" && error !== "google") return null;

  return (
    <p role="alert" className="mb-6 rounded-xl border border-down/40 px-4 py-3 text-sm text-down">
      {error === "link" ? t("linkError") : t("googleError")}
    </p>
  );
}
