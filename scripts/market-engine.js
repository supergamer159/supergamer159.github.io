const BAR_MINUTES = 5;
const SESSION_BARS = 78;
const SNAPSHOT_MS = 15 * 60 * 1000;

const CURATED_UNIVERSE = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "Index ETFs", assetType: "etf", description: "Broad US large-cap equity benchmark and market risk proxy.", basePrice: 521, averageVolume: 88000000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Index ETFs", assetType: "etf", description: "Nasdaq-100 tracker with heavy large-cap technology exposure.", basePrice: 451, averageVolume: 61000000 },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", sector: "Index ETFs", assetType: "etf", description: "Small-cap risk appetite gauge for the US market.", basePrice: 206, averageVolume: 32000000 },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", sector: "Index ETFs", assetType: "etf", description: "Blue-chip index tracker used for industrial leadership checks.", basePrice: 396, averageVolume: 6200000 },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", sector: "Technology", assetType: "etf", description: "Technology leadership ETF used for sector rotation signals.", basePrice: 219, averageVolume: 8400000 },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", sector: "Financials", assetType: "etf", description: "Bank and financial-sector ETF used for breadth confirmation.", basePrice: 42, averageVolume: 39000000 },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", sector: "Energy", assetType: "etf", description: "Energy sector leadership ETF used for commodity-linked rotation.", basePrice: 92, averageVolume: 18000000 },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", sector: "Semiconductors", assetType: "etf", description: "Semiconductor leadership proxy for high-beta trend days.", basePrice: 232, averageVolume: 9300000 },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", assetType: "stock", description: "Semiconductor and AI infrastructure bellwether.", basePrice: 932, averageVolume: 47500000 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", assetType: "stock", description: "Mega-cap software and cloud leadership component.", basePrice: 426, averageVolume: 21000000 },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", assetType: "stock", description: "Consumer electronics and mega-cap liquidity leader.", basePrice: 219, averageVolume: 59000000 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Discretionary", assetType: "stock", description: "E-commerce and cloud platform bellwether.", basePrice: 182, averageVolume: 44000000 },
  { symbol: "META", name: "Meta Platforms, Inc.", sector: "Communication Services", assetType: "stock", description: "Digital advertising and social-platform momentum name.", basePrice: 498, averageVolume: 18000000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services", assetType: "stock", description: "Search and advertising leader with major AI relevance.", basePrice: 171, averageVolume: 24000000 },
  { symbol: "TSLA", name: "Tesla, Inc.", sector: "Consumer Discretionary", assetType: "stock", description: "High-beta retail favorite with outsized intraday volatility.", basePrice: 194, averageVolume: 67000000 },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", sector: "Semiconductors", assetType: "stock", description: "Semiconductor momentum stock with strong trader interest.", basePrice: 171, averageVolume: 51000000 },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", assetType: "stock", description: "Infrastructure semiconductor and platform software compounder.", basePrice: 1382, averageVolume: 4500000 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", assetType: "stock", description: "Money-center bank leader and financial-sector proxy.", basePrice: 203, averageVolume: 12000000 },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Health Care", assetType: "stock", description: "Pharma leader with strong trend-following flows.", basePrice: 807, averageVolume: 4200000 },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", sector: "Health Care", assetType: "stock", description: "Large managed-care name with defensive sector influence.", basePrice: 499, averageVolume: 3500000 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", assetType: "stock", description: "Integrated energy major and sector heavyweight.", basePrice: 118, averageVolume: 16000000 },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Energy", assetType: "stock", description: "Oil major with strong sector beta during energy-led sessions.", basePrice: 162, averageVolume: 8100000 },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials", assetType: "stock", description: "Heavy machinery bellwether for industrial cyclicals.", basePrice: 349, averageVolume: 2500000 },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", assetType: "stock", description: "Industrial leader with strong momentum trader interest.", basePrice: 162, averageVolume: 6200000 },
  { symbol: "CRM", name: "Salesforce, Inc.", sector: "Technology", assetType: "stock", description: "Enterprise software platform with strong growth factor beta.", basePrice: 301, averageVolume: 5400000 },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology", assetType: "stock", description: "Creative software leader and momentum-quality name.", basePrice: 542, averageVolume: 3500000 },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", sector: "Technology", assetType: "stock", description: "AI-linked software stock with intense retail participation.", basePrice: 28, averageVolume: 74000000 },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", assetType: "stock", description: "Commerce enablement platform with trend-sensitive flows.", basePrice: 78, averageVolume: 9300000 },
  { symbol: "UBER", name: "Uber Technologies, Inc.", sector: "Technology", assetType: "stock", description: "Platform name with strong trend and event-driven behavior.", basePrice: 82, averageVolume: 17000000 },
  { symbol: "NFLX", name: "Netflix, Inc.", sector: "Communication Services", assetType: "stock", description: "Streaming leader with strong momentum-following behavior.", basePrice: 635, averageVolume: 5300000 },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", assetType: "stock", description: "Defensive retail leader and consumer spending barometer.", basePrice: 64, averageVolume: 12000000 },
  { symbol: "COST", name: "Costco Wholesale Corporation", sector: "Consumer Staples", assetType: "stock", description: "Defensive quality retailer with steady institutional sponsorship.", basePrice: 749, averageVolume: 1900000 },
  { symbol: "SO", name: "Southern Company", sector: "Utilities", assetType: "stock", description: "Utility-sector anchor used for defensive participation checks.", basePrice: 72, averageVolume: 4500000 },
  { symbol: "NEE", name: "NextEra Energy, Inc.", sector: "Utilities", assetType: "stock", description: "Utility and clean-energy hybrid with trend sensitivity.", basePrice: 67, averageVolume: 9100000 },
  { symbol: "AMT", name: "American Tower Corporation", sector: "Real Estate", assetType: "stock", description: "Tower REIT with rate-sensitive trading behavior.", basePrice: 193, averageVolume: 2300000 },
  { symbol: "PLD", name: "Prologis, Inc.", sector: "Real Estate", assetType: "stock", description: "Industrial REIT leader tied to logistics and rates.", basePrice: 124, averageVolume: 4100000 }
];

