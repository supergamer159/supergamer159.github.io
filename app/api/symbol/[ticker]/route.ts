import { NextResponse } from "next/server";

import { getSymbolDetail } from "@/lib/market/store";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      ticker: string;
    }>;
  },
) {
  const { ticker } = await context.params;
  const detail = await getSymbolDetail(ticker);
  if (!detail) {
    return NextResponse.json({ error: "Symbol not found." }, { status: 404 });
  }
  return NextResponse.json(detail);
}
