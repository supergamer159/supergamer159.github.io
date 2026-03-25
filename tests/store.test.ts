import { describe, expect, it } from "vitest";

import {
  getMarketDataset,
  getMarketOverview,
  getScreener,
  refreshMarketDataset,
} from "@/lib/market/store";

describe("market store", () => {
  it("returns a stable dataset for the current bucket", async () => {
    const first = await getMarketDataset();
    const second = await getMarketDataset();

    expect(first.bucketKey).toBe(second.bucketKey);
    expect(first.signals.length).toBeGreaterThanOrEqual(500);
  });

  it("refreshes without changing the symbol inventory size", async () => {
    const before = await getMarketDataset();
    const refreshed = await refreshMarketDataset();

    expect(refreshed.signals.length).toBe(before.signals.length);
    expect(refreshed.overview.topBullish.length).toBeGreaterThan(0);
  });

  it("supports screener filtering and overview retrieval", async () => {
    const overview = await getMarketOverview();
    const bullish = await getScreener({ bias: "bullish", minConfidence: 70, limit: 25 });

    expect(["bullish", "bearish", "neutral"]).toContain(overview.overallBias);
    expect(bullish.every((signal) => signal.bias === "bullish" && signal.confidence >= 70)).toBe(true);
  });
});
