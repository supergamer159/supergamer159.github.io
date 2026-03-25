import { NextResponse } from "next/server";

import { refreshMarketDataset } from "@/lib/market/store";

export async function POST(request: Request) {
  const secret = request.headers.get("x-refresh-secret");
  if (!process.env.REFRESH_SECRET || secret !== process.env.REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized refresh request." }, { status: 401 });
  }

  const dataset = await refreshMarketDataset();
  return NextResponse.json({
    refreshedAt: dataset.generatedAt,
    bucketKey: dataset.bucketKey,
    symbolCount: dataset.signals.length,
  });
}
