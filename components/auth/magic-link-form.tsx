"use client";

import { type FormEvent, useState, useTransition } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setStatus("Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable magic-link auth.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/watchlists`,
        },
      });

      setStatus(error ? error.message : "Check your email for the sign-in link.");
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-8 shadow-panel backdrop-blur">
      <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Magic Link</p>
      <h2 className="mt-4 font-display text-3xl text-white">Sign in without a password.</h2>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-white/60">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-white/10 bg-ink-950/80 px-4 py-3 text-white outline-none transition focus:border-mint-400/60"
            placeholder="you@desk.com"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-mint-400 px-5 py-3 font-semibold text-ink-950 transition hover:bg-mint-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending link..." : "Send sign-in link"}
        </button>
      </form>
      <p className="mt-4 min-h-6 text-sm text-white/60">{status}</p>
    </section>
  );
}
