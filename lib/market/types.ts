export type SignalBias = "bullish" | "bearish" | "neutral";
export type AssetType = "stock" | "etf";
export type Horizon = "intraday";

export interface UniverseSymbol {
  symbol: string;
  name: string;
  sector: string;
  assetType: AssetType;
  description: string;
  basePrice: number;
  averageVolume: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSnapshot {
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  atr14: number;
  vwap: number;
  volumeRatio: number;
  trendStrength: number;
  relativeStrength: number;
  volatilityCompression: number;
}

export interface SignalFactorBreakdown {
  trend: number;
  momentum: number;
  relativeStrength: number;
  volume: number;
  vwap: number;
  volatility: number;
  pattern: number;
  total: number;
}

export interface TradeLevels {
  entryZone: [number, number];
  targetZone: [number, number];
  invalidation: number;
}

export interface SignalScore {
  symbol: string;
  name: string;
  sector: string;
  assetType: AssetType;
  price: number;
  changePct: number;
  volume: number;
  averageVolume: number;
  updatedAt: string;
  freshnessLabel: string;
  bias: SignalBias;
  confidence: number;
  horizon: Horizon;
  patternTags: string[];
  factorBreakdown: SignalFactorBreakdown;
  tradeLevels: TradeLevels;
  shortThesis: string;
}

export interface MarketIndexSnapshot {
  symbol: string;
  name: string;
  changePct: number;
  bias: SignalBias;
}

export interface BreadthSnapshot {
  advancers: number;
  decliners: number;
  neutral: number;
  bullishSignals: number;
  bearishSignals: number;
  breadthScore: number;
}

export interface SectorSnapshot {
  sector: string;
  averageScore: number;
  leader: boolean;
  laggard: boolean;
}

export interface MarketSnapshot {
  timestamp: string;
  freshnessLabel: string;
  overallBias: SignalBias;
  overallConfidence: number;
  indexes: MarketIndexSnapshot[];
  breadth: BreadthSnapshot;
  sectors: SectorSnapshot[];
  topBullish: SignalScore[];
  topBearish: SignalScore[];
  narrative: string;
}

export interface SignalHistoryPoint {
  time: string;
  price: number;
  confidence: number;
  bias: SignalBias;
}

export interface SymbolDetail {
  snapshot: SignalScore;
  description: string;
  candles: Candle[];
  indicators: IndicatorSnapshot;
  signalHistory: SignalHistoryPoint[];
  narrative: string;
  relatedSymbols: string[];
}

export interface MarketDataset {
  bucketKey: string;
  generatedAt: string;
  overview: MarketSnapshot;
  signals: SignalScore[];
  details: Record<string, SymbolDetail>;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  note: string | null;
  createdAt: string;
  latestSignal?: SignalScore;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
}

export interface SavedScreenerFilter {
  id: string;
  userId: string;
  name: string;
  minConfidence: number;
  sector?: string;
  bias?: SignalBias | "all";
  createdAt: string;
}

export interface WatchlistInput {
  name: string;
  description?: string;
  symbols?: string[];
}
