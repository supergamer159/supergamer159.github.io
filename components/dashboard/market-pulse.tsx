import { formatDateTime } from "@/lib/core/utils";
import type { MarketSnapshot } from "@/lib/market/types";

export function MarketPulse({ overview }: { overview: MarketSnapshot }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Market Pulse</p>
          <h2 className="mt-3 font-display text-4xl text-white">
            {overview.overallBias === "bullish" ? "Risk appetite is expanding." : overview.overallBias === "bearish" ? "Tape is tilting defensive." : "Rotation is dominating the tape."}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-white/65">{overview.narrative}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.26em] text-white/45">Confidence</p>
          <p className="mt-2 font-display text-4xl text-white">{overview.overallConfidence}%</p>
          <p className="mt-2 text-sm text-white/45">{overview.freshnessLabel}</p>
          <p className="text-sm text-white/45">{formatDateTime(overview.timestamp)}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Breadth</p>
            <p className="mt-2 text-sm text-white/70">
              {overview.breadth.advancers} advancers / {overview.breadth.decliners} decliners
            </p>
            <p className="mt-3 font-display text-3xl text-white">{overview.breadth.breadthScore}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Signal Spread</p>
            <p className="mt-2 text-sm text-white/70">
              {overview.breadth.bullishSignals} bullish / {overview.breadth.bearishSignals} bearish
            </p>
            <p className="mt-3 font-display text-3xl text-white">{overview.indexes.length} indexes tracked</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Sector Leaders</p>
            <div className="mt-3 grid gap-2">
              {overview.sectors.filter((sector) => sector.leader || sector.averageScore > 0.12).slice(0, 3).map((sector) => (
                <div key={sector.sector} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                  <span className="text-sm text-white/75">{sector.sector}</span>
                  <span className="text-sm text-mint-400">{sector.averageScore}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Sector Laggards</p>
            <div className="mt-3 grid gap-2">
              {overview.sectors.filter((sector) => sector.laggard || sector.averageScore < -0.04).slice(0, 3).map((sector) => (
                <div key={sector.sector} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                  <span className="text-sm text-white/75">{sector.sector}</span>
                  <span className="text-sm text-coral-400">{sector.averageScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
