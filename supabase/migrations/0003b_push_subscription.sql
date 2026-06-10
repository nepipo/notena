create table if not exists public.push_subscription (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscription enable row level security;

create policy "Eigene Subscriptions lesen"
  on public.push_subscription for select
  using (auth.uid() = user_id);

create policy "Eigene Subscriptions anlegen"
  on public.push_subscription for insert
  with check (auth.uid() = user_id);

create policy "Eigene Subscriptions löschen"
  on public.push_subscription for delete
  using (auth.uid() = user_id);
