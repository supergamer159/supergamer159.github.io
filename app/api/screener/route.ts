import { NextRequest, NextResponse } from "next/server";

import { getScreener } from "@/lib/market/store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const signals = await getScreener({
    search: searchParams.get("q") ?? undefined,
    sector: searchParams.get("sector") ?? undefined,
    bias: (searchParams.get("bias") as "bullish" | "bearish" | "neutral" | "all" | null) ?? "all",
    minConfidence: searchParams.get("minConfidence") ? Number(searchParams.get("minConfidence")) : 0,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 100,
  });
  return NextResponse.json({
    count: signals.length,
    signals,
  });
}
