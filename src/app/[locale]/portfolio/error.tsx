"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { card, secondaryButton } from "@/components/portfolio/styles";

/** Shown when a portfolio page fails to load (e.g. the database is unreachable). */
export default function PortfolioError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("Portfolio.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className={card}>
      <p className="font-medium text-fg">{t("title")}</p>
      <p className="mt-2 text-sm text-body">{t("body")}</p>
      <button type="button" onClick={() => retry()} className={`${secondaryButton} mt-4`}>
        {t("retry")}
      </button>
    </div>
  );
}
