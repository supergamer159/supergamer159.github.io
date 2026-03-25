import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";

const nav = [
  { href: "/app", label: "Market Pulse" },
  { href: "/app/screener", label: "Screener" },
  { href: "/app/watchlists", label: "Watchlists" },
];

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-4 shadow-panel backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/app" className="font-display text-xl uppercase tracking-[0.28em] text-white">
                Signal Forge
              </Link>
              <p className="mt-1 text-sm text-white/50">Delayed 15-minute intraday pattern intelligence.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-ink-950/60 p-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white">
                {user?.email ?? "Sign in"}
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
