-- M7 import: the broker's own id of an imported row, prefixed with the broker
-- ("nordnet:2764365555", "binance:N0179…"), so importing the same file again,
-- or a newer export that repeats old rows, never duplicates them (decision 103).
alter table public.transactions
  add column external_id text check (length(external_id) between 1 and 300);

-- One import id per user. Manual rows have no id (NULL) and never collide.
-- Not a partial index, so `insert … on conflict (user_id, external_id)` can use it.
create unique index transactions_user_external_id_key
  on public.transactions (user_id, external_id);
