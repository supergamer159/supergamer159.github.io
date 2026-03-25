import { average, clamp, sum } from "@/lib/core/utils";
import { MARKET_INDEX_SYMBOLS, MARKET_UNIVERSE } from "@/lib/market/universe";
import type {
  Candle,
  IndicatorSnapshot,
  MarketDataset,
  MarketIndexSnapshot,
  MarketSnapshot,
  SectorSnapshot,
  SignalBias,
  SignalFactorBreakdown,
  SignalHistoryPoint,
  SignalScore,
  SymbolDetail,
  UniverseSymbol,
} from "@/lib/market/types";

const BAR_MINUTES = 5;
const SESSION_BARS = 78;
const BUCKET_MS = 15 * 60 * 1000;

function hashString(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sma(values: number[], period: number) {
  return average(values.slice(-period));
}

function ema(values: number[], period: number) {
  if (!values.length) {
    return 0;
  }
  const multiplier = 2 / (period + 1);
  return values.slice(1).reduce((current, value) => ((value - current) * multiplier) + current, values[0]);
}

function rsi(values: number[], period = 14) {
  if (values.length <= period) {
    return 50;
  }
  let gains = 0;
  let losses = 0;
  for (let index = values.length - period; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  if (!losses) {
    return 100;
  }
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function atr(candles: Candle[], period = 14) {
  if (candles.length < 2) {
    return 0;
  }
  const relevant = candles.slice(-(period + 1));
  const ranges = relevant.slice(1).map((candle, index) => {
    const previousClose = relevant[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });
  return average(ranges);
}

function vwap(candles: Candle[]) {
  const weighted = candles.map((candle) => ((candle.high + candle.low + candle.close) / 3) * candle.volume);
  return sum(weighted) / Math.max(sum(candles.map((candle) => candle.volume)), 1);
}

function volumeRatio(candles: Candle[]) {
  const latest = candles.at(-1)?.volume ?? 0;
  const baseline = average(candles.slice(-21, -1).map((candle) => candle.volume));
  return baseline ? latest / baseline : 1;
}

function volatilityCompression(candles: Candle[]) {
  if (candles.length < 20) {
    return 0;
  }
  const recent = candles.slice(-8);
  const prior = candles.slice(-20, -8);
  const recentRange = average(recent.map((candle) => candle.high - candle.low));
  const priorRange = average(prior.map((candle) => candle.high - candle.low));
  if (!priorRange) {
    return 0;
  }
  return clamp((priorRange - recentRange) / priorRange, -1, 1);
}

function bucketTime(now = new Date()) {
  return new Date(Math.floor(now.getTime() / BUCKET_MS) * BUCKET_MS);
}

function sessionTime(bucket: Date, index: number) {
  return new Date(bucket.getTime() - ((SESSION_BARS - 1 - index) * BAR_MINUTES * 60 * 1000)).toISOString();
}

function marketRegime(bucket: Date) {
  const rng = mulberry32(hashString(bucket.toISOString()));
  return between(rng, -0.4, 0.55);
}

function sectorDrift(sector: string) {
  const map: Record<string, number> = {
    Technology: 0.18,
    Semiconductors: 0.24,
    Financials: 0.05,
    "Health Care": -0.03,
    Energy: 0.08,
    Industrials: 0.1,
    "Consumer Discretionary": 0.06,
    "Consumer Staples": -0.05,
    "Communication Services": 0.09,
    Utilities: -0.08,
    "Real Estate": -0.06,
    Materials: 0.03,
    "Index ETFs": 0,
  };
  return map[sector] ?? 0;
}

function generateCandles(meta: UniverseSymbol, bucket: Date, marketDrift: number) {
  const rng = mulberry32(hashString(`${meta.symbol}:${bucket.toISOString()}`));
  const symbolDrift = between(rng, -0.14, 0.18);
  const sectorBias = sectorDrift(meta.sector);
  const openingGap = between(rng, -0.028, 0.028);
  let price = meta.basePrice * (1 + openingGap);

  const candles: Candle[] = [];
  for (let index = 0; index < SESSION_BARS; index += 1) {
    const open = price;
    const trendPhase = Math.sin((index / (SESSION_BARS - 1)) * Math.PI);
    const impulse = (marketDrift * 0.0014) + (sectorBias * 0.0011) + (symbolDrift * 0.0012);
    const noise = between(rng, -0.006, 0.006);
    const momentumPulse = between(rng, -0.0018, 0.0023) * trendPhase;
    const close = Math.max(1, open * (1 + impulse + noise + momentumPulse));
    const spread = Math.max(open, close) * between(rng, 0.0012, 0.0064);
    const lowSpread = Math.max(open, close) * between(rng, 0.0012, 0.0058);
    const high = Math.max(open, close) + spread;
    const low = Math.max(0.5, Math.min(open, close) - lowSpread);
    const intradayVolumeCurve = 1.35 - Math.abs((index / SESSION_BARS) - 0.5);
    const volume = Math.round((meta.averageVolume / SESSION_BARS) * intradayVolumeCurve * between(rng, 0.72, 1.45));

    candles.push({
      time: sessionTime(bucket, index),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume,
    });
    price = close;
  }

  return candles;
}

function computeIndicators(candles: Candle[], benchmarkReturn: number): IndicatorSnapshot {
  const closes = candles.map((candle) => candle.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = ema12 - ema26;
  const macdSignal = ema(closes.map((_, index) => ema(closes.slice(0, index + 1), 12) - ema(closes.slice(0, index + 1), 26)), 9);
  const macdHistogram = macd - macdSignal;
  const latestClose = closes.at(-1) ?? 0;
  const firstClose = closes[0] ?? latestClose;
  const relativeStrength = ((latestClose - firstClose) / Math.max(firstClose, 1)) - benchmarkReturn;

  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    ema12,
    ema26,
    rsi14: rsi(closes, 14),
    macd,
    macdSignal,
    macdHistogram,
    atr14: atr(candles, 14),
    vwap: vwap(candles),
    volumeRatio: volumeRatio(candles),
    trendStrength: clamp((((latestClose - sma(closes, 20)) / Math.max(sma(closes, 20), 1)) * 8), -1, 1),
    relativeStrength: clamp(relativeStrength * 16, -1, 1),
    volatilityCompression: volatilityCompression(candles),
  };
}

function buildPatternTags(candles: Candle[], indicators: IndicatorSnapshot) {
  const closes = candles.map((candle) => candle.close);
  const latest = closes.at(-1) ?? 0;
  const recentHigh = Math.max(...closes.slice(-20));
  const recentLow = Math.min(...closes.slice(-20));
  const tags: string[] = [];
  let patternScore = 0;

  if (latest >= recentHigh * 0.997 && indicators.volumeRatio > 1.12) {
    tags.push("Breakout pressure");
    patternScore += 0.34;
  }
  if (latest <= recentLow * 1.003 && indicators.volumeRatio > 1.12) {
    tags.push("Breakdown pressure");
    patternScore -= 0.34;
  }
  if (indicators.rsi14 > 61 && indicators.macdHistogram > 0) {
    tags.push("Momentum expansion");
    patternScore += 0.18;
  }
  if (indicators.rsi14 < 41 && indicators.macdHistogram < 0) {
    tags.push("Momentum unwind");
    patternScore -= 0.18;
  }
  if (Math.abs(latest - indicators.vwap) / Math.max(indicators.vwap, 1) < 0.004) {
    tags.push("VWAP coil");
  }
  if (indicators.volumeRatio > 1.45) {
    tags.push("Volume expansion");
    patternScore += indicators.macdHistogram >= 0 ? 0.12 : -0.12;
  }
  if (indicators.volatilityCompression > 0.24) {
    tags.push("Compression setup");
    patternScore += indicators.macdHistogram >= 0 ? 0.12 : -0.12;
  }

  return {
    tags: tags.length ? tags.slice(0, 4) : ["Balanced tape"],
    patternScore: clamp(patternScore, -1, 1),
  };
}

function inferBias(total: number): SignalBias {
  if (total >= 0.22) {
    return "bullish";
  }
  if (total <= -0.22) {
    return "bearish";
  }
  return "neutral";
}

function factorBreakdown(candles: Candle[], indicators: IndicatorSnapshot) {
  const closes = candles.map((candle) => candle.close);
  const latest = closes.at(-1) ?? 0;
  const trend = clamp((((latest - indicators.sma20) / Math.max(indicators.sma20, 1)) * 9) + (((indicators.sma20 - indicators.sma50) / Math.max(indicators.sma50, 1)) * 12), -1, 1);
  const momentum = clamp(((indicators.rsi14 - 50) / 20) + (indicators.macdHistogram / Math.max(indicators.atr14 * 0.8, 0.5)), -1, 1);
  const relativeStrength = indicators.relativeStrength;
  const volume = clamp((indicators.volumeRatio - 1) * 0.85, -1, 1);
  const vwapEdge = clamp((latest - indicators.vwap) / Math.max(indicators.atr14 * 0.9, 0.5), -1, 1);
  const volatility = clamp(indicators.volatilityCompression * (momentum >= 0 ? 1 : -1), -1, 1);
  const { tags, patternScore } = buildPatternTags(candles, indicators);
  const total = clamp(
    (trend * 0.24) +
      (momentum * 0.18) +
      (relativeStrength * 0.18) +
      (volume * 0.14) +
      (vwapEdge * 0.12) +
      (volatility * 0.07) +
      (patternScore * 0.07),
    -1,
    1,
  );

  return {
    tags,
    breakdown: {
      trend: round(trend, 2),
      momentum: round(momentum, 2),
      relativeStrength: round(relativeStrength, 2),
      volume: round(volume, 2),
      vwap: round(vwapEdge, 2),
      volatility: round(volatility, 2),
      pattern: round(patternScore, 2),
      total: round(total, 2),
    } satisfies SignalFactorBreakdown,
  };
}

function tradeLevels(price: number, atrValue: number, bias: SignalBias): SignalScore["tradeLevels"] {
  const distance = Math.max(atrValue * 0.8, price * 0.006);
  if (bias === "bullish") {
    return {
      entryZone: [round(price - (distance * 0.35)), round(price + (distance * 0.12))],
      targetZone: [round(price + (distance * 1.2)), round(price + (distance * 2.1))],
      invalidation: round(price - (distance * 1.05)),
    };
  }
  if (bias === "bearish") {
    return {
      entryZone: [round(price - (distance * 0.12)), round(price + (distance * 0.35))],
      targetZone: [round(price - (distance * 2.1)), round(price - (distance * 1.2))],
      invalidation: round(price + (distance * 1.05)),
    };
  }
  return {
    entryZone: [round(price - (distance * 0.35)), round(price + (distance * 0.35))],
    targetZone: [round(price - distance), round(price + distance)],
    invalidation: round(price - (distance * 1.5)),
  };
}

function thesisForSignal(
  signal: Pick<SignalScore, "bias" | "patternTags" | "confidence">,
  sector: string,
) {
  if (signal.bias === "bullish") {
    return `${sector} leadership is holding above trend with ${signal.patternTags[0].toLowerCase()} and ${signal.confidence}% confidence.`;
  }
  if (signal.bias === "bearish") {
    return `${sector} is under pressure as ${signal.patternTags[0].toLowerCase()} drags the tape with ${signal.confidence}% confidence.`;
  }
  return `${sector} is balanced intraday; the setup remains range-bound while signal conviction stays muted.`;
}

export function buildSignalScore(
  meta: UniverseSymbol,
  candles: Candle[],
  benchmarkReturn: number,
  updatedAt: string,
) {
  const indicators = computeIndicators(candles, benchmarkReturn);
  const latest = candles.at(-1) ?? candles[0];
  const first = candles[0];
  const changePct = ((latest.close - first.close) / Math.max(first.close, 1)) * 100;
  const { tags, breakdown } = factorBreakdown(candles, indicators);
  const bias = inferBias(breakdown.total);
  const confidence = clamp(Math.round(42 + Math.abs(breakdown.total) * 44 + Math.min(tags.length, 3) * 3), 35, 95);
  const signal: SignalScore = {
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    assetType: meta.assetType,
    price: round(latest.close),
    changePct: round(changePct),
    volume: latest.volume,
    averageVolume: meta.averageVolume,
    updatedAt,
    freshnessLabel: "Delayed 15 minutes",
    bias,
    confidence,
    horizon: "intraday",
    patternTags: tags,
    factorBreakdown: breakdown,
    tradeLevels: tradeLevels(latest.close, indicators.atr14, bias),
    shortThesis: thesisForSignal(
      {
        bias,
        patternTags: tags,
        confidence,
      },
      meta.sector,
    ),
  };

  return {
    signal,
    indicators,
  };
}

function signalHistory(candles: Candle[], signal: SignalScore): SignalHistoryPoint[] {
  return candles
    .filter((_, index) => index % 6 === 0 || index === candles.length - 1)
    .map((candle, index, history) => {
      const trend = history.length <= 1 ? 0 : index / (history.length - 1);
      return {
        time: candle.time,
        price: candle.close,
        confidence: clamp(Math.round(signal.confidence - 8 + (trend * 12)), 30, 96),
        bias: signal.bias,
      };
    });
}

function relatedSymbols(meta: UniverseSymbol) {
  return MARKET_UNIVERSE
    .filter((item) => item.symbol !== meta.symbol && item.sector === meta.sector)
    .slice(0, 3)
    .map((item) => item.symbol);
}

function marketIndexes(signals: SignalScore[]): MarketIndexSnapshot[] {
  return MARKET_INDEX_SYMBOLS
    .map((symbol) => signals.find((signal) => signal.symbol === symbol))
    .filter((signal): signal is SignalScore => Boolean(signal))
    .map((signal) => ({
      symbol: signal.symbol,
      name: signal.name,
      changePct: signal.changePct,
      bias: signal.bias,
    }));
}

function sectorSnapshots(signals: SignalScore[]): SectorSnapshot[] {
  const grouped = new Map<string, number[]>();
  for (const signal of signals) {
    if (!grouped.has(signal.sector)) {
      grouped.set(signal.sector, []);
    }
    grouped.get(signal.sector)?.push(signal.factorBreakdown.total);
  }
  const sectors = [...grouped.entries()].map(([sector, scores]) => ({
    sector,
    averageScore: round(average(scores), 2),
    leader: false,
    laggard: false,
  }));
  const sorted = sectors.slice().sort((left, right) => right.averageScore - left.averageScore);
  const leader = sorted[0]?.sector;
  const laggard = sorted.at(-1)?.sector;
  return sectors.map((sector) => ({
    ...sector,
    leader: sector.sector === leader,
    laggard: sector.sector === laggard,
  }));
}

function marketNarrative(
  bias: SignalBias,
  sectors: SectorSnapshot[],
  topBullish: SignalScore[],
  topBearish: SignalScore[],
) {
  const leader = sectors.find((sector) => sector.leader)?.sector ?? "Technology";
  const laggard = sectors.find((sector) => sector.laggard)?.sector ?? "Utilities";
  if (bias === "bullish") {
    return `${leader} is carrying the tape while ${topBullish[0]?.symbol ?? "SPY"} and ${topBullish[1]?.symbol ?? "QQQ"} hold the strongest intraday pattern stacks. ${laggard} remains the soft spot, but overall breadth is supportive.`;
  }
  if (bias === "bearish") {
    return `${laggard} is dragging on the market backdrop and ${topBearish[0]?.symbol ?? "IWM"} is flashing the weakest pattern stack. Traders should assume fade risk until breadth stabilizes.`;
  }
  return `${leader} is showing relative resilience, but the overall tape is mixed. Expect rotation-driven opportunities rather than broad directional follow-through.`;
}

export function buildMarketDataset(asOf = new Date()): MarketDataset {
  const bucket = bucketTime(asOf);
  const updatedAt = bucket.toISOString();
  const regime = marketRegime(bucket);
  const benchmarkMeta = MARKET_UNIVERSE.find((meta) => meta.symbol === "SPY") ?? MARKET_UNIVERSE[0];
  const benchmarkCandles = generateCandles(benchmarkMeta, bucket, regime);
  const spyReturn = ((benchmarkCandles.at(-1)?.close ?? 0) - benchmarkCandles[0].close) / Math.max(benchmarkCandles[0].close, 1);

  const detailEntries = MARKET_UNIVERSE.map((meta) => {
    const candles = meta.symbol === benchmarkMeta.symbol ? benchmarkCandles : generateCandles(meta, bucket, regime);
    const { signal, indicators } = buildSignalScore(meta, candles, spyReturn, updatedAt);
    const detail: SymbolDetail = {
      snapshot: signal,
      description: meta.description,
      candles,
      indicators,
      signalHistory: signalHistory(candles, signal),
      narrative: "",
      relatedSymbols: relatedSymbols(meta),
    };
    return [meta.symbol, detail] as const;
  });

  const details = Object.fromEntries(detailEntries);
  const signals = Object.values(details)
    .map((detail) => detail.snapshot)
    .sort((left, right) => right.confidence - left.confidence);
  const indexes = marketIndexes(signals);
  const breadth = {
    advancers: signals.filter((signal) => signal.changePct > 0).length,
    decliners: signals.filter((signal) => signal.changePct < 0).length,
    neutral: signals.filter((signal) => signal.changePct === 0).length,
    bullishSignals: signals.filter((signal) => signal.bias === "bullish").length,
    bearishSignals: signals.filter((signal) => signal.bias === "bearish").length,
    breadthScore: round(average(indexes.map((index) => index.changePct)) + average(signals.map((signal) => signal.factorBreakdown.total * 10)), 2),
  };
  const sectors = sectorSnapshots(signals);
  const topBullish = signals.filter((signal) => signal.bias === "bullish").slice(0, 6);
  const topBearish = signals.filter((signal) => signal.bias === "bearish").sort((left, right) => right.confidence - left.confidence).slice(0, 6);
  const indexScore = average(indexes.map((index) => index.changePct / 2));
  const totalScore = (breadth.breadthScore / 10) + indexScore;
  const overallBias = inferBias(clamp(totalScore / 2, -1, 1));
  const overview: MarketSnapshot = {
    timestamp: updatedAt,
    freshnessLabel: "Delayed 15 minutes",
    overallBias,
    overallConfidence: clamp(Math.round(48 + Math.abs(totalScore) * 18), 35, 92),
    indexes,
    breadth,
    sectors,
    topBullish,
    topBearish,
    narrative: marketNarrative(overallBias, sectors, topBullish, topBearish),
  };

  for (const detail of Object.values(details)) {
    detail.narrative = `${detail.snapshot.shortThesis} Entry sits between ${detail.snapshot.tradeLevels.entryZone[0]} and ${detail.snapshot.tradeLevels.entryZone[1]}, with ${detail.snapshot.tradeLevels.invalidation} as invalidation.`;
  }

  return {
    bucketKey: updatedAt,
    generatedAt: new Date().toISOString(),
    overview,
    signals,
    details,
  };
}
