import type { MarketSnapshot, SignalScore, SymbolDetail } from "@/lib/market/types";

export interface NarrativeProvider {
  marketNarrative(input: {
    overview: MarketSnapshot;
    bullish: SignalScore[];
    bearish: SignalScore[];
  }): Promise<string>;
  symbolNarrative(detail: SymbolDetail): Promise<string>;
}

class TemplateNarrativeProvider implements NarrativeProvider {
  async marketNarrative(input: {
    overview: MarketSnapshot;
    bullish: SignalScore[];
    bearish: SignalScore[];
  }) {
    const leader = input.overview.sectors.find((sector) => sector.leader)?.sector ?? "Technology";
    const laggard = input.overview.sectors.find((sector) => sector.laggard)?.sector ?? "Utilities";
    if (input.overview.overallBias === "bullish") {
      return `${leader} is leading the tape while ${input.bullish[0]?.symbol ?? "SPY"} and ${input.bullish[1]?.symbol ?? "QQQ"} show the cleanest continuation structure. Breadth is supportive enough to keep dip-buying in play, but ${laggard} is still lagging and should stay on the risk dashboard.`;
    }
    if (input.overview.overallBias === "bearish") {
      return `${laggard} is weighing on the market backdrop and the weakest setups are clustering around ${input.bearish[0]?.symbol ?? "IWM"} and ${input.bearish[1]?.symbol ?? "XLF"}. Until breadth improves, short-covering rallies deserve more skepticism than trust.`;
    }
    return `${leader} remains relatively firm, but overall participation is mixed and rotation is doing more of the work than a clean index trend. Focus on selective setups with clear invalidation instead of broad market assumptions.`;
  }

  async symbolNarrative(detail: SymbolDetail) {
    const signal = detail.snapshot;
    if (signal.bias === "bullish") {
      return `${signal.symbol} is trading with a bullish intraday bias at ${signal.confidence}% confidence. The setup is being driven by ${signal.patternTags.join(", ").toLowerCase()}, with buyers defending ${signal.tradeLevels.entryZone[0]}-${signal.tradeLevels.entryZone[1]} and upside room toward ${signal.tradeLevels.targetZone[0]}-${signal.tradeLevels.targetZone[1]}. Invalidation sits at ${signal.tradeLevels.invalidation}.`;
    }
    if (signal.bias === "bearish") {
      return `${signal.symbol} is leaning bearish intraday at ${signal.confidence}% confidence. The setup reflects ${signal.patternTags.join(", ").toLowerCase()}, with rallies into ${signal.tradeLevels.entryZone[0]}-${signal.tradeLevels.entryZone[1]} vulnerable to rejection and downside room toward ${signal.tradeLevels.targetZone[0]}-${signal.tradeLevels.targetZone[1]}. Invalidation sits at ${signal.tradeLevels.invalidation}.`;
    }
    return `${signal.symbol} is neutral intraday and trading closer to range behavior than directional expansion. Confidence is only ${signal.confidence}%, so the better plan is to wait for a cleaner break away from ${signal.tradeLevels.entryZone[0]}-${signal.tradeLevels.entryZone[1]} before assuming trend follow-through.`;
  }
}

export function getNarrativeProvider(): NarrativeProvider {
  return new TemplateNarrativeProvider();
}
