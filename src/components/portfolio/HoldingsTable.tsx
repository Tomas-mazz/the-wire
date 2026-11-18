import { connection } from "next/server";
import { computeHoldings, type Holding } from "@/domain";
import { livePairs, type PriceAsset } from "@/market-data";
import { getPriceAssets, getPricesForUser, type PriceSnapshot } from "@/lib/prices/service";
import { toLedger, type Asset, type TransactionRow } from "@/lib/portfolio/data";
import LiveHoldings, { type LiveHoldingRow } from "./LiveHoldings";
import type { DashboardInfo } from "./SummaryCards";

export interface HoldingRow {
  asset: Asset;
  holding: Holding;
}

/**
 * Holdings per asset from transaction rows (cash is shown separately).
 * `problemSymbols` lists assets whose ledger can't be replayed.
 */
export function holdingsFrom(transactions: TransactionRow[]): {
  rows: HoldingRow[];
  problemSymbols: string[];
} {
  const assets = new Map(transactions.map((tx) => [tx.assetId, tx.asset]));
  const { holdings, problems } = computeHoldings(
    transactions.filter((tx) => tx.asset.assetClass !== "cash").map(toLedger),
  );
  return {
    rows: holdings.map((holding) => ({ asset: assets.get(holding.assetId)!, holding })),
    problemSymbols: [...new Set(problems.map((p) => assets.get(p.assetId)?.symbol ?? "?"))],
  };
}

/** First prices plus the server time they belong to. Never throws. */
async function loadInitialPrices(assets: PriceAsset[]): Promise<{ prices: PriceSnapshot[]; renderedAt: number }> {
  try {
    return { prices: await getPricesForUser(assets), renderedAt: Date.now() };
  } catch (error) {
    // The table still renders; the browser asks again in 30 s.
    console.error("[prices]", error);
    return { prices: [], renderedAt: Date.now() };
  }
}

/**
 * What the user holds, with prices (M5). The first prices are fetched here on
 * the server so the table never starts empty; LiveHoldings keeps them moving
 * in the browser. With `dashboard` (the section pages) the summary cards and
 * the allocation donut are shown above the table. Render inside <Suspense>.
 */
export default async function HoldingsTable({
  rows,
  dashboard,
  heading,
}: {
  rows: HoldingRow[];
  locale?: string;
  dashboard?: DashboardInfo;
  heading?: React.ReactNode;
}) {
  await connection(); // prices and "now" are request-time data
  const priced = rows.filter((r) => r.asset.assetClass !== "cash");
  const openIds = priced.filter((r) => !r.holding.quantity.isZero()).map((r) => r.asset.id);

  const assets = await getPriceAssets(openIds);
  const { prices: initialPrices, renderedAt } = await loadInitialPrices(assets);

  const liveRows: LiveHoldingRow[] = priced.map(({ asset, holding }) => ({
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    assetClass: asset.assetClass as LiveHoldingRow["assetClass"],
    quantity: holding.quantity.toFixed(),
    costBasis: holding.costBasis.toFixed(),
    avgCost: holding.avgCost?.toFixed() ?? null,
    realized: holding.realized.toFixed(),
    income: holding.income.toFixed(),
    fees: holding.fees.toFixed(),
    invested: holding.invested.toFixed(),
  }));

  return (
    <LiveHoldings
      rows={liveRows}
      initialPrices={initialPrices}
      livePairs={livePairs(assets)}
      renderedAt={renderedAt}
      dashboard={dashboard}
      heading={heading}
    />
  );
}
