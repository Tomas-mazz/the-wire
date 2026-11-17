import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Dec, toDec } from "@/domain";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatQuantity, formatUsd } from "@/lib/format";
import type { TransactionRow } from "@/lib/portfolio/data";
import { tdNumber, th } from "./styles";

interface TransactionTableProps {
  rows: TransactionRow[];
  locale: string;
  timeZone: string;
  /** Project names by id; the column is hidden when omitted. */
  projectNames?: Map<string, string>;
}

/**
 * Money that moved, before fees:
 *   buy / sell / dividend = quantity × unit price
 *   deposit / withdrawal  = quantity (dollars)
 *   reward                = nothing (it is free)
 */
function total(row: TransactionRow): Dec | null {
  if (row.type === "reward") return null;
  if (row.type === "deposit" || row.type === "withdrawal") return toDec(row.quantity);
  return toDec(row.quantity).times(toDec(row.unitPrice));
}

const PRICED = new Set(["buy", "sell", "dividend"]);

export default async function TransactionTable({
  rows,
  locale,
  timeZone,
  projectNames,
}: TransactionTableProps) {
  const t = await getTranslations("Portfolio");

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-line bg-surface">
          <tr>
            <th scope="col" className={th}>{t("transactions.columns.date")}</th>
            <th scope="col" className={th}>{t("transactions.columns.asset")}</th>
            <th scope="col" className={th}>{t("transactions.columns.type")}</th>
            <th scope="col" className={`${th} text-right`}>{t("transactions.columns.quantity")}</th>
            <th scope="col" className={`${th} text-right`}>{t("transactions.columns.price")}</th>
            <th scope="col" className={`${th} text-right`}>{t("transactions.columns.fee")}</th>
            <th scope="col" className={`${th} text-right`}>{t("transactions.columns.total")}</th>
            {projectNames && <th scope="col" className={th}>{t("transactions.columns.project")}</th>}
            <th scope="col" className="w-10 px-3 py-3">
              <span className="sr-only">{t("transactions.edit")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const date = formatDateTime(row.executedAt, locale, timeZone);
            const amount = total(row);
            return (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface">
                <td className="px-3 py-3 whitespace-nowrap text-body">{date}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="font-mono font-semibold text-accent">{row.asset.symbol}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-body">{t(`types.${row.type}`)}</td>
                <td className={tdNumber}>{formatQuantity(row.quantity, locale)}</td>
                <td className={tdNumber}>
                  {PRICED.has(row.type) ? formatUsd(row.unitPrice, locale) : "—"}
                </td>
                <td className={tdNumber}>{row.fee ? formatUsd(row.fee, locale) : "—"}</td>
                <td className={tdNumber}>{amount ? formatUsd(amount, locale) : "—"}</td>
                {projectNames && (
                  <td className="px-3 py-3 whitespace-nowrap text-muted">
                    {projectNames.get(row.projectId) ?? "—"}
                  </td>
                )}
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/portfolio/transactions/${row.id}`}
                    aria-label={t("transactions.editLabel", {
                      asset: row.asset.symbol,
                      type: t(`types.${row.type}`),
                      date,
                    })}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-fg"
                  >
                    <Pencil size={15} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