const CORE_SYMBOLS = new Set(CURATED_UNIVERSE.map((item) => item.symbol));

const MARKET_INDEX_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "XLK", "XLF", "XLE", "SMH"];
const SYNTHETIC_SECTORS = [
  "Technology",
  "Financials",
  "Health Care",
  "Industrials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Communication Services",
  "Utilities",
  "Real Estate",
  "Materials",
  "Semiconductors"
];
const PREFIXES = ["Atlas", "Beacon", "Cobalt", "Delta", "Echo", "Falcon", "Granite", "Harbor", "Ion", "Juniper", "Keystone", "Lattice", "Monarch", "Northstar", "Orion", "Pioneer", "Quarry", "Redwood", "Summit", "Trident", "Unity", "Vector", "Westbridge", "Zenith"];
const SUFFIXES = ["Systems", "Holdings", "Labs", "Capital", "Energy", "Networks", "Industries", "Therapeutics", "Logistics", "Platforms", "Motors", "Materials"];

function syntheticSymbol(index) {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = alpha[Math.floor(index / (26 * 26)) % 26];
  const b = alpha[Math.floor(index / 26) % 26];
  const c = alpha[index % 26];
  return `Q${a}${b}${c}`;
}

function buildSyntheticUniverse(count) {
  return Array.from({ length: count }, (_, index) => {
    const sector = SYNTHETIC_SECTORS[index % SYNTHETIC_SECTORS.length];
    const prefix = PREFIXES[index % PREFIXES.length];
    const suffix = SUFFIXES[Math.floor(index / PREFIXES.length) % SUFFIXES.length];
    const assetType = index % 19 === 0 ? "etf" : "stock";
    return {
      symbol: syntheticSymbol(index),
      name: `${prefix} ${suffix}`,
      sector,
      assetType,
      description: `Synthetic ${sector.toLowerCase()} ${assetType === "etf" ? "fund" : "equity"} used to widen the client-side screener universe.`,
      basePrice: 16 + (index % 24) * 4.2 + ((index * 7) % 6) * 1.3,
      averageVolume: 800000 + (index % 20) * 250000 + (assetType === "etf" ? 1800000 : 0)
    };
  });
}

