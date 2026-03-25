import Link from "next/link";

import { cn, formatCompactNumber, formatCurrency, formatPercent } from "@/lib/core/utils";
import type { SignalScore } from "@/lib/market/types";

function toneClasses(bias: SignalScore["bias"]) {
  if (bias === "bullish") {
    return "border-mint-400/30 bg-mint-400/10";
  }
  if (bias === "bearish") {
    return "border-coral-400/30 bg-coral-400/10";
  }
  return "border-white/10 bg-white/5";
}

export function SignalCard({
  signal,
  compact = false,
}: {
  signal: SignalScore;
  compact?: boolean;
}) {
  return (
    <article className={cn("rounded-[1.5rem] border p-4 shadow-panel", toneClasses(signal.bias), compact && "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">{signal.sector}</p>
          <h3 className="mt-1 font-display text-2xl text-white">{signal.symbol}</h3>
          <p className="text-sm text-white/55">{signal.name}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-ink-950/70 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{signal.bias}</p>
          <p className="font-display text-xl text-white">{signal.confidence}%</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-white/70">
        <div>
          <p className="text-white/40">Price</p>
          <p className="mt-1 font-medium text-white">{formatCurrency(signal.price)}</p>
        </div>
        <div>
          <p className="text-white/40">Change</p>
          <p className="mt-1 font-medium text-white">{formatPercent(signal.changePct)}</p>
        </div>
        <div>
          <p className="text-white/40">Volume</p>
          <p className="mt-1 font-medium text-white">{formatCompactNumber(signal.volume)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/65">{signal.shortThesis}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {signal.patternTags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
            {tag}
          </span>
        ))}
      </div>
      <Link href={`/app/symbol/${signal.symbol}`} className="mt-5 inline-flex text-sm font-semibold text-gold-300 hover:text-gold-400">
        View full setup
      </Link>
    </article>
  );
}
