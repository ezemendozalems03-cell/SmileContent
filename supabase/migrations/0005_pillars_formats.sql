-- Lookup tables (not enums) so pillars/formats are customizable per client.
-- client_id null = global default (seeded in 0014); non-null = client-specific
-- addition. Resolution rule used everywhere: fetch rows where
-- (client_id is null or client_id = :clientId), merge, sort by sort_order.

create table public.pillars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index pillars_unique_name_per_scope
  on public.pillars (coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table public.subpillars (
  id uuid primary key default gen_random_uuid(),
  pillar_id uuid not null references public.pillars(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index subpillars_pillar_idx on public.subpillars(pillar_id);

create table public.formats (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index formats_unique_name_per_scope
  on public.formats (coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table public.sub_formats (
  id uuid primary key default gen_random_uuid(),
  format_id uuid not null references public.formats(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index sub_formats_format_idx on public.sub_formats(format_id);
