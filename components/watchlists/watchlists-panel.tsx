"use client";

import { type FormEvent, startTransition, useState } from "react";

import type { Watchlist } from "@/lib/market/types";

export function WatchlistsPanel({
  initialWatchlists,
  canManage,
}: {
  initialWatchlists: Watchlist[];
  canManage: boolean;
}) {
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) {
      setStatus("Sign in with Supabase to create persistent watchlists.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          symbols: symbolInput
            .split(",")
            .map((symbol) => symbol.trim().toUpperCase())
            .filter(Boolean),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error ?? "Could not create watchlist.");
        return;
      }
      setWatchlists(payload.watchlists ?? []);
      setName("");
      setDescription("");
      setSymbolInput("");
      setStatus("Watchlist created.");
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Create Watchlist</p>
        <h2 className="mt-2 font-display text-3xl text-white">Save a symbol basket for repeat monitoring.</h2>
        <form onSubmit={createList} className="mt-6 grid gap-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
            placeholder="Watchlist name"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
            placeholder="What is this list for?"
          />
          <input
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
            placeholder="NVDA, QQQ, XLF"
          />
          <button type="submit" className="rounded-2xl bg-mint-400 px-5 py-3 font-semibold text-ink-950 hover:bg-mint-500">
            Save watchlist
          </button>
        </form>
        <p className="mt-4 min-h-6 text-sm text-white/60">{status}</p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Saved Lists</p>
        <div className="mt-5 grid gap-4">
          {watchlists.map((watchlist) => (
            <article key={watchlist.id} className="rounded-[1.5rem] border border-white/10 bg-ink-950/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl text-white">{watchlist.name}</h3>
                  <p className="mt-1 text-sm text-white/55">{watchlist.description ?? "No description added."}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                  {watchlist.items.length} symbols
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {watchlist.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                    <div>
                      <p className="font-display text-lg text-white">{item.symbol}</p>
                      <p className="text-xs text-white/45">{item.note ?? "No note"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm capitalize text-white/70">{item.latestSignal?.bias ?? "pending"}</p>
                      <p className="text-xs text-white/45">{item.latestSignal?.confidence ?? 0}% confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
