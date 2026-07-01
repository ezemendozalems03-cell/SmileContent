-- Stories are an explicitly separate module from content_items (not merged).
create table public.story_types (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create unique index story_types_unique_per_scope
  on public.story_types (coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  hora time,
  story_type_id uuid references public.story_types(id) on delete set null,
  objetivo text,
  status story_status not null default 'idea',
  assignee_id uuid references public.profiles(id) on delete set null,
  texto text,
  sticker text,
  link text,
  cta text,
  observacion text,
  respuesta_esperada text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stories_client_idx on public.stories(client_id);
create index stories_fecha_idx on public.stories(fecha);
create index stories_assignee_idx on public.stories(assignee_id);

create trigger stories_set_updated_at before update on public.stories
  for each row execute function public.set_updated_at();

-- Story "Archivo" attachments reuse the shared `files` table (story_id parent)
-- defined in 0009_files.sql, instead of a second upload pipeline.
