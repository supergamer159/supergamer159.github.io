import { getNarrativeProvider } from "@/lib/ai/provider";
import { buildMarketDataset } from "@/lib/market/engine";
import type {
  MarketDataset,
  SavedScreenerFilter,
  SignalBias,
  SignalScore,
  Watchlist,
  WatchlistInput,
} from "@/lib/market/types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

declare global {
  // eslint-disable-next-line no-var
  var __marketDataset: MarketDataset | undefined;
  // eslint-disable-next-line no-var
  var __watchlists: Map<string, Watchlist[]> | undefined;
}

function getWatchlistMap() {
  if (!globalThis.__watchlists) {
    globalThis.__watchlists = new Map<string, Watchlist[]>();
  }
  return globalThis.__watchlists;
}

function listForUser(userId: string) {
  const map = getWatchlistMap();
  if (!map.has(userId)) {
    const createdAt = new Date().toISOString();
    const starterId = crypto.randomUUID();
    map.set(userId, [
      {
        id: starterId,
        userId,
        name: "Momentum Leaders",
        description: "High-confidence AI-backed longs and shorts.",
        createdAt,
        updatedAt: createdAt,
        items: [
          { id: crypto.randomUUID(), watchlistId: starterId, symbol: "NVDA", note: "Keep above VWAP", createdAt },
          { id: crypto.randomUUID(), watchlistId: starterId, symbol: "XLF", note: "Watch breadth confirmation", createdAt },
        ],
      },
    ]);
  }
  return map.get(userId)!;
}

function attachSignals(watchlists: Watchlist[], signals: SignalScore[]) {
  return watchlists.map((watchlist) => ({
    ...watchlist,
    items: watchlist.items.map((item) => ({
      ...item,
      latestSignal: signals.find((signal) => signal.symbol === item.symbol),
    })),
  }));
}

export const SCREENER_FILTER_PRESETS: SavedScreenerFilter[] = [
  {
    id: "high-conviction-bull",
    userId: "public",
    name: "High Conviction Bull",
    minConfidence: 75,
    bias: "bullish",
    createdAt: new Date().toISOString(),
  },
  {
    id: "high-conviction-bear",
    userId: "public",
    name: "High Conviction Bear",
    minConfidence: 75,
    bias: "bearish",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tech-leadership",
    userId: "public",
    name: "Tech Leadership",
    minConfidence: 68,
    sector: "Technology",
    bias: "all",
    createdAt: new Date().toISOString(),
  },
];

export async function getMarketDataset(forceRefresh = false) {
  const existing = globalThis.__marketDataset;
  const current = buildMarketDataset();
  if (!forceRefresh && existing && existing.bucketKey === current.bucketKey) {
    return existing;
  }

  const dataset = current;
  const narrator = getNarrativeProvider();
  dataset.overview.narrative = await narrator.marketNarrative({
    overview: dataset.overview,
    bullish: dataset.overview.topBullish,
    bearish: dataset.overview.topBearish,
  });

  await Promise.all(
    Object.values(dataset.details).map(async (detail) => {
      detail.narrative = await narrator.symbolNarrative(detail);
    }),
  );

  globalThis.__marketDataset = dataset;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from("market_snapshots").upsert({
      bucket_key: dataset.bucketKey,
      payload: dataset,
      generated_at: dataset.generatedAt,
    });
  }

  return dataset;
}

export async function refreshMarketDataset() {
  return getMarketDataset(true);
}

export async function getMarketOverview() {
  const dataset = await getMarketDataset();
  return dataset.overview;
}

export async function getSymbolDetail(symbol: string) {
  const dataset = await getMarketDataset();
  return dataset.details[symbol.toUpperCase()] ?? null;
}

