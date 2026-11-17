import type { FetchLike, PriceAsset } from "./types";

export function asset(
  symbol: string,
  assetClass: PriceAsset["assetClass"] = "crypto",
  providerRefs: Record<string, string> = {},
): PriceAsset {
  return { id: `id-${symbol}`, symbol, assetClass, providerRefs };
}

/** A fake fetch: `routes` maps a URL test to a status and body; every call is recorded. */
export function fakeFetch(routes: ((url: string) => { status?: number; body: unknown } | undefined)[]) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    for (const route of routes) {
      const hit = route(url);
      if (hit) {
        const text = typeof hit.body === "string" ? hit.body : JSON.stringify(hit.body);
        return new Response(text, { status: hit.status ?? 200 });
      }
    }
    return new Response("not found", { status: 404 });
  };
  return { fetchImpl, calls };
}

/** The symbols of a Binance ?symbols=[...] URL. */
export function binancePairs(url: string): string[] {
  const raw = new URL(url).searchParams.get("symbols");
  return raw ? (JSON.parse(raw) as string[]) : [];
}
