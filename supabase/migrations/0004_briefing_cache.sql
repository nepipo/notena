create table if not exists public.briefing_cache (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  datum      date not null,
  text       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, datum)
);

alter table public.briefing_cache enable row level security;

create policy "Eigenes Briefing lesen"
  on public.briefing_cache for select
  using (auth.uid() = user_id);

create policy "Eigenes Briefing schreiben"
  on public.briefing_cache for insert
  with check (auth.uid() = user_id);
