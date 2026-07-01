create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  rubro text,
  status client_status not null default 'activo',
  plan_contratado text,
  fecha_inicio date,
  primary_owner_id uuid references public.profiles(id) on delete set null,
  instagram_url text,
  tiktok_url text,
  brand_manual_url text,
  brand_colors jsonb not null default '[]'::jsonb,
  brand_typography text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- Which internal team members can access a given client (used by has_client_access()).
create table public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, profile_id)
);

create index client_members_profile_idx on public.client_members(profile_id);