const MARKET_UNIVERSE = [...CURATED_UNIVERSE, ...buildSyntheticUniverse(520 - CURATED_UNIVERSE.length)];

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function between(rng, min, max) {
  return min + rng() * (max - min);
}

function sma(values, period) {
  return average(values.slice(-period));
}

function ema(values, period) {
  if (!values.length) {
    return 0;
  }
  const multiplier = 2 / (period + 1);
  return values.slice(1).reduce((current, value) => ((value - current) * multiplier) + current, values[0]);
}

function rsi(values, period = 14) {
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

function atr(candles, period = 14) {
  if (candles.length < 2) {
    return 0;
  }
  const relevant = candles.slice(-(period + 1));
  const ranges = relevant.slice(1).map((candle, index) => {
    const previousClose = relevant[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose)
    );
  });
  return average(ranges);
}

function vwap(candles) {
  const weighted = candles.map((candle) => ((candle.high + candle.low + candle.close) / 3) * candle.volume);
  return sum(weighted) / Math.max(sum(candles.map((candle) => candle.volume)), 1);
}

function volumeRatio(candles) {
  const latest = candles[candles.length - 1]?.volume ?? 0;
  const baseline = average(candles.slice(-21, -1).map((candle) => candle.volume));
  return baseline ? latest / baseline : 1;
}

function volatilityCompression(candles) {
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
  return new Date(Math.floor(now.getTime() / SNAPSHOT_MS) * SNAPSHOT_MS);
}

function sessionTime(bucket, index) {
  return new Date(bucket.getTime() - ((SESSION_BARS - 1 - index) * BAR_MINUTES * 60 * 1000)).toISOString();
}

function marketRegime(bucket) {
  const rng = mulberry32(hashString(bucket.toISOString()));
  return between(rng, -0.42, 0.56);
}

function sectorDrift(sector) {
  const map = {
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
    "Index ETFs": 0
  };
  return map[sector] ?? 0;
}

function generateCandles(meta, bucket, marketDrift) {
  const rng = mulberry32(hashString(`${meta.symbol}:${bucket.toISOString()}`));
  const symbolDrift = between(rng, -0.14, 0.18);
  const sectorBias = sectorDrift(meta.sector);
  const openingGap = between(rng, -0.026, 0.026);
  let price = meta.basePrice * (1 + openingGap);
  const candles = [];

  for (let index = 0; index < SESSION_BARS; index += 1) {
    const open = price;
    const trendPhase = Math.sin((index / (SESSION_BARS - 1)) * Math.PI);
    const impulse = (marketDrift * 0.00145) + (sectorBias * 0.0011) + (symbolDrift * 0.00115);
    const noise = between(rng, -0.0064, 0.0064);
    const momentumPulse = between(rng, -0.0017, 0.0021) * trendPhase;
    const close = Math.max(1, open * (1 + impulse + noise + momentumPulse));
    const spread = Math.max(open, close) * between(rng, 0.0012, 0.0064);
    const lowSpread = Math.max(open, close) * between(rng, 0.0012, 0.0058);
    const high = Math.max(open, close) + spread;
    const low = Math.max(0.5, Math.min(open, close) - lowSpread);
    const volumeCurve = 1.35 - Math.abs((index / SESSION_BARS) - 0.5);
    const volume = Math.round((meta.averageVolume / SESSION_BARS) * volumeCurve * between(rng, 0.72, 1.45));

    candles.push({
      time: sessionTime(bucket, index),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume
    });

    price = close;
  }

  return candles;
}

