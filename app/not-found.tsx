import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-panel backdrop-blur">
        <p className="text-sm uppercase tracking-[0.32em] text-gold-300">Signal not found</p>
        <h1 className="mt-3 font-display text-4xl text-white">That symbol page does not exist in the current snapshot.</h1>
        <p className="mt-4 text-base leading-7 text-white/65">
          Try the screener instead and jump into a symbol that is currently covered by the delayed market universe.
        </p>
        <Link href="/app/screener" className="mt-6 inline-flex rounded-full bg-mint-400 px-5 py-3 font-semibold text-ink-950 hover:bg-mint-500">
          Open screener
        </Link>
      </div>
    </main>
  );
}
