import Link from "next/link";
import { notFound } from "next/navigation";

import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/core/utils";
import { getSymbolDetail } from "@/lib/market/store";

type SymbolPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export default async function SymbolDetailPage({ params }: SymbolPageProps) {
  const { ticker } = await params;
  const detail = await getSymbolDetail(ticker);

  if (!detail) {
    notFound();
  }

  return (
    <main className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-gold-300">{detail.snapshot.sector}</p>
            <h1 className="mt-2 font-display text-5xl text-white">{detail.snapshot.symbol}</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-white/65">{detail.description}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{detail.snapshot.bias}</p>
            <p className="mt-2 font-display text-4xl text-white">{detail.snapshot.confidence}%</p>
            <p className="mt-2 text-sm text-white/45">{formatDateTime(detail.snapshot.updatedAt)}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Last Price</p>
            <p className="mt-2 font-display text-3xl text-white">{formatCurrency(detail.snapshot.price)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Session Change</p>
            <p className="mt-2 font-display text-3xl text-white">{formatPercent(detail.snapshot.changePct)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Entry Zone</p>
            <p className="mt-2 font-display text-2xl text-white">
              {detail.snapshot.tradeLevels.entryZone[0]} - {detail.snapshot.tradeLevels.entryZone[1]}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Invalidation</p>
            <p className="mt-2 font-display text-3xl text-white">{detail.snapshot.tradeLevels.invalidation}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-panel backdrop-blur">
          <CandlestickChart candles={detail.candles} />
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.snapshot.patternTags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/65">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-5 rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4 text-sm leading-7 text-white/65">
            {detail.narrative}
          </p>
        </section>

        <section className="grid gap-4">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
            <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Indicator Stack</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">RSI 14</p>
                <p className="mt-2 font-display text-3xl text-white">{detail.indicators.rsi14.toFixed(1)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">MACD Histogram</p>
                <p className="mt-2 font-display text-3xl text-white">{detail.indicators.macdHistogram.toFixed(2)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">VWAP</p>
                <p className="mt-2 font-display text-3xl text-white">{detail.indicators.vwap.toFixed(2)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">ATR 14</p>
                <p className="mt-2 font-display text-3xl text-white">{detail.indicators.atr14.toFixed(2)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
            <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Signal History</p>
            <div className="mt-4 grid gap-2">
              {detail.signalHistory.map((point) => (
                <div key={point.time} className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-ink-950/70 px-4 py-3 text-sm text-white/70">
                  <span>{formatDateTime(point.time)}</span>
                  <span>{formatCurrency(point.price)}</span>
                  <span>{point.confidence}%</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
            <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Related Symbols</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.relatedSymbols.map((symbol) => (
                <Link key={symbol} href={`/app/symbol/${symbol}`} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70 hover:border-white/25 hover:text-white">
                  {symbol}
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