function computeIndicators(candles, benchmarkReturn) {
  const closes = candles.map((candle) => candle.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = ema12 - ema26;
  const macdLine = closes.map((_, index) => ema(closes.slice(0, index + 1), 12) - ema(closes.slice(0, index + 1), 26));
  const macdSignal = ema(macdLine, 9);
  const macdHistogram = macd - macdSignal;
  const latest = closes[closes.length - 1];
  const first = closes[0];
  const relStrength = ((latest - first) / Math.max(first, 1)) - benchmarkReturn;

  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    rsi14: rsi(closes, 14),
    macd,
    macdSignal,
    macdHistogram,
    atr14: atr(candles, 14),
    vwap: vwap(candles),
    volumeRatio: volumeRatio(candles),
    trendStrength: clamp((((latest - sma(closes, 20)) / Math.max(sma(closes, 20), 1)) * 8), -1, 1),
    relativeStrength: clamp(relStrength * 16, -1, 1),
    volatilityCompression: volatilityCompression(candles)
  };
}

function buildPatternTags(candles, indicators) {
  const closes = candles.map((candle) => candle.close);
  const latest = closes[closes.length - 1];
  const recentHigh = Math.max(...closes.slice(-20));
  const recentLow = Math.min(...closes.slice(-20));
  const tags = [];
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
    patternScore: clamp(patternScore, -1, 1)
  };
}

function inferBias(total) {
  if (total >= 0.22) {
    return "bullish";
  }
  if (total <= -0.22) {
    return "bearish";
  }
  return "neutral";
}

function factorBreakdown(candles, indicators) {
  const closes = candles.map((candle) => candle.close);
  const latest = closes[closes.length - 1];
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
    1
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
      total: round(total, 2)
    }
  };
}

function tradeLevels(price, atrValue, bias) {
  const distance = Math.max(atrValue * 0.8, price * 0.006);
  if (bias === "bullish") {
    return {
      entryZone: [round(price - (distance * 0.35)), round(price + (distance * 0.12))],
      targetZone: [round(price + (distance * 1.2)), round(price + (distance * 2.1))],
      invalidation: round(price - (distance * 1.05))
    };
  }
  if (bias === "bearish") {
    return {
      entryZone: [round(price - (distance * 0.12)), round(price + (distance * 0.35))],
      targetZone: [round(price - (distance * 2.1)), round(price - (distance * 1.2))],
      invalidation: round(price + (distance * 1.05))
    };
  }
  return {
    entryZone: [round(price - (distance * 0.35)), round(price + (distance * 0.35))],
    targetZone: [round(price - distance), round(price + distance)],
    invalidation: round(price - (distance * 1.5))
  };
}

function shortThesis(signal, sector) {
  if (signal.bias === "bullish") {
    return `${sector} leadership is holding above trend with ${signal.patternTags[0].toLowerCase()} and ${signal.confidence}% confidence.`;
  }
  if (signal.bias === "bearish") {
    return `${sector} is under pressure as ${signal.patternTags[0].toLowerCase()} drags the tape with ${signal.confidence}% confidence.`;
  }
  return `${sector} is balanced intraday; the setup remains range-bound while signal conviction stays muted.`;
}

function buildSignal(meta, candles, benchmarkReturn, updatedAt) {
  const indicators = computeIndicators(candles, benchmarkReturn);
  const latest = candles[candles.length - 1];
  const first = candles[0];
  const changePct = ((latest.close - first.close) / Math.max(first.close, 1)) * 100;
  const { tags, breakdown } = factorBreakdown(candles, indicators);
  const bias = inferBias(breakdown.total);
  const confidence = clamp(Math.round(42 + Math.abs(breakdown.total) * 44 + Math.min(tags.length, 3) * 3), 35, 95);
  const signal = {
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
    tradeLevels: tradeLevels(latest.close, indicators.atr14, bias)
  };
  signal.shortThesis = shortThesis(signal, meta.sector);
  return { signal, indicators };
}

