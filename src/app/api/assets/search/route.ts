import type { NextRequest } from "next/server";
import { searchAssets } from "@/market-data/search";
import { getActionUser } from "@/lib/auth";

/**
 * GET /api/assets/search?q=sol
 *
 * Stocks/ETFs (Finnhub) and crypto (CoinGecko) matching the text, for the
 * asset picker of the transaction form (decision 81). Signed-in users only.
 */
export async function GET(request: NextRequest) {
  const user = await getActionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 40);
  const results = await searchAssets(q, {
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    finnhubApiKey: process.env.FINNHUB_API_KEY,
  });
  return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
