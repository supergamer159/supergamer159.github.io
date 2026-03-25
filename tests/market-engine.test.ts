import { describe, expect, it } from "vitest";

import { buildSignalScore } from "@/lib/market/engine";
import type { Candle, UniverseSymbol } from "@/lib/market/types";

const meta: UniverseSymbol = {
  symbol: "TEST",
  name: "Test Systems",
  sector: "Technology",
  assetType: "stock",
  description: "Fixture symbol for deterministic engine tests.",
  basePrice: 100,
  averageVolume: 1_000_000,
};

function candleSeries({
  start = 100,
  step = 0,
  volatility = 1,
  finalBoost = 0,
  volume = 100_000,
  finalVolumeMultiplier = 1,
}: {
  start?: number;
  step?: number;
  volatility?: number;
  finalBoost?: number;
  volume?: number;
  finalVolumeMultiplier?: number;
}) {
  return Array.from({ length: 60 }, (_, index) => {
    const base = start + (step * index);
    const close = index === 59 ? base + finalBoost : base + ((index % 2 === 0 ? volatility : -volatility) * 0.25);
    return {
      time: new Date(Date.UTC(2026, 2, 25, 14, 30 + index)).toISOString(),
      open: base,
      high: Math.max(base, close) + volatility,
      low: Math.min(base, close) - volatility,
      close,
      volume: Math.round(volume * (index === 59 ? finalVolumeMultiplier : 1)),
    } satisfies Candle;
  });
}

describe("buildSignalScore", () => {
  it("detects a breakout-style bullish setup", () => {
    const candles = candleSeries({
      start: 100,
      step: 0.55,
      volatility: 0.7,
      finalBoost: 4.5,
      finalVolumeMultiplier: 2.4,
    });

    const { signal } = buildSignalScore(meta, candles, 0.01, new Date().toISOString());
    expect(signal.bias).toBe("bullish");
    expect(signal.confidence).toBeGreaterThan(60);
    expect(signal.patternTags.join(" ")).toMatch(/Breakout|Momentum|Volume/i);
  });

  it("detects a bearish unwind setup", () => {
    const candles = candleSeries({
      start: 140,
      step: -0.6,
      volatility: 0.8,
      finalBoost: -4.2,
      finalVolumeMultiplier: 2.1,
    });

    const { signal } = buildSignalScore(meta, candles, 0.02, new Date().toISOString());
    expect(signal.bias).toBe("bearish");
    expect(signal.confidence).toBeGreaterThan(55);
  });

  it("keeps a choppy tape near neutral", () => {
    const candles = candleSeries({
      start: 100,
      step: 0,
      volatility: 0.08,
      finalBoost: 0,
      finalVolumeMultiplier: 1,
    });

    const { signal } = buildSignalScore(meta, candles, 0, new Date().toISOString());
    expect(signal.bias).toBe("neutral");
    expect(signal.confidence).toBeLessThanOrEqual(70);
  });
});
