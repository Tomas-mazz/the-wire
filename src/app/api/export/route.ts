import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { getActionUser } from "@/lib/auth";
import { exportFileName, transactionsCsv } from "@/lib/export/csv";
import { getAllTransactions, getProjects, getTimeZone } from "@/lib/portfolio/data";
import { readTransactionFilters } from "@/lib/portfolio/filters";

/**
 * GET /api/export?project=&asset=&type=&from=&to=
 *
 * Downloads the signed-in user's transactions as CSV (M8, decisions 118–121),
 * with the same filters as the Transactions tab. Signed-in users only; Row
 * Level Security returns only their own rows. The file is built on request
 * and never stored.
 */
export async function GET(request: NextRequest) {
  const user = await getActionUser();
  if (!user) return new Response("Sign in to export your transactions.", { status: 401 });

  try {
    const timeZone = (await getTimeZone(user.id)) ?? "UTC";
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { filters } = readTransactionFilters(params, timeZone);
    // The default name only matters for a user with no project yet (decision 80).
    const t = await getTranslations({ locale: "en", namespace: "Portfolio" });
    const [projects, rows] = await Promise.all([
      getProjects(user.id, t("defaultProject")),
      getAllTransactions(user.id, filters),
    ]);

    const csv = transactionsCsv(rows, new Map(projects.map((p) => [p.id, p.name])), timeZone);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName(Date.now(), timeZone)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[export]", error);
    return new Response("The export failed. Try again.", { status: 503 });
  }
}
