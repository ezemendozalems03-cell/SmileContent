-- =============================================================================
-- Etapa IA (2): Motor Estrategico de Contenidos (AI Strategy).
--
-- Decisiones de diseno:
--   * Se REUTILIZA lo existente en lugar de duplicar: el banco de ideas (0011/
--     0022) recibe columnas nuevas (dificultad, tiempo estimado, objetivo,
--     origen, campania); campaigns (0004) ya existe y content_items.campaign_id
--     ya enlaza publicaciones a campanias. campaign_contents solo agrega el
--     enlace campania<->idea (pre-produccion).
--   * Texto + check constraints en vez de enums nuevos: estas taxonomias van
--     a iterar rapido y ALTER TYPE es mas costoso que ampliar un check.
--   * monthly_plans es unique(client_id, mes): "el plan del mes" se regenera
--     en el lugar; la historia completa queda en ai_generations/strategy_reports.
--   * RLS: igual que Brand Memory, todo interno de agencia
--     (is_internal_team_member) — el portal de clientes no ve la estrategia.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Configuracion de frecuencia (1:1 con clients)
-- ---------------------------------------------------------------------------
create table public.strategy_settings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,

  posts_semanales int not null default 3 check (posts_semanales between 0 and 50),
  reels_semanales int not null default 1 check (reels_semanales between 0 and 50),
  historias_semanales int not null default 5 check (historias_semanales between 0 and 100),
  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger strategy_settings_set_updated_at before update on public.strategy_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reglas estrategicas ("Nunca dos promociones seguidas", "Un reel por semana")
-- Texto libre: las interpreta la IA en cada analisis/planificacion.
-- ---------------------------------------------------------------------------
create table public.strategy_rules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  regla text not null,
  categoria text not null default 'otro'
    check (categoria in ('secuencia', 'frecuencia', 'contenido', 'otro')),
  activo boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index strategy_rules_client_idx on public.strategy_rules(client_id);

create trigger strategy_rules_set_updated_at before update on public.strategy_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Objetivos del cliente, priorizados (complementan brand_memory.objetivos_
-- marketing: aca cada objetivo es una fila activable y ordenable que la IA
-- usa para priorizar contenido).
-- ---------------------------------------------------------------------------
create table public.client_objectives (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  objetivo text not null,
  prioridad int not null default 1 check (prioridad between 1 and 5),
  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_objectives_client_idx on public.client_objectives(client_id);

create trigger client_objectives_set_updated_at before update on public.client_objectives
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Informes del asistente estrategico ("Analizar marca")
-- ---------------------------------------------------------------------------
create table public.strategy_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  resumen text,
  resultado jsonb not null,
  modelo text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now()
);

create index strategy_reports_client_idx on public.strategy_reports(client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Recomendaciones accionables (alertas del panel). Las genera el analisis IA
-- y tambien el chequeo deterministico de balance/frecuencia.
-- ---------------------------------------------------------------------------
create table public.content_recommendations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  report_id uuid references public.strategy_reports(id) on delete cascade,

  tipo text not null default 'otro'
    check (tipo in ('balance', 'repeticion', 'frecuencia', 'oportunidad', 'otro')),
  titulo text not null,
  detalle text,
  severidad text not null default 'info' check (severidad in ('info', 'media', 'alta')),
  estado text not null default 'nueva' check (estado in ('nueva', 'aplicada', 'descartada')),
  origen text not null default 'ia' check (origen in ('ia', 'sistema')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_recommendations_client_idx
  on public.content_recommendations(client_id, estado, created_at desc);

create trigger content_recommendations_set_updated_at before update on public.content_recommendations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Plan mensual generado por la IA
-- ---------------------------------------------------------------------------
create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  mes date not null, -- siempre dia 1 del mes
  resumen text,
  cantidad_contenidos int not null default 0,
  resultado jsonb not null,
  modelo text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, mes)
);

create index monthly_plans_client_idx on public.monthly_plans(client_id, mes desc);

create trigger monthly_plans_set_updated_at before update on public.monthly_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Plantillas de calendario (estructura semanal ideal). Stub con RLS para
-- etapas siguientes: "Completar automaticamente" hoy usa strategy_settings,
-- pero la plantilla por slots ya tiene donde vivir.
-- slots: [{ dia_semana: 0-6, tipo_contenido, pilar_id?, nota? }]
-- ---------------------------------------------------------------------------
create table public.calendar_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  nombre text not null,
  slots jsonb not null default '[]',
  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_templates_client_idx on public.calendar_templates(client_id);

create trigger calendar_templates_set_updated_at before update on public.calendar_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contenidos de campania: enlaza campanias con IDEAS (pre-produccion).
-- Las publicaciones ya se enlazan por content_items.campaign_id (0006).
-- ---------------------------------------------------------------------------
create table public.campaign_contents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, idea_id)
);

create index campaign_contents_campaign_idx on public.campaign_contents(campaign_id);

-- ---------------------------------------------------------------------------
-- Banco de ideas: campos que pide el motor estrategico
-- ---------------------------------------------------------------------------
alter table public.ideas
  add column objetivo text,
  add column dificultad text check (dificultad in ('baja', 'media', 'alta')),
  add column tiempo_estimado text,
  add column origen text not null default 'manual' check (origen in ('manual', 'ia')),
  add column campaign_id uuid references public.campaigns(id) on delete set null;

create index ideas_campaign_idx on public.ideas(campaign_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.strategy_settings enable row level security;
create policy strategy_settings_select on public.strategy_settings for select
  using (public.is_internal_team_member(client_id));
create policy strategy_settings_write on public.strategy_settings for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.strategy_rules enable row level security;
create policy strategy_rules_select on public.strategy_rules for select
  using (public.is_internal_team_member(client_id));
create policy strategy_rules_write on public.strategy_rules for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.client_objectives enable row level security;
create policy client_objectives_select on public.client_objectives for select
  using (public.is_internal_team_member(client_id));
create policy client_objectives_write on public.client_objectives for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.strategy_reports enable row level security;
create policy strategy_reports_select on public.strategy_reports for select
  using (public.is_internal_team_member(client_id));
create policy strategy_reports_write on public.strategy_reports for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.content_recommendations enable row level security;
create policy content_recommendations_select on public.content_recommendations for select
  using (public.is_internal_team_member(client_id));
create policy content_recommendations_write on public.content_recommendations for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.monthly_plans enable row level security;
create policy monthly_plans_select on public.monthly_plans for select
  using (public.is_internal_team_member(client_id));
create policy monthly_plans_write on public.monthly_plans for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.calendar_templates enable row level security;
create policy calendar_templates_select on public.calendar_templates for select
  using (public.is_internal_team_member(client_id));
create policy calendar_templates_write on public.calendar_templates for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.campaign_contents enable row level security;
create policy campaign_contents_select on public.campaign_contents for select
  using (exists (
    select 1 from public.campaigns c
    where c.id = campaign_contents.campaign_id and public.is_internal_team_member(c.client_id)
  ));
create policy campaign_contents_write on public.campaign_contents for all
  using (exists (
    select 1 from public.campaigns c
    where c.id = campaign_contents.campaign_id and public.is_internal_team_member(c.client_id)
  ))
  with check (exists (
    select 1 from public.campaigns c
    where c.id = campaign_contents.campaign_id and public.is_internal_team_member(c.client_id)
  ));
