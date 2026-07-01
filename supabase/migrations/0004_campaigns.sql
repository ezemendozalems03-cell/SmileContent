create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_client_idx on public.campaigns(client_id);

create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();
