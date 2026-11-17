import { getTranslations } from "next-intl/server";
import { computeHoldings, type Holding } from "@/domain";
import { formatQuantity, formatUsd } from "@/lib/format";
import { toLedger, type Asset, type TransactionRow } from "@/lib/portfolio/data";
import { tdNumber, th } from "./styles";

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

/** Signed money: "+" or "−" plus an arrow, never color alone (STYLE.md). */
function Signed({ value, locale }: { value: Holding["realized"]; locale: string }) {
  if (value.isZero()) return <span className="text-muted">{formatUsd(value, locale)}</span>;
  const up = value.isPositive();
  return (
    <span className={up ? "text-up" : "text-down"}>
      {up ? "▲ +" : "▼ −"}
      {formatUsd(value.abs(), locale)}
    </span>
  );
}

/**
 * What the user holds, per asset. Prices arrive in M5, so this shows
 * quantity, average cost and money invested (no market value yet).
 */
export default async function HoldingsTable({ rows, locale }: { rows: HoldingRow[]; locale: string }) {
  const t = await getTranslations("Portfolio");
  const sorted = [...rows].sort(
    (a, b) =>
      Number(b.holding.quantity.isZero() ? 0 : 1) - Number(a.holding.quantity.isZero() ? 0 : 1) ||
      b.holding.costBasis.comparedTo(a.holding.costBasis) ||
      a.asset.symbol.localeCompare(b.asset.symbol),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-surface">
          <tr>
            <th scope="col" className={th}>{t("holdings.asset")}</th>
            <th scope="col" className={`${th} text-right`}>{t("holdings.quantity")}</th>
            <th scope="col" className={`${th} text-right`}>{t("holdings.avgCost")}</th>
            <th scope="col" className={`${th} text-right`}>{t("holdings.invested")}</th>
            <th scope="col" className={`${th} text-right`}>{t("holdings.realized")}</th>
            <th scope="col" className={`${th} text-right`}>{t("holdings.income")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ asset, holding }) => {
            const closed = holding.quantity.isZero();
            return (
              <tr key={asset.id} className={`border-b border-line last:border-0 ${closed ? "opacity-60" : ""}`}>
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <span className="font-mono font-semibold text-fg">{asset.symbol}</span>
                  <span className="ml-2 text-muted">{asset.name}</span>
                  <span className="ml-2 text-xs text-muted">
                    · {t(`assetClasses.${asset.assetClass}`)}
                    {closed && ` · ${t("holdings.closed")}`}
                  </span>
                </th>
                <td className={tdNumber}>{formatQuantity(holding.quantity, locale)}</td>
                <td className={tdNumber}>
                  {holding.avgCost ? formatUsd(holding.avgCost, locale) : "—"}
                </td>
                <td className={tdNumber}>{formatUsd(holding.costBasis, locale)}</td>
                <td className={tdNumber}>
                  <Signed value={holding.realized} locale={locale} />
                </td>
                <td className={tdNumber}>
                  {holding.income.isZero() ? "—" : formatUsd(holding.income, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
