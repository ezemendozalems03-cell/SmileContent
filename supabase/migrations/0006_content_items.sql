-- The core "publications" table: replaces the Notion base entirely.
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,

  titulo text not null,
  descripcion text,

  formato_id uuid references public.formats(id) on delete set null,
  sub_formato_id uuid references public.sub_formats(id) on delete set null,
  pilar_id uuid references public.pillars(id) on delete set null,
  subpilar_id uuid references public.subpillars(id) on delete set null,
  tipo_contenido content_kind not null default 'post',
  objetivo text,

  status content_status not null default 'idea',
  priority content_priority not null default 'media',
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,

  fecha_publicacion date,
  hora_sugerida time,

  hook text,
  guion text,
  copy text,
  cta text,
  hashtags text[] not null default '{}',

  link_drive text,
  link_canva text,
  link_capcut text,
  link_publicacion_final text,

  vistas bigint not null default 0,
  likes bigint not null default 0,
  comentarios_count bigint not null default 0,
  compartidos bigint not null default 0,
  guardados bigint not null default 0,
  consultas_generadas bigint not null default 0,

  observaciones_internas text,
  feedback_cliente text,

  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(hook, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(copy, '')), 'C')
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_client_idx on public.content_items(client_id);
create index content_items_status_idx on public.content_items(status);
create index content_items_fecha_idx on public.content_items(fecha_publicacion);
create index content_items_assignee_idx on public.content_items(assignee_id);
create index content_items_pilar_idx on public.content_items(pilar_id);
create index content_items_formato_idx on public.content_items(formato_id);
create index content_items_campaign_idx on public.content_items(campaign_id);
create index content_items_search_idx on public.content_items using gin(search_vector);

create trigger content_items_set_updated_at before update on public.content_items
  for each row execute function public.set_updated_at();

-- Notion field mapping (for reference during migration off Notion):
--   Nombre/idea -> titulo            Estado -> status
--   Formato -> formato_id            Sub formato -> sub_formato_id
--   Tipo de contenido -> tipo_contenido   Pilar -> pilar_id
--   Fecha de publicacion -> fecha_publicacion
--   Enlace -> link_publicacion_final Cantidad de vistas -> vistas
--   Autor -> created_by (Responsable -> assignee_id)
--   Pie de publicacion -> copy
