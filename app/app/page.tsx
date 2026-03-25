import Link from "next/link";

import { MarketPulse } from "@/components/dashboard/market-pulse";
import { ScreenerTable } from "@/components/dashboard/screener-table";
import { SignalCard } from "@/components/dashboard/signal-card";
import { getCurrentUser } from "@/lib/auth/session";
import { SCREENER_FILTER_PRESETS, getMarketOverview, getScreener, listWatchlists } from "@/lib/market/store";

export default async function DashboardPage() {
  const [overview, topSignals, user] = await Promise.all([
    getMarketOverview(),
    getScreener({ limit: 18, minConfidence: 60 }),
    getCurrentUser(),
  ]);
  const watchlists = await listWatchlists(user?.id ?? "guest-demo");

  return (
    <main className="grid gap-4">
      <MarketPulse overview={overview} />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {overview.topBullish.slice(0, 2).map((signal) => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))}
          </div>
          <ScreenerTable signals={topSignals.slice(0, 12)} title="Live Screener Preview" />
        </div>

        <div className="grid gap-4">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
            <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Preset Filters</p>
            <div className="mt-4 grid gap-3">
              {SCREENER_FILTER_PRESETS.map((preset) => (
                <Link
                  key={preset.id}
                  href={`/app/screener?minConfidence=${preset.minConfidence}&bias=${preset.bias ?? "all"}${preset.sector ? `&sector=${encodeURIComponent(preset.sector)}` : ""}`}
                  className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4 hover:border-white/20"
                >
                  <p className="font-display text-xl text-white">{preset.name}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {preset.bias === "all" ? "All bias states" : `${preset.bias} only`} · {preset.minConfidence}%+
                    {preset.sector ? ` · ${preset.sector}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Watchlists</p>
                <h2 className="mt-2 font-display text-3xl text-white">
                  {user ? "Your saved symbol baskets" : "Sign in to persist watchlists"}
                </h2>
              </div>
              <Link href="/app/watchlists" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white">
                Manage
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {watchlists.slice(0, 2).map((watchlist) => (
                <div key={watchlist.id} className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl text-white">{watchlist.name}</p>
                      <p className="text-sm text-white/55">{watchlist.description ?? "No description added."}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                      {watchlist.items.length} symbols
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {watchlist.items.slice(0, 4).map((item) => (
                      <Link key={item.id} href={`/app/symbol/${item.symbol}`} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70 hover:border-white/25 hover:text-white">
                        {item.symbol}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <p className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 px-4 py-3 text-sm leading-6 text-white/55">
        Signals are probabilistic, delayed, and intended for research use. Every setup includes confidence,
        target, and invalidation so the output stays interpretable instead of pretending certainty.
      </p>
    </main>
  );
}
