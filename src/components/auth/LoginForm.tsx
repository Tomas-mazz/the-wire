"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signInWithEmail, type EmailSignInState } from "@/app/auth/actions";

const initialState: EmailSignInState = { status: "idle" };

/** Magic link form: email only, no passwords (decision 71). */
export default function LoginForm() {
  const t = useTranslations("Login");
  const locale = useLocale();
  const [state, emailAction, pending] = useActionState(
    signInWithEmail.bind(null, locale),
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <Mail size={20} strokeWidth={1.5} aria-hidden="true" className="text-fg" />
        <p className="mt-4 font-medium text-fg">{t("sentTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          {t("sentBody", { email: state.email })}
        </p>
      </div>
    );
  }

  const message =
    state.status === "invalid" ? t("invalidEmail") : state.status === "error" ? t("sendError") : null;

  return (
    <form action={emailAction} className="space-y-3" noValidate>
      <label htmlFor="email" className="block text-sm text-body">
        {t("emailLabel")}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder={t("emailPlaceholder")}
        aria-invalid={state.status === "invalid"}
        aria-describedby={message ? "email-message" : undefined}
        className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-fg placeholder:text-muted focus:border-fg focus:outline-none"
      />
      {message && (
        <p id="email-message" role="alert" className="text-sm text-down">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-fg px-4 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t("sending") : t("sendLink")}
      </button>
    </form>
  );
}
