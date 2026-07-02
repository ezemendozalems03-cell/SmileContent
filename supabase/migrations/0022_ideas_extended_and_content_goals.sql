-- =============================================================================
-- Stage 1 of "Ideas IA / Planificacion Inteligente": extends the existing
-- ideas stub (0011) to the full idea-bank field set, and adds content_goals
-- for monthly target tracking. Deliberately reuses pillars/subpillars/
-- formats/sub_formats/content_kind/content_priority as-is rather than
-- forking new tables/enums for concepts that already exist on content_items.
-- =============================================================================

-- A small, DISTINCT lifecycle for ideas (not content_status): ideas move
-- through a much shorter pre-production lifecycle before becoming a real
-- content_item. Conflating this with content_status would force ideas to
-- carry pipeline stages (grabacion, edicion, revision_interna...) that make
-- no sense pre-promotion, and would wrongly couple the two pipelines.
create type idea_status as enum ('idea', 'en_desarrollo', 'aprobado', 'calendarizado', 'publicado');

alter table public.ideas
  add column subpilar_id uuid references public.subpillars(id) on delete set null,
  add column formato_id uuid references public.formats(id) on delete set null,
  add column sub_formato_id uuid references public.sub_formats(id) on delete set null,
  add column tipo_contenido content_kind not null default 'post',
  add column status idea_status not null default 'idea',
  add column priority content_priority not null default 'media',
  add column hook text,
  add column guion text,
  add column copy text,
  add column cta text,
  add column observaciones_internas text,
  add column feedback_cliente text,
  add column fecha_sugerida date,
  add column updated_at timestamptz not null default now();

-- Backfill: existing promoted ideas get a sensible status instead of the
-- new default 'idea', inferred from their linked content_item's schedule
-- state (existing rows have no status column today, so this is a one-time
-- best-effort classification, not a data-loss risk).
update public.ideas i
set status = case
  when ci.fecha_publicacion is not null then 'calendarizado'::idea_status
  else 'aprobado'::idea_status
end
from public.content_items ci
where i.promoted_content_item_id = ci.id;

create index ideas_status_idx on public.ideas(status);
create index ideas_subpilar_idx on public.ideas(subpilar_id);
create index ideas_formato_idx on public.ideas(formato_id);

create trigger ideas_set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

-- Full-text search across the fields users will actually search by.
alter table public.ideas add column search_vector tsvector generated always as (
  setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(hook, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(copy, '')), 'C')
) stored;
create index ideas_search_idx on public.ideas using gin(search_vector);

-- ---------------------------------------------------------------------------
-- content_goals: monthly target counts per client. formato_id on delete set
-- null (per user decision: a deleted format's goal falls back to the
-- generic type-level goal instead of disappearing).
-- ---------------------------------------------------------------------------
create table public.content_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  tipo_contenido content_kind not null,
  formato_id uuid references public.formats(id) on delete set null,
  target_count int not null check (target_count >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index content_goals_unique_scope on public.content_goals (
  client_id, year, month, tipo_contenido,
  coalesce(formato_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index content_goals_client_period_idx on public.content_goals(client_id, year, month);

create trigger content_goals_set_updated_at before update on public.content_goals
  for each row execute function public.set_updated_at();

alter table public.content_goals enable row level security;

create policy content_goals_select on public.content_goals for select
  using (public.is_internal_team_member(client_id));
create policy content_goals_write on public.content_goals for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

-- ---------------------------------------------------------------------------
-- monthly_goals_progress: plain SQL (not security definer) so RLS still
-- scopes results to what the calling user can see, mirroring dashboard_stats.
-- ---------------------------------------------------------------------------
create or replace function public.monthly_goals_progress(p_client_id uuid, p_year int, p_month int)
returns table (
  tipo_contenido content_kind,
  formato_id uuid,
  formato_nombre text,
  target_count int,
  scheduled_count bigint,
  published_count bigint,
  remaining_count int,
  pct_complete int
)
language sql stable as $$
  with goals as (
    select g.tipo_contenido, g.formato_id, f.name as formato_nombre, g.target_count
    from public.content_goals g
    left join public.formats f on f.id = g.formato_id
    where g.client_id = p_client_id and g.year = p_year and g.month = p_month
  ),
  scoped_items as (
    select ci.tipo_contenido, ci.formato_id, ci.status
    from public.content_items ci
    where ci.client_id = p_client_id
      and extract(year from ci.fecha_publicacion) = p_year
      and extract(month from ci.fecha_publicacion) = p_month
  )
  select
    g.tipo_contenido, g.formato_id, g.formato_nombre, g.target_count,
    count(si.*) filter (
      where si.tipo_contenido = g.tipo_contenido
        and (g.formato_id is null or si.formato_id = g.formato_id)
        and si.status not in ('archivado')
    ) as scheduled_count,
    count(si.*) filter (
      where si.tipo_contenido = g.tipo_contenido
        and (g.formato_id is null or si.formato_id = g.formato_id)
        and si.status in ('publicado', 'medido')
    ) as published_count,
    greatest(0, g.target_count - count(si.*) filter (
      where si.tipo_contenido = g.tipo_contenido
        and (g.formato_id is null or si.formato_id = g.formato_id)
        and si.status not in ('archivado')
    ))::int as remaining_count,
    case when g.target_count = 0 then 0
      else least(100, round(100.0 * count(si.*) filter (
        where si.tipo_contenido = g.tipo_contenido
          and (g.formato_id is null or si.formato_id = g.formato_id)
          and si.status in ('publicado', 'medido')
      ) / g.target_count))::int
    end as pct_complete
  from goals g
  left join scoped_items si on true
  group by g.tipo_contenido, g.formato_id, g.formato_nombre, g.target_count
  order by g.tipo_contenido, g.formato_nombre nulls first;
$$;

grant execute on function public.monthly_goals_progress(uuid, int, int) to authenticated;
