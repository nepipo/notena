-- Feedback-Tabelle für Beta
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  nachricht   text not null check (char_length(nachricht) between 1 and 2000),
  seite       text,
  created_at  timestamptz default now() not null
);

-- Nur eingeloggte User dürfen schreiben, niemand lesen (außer Service-Role)
alter table feedback enable row level security;

create policy "user kann eigenes feedback schreiben"
  on feedback for insert
  to authenticated
  with check (user_id = auth.uid());
