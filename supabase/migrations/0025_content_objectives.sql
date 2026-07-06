-- Tipos de contenido (objetivo principal): Educación, Viral, Venta, etc.
-- Lookup table like formats/pillars: client_id null = global default,
-- non-null = client-specific addition. The chosen value is stored by NAME in
-- content_items.objetivo (text) so existing imported data keeps working.

create table public.content_objectives (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index content_objectives_unique_name_per_scope
  on public.content_objectives (coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

alter table public.content_objectives enable row level security;

create policy content_objectives_select on public.content_objectives for select
  using (client_id is null or public.is_internal_team_member(client_id));

create policy content_objectives_write on public.content_objectives for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)));

-- Global defaults (framework estándar de objetivos de contenido).
insert into public.content_objectives (client_id, name, sort_order) values
  (null, 'Educación', 1),
  (null, 'Viral', 2),
  (null, 'Venta', 3),
  (null, 'Autoridad', 4),
  (null, 'Comunidad', 5);
