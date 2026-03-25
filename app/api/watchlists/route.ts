import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  createWatchlist,
  deleteWatchlist,
  listWatchlists,
  updateWatchlist,
} from "@/lib/market/store";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }
  const watchlists = await listWatchlists(user.id);
  return NextResponse.json({ watchlists });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  const body = await request.json();
  try {
    await createWatchlist(user.id, body);
    const watchlists = await listWatchlists(user.id);
    return NextResponse.json({ watchlists });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create watchlist." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Watchlist id is required." }, { status: 400 });
  }

  const watchlist = await updateWatchlist(user.id, body.id, body);
  return NextResponse.json({ watchlist });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Watchlist id is required." }, { status: 400 });
  }

  await deleteWatchlist(user.id, id);
  const watchlists = await listWatchlists(user.id);
  return NextResponse.json({ watchlists });
}
