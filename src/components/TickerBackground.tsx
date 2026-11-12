/*
 * Faint, slowly drifting grid of tickers behind the hero — the site's visual
 * signature (STYLE.md → Hero). Purely decorative, so it's hidden from screen readers.
 */
const ROWS = [
  "AAPL 189.20 +1.2%  ·  NVDA 921.40 −0.8%  ·  MSFT 415.10 +0.4%  ·  GOOGL 172.30 +0.9%  ·  AMZN 186.50 −0.3%",
  "BTC 67,200 −0.4%  ·  ETH 3,480 +1.1%  ·  SOL 162.40 +2.3%  ·  XRP 0.62 −1.0%  ·  BNB 590.20 +0.2%",
  "S&P 500 5,320 +0.6%  ·  NASDAQ 16,780 +0.9%  ·  DOW 39,410 +0.2%  ·  MERVAL 1,620,000 +1.8%",
  "META 498.70 +1.5%  ·  TSLA 178.20 −2.1%  ·  YPF 21.40 +3.2%  ·  GGAL 38.60 +2.7%  ·  MELI 1,712 +0.5%",
  "EUR/USD 1.084 +0.1%  ·  USD/ARS 1,015 +0.3%  ·  USD/DKK 6.88 −0.1%  ·  GOLD 2,345 +0.4%",
  "DAX 18,640 −0.2%  ·  IBEX 11,230 +0.3%  ·  CAC 8,010 −0.5%  ·  STOXX 600 518 +0.1%",
];

export default function TickerBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-sm leading-10 text-fg/[0.07] select-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
    >
      <div className="flex h-full flex-col justify-center">
        {ROWS.map((row, i) => (
          <div
            key={i}
            className={`flex w-max animate-ticker whitespace-nowrap ${
              i % 2 === 1 ? "[animation-direction:reverse]" : ""
            }`}
          >
            {/* Content repeated twice so the -50% animation loops seamlessly. */}
            <span className="pr-8">{row}  ·  {row}  ·  </span>
            <span className="pr-8">{row}  ·  {row}  ·  </span>
          </div>
        ))}
      </div>
    </div>
  );
}
