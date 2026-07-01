-- Stage 2 skeleton: shoot-day planning ("Content Day") and brand library.
create table public.content_days (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create index content_days_client_idx on public.content_days(client_id);

create table public.content_day_shots (
  id uuid primary key default gen_random_uuid(),
  content_day_id uuid not null references public.content_days(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  shot_description text,
  sort_order int not null default 0
);

create index content_day_shots_day_idx on public.content_day_shots(content_day_id);

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  storage_path text not null,
  asset_type text,
  created_at timestamptz not null default now()
);

create index brand_assets_client_idx on public.brand_assets(client_id);
