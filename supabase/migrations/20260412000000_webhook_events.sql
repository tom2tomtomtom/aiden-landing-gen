create table if not exists webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table webhook_events enable row level security;
