import type { FetchLike } from "./types";

/** Error with the HTTP status and the provider's body, for logs and retries. */
export class ProviderHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`${provider} answered HTTP ${status}: ${body.slice(0, 200)}`);
  }
}

/** Every provider call gives up after this long, so a slow API never blocks a page. */
export const PROVIDER_TIMEOUT_MS = 5000;

export async function getJson(
  fetchImpl: FetchLike,
  provider: string,
  url: string,
  headers: Record<string, string> = {},
): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json", ...headers },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ProviderHttpError(provider, response.status, await response.text().catch(() => ""));
  }
  return response.json();
}

/**
 * Some providers send prices as JSON numbers. String(n) gives the shortest
 * decimal that reads back as the same number, which is the text the provider
 * wrote, so the value enters decimal.js unchanged. Non-finite or negative
 * values are rejected.
 */
export function numberToDecimalText(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return String(value).includes("e") ? value.toFixed(20).replace(/\.?0+$/, "") : String(value);
}

/** Same for signed values such as a percent change. */
export function signedNumberToDecimalText(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const abs = numberToDecimalText(Math.abs(value));
  return abs === null ? null : value < 0 ? `-${abs}` : abs;
}

/** Runs `task` over `items` with at most `limit` running at once. */
export async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
