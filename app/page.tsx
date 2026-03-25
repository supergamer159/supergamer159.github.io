import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.32em] text-mint-400">Signal Forge</p>
            <p className="text-sm text-white/55">AI narratives layered on deterministic market structure.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:border-white/25 hover:text-white">
              Sign in
            </Link>
            <Link href="/app" className="rounded-full bg-mint-400 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-mint-500">
              Open Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-panel backdrop-blur">
            <p className="font-display text-sm uppercase tracking-[0.32em] text-gold-300">Intraday Market Intelligence</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-white md:text-7xl">
              Pattern-first stock screening with AI that explains the setup.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              Signal Forge watches US stocks and ETFs, ranks intraday structure, scores bullish and bearish setups,
              and turns the read into decision-grade trade narratives with clear entry, target, and invalidation levels.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="rounded-full bg-coral-400 px-5 py-3 font-semibold text-ink-950 hover:bg-coral-500">
                Launch Market Pulse
              </Link>
              <Link href="/app/screener" className="rounded-full border border-white/10 px-5 py-3 font-semibold text-white/80 hover:border-white/25 hover:text-white">
                Explore Screener
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4">
                <p className="text-3xl font-display text-white">520</p>
                <p className="mt-2 text-sm text-white/55">Tracked symbols across US stocks and ETFs.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4">
                <p className="text-3xl font-display text-white">15m</p>
                <p className="mt-2 text-sm text-white/55">Delayed refresh cadence built for intraday rhythm.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4">
                <p className="text-3xl font-display text-white">AI + Quant</p>
                <p className="mt-2 text-sm text-white/55">Deterministic scoring with narrative interpretation.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-ink-900/90 to-ink-800/80 p-6 shadow-panel">
              <p className="text-sm uppercase tracking-[0.3em] text-white/45">Market Pulse</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl border border-mint-400/25 bg-mint-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-mint-400">Bullish Leader</p>
                  <h2 className="mt-2 font-display text-3xl">NVDA</h2>
                  <p className="mt-2 text-sm text-white/65">Breakout pressure, momentum expansion, and strong relative strength.</p>
                </div>
                <div className="rounded-3xl border border-coral-400/25 bg-coral-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-coral-400">Bearish Leader</p>
                  <h2 className="mt-2 font-display text-3xl">XLF</h2>
                  <p className="mt-2 text-sm text-white/65">Financial breadth is soft and breakdown pressure is widening.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-white/45">What ships in v1</p>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-white/70">
                <li>Wide screener with bullish, bearish, and sector-aware filtering.</li>
                <li>Symbol detail pages with candle charts, indicator stack, and AI thesis.</li>
                <li>Market breadth and sector leadership view updated on a 15-minute cadence.</li>
                <li>Magic-link auth and saved watchlists backed by Supabase.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