function buildSignalHistory(candles, bias, confidence) {
  return candles
    .filter((_, index) => index % 6 === 0 || index === candles.length - 1)
    .map((candle, index, collection) => {
      const drift = collection.length <= 1 ? 0 : index / (collection.length - 1);
      return {
        time: candle.time,
        price: candle.close,
        confidence: clamp(Math.round(confidence - 7 + (drift * 12)), 30, 96),
        bias
      };
    });
}

function relatedSymbols(meta) {
  return MARKET_UNIVERSE
    .filter((item) => item.symbol !== meta.symbol && item.sector === meta.sector)
    .slice(0, 3)
    .map((item) => item.symbol);
}

function marketIndexes(signals) {
  return MARKET_INDEX_SYMBOLS
    .map((symbol) => signals.find((signal) => signal.symbol === symbol))
    .filter(Boolean)
    .map((signal) => ({
      symbol: signal.symbol,
      name: signal.name,
      changePct: signal.changePct,
      bias: signal.bias
    }));
}

function sectorSnapshots(signals) {
  const grouped = new Map();
  for (const signal of signals) {
    if (!grouped.has(signal.sector)) {
      grouped.set(signal.sector, []);
    }
    grouped.get(signal.sector).push(signal.factorBreakdown.total);
  }

  const sectors = [...grouped.entries()].map(([sector, scores]) => ({
    sector,
    averageScore: round(average(scores), 2),
    leader: false,
    laggard: false
  }));

  const sorted = sectors.slice().sort((left, right) => right.averageScore - left.averageScore);
  const leader = sorted[0]?.sector;
  const laggard = sorted[sorted.length - 1]?.sector;
  return sectors.map((sector) => ({
    ...sector,
    leader: sector.sector === leader,
    laggard: sector.sector === laggard
  }));
}

function marketHeadline(bias) {
  if (bias === "bullish") {
    return "Bullish expansion is starting to control the tape.";
  }
  if (bias === "bearish") {
    return "Defensive pressure is widening across the board.";
  }
  return "The market is rotating, not trending cleanly.";
}

function marketForecastText(bias, confidence, leader, laggard) {
  if (bias === "bullish") {
    return `AI forecast: expect continuation higher into the next trade window while ${leader} keeps leading. The main failure condition is a sudden reversal in breadth or a breakdown from the strongest index ETFs. Confidence sits at ${confidence}%.`;
  }
  if (bias === "bearish") {
    return `AI forecast: downside pressure likely stays in control into the next trade window unless buyers repair breadth quickly. ${laggard} remains the soft spot and the tape should be treated as fade-prone. Confidence sits at ${confidence}%.`;
  }
  return `AI forecast: mixed continuation with rotation favored over index-wide follow-through. The best opportunities are likely to stay concentrated in isolated leaders while weaker sectors continue chopping lower. Confidence sits at ${confidence}%.`;
}

function marketNarrative(bias, sectors, topBullish, topBearish) {
  const leader = sectors.find((sector) => sector.leader)?.sector ?? "Technology";
  const laggard = sectors.find((sector) => sector.laggard)?.sector ?? "Utilities";
  if (bias === "bullish") {
    return `${leader} is carrying the tape while ${topBullish[0]?.symbol ?? "SPY"} and ${topBullish[1]?.symbol ?? "QQQ"} hold the strongest continuation stacks. ${laggard} remains the weak corner of the board, but overall breadth is supportive enough for bullish follow-through.`;
  }
  if (bias === "bearish") {
    return `${laggard} is dragging on the market backdrop and ${topBearish[0]?.symbol ?? "IWM"} is flashing the weakest pattern stack. Until breadth improves, short-covering rallies deserve more skepticism than trust.`;
  }
  return `${leader} is showing relative resilience, but the tape is mixed and rotation-driven. The market is producing tradable names, just not a clean index-wide trend.`;
}

