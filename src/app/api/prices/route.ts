import type { NextRequest } from "next/server";
import { getActionUser } from "@/lib/auth";
import { getPriceAssets, getPricesForUser } from "@/lib/prices/service";

/**
 * GET /api/prices?ids=<asset id>,<asset id>
 *
 * Latest prices for the open portfolio page, which calls it every 30 s
 * (decision 90). Signed-in users only, so strangers can't spend our
 * provider limits. Up to 100 assets per call.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  const user = await getActionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  if (ids.length > MAX_IDS || !ids.every((id) => UUID.test(id))) {
    return Response.json({ error: "invalid ids" }, { status: 400 });
  }

  try {
    const prices = await getPricesForUser(await getPriceAssets(ids));
    return Response.json({ prices }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[prices]", error);
    return Response.json({ error: "prices unavailable" }, { status: 503 });
  }
}
