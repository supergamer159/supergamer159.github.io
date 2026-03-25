import Link from "next/link";

import { WatchlistsPanel } from "@/components/watchlists/watchlists-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { listWatchlists } from "@/lib/market/store";

export default async function WatchlistsPage() {
  const user = await getCurrentUser();
  const watchlists = await listWatchlists(user?.id ?? "guest-demo");

  return (
    <main className="grid gap-4">
      {!user ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
          <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Read-only mode</p>
          <h1 className="mt-2 font-display text-4xl text-white">Sign in to persist watchlists in Supabase.</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-white/65">
            The UI below is live and uses demo watchlists right now, but persistent storage and per-user isolation
            activate once magic-link auth is configured.
          </p>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-mint-400 px-4 py-2 font-semibold text-ink-950 hover:bg-mint-500">
            Open sign-in
          </Link>
        </section>
      ) : null}

      <WatchlistsPanel initialWatchlists={watchlists} canManage={Boolean(user)} />
    </main>
  );
}
