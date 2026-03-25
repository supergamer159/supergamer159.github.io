import Link from "next/link";

import { MagicLinkForm } from "@/components/auth/magic-link-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-panel backdrop-blur">
          <p className="font-display text-sm uppercase tracking-[0.32em] text-mint-400">Access Signal Forge</p>
          <h1 className="mt-4 font-display text-4xl text-white">Magic-link access for your trading workspace.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/65">
            Sign in to save watchlists, persist screener presets, and keep your workflow synchronized across devices.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/65">
            <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4">
              No password flow in v1. Email delivers the sign-in link.
            </div>
            <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4">
              If Supabase env vars are not set yet, the app still opens in read-only market mode.
            </div>
          </div>
          <Link href="/app" className="mt-8 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white">
            Continue to dashboard
          </Link>
        </section>

        <MagicLinkForm />
      </div>
    </main>
  );
}
