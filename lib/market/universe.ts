import type { UniverseSymbol } from "@/lib/market/types";

const CURATED_UNIVERSE: UniverseSymbol[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "Index ETFs", assetType: "etf", description: "Broad US large-cap equity benchmark and market risk proxy.", basePrice: 521, averageVolume: 88000000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Index ETFs", assetType: "etf", description: "Nasdaq-100 tracker with heavy large-cap technology exposure.", basePrice: 451, averageVolume: 61000000 },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", sector: "Index ETFs", assetType: "etf", description: "Small-cap risk appetite gauge for the US market.", basePrice: 206, averageVolume: 32000000 },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", sector: "Index ETFs", assetType: "etf", description: "Blue-chip index tracker used for industrial leadership checks.", basePrice: 396, averageVolume: 6200000 },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", sector: "Technology", assetType: "etf", description: "Technology leadership ETF used for sector rotation signals.", basePrice: 219, averageVolume: 8400000 },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", sector: "Financials", assetType: "etf", description: "Bank and financial-sector ETF used for breadth confirmation.", basePrice: 42, averageVolume: 39000000 },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", sector: "Energy", assetType: "etf", description: "Energy sector leadership ETF used for commodity-linked rotation.", basePrice: 92, averageVolume: 18000000 },
  { symbol: "XLI", name: "Industrial Select Sector SPDR Fund", sector: "Industrials", assetType: "etf", description: "Industrials ETF used to track cyclical participation.", basePrice: 126, averageVolume: 9700000 },
  { symbol: "XLV", name: "Health Care Select Sector SPDR Fund", sector: "Health Care", assetType: "etf", description: "Health care sector ETF for defensive rotation analysis.", basePrice: 146, averageVolume: 7600000 },
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
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", assetType: "stock", description: "Integrated energy major and sector heavyweight.", basePrice: 118, averageVolume: 16000000 },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials", assetType: "stock", description: "Heavy machinery bellwether for industrial cyclicals.", basePrice: 349, averageVolume: 2500000 },
  { symbol: "CRM", name: "Salesforce, Inc.", sector: "Technology", assetType: "stock", description: "Enterprise software platform with strong growth factor beta.", basePrice: 301, averageVolume: 5400000 },
  { symbol: "PANW", name: "Palo Alto Networks, Inc.", sector: "Technology", assetType: "stock", description: "Cybersecurity leader with strong institutional participation.", basePrice: 317, averageVolume: 4300000 },
  { symbol: "CRWD", name: "CrowdStrike Holdings, Inc.", sector: "Technology", assetType: "stock", description: "Cybersecurity momentum leader with high trend persistence.", basePrice: 356, averageVolume: 4600000 },
  { symbol: "NFLX", name: "Netflix, Inc.", sector: "Communication Services", assetType: "stock", description: "Streaming leader with strong momentum-following behavior.", basePrice: 635, averageVolume: 5300000 },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", assetType: "stock", description: "Defensive retail leader and consumer spending barometer.", basePrice: 64, averageVolume: 12000000 },
  { symbol: "SO", name: "Southern Company", sector: "Utilities", assetType: "stock", description: "Utility-sector anchor used for defensive participation checks.", basePrice: 72, averageVolume: 4500000 },
  { symbol: "AMT", name: "American Tower Corporation", sector: "Real Estate", assetType: "stock", description: "Tower REIT with rate-sensitive trading behavior.", basePrice: 193, averageVolume: 2300000 }
];

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
  "Semiconductors",
];

const PREFIXES = ["Atlas", "Beacon", "Cobalt", "Delta", "Echo", "Falcon", "Granite", "Harbor", "Ion", "Juniper", "Keystone", "Lattice", "Monarch", "Northstar", "Orion", "Pioneer", "Quarry", "Redwood", "Summit", "Trident", "Unity", "Vector", "Westbridge", "Zenith"];
const SUFFIXES = ["Systems", "Holdings", "Labs", "Capital", "Energy", "Networks", "Industries", "Therapeutics", "Logistics", "Platforms", "Motors", "Materials"];

function syntheticSymbol(index: number) {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = alpha[Math.floor(index / (26 * 26)) % 26];
  const b = alpha[Math.floor(index / 26) % 26];
  const c = alpha[index % 26];
  return `Q${a}${b}${c}`;
}

function buildSyntheticUniverse(count: number): UniverseSymbol[] {
  return Array.from({ length: count }, (_, index) => {
    const sector = SYNTHETIC_SECTORS[index % SYNTHETIC_SECTORS.length];
    const prefix = PREFIXES[index % PREFIXES.length];
    const suffix = SUFFIXES[Math.floor(index / PREFIXES.length) % SUFFIXES.length];
    const assetType = index % 17 === 0 ? "etf" : "stock";
    return {
      symbol: syntheticSymbol(index),
      name: `${prefix} ${suffix}`,
      sector,
      assetType,
      description: `Synthetic ${sector.toLowerCase()} ${assetType === "etf" ? "fund" : "equity"} used to stress-test the wide screener universe.`,
      basePrice: 18 + (index % 30) * 4 + ((index * 11) % 7) * 1.5,
      averageVolume: 900000 + (index % 24) * 230000 + (assetType === "etf" ? 1500000 : 0),
    };
  });
}

export const MARKET_UNIVERSE: UniverseSymbol[] = [
  ...CURATED_UNIVERSE,
  ...buildSyntheticUniverse(520 - CURATED_UNIVERSE.length),
];

export const MARKET_INDEX_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "XLK", "XLF", "XLE", "XLI", "XLV", "SMH"];
