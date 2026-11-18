import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface WantedAsset {
  symbol: string;
  name: string;
  asset_class: string;
  provider_refs: Record<string, string>;
}

const findId = (supabase: Supabase, assetClass: string, symbol: string) =>
  supabase
    .from("assets")
    .select("id")
    .eq("asset_class", assetClass)
    .eq("symbol", symbol)
    .is("exchange", null)
    .maybeSingle();

/** The shared catalogue row for this asset, created if it doesn't exist yet. */
export async function findOrCreateAsset(supabase: Supabase, wanted: WantedAsset): Promise<string | null> {
  const existing = await findId(supabase, wanted.asset_class, wanted.symbol);
  if (existing.data) return existing.data.id;

  const inserted = await supabase.from("assets").insert(wanted).select("id").single();
  if (inserted.data) return inserted.data.id;
  // 23505 = someone added the same asset a moment ago: use theirs.
  if (inserted.error?.code === "23505") return (await findId(supabase, wanted.asset_class, wanted.symbol)).data?.id ?? null;
  console.error("findOrCreateAsset failed:", inserted.error?.message);
  return null;
}

export interface CatalogueAsset {
  id: string;
  symbol: string;
  name: string;
  assetClass: "stock" | "etf" | "crypto";
  providerRefs: Record<string, string>;
}

/** Catalogue rows for these symbols (any class), without exchange. */
export async function findAssetsBySymbol(supabase: Supabase, symbols: readonly string[]): Promise<CatalogueAsset[]> {
  if (symbols.length === 0) return [];
  const { data, error } = await supabase
    .from("assets")
    .select("id, symbol, name, asset_class, provider_refs")
    .in("symbol", [...new Set(symbols)])
    .in("asset_class", ["stock", "etf", "crypto"])
    .is("exchange", null);
  if (error) throw new Error(`Could not read assets: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    assetClass: r.asset_class,
    providerRefs: r.provider_refs ?? {},
  }));
}

/** Catalogue rows that were matched to these ISINs by an earlier import (provider_refs.isin). */
export async function findAssetsByIsin(supabase: Supabase, isins: readonly string[]): Promise<Map<string, CatalogueAsset>> {
  const found = new Map<string, CatalogueAsset>();
  if (isins.length === 0) return found;
  const { data, error } = await supabase
    .from("assets")
    .select("id, symbol, name, asset_class, provider_refs")
    .in("provider_refs->>isin", [...new Set(isins)])
    .in("asset_class", ["stock", "etf"])
    .is("exchange", null);
  if (error) throw new Error(`Could not read assets: ${error.message}`);
  for (const r of data) {
    const refs: Record<string, string> = r.provider_refs ?? {};
    if (refs.isin) {
      found.set(refs.isin, { id: r.id, symbol: r.symbol, name: r.name, assetClass: r.asset_class, providerRefs: refs });
    }
  }
  return found;
}