function featuredLeaders(signals, bias) {
  const featured = signals.filter((signal) => CORE_SYMBOLS.has(signal.symbol) && signal.bias === bias);
  if (featured.length >= 6) {
    return featured.slice(0, 6);
  }
  const fallback = signals.filter((signal) => signal.bias === bias);
  return [...featured, ...fallback.filter((signal) => !CORE_SYMBOLS.has(signal.symbol))].slice(0, 6);
}

export function buildMarketDataset(asOf = new Date()) {
  const bucket = bucketTime(asOf);
  const updatedAt = bucket.toISOString();
  const regime = marketRegime(bucket);
  const benchmarkMeta = MARKET_UNIVERSE.find((meta) => meta.symbol === "SPY") ?? MARKET_UNIVERSE[0];
  const benchmarkCandles = generateCandles(benchmarkMeta, bucket, regime);
  const spyReturn = ((benchmarkCandles[benchmarkCandles.length - 1].close - benchmarkCandles[0].close) / Math.max(benchmarkCandles[0].close, 1));

  const details = {};
  for (const meta of MARKET_UNIVERSE) {
    const candles = meta.symbol === benchmarkMeta.symbol ? benchmarkCandles : generateCandles(meta, bucket, regime);
    const { signal, indicators } = buildSignal(meta, candles, spyReturn, updatedAt);
    details[meta.symbol] = {
      snapshot: signal,
      description: meta.description,
      candles,
      indicators,
      signalHistory: buildSignalHistory(candles, signal.bias, signal.confidence),
      narrative: `${signal.shortThesis} Entry sits between ${signal.tradeLevels.entryZone[0]} and ${signal.tradeLevels.entryZone[1]}, with ${signal.tradeLevels.invalidation} as invalidation.`,
      relatedSymbols: relatedSymbols(meta)
    };
  }

  const signals = Object.values(details)
    .map((detail) => detail.snapshot)
    .sort((left, right) => right.confidence - left.confidence);
  const indexes = marketIndexes(signals);
  const sectors = sectorSnapshots(signals);
  const topBullish = featuredLeaders(signals, "bullish");
  const topBearish = featuredLeaders(signals, "bearish");
  const breadth = {
    advancers: signals.filter((signal) => signal.changePct > 0).length,
    decliners: signals.filter((signal) => signal.changePct < 0).length,
    neutral: signals.filter((signal) => Math.abs(signal.changePct) < 0.1).length,
    bullishSignals: signals.filter((signal) => signal.bias === "bullish").length,
    bearishSignals: signals.filter((signal) => signal.bias === "bearish").length
  };
  breadth.breadthScore = round(
    average(indexes.map((index) => index.changePct)) +
      average(signals.map((signal) => signal.factorBreakdown.total * 10)),
    2
  );
  const overallScore = (breadth.breadthScore / 10) + average(indexes.map((index) => index.changePct / 2));
  const overallBias = inferBias(clamp(overallScore / 2, -1, 1));
  const overallConfidence = clamp(Math.round(48 + Math.abs(overallScore) * 18), 35, 92);
  const leader = sectors.find((sector) => sector.leader)?.sector ?? "Technology";
  const laggard = sectors.find((sector) => sector.laggard)?.sector ?? "Utilities";

  const overview = {
    timestamp: updatedAt,
    freshnessLabel: "Delayed 15 minutes",
    overallBias,
    overallConfidence,
    headline: marketHeadline(overallBias),
    forecast: marketForecastText(overallBias, overallConfidence, leader, laggard),
    indexes,
    breadth,
    sectors,
    topBullish,
    topBearish,
    narrative: marketNarrative(overallBias, sectors, topBullish, topBearish)
  };

  return {
    bucketKey: updatedAt,
    universeSize: MARKET_UNIVERSE.length,
    overview,
    signals,
    details,
    sectors: [...new Set(signals.map((signal) => signal.sector))].sort((left, right) => left.localeCompare(right))
  };
}
