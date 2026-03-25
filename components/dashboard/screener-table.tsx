import Link from "next/link";

import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/core/utils";
import type { SignalScore } from "@/lib/market/types";

export function ScreenerTable({
  signals,
  title = "Screener",
}: {
  signals: SignalScore[];
  title?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-gold-300">{title}</p>
          <h2 className="mt-2 font-display text-3xl text-white">Ranked by confidence and structure quality.</h2>
        </div>
        <Link href="/app/screener" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white">
          Full table
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.24em] text-white/40">
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Bias</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Change</th>
              <th className="px-3 py-2">Volume</th>
              <th className="px-3 py-2">Patterns</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr key={signal.symbol} className="rounded-2xl bg-ink-950/70 text-sm text-white/75">
                <td className="rounded-l-2xl px-3 py-3">
                  <Link href={`/app/symbol/${signal.symbol}`} className="font-display text-lg text-white hover:text-gold-300">
                    {signal.symbol}
                  </Link>
                  <p className="text-xs text-white/45">{signal.name}</p>
                </td>
                <td className="px-3 py-3 capitalize">{signal.bias}</td>
                <td className="px-3 py-3">{signal.confidence}%</td>
                <td className="px-3 py-3">{formatCurrency(signal.price)}</td>
                <td className="px-3 py-3">{formatPercent(signal.changePct)}</td>
                <td className="px-3 py-3">{formatCompactNumber(signal.volume)}</td>
                <td className="rounded-r-2xl px-3 py-3">{signal.patternTags.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
