import TickerBackground from "./TickerBackground";
import TodayDate from "./TodayDate";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <TickerBackground />

      <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-[13px] font-medium tracking-widest text-muted uppercase">
          <TodayDate />
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold text-fg sm:text-5xl">
          What matters today.
        </h1>
        <p className="mt-4 max-w-xl text-body">
          The most important stories in stocks, crypto, programming and the economy — summarized
          in a few lines.
        </p>
        <p className="mt-6 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
          Preview · sample stories
        </p>
      </div>
    </section>
  );
}
