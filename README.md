# Signal Forge

Signal Forge is a Next.js + TypeScript intraday market screener built around a hybrid signal model:

- deterministic pattern scoring creates the trade bias
- server-side narrative generation explains the setup
- Supabase handles auth and persistent watchlists when configured

## Product shape

- Public landing page and app shell
- Market Pulse overview with breadth and sector leadership
- Wide screener for US stocks + ETFs
- Symbol detail pages with candle chart, indicators, targets, and invalidation
- Magic-link login page
- Watchlists backed by Supabase or demo memory mode
- Internal refresh endpoint for 15-minute snapshot regeneration

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lightweight Charts
- Supabase Auth + Postgres
- Vitest for engine/store tests

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add your values.

3. Run the dev server:

```bash
npm run dev
```

4. Run tests:

```bash
npm run test
```

## Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REFRESH_SECRET`

If Supabase is not configured, the app still runs in market-data demo mode with in-memory watchlists.

## API

- `GET /api/market/overview`
- `GET /api/screener`
- `GET /api/symbol/[ticker]`
- `GET/POST/PATCH/DELETE /api/watchlists`
- `POST /api/internal/refresh`

## Notes

- Market data is currently generated through a deterministic seeded engine so the UI and APIs are runnable without a live provider.
- The architecture already isolates the narrative layer and persistence layer so a live delayed-data provider can replace the seeded generator cleanly.
- This project presents probabilistic trade research, not guaranteed market outcomes or brokerage automation.
