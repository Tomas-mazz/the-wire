"use server";

import { refresh } from "next/cache";
import { getActionUser } from "@/lib/auth";
import { MAX_IMPORT_BYTES, readImportFile, type ImportBroker, type RowError, type SkippedRow } from "@/lib/import";
import type { ReviewRow } from "@/lib/import/review";
import { MAX_IMPORT_ROWS, reviewImport, saveImport } from "@/lib/import/server";
import { getTimeZone } from "@/lib/portfolio/data";
import { isUuid, isValidTimeZone } from "@/lib/portfolio/parse";
import { createClient } from "@/lib/supabase/server";

/*
 * M7 import (decisions 103–108). One action, two modes:
 *   mode=preview  read the file and return the review table
 *   mode=save     read the same file again, rebuild the review and save the "new" rows
 * The file is never stored (PLAN.md: no stored uploads), and the save trusts
 * nothing the browser says about the rows.
 */

export type ImportError =
  | "no_file"
  | "too_large"
  | "unrecognized_format"
  | "no_prices"
  | "unsupported_file"
  | "too_many_rows"
  | "invalid_project"
  | "unauthorized"
  | "failed";

export type ImportState =
  | { status: "idle" }
  | { status: "error"; error: ImportError }
  | {
      status: "preview";
      broker: ImportBroker;
      rows: ReviewRow[];
      skipped: SkippedRow[];
      errors: RowError[];
    }
  | { status: "saved"; saved: number; partial: boolean };

export async function runImport(_locale: string, _previous: ImportState, form: FormData): Promise<ImportState> {
  const user = await getActionUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", error: "no_file" };
  if (file.size > MAX_IMPORT_BYTES) return { status: "error", error: "too_large" };

  const projectId = form.get("projectId");
  if (!isUuid(projectId)) return { status: "error", error: "invalid_project" };

  try {
    const supabase = await createClient();
    const project = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
    if (!project.data) return { status: "error", error: "invalid_project" };

    const browserZone = form.get("timeZone");
    const timeZone = (await getTimeZone(user.id)) ?? (isValidTimeZone(browserZone) ? browserZone : "UTC");

    const result = readImportFile(new Uint8Array(await file.arrayBuffer()), file.name, timeZone);
    if (!result.ok) return { status: "error", error: result.error };
    if (result.transactions.length > MAX_IMPORT_ROWS) return { status: "error", error: "too_many_rows" };

    const rows = await reviewImport(supabase, result.transactions, projectId);

    if (form.get("mode") !== "save") {
      return { status: "preview", broker: result.broker, rows, skipped: result.skipped, errors: result.errors };
    }

    const { saved, failed } = await saveImport(supabase, rows, projectId, result.broker);
    refresh();
    return { status: "saved", saved, partial: failed };
  } catch (error) {
    console.error("runImport failed:", (error as Error).message);
    return { status: "error", error: "failed" };
  }
}
