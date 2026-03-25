import { ScreenerTable } from "@/components/dashboard/screener-table";
import { getMarketDataset, getScreener } from "@/lib/market/store";

type ScreenerPageProps = {
  searchParams: Promise<{
    q?: string;
    bias?: "bullish" | "bearish" | "neutral" | "all";
    sector?: string;
    minConfidence?: string;
  }>;
};

export default async function ScreenerPage({ searchParams }: ScreenerPageProps) {
  const params = await searchParams;
  const dataset = await getMarketDataset();
  const signals = await getScreener({
    search: params.q,
    bias: params.bias ?? "all",
    sector: params.sector,
    minConfidence: params.minConfidence ? Number(params.minConfidence) : 0,
    limit: 120,
  });

  const sectors = [...new Set(dataset.signals.map((signal) => signal.sector))].sort((left, right) => left.localeCompare(right));

  return (
    <main className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Wide Screener</p>
        <h1 className="mt-2 font-display text-4xl text-white">Filter intraday structure across the tracked universe.</h1>
        <form className="mt-6 grid gap-3 md:grid-cols-4">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search symbol or name"
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
          />
          <select
            name="bias"
            defaultValue={params.bias ?? "all"}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
          >
            <option value="all">All bias states</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
            <option value="neutral">Neutral</option>
          </select>
          <select
            name="sector"
            defaultValue={params.sector ?? ""}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
          >
            <option value="">All sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
          <input
            name="minConfidence"
            type="number"
            min={0}
            max={100}
            defaultValue={params.minConfidence ?? "60"}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
          />
          <button type="submit" className="rounded-2xl bg-mint-400 px-5 py-3 font-semibold text-ink-950 hover:bg-mint-500 md:col-span-4">
            Apply filters
          </button>
        </form>
      </section>

      <ScreenerTable signals={signals} title={`Showing ${signals.length} ranked setups`} />
    </main>
  );
}
