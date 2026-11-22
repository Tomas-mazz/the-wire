-- Daily closing prices for the performance chart (decision 113).
-- Shared by every user, like latest_prices: signed-in users read them, and
-- only the server writes them with the secret key (which skips RLS), so one
-- provider call serves everyone and the free plans' limits are respected.

create table public.price_history (
  asset_id uuid not null references public.assets (id) on delete cascade,
  day date not null,                         -- UTC calendar day of the close
  close numeric not null check (close >= 0), -- USD, split-adjusted to today's shares
  source text not null check (length(source) between 1 and 40),
  primary key (asset_id, day)
);

-- When each asset's history was last asked for, and from which day it is
-- complete, so a page view only calls the provider when something is missing.
create table public.price_history_sync (
  asset_id uuid primary key references public.assets (id) on delete cascade,
  first_day date not null,
  synced_at timestamptz not null
);

alter table public.price_history enable row level security;
alter table public.price_history_sync enable row level security;

create policy "Signed-in users can read price history"
  on public.price_history for select to authenticated
  using (true);

create policy "Signed-in users can read price history sync"
  on public.price_history_sync for select to authenticated
  using (true);

-- Data API grants: read-only for signed-in users, nothing for visitors.
revoke all on public.price_history, public.price_history_sync from anon, authenticated;
grant select on public.price_history, public.price_history_sync to authenticated;
