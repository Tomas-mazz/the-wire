-- M3: portfolio tables (projects, assets, transactions, audit trail, prices).
-- Applied automatically by the Supabase GitHub integration on merge to main.
-- Money and quantities are `numeric` (exact). Timestamps are UTC (timestamptz).

-- ---------------------------------------------------------------------------
-- Projects ("albums"): user-created groups of transactions.
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  description text check (length(description) <= 500),
  default_broker text check (length(default_broker) <= 80),
  strategy text check (length(strategy) <= 200),
  horizon text check (length(horizon) <= 80),
  tags text[] not null default '{}',
  track_cash boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets transactions reference (project, owner) so a transaction can only
  -- point to a project of the same user.
  unique (id, user_id)
);

create index projects_user_id_idx on public.projects (user_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "Users can read their own projects"
  on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Assets: shared catalogue. Signed-in users can read and add assets, but not
-- change or delete them (that is reserved for server-side maintenance).
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (symbol = upper(symbol) and length(symbol) between 1 and 20),
  name text not null check (length(trim(name)) between 1 and 120),
  asset_class text not null check (asset_class in ('stock', 'etf', 'crypto', 'cash')),
  exchange text check (length(exchange) <= 40),
  quote_currency text not null default 'USD' check (quote_currency ~ '^[A-Z]{3}$'),
  provider_refs jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- One row per symbol, class and exchange (no exchange counts as one value).
create unique index assets_class_symbol_exchange_key
  on public.assets (asset_class, symbol, coalesce(exchange, ''));

alter table public.assets enable row level security;

create policy "Signed-in users can read assets"
  on public.assets for select to authenticated
  using (true);

create policy "Signed-in users can add assets"
  on public.assets for insert to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Transactions: the source of truth for every number in the app.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null,
  asset_id uuid not null references public.assets (id) on delete restrict,
  type text not null
    check (type in ('buy', 'sell', 'deposit', 'withdrawal', 'dividend', 'reward')),
  -- Same rules as src/domain/ledger.ts: quantity > 0, price ≥ 0, fee ≥ 0.
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  fee numeric check (fee >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  executed_at timestamptz not null,
  broker text check (length(broker) <= 80),
  note text check (length(note) <= 1000),
  source text not null default 'manual' check (source in ('manual', 'csv', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete cascade
);

-- Replay order for one asset in one project: executed_at, then created_at.
create index transactions_position_idx
  on public.transactions (user_id, project_id, asset_id, executed_at, created_at);
create index transactions_user_executed_idx
  on public.transactions (user_id, executed_at desc);
create index transactions_project_id_idx on public.transactions (project_id);
create index transactions_asset_id_idx on public.transactions (asset_id);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "Users can read their own transactions"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own transactions"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Audit trail: one row per create / update / delete of a transaction.
-- Written only by the trigger below; users can read their own history but
-- never change it. transaction_id has no foreign key so history outlives
-- the deleted transaction.
-- ---------------------------------------------------------------------------
create table public.transaction_events (
  id bigint generated always as identity primary key,
  transaction_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('create', 'update', 'delete')),
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create index transaction_events_transaction_idx
  on public.transaction_events (transaction_id, at);
create index transaction_events_user_idx on public.transaction_events (user_id, at desc);

alter table public.transaction_events enable row level security;

create policy "Users can read their own transaction history"
  on public.transaction_events for select to authenticated
  using ((select auth.uid()) = user_id);

create function public.log_transaction_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_user uuid := coalesce(new.user_id, old.user_id);
begin
  -- When an account is deleted its transactions cascade away; skip logging
  -- then, because the history is being deleted with the account.
  if not exists (select 1 from auth.users where id = row_user) then
    return null;
  end if;

  insert into public.transaction_events (transaction_id, user_id, action, before, after)
  values (
    coalesce(new.id, old.id),
    row_user,
    case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger transactions_audit
  after insert or update or delete on public.transactions
  for each row execute function public.log_transaction_event();

-- ---------------------------------------------------------------------------
-- Manual prices: a user's own price for an asset no provider covers.
-- ---------------------------------------------------------------------------
create table public.manual_prices (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  price numeric not null check (price >= 0),
  as_of timestamptz not null default now(),
  primary key (user_id, asset_id)
);

create index manual_prices_asset_id_idx on public.manual_prices (asset_id);

alter table public.manual_prices enable row level security;

create policy "Users can read their own manual prices"
  on public.manual_prices for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own manual prices"
  on public.manual_prices for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own manual prices"
  on public.manual_prices for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own manual prices"
  on public.manual_prices for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Latest prices: shared cache filled by the server (M5). Users only read it.
-- ---------------------------------------------------------------------------
create table public.latest_prices (
  asset_id uuid primary key references public.assets (id) on delete cascade,
  price numeric not null check (price >= 0),
  day_change_pct numeric,
  as_of timestamptz not null,
  source text not null check (length(source) between 1 and 40)
);

alter table public.latest_prices enable row level security;

create policy "Signed-in users can read latest prices"
  on public.latest_prices for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Data API grants: signed-in users only (RLS above narrows them per row).
-- Supabase grants everything on new tables by default, so start from zero
-- and give back only what each table needs.
-- ---------------------------------------------------------------------------
revoke all on public.projects, public.assets, public.transactions,
  public.transaction_events, public.manual_prices, public.latest_prices
  from anon, authenticated;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert on public.assets to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.transaction_events to authenticated;
grant select, insert, update, delete on public.manual_prices to authenticated;
grant select on public.latest_prices to authenticated;

revoke execute on function public.log_transaction_event() from public, anon, authenticated;
