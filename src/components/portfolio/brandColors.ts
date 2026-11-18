/**
 * Brand colors for the allocation donut and its bars (decision 96).
 *
 * A fixed list of common assets, using each brand's well-known color. This
 * is the only place where green or red may mean something other than a gain
 * or a loss, so these colors must never be used for numbers. Brands whose
 * color is black or very dark are shown in a lighter tone so they stay
 * visible on the dark background. Anything not listed gets a violet shade.
 */

const CRYPTO: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#9945FF",
  USDT: "#26A17B",
  USDC: "#2775CA",
  BNB: "#F3BA2F",
  XRP: "#BFC6CF", // black logo, shown light
  ADA: "#3468D1",
  DOGE: "#C2A633",
  AVAX: "#E84142",
  DOT: "#E6007A",
  LINK: "#2A5ADA",
  POL: "#8247E5",
  MATIC: "#8247E5",
  LTC: "#A6A9AA",
  TRX: "#EB0029",
  SHIB: "#FFA409",
  TON: "#0098EA",
  SUI: "#4DA2FF",
  ARB: "#28A0F0",
  OP: "#FF0420",
};

/** Stocks and ETFs share one list (same tickers on US exchanges). */
const STOCKS: Record<string, string> = {
  AAPL: "#A2AAAD",
  MSFT: "#00A4EF",
  NVDA: "#76B900",
  GOOGL: "#4285F4",
  GOOG: "#4285F4",
  AMZN: "#FF9900",
  META: "#0866FF",
  TSLA: "#CC0000",
  NFLX: "#E50914",
  INTC: "#0071C5",
  KO: "#F40009",
  PEP: "#2A6FD6",
  DIS: "#3B6BE8",
  V: "#2D3BB5",
  MA: "#EB001B",
  COIN: "#0052FF",
  PYPL: "#169BD7",
  SPOT: "#1DB954",
  SHOP: "#95BF47",
  VOO: "#96151D", // Vanguard
  VTI: "#96151D",
  VT: "#96151D",
};

/** Violet shades for assets without a listed brand color. */
const FALLBACK = ["#b57cff", "#8f5be0", "#d9b8ff", "#6a3fb8", "#c99cff", "#7d4fd0"];

/** Muted violet for the grouped "Others" slice. */
export const OTHERS_COLOR = "#5b4a73";

/**
 * Colors for a list of assets, in order. Unlisted assets take the violet
 * shades one after another, so two of them side by side never look the same.
 */
export function brandColors(assets: readonly { symbol: string; assetClass: string }[]): string[] {
  let next = 0;
  return assets.map(({ symbol, assetClass }) => {
    const list = assetClass === "crypto" ? CRYPTO : STOCKS;
    return list[symbol.toUpperCase()] ?? FALLBACK[next++ % FALLBACK.length];
  });
}
