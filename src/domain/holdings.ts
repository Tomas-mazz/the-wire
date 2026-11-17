import { ZERO } from "./decimal";
import { computePosition, type Position } from "./position";
import { PortfolioError, type Transaction } from "./types";

/** A ledger row that knows its project and asset. */
export interface LedgerTransaction extends Transaction {
  projectId: string;
  assetId: string;
}

/** Everything held of one asset, across the given projects. */
export interface Holding extends Position {
  assetId: string;
}

export interface LedgerProblem {
  projectId: string;
  assetId: string;
  error: PortfolioError;
}

/**
 * Builds one position per asset.
 *
 * Each (project, asset) ledger is replayed on its own with computePosition,
 * because average cost is tracked per project. The results are then summed
 * per asset:
 *
 *   quantity, costBasis, realized, income, fees = sum over projects
 *   avgCost = total costBasis / total quantity
 *
 * A ledger that cannot be replayed (e.g. a sell larger than the holding) is
 * reported in `problems` and left out, so one bad row never hides the rest.
 */
export function computeHoldings(transactions: readonly LedgerTransaction[]): {
  holdings: Holding[];
  problems: LedgerProblem[];
} {
  const groups = new Map<string, LedgerTransaction[]>();
  for (const tx of transactions) {
    const key = `${tx.projectId}|${tx.assetId}`;
    const group = groups.get(key);
    if (group) group.push(tx);
    else groups.set(key, [tx]);
  }

  const byAsset = new Map<string, Omit<Holding, "avgCost">>();
  const problems: LedgerProblem[] = [];

  for (const group of groups.values()) {
    const { projectId, assetId } = group[0];
    let position: Position;
    try {
      position = computePosition(group);
    } catch (error) {
      if (error instanceof PortfolioError) {
        problems.push({ projectId, assetId, error });
        continue;
      }
      throw error;
    }
    const sum = byAsset.get(assetId) ?? {
      assetId,
      quantity: ZERO,
      costBasis: ZERO,
      realized: ZERO,
      income: ZERO,
      fees: ZERO,
    };
    byAsset.set(assetId, {
      assetId,
      quantity: sum.quantity.plus(position.quantity),
      costBasis: sum.costBasis.plus(position.costBasis),
      realized: sum.realized.plus(position.realized),
      income: sum.income.plus(position.income),
      fees: sum.fees.plus(position.fees),
    });
  }

  const holdings = [...byAsset.values()].map((h) => ({
    ...h,
    avgCost: h.quantity.isZero() ? null : h.costBasis.div(h.quantity),
  }));
  return { holdings, problems };
}
