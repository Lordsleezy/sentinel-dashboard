create table if not exists public.push_devices (
  token text primary key,
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists push_devices_created_at_idx
  on public.push_devices (created_at desc);
