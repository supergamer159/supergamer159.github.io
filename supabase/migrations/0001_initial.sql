create extension if not exists "pgcrypto";

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  bucket_key timestamptz not null unique,
  generated_at timestamptz not null default now(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  symbol text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_screener_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  min_confidence integer not null default 60,
  sector text,
  bias text not null default 'all',
  created_at timestamptz not null default now()
);

alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.saved_screener_filters enable row level security;

create policy "users manage their watchlists"
on public.watchlists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage their watchlist items"
on public.watchlist_items
for all
using (
  exists (
    select 1
    from public.watchlists
    where watchlists.id = watchlist_items.watchlist_id
      and watchlists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.watchlists
    where watchlists.id = watchlist_items.watchlist_id
      and watchlists.user_id = auth.uid()
  )
);

create policy "users manage their screener filters"
on public.saved_screener_filters
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
