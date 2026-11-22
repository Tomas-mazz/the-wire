import type { NextRequest } from "next/server";
import { dayRange, utcDay, valueSeries } from "@/domain";
import { getActionUser } from "@/lib/auth";
import { getTransactions, toLedger } from "@/lib/portfolio/data";
import { isSection, SECTION_CLASSES } from "@/lib/portfolio/sections";
import { getDailyCloses } from "@/lib/prices/history";
import { getPriceAssets } from "@/lib/prices/service";

/**
 * Data for the performance chart (decisions 113–115). Signed-in users only,
 * so strangers can't spend the providers' free limits.
 *
 * GET /api/history?section=overview|crypto|stocks
 *   → { points: [{ day, value, flow }], missing: ["XYZ"] }
 *   The section's value at the end of every UTC day since its first
 *   transaction, plus each day's money in/out (domain/history.ts).
 *   `missing` lists held assets without any price history.
 *
 * GET /api/history?asset=<asset id>
 *   → { closes: [{ day, close }] }
 *   The asset's daily closes since the user's first transaction in it.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRICED = ["stock", "etf", "crypto"];

export async function GET(request: NextRequest) {
  const user = await getActionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const section = params.get("section");
  const assetId = params.get("asset");
  const byAsset = assetId !== null && UUID.test(assetId);
  if (!isSection(section) && !byAsset) return Response.json({ error: "invalid request" }, { status: 400 });

  const headers = { "Cache-Control": "no-store" };
  try {
    const all = await getTransactions(user.id, byAsset ? { assetId } : {}, 10_000);
    const classes = byAsset ? PRICED : SECTION_CLASSES[section as keyof typeof SECTION_CLASSES];
    const transactions = all.filter((tx) => classes.includes(tx.asset.assetClass));
    if (transactions.length === 0) {
      return Response.json(byAsset ? { closes: [] } : { points: [], missing: [] }, { headers });
    }

    const firstDay = transactions.map((tx) => utcDay(tx.executedAt)).sort()[0];
    const assets = await getPriceAssets([...new Set(transactions.map((tx) => tx.assetId))]);
    const closes = await getDailyCloses(assets, firstDay);

    if (byAsset) return Response.json({ closes: closes.get(assetId) ?? [] }, { headers });

    const today = utcDay(new Date().toISOString());
    const points = valueSeries(transactions.map(toLedger), closes, dayRange(firstDay, today));
    const symbols = new Map(transactions.map((tx) => [tx.assetId, tx.asset.symbol]));
    const missing = (points.at(-1)?.missing ?? []).map((id) => symbols.get(id) ?? "?");
    return Response.json(
      {
        points: points.map((p) => ({ day: p.day, value: p.value.toDecimalPlaces(8).toFixed(), flow: p.flow.toFixed() })),
        missing,
      },
      { headers },
    );
  } catch (error) {
    console.error("[history]", error);
    return Response.json({ error: "history unavailable" }, { status: 503 });
  }
}