export async function getScreener(params?: {
  search?: string;
  sector?: string;
  bias?: SignalBias | "all";
  minConfidence?: number;
  limit?: number;
}) {
  const dataset = await getMarketDataset();
  const search = params?.search?.trim().toUpperCase();
  const bias = params?.bias ?? "all";
  const minConfidence = params?.minConfidence ?? 0;

  const filtered = dataset.signals.filter((signal) => {
    if (search && !signal.symbol.includes(search) && !signal.name.toUpperCase().includes(search)) {
      return false;
    }
    if (params?.sector && signal.sector !== params.sector) {
      return false;
    }
    if (bias !== "all" && signal.bias !== bias) {
      return false;
    }
    return signal.confidence >= minConfidence;
  });

  return filtered.slice(0, params?.limit ?? 100);
}

export async function listWatchlists(userId: string) {
  const dataset = await getMarketDataset();
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("watchlists")
      .select("id,user_id,name,description,created_at,updated_at,watchlist_items(id,watchlist_id,symbol,note,created_at)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      return attachSignals(
        data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          items: (row.watchlist_items ?? []).map((item: any) => ({
            id: item.id,
            watchlistId: item.watchlist_id,
            symbol: item.symbol,
            note: item.note,
            createdAt: item.created_at,
          })),
        })),
        dataset.signals,
      );
    }
  }

  return attachSignals(listForUser(userId), dataset.signals);
}

export async function createWatchlist(userId: string, input: WatchlistInput) {
  const dataset = await getMarketDataset();
  const name = input.name.trim();
  if (!name) {
    throw new Error("Watchlist name is required.");
  }
  const normalizedSymbols = [...new Set((input.symbols ?? []).map((symbol) => symbol.toUpperCase()))]
    .filter((symbol) => dataset.details[symbol]);

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data: created, error } = await supabase
      .from("watchlists")
      .insert({
        user_id: userId,
        name,
        description: input.description ?? null,
      })
      .select("id,user_id,name,description,created_at,updated_at")
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? "Could not create watchlist.");
    }

    if (normalizedSymbols.length) {
      await supabase.from("watchlist_items").insert(
        normalizedSymbols.map((symbol) => ({
          watchlist_id: created.id,
          symbol,
        })),
      );
    }

    return (await listWatchlists(userId)).find((watchlist) => watchlist.id === created.id)!;
  }

  const watchlists = listForUser(userId);
  const watchlistId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const watchlist: Watchlist = {
    id: watchlistId,
    userId,
    name,
    description: input.description ?? null,
    createdAt,
    updatedAt: createdAt,
    items: normalizedSymbols.map((symbol) => ({
      id: crypto.randomUUID(),
      watchlistId,
      symbol,
      note: null,
      createdAt,
    })),
  };
  watchlists.unshift(watchlist);
  return attachSignals([watchlist], dataset.signals)[0];
}

export async function updateWatchlist(
  userId: string,
  watchlistId: string,
  input: Partial<WatchlistInput>,
) {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from("watchlists")
      .update({
        name: input.name?.trim(),
        description: input.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", watchlistId)
      .eq("user_id", userId);
    return (await listWatchlists(userId)).find((watchlist) => watchlist.id === watchlistId) ?? null;
  }

  const watchlists = listForUser(userId);
  const watchlist = watchlists.find((entry) => entry.id === watchlistId);
  if (!watchlist) {
    return null;
  }
  watchlist.name = input.name?.trim() || watchlist.name;
  watchlist.description = input.description ?? watchlist.description;
  watchlist.updatedAt = new Date().toISOString();
  return (await listWatchlists(userId)).find((entry) => entry.id === watchlistId) ?? null;
}

export async function deleteWatchlist(userId: string, watchlistId: string) {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from("watchlists").delete().eq("id", watchlistId).eq("user_id", userId);
    return true;
  }

  const map = getWatchlistMap();
  const watchlists = listForUser(userId);
  map.set(
    userId,
    watchlists.filter((watchlist) => watchlist.id !== watchlistId),
  );
  return true;
}
