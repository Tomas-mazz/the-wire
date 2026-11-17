"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "@/app/[locale]/portfolio/actions";
import { fieldError, hint, input, label, primaryButton } from "./styles";

export interface ProjectFormValues {
  id: string;
  name: string;
  description: string | null;
  defaultBroker: string | null;
  strategy: string | null;
  horizon: string | null;
  tags: string[];
  trackCash: boolean;
}

const initialState: ProjectFormState = { status: "idle" };

/** Create a project (no `project`) or edit one. */
export default function ProjectForm({ project }: { project?: ProjectFormValues }) {
  const t = useTranslations("Portfolio.projectForm");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    project ? updateProject.bind(null, project.id) : createProject.bind(null, locale),
    initialState,
  );

  const typed = state.status === "error" ? state.values : undefined;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const value = (name: string, saved: string | null | undefined) => typed?.[name] ?? saved ?? "";
  const error = (name: keyof typeof errors) =>
    errors[name] ? (
      <p id={`${name}-error`} className={fieldError}>
        {t(`errors.${errors[name]}`)}
      </p>
    ) : null;
  const a11y = (name: keyof typeof errors) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className={label}>
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder={t("namePlaceholder")}
          defaultValue={value("name", project?.name)}
          className={input}
          {...a11y("name")}
        />
        {error("name")}
      </div>

      <div>
        <label htmlFor="description" className={label}>
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={value("description", project?.description)}
          className={input}
          {...a11y("description")}
        />
        {error("description")}
      </div>

      <details className="group" open={Object.keys(errors).some((k) => k !== "name")}>
        <summary className="cursor-pointer text-sm text-body hover:text-fg">{t("moreOptions")}</summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="defaultBroker" className={label}>
              {t("defaultBroker")}
            </label>
            <input
              id="defaultBroker"
              name="defaultBroker"
              maxLength={80}
              defaultValue={value("defaultBroker", project?.defaultBroker)}
              className={input}
              {...a11y("defaultBroker")}
            />
            {error("defaultBroker")}
          </div>
          <div>
            <label htmlFor="horizon" className={label}>
              {t("horizon")}
            </label>
            <input
              id="horizon"
              name="horizon"
              maxLength={80}
              placeholder={t("horizonPlaceholder")}
              defaultValue={value("horizon", project?.horizon)}
              className={input}
              {...a11y("horizon")}
            />
            {error("horizon")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="strategy" className={label}>
              {t("strategy")}
            </label>
            <input
              id="strategy"
              name="strategy"
              maxLength={200}
              defaultValue={value("strategy", project?.strategy)}
              className={input}
              {...a11y("strategy")}
            />
            {error("strategy")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tags" className={label}>
              {t("tags")}
            </label>
            <input
              id="tags"
              name="tags"
              defaultValue={value("tags", project?.tags.join(", "))}
              className={input}
              {...a11y("tags")}
            />
            <p className={hint}>{t("tagsHint")}</p>
            {error("tags")}
          </div>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="trackCash"
              defaultChecked={typed ? typed.trackCash === "on" : project?.trackCash}
              className="mt-1 size-4 accent-white"
            />
            <span>
              <span className="text-sm text-fg">{t("trackCash")}</span>
              <span className="block text-xs text-muted">{t("trackCashHint")}</span>
            </span>
          </label>
        </div>
      </details>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? t("saving") : project ? t("save") : t("create")}
        </button>
        <p role="status" className="text-sm text-muted">
          {state.status === "saved" ? t("saved") : ""}
        </p>
      </div>
    </form>
  );
}
