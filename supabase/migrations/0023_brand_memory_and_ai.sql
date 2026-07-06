-- =============================================================================
-- Etapa IA (1): Brand Memory + generaciones IA.
--
-- La memoria de marca es la base de conocimiento permanente que alimenta al
-- asistente IA. Decisiones de diseno:
--   * brand_memory / brand_voice / brand_visual_identity son 1:1 con clients
--     (unique client_id) para que el "upsert por seccion" sea trivial y no
--     haya filas duplicadas que desincronicen el contexto de la IA.
--   * Productos y servicios comparten shape identico; una sola tabla
--     brand_products con columna `kind` evita duplicar tabla + acciones + UI
--     (la UI los muestra como pestanas separadas).
--   * Pilares/subpilares NO se duplican aqui: ya existen como taxonomia por
--     cliente (0005) y la IA los lee de ahi. Igual el logo: vive en
--     brand_assets (0020); aqui solo se guarda la descripcion de uso.
--   * RLS: todo es conocimiento interno de agencia -> is_internal_team_member
--     en lectura Y escritura (los usuarios rol `client` del portal no deben
--     ver aprendizajes, ejemplos ni la voz interna de la marca).
-- =============================================================================

-- Tipos de contenido que la IA puede generar. Mas amplio que content_kind
-- (suma carrusel, email y campana); al guardar en content_items se mapea al
-- content_kind mas cercano y el formato queda en el resultado JSON.
create type ai_content_type as enum (
  'carrusel',
  'reel',
  'historia',
  'post',
  'tiktok',
  'email',
  'campana'
);

create type ai_generation_status as enum ('ok', 'error');

-- ---------------------------------------------------------------------------
-- brand_memory: informacion general + publico objetivo + redes + objetivos.
-- ---------------------------------------------------------------------------
create table public.brand_memory (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,

  -- Informacion general
  nombre_comercial text,
  rubro text,
  descripcion text,
  historia text,
  mision text,
  vision text,
  valores text[] not null default '{}',

  -- Publico objetivo
  publico_edad text,
  publico_pais text,
  publico_ciudad text,
  publico_nivel_socioeconomico text,
  publico_problemas text[] not null default '{}',
  publico_deseos text[] not null default '{}',
  publico_objeciones text[] not null default '{}',
  publico_intereses text[] not null default '{}',
  publico_lenguaje text,

  -- Redes sociales
  red_instagram text,
  red_facebook text,
  red_tiktok text,
  red_sitio_web text,
  red_whatsapp text,

  -- Competidores y objetivos de marketing (listas editables)
  competidores text[] not null default '{}',
  objetivos_marketing text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_memory_set_updated_at before update on public.brand_memory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_voice: identidad de comunicacion.
-- ---------------------------------------------------------------------------
create table public.brand_voice (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,

  tono text,
  personalidad text,
  nivel_formalidad text,
  emojis_permitidos text[] not null default '{}',
  emojis_prohibidos text[] not null default '{}',
  palabras_permitidas text[] not null default '{}',
  palabras_prohibidas text[] not null default '{}',
  frases_tipicas text[] not null default '{}',
  ctas_habituales text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_voice_set_updated_at before update on public.brand_voice
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_visual_identity: estilo visual (texto descriptivo que la IA usa para
-- ideas visuales y notas al disenador; los archivos viven en brand_assets).
-- ---------------------------------------------------------------------------
create table public.brand_visual_identity (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,

  logo_descripcion text,
  colores text[] not null default '{}',
  tipografias text[] not null default '{}',
  estilo_fotografico text,
  estilo_grafico text,
  estilo_carruseles text,
  estilo_historias text,
  estilo_reels text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_visual_identity_set_updated_at before update on public.brand_visual_identity
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_products: productos Y servicios (kind) del cliente.
-- ---------------------------------------------------------------------------
create table public.brand_products (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null default 'producto' check (kind in ('producto', 'servicio')),

  nombre text not null,
  descripcion text,
  beneficios text[] not null default '{}',
  caracteristicas text[] not null default '{}',
  diferenciales text[] not null default '{}',
  precio text,
  promociones text,
  publico_objetivo text,
  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_products_client_idx on public.brand_products(client_id);

create trigger brand_products_set_updated_at before update on public.brand_products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_learning: aprendizajes acumulados ("No usar la palabra financiacion",
-- "Las publicaciones largas funcionan mejor"...). Se inyectan en cada
-- generacion mientras esten activos.
-- ---------------------------------------------------------------------------
create table public.brand_learning (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,

  contenido text not null,
  categoria text not null default 'otro'
    check (categoria in ('estilo', 'lenguaje', 'rendimiento', 'otro')),
  activo boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_learning_client_idx on public.brand_learning(client_id);

create trigger brand_learning_set_updated_at before update on public.brand_learning
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_examples: publicaciones aprobadas que sirven de referencia de estilo.
-- Snapshot de los campos de copy (no FK-dependiente del contenido vivo) para
-- que editar/borrar la publicacion no altere lo que la IA aprendio.
-- ---------------------------------------------------------------------------
create table public.brand_examples (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,

  titulo text not null,
  tipo_contenido content_kind not null default 'post',
  hook text,
  guion text,
  copy text,
  cta text,
  hashtags text[] not null default '{}',
  notas text,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now()
);

create index brand_examples_client_idx on public.brand_examples(client_id);
-- Evita duplicar el mismo contenido aprobado dos veces como ejemplo.
create unique index brand_examples_content_item_uniq
  on public.brand_examples(content_item_id) where content_item_id is not null;

-- ---------------------------------------------------------------------------
-- ai_generations: registro de cada generacion (auditoria + regeneraciones +
-- futuro entrenamiento). `resultado` guarda el JSON completo devuelto por el
-- modelo; `content_item_id` se enlaza cuando el usuario guarda el resultado.
-- ---------------------------------------------------------------------------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,

  tipo_contenido ai_content_type not null,
  tema text not null,
  objetivo text,
  producto_id uuid references public.brand_products(id) on delete set null,
  fecha_publicacion date,
  seccion_regenerada text,

  modelo text not null,
  resultado jsonb,
  status ai_generation_status not null default 'ok',
  error text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,

  created_at timestamptz not null default now()
);

create index ai_generations_client_idx on public.ai_generations(client_id);
create index ai_generations_content_item_idx on public.ai_generations(content_item_id);

-- ---------------------------------------------------------------------------
-- RLS: interno de agencia en lectura y escritura. NO has_client_access: los
-- usuarios rol `client` (portal) estan en client_members y verian la memoria
-- interna de su marca (aprendizajes, palabras prohibidas, notas de estilo).
-- ---------------------------------------------------------------------------
alter table public.brand_memory enable row level security;
create policy brand_memory_select on public.brand_memory for select
  using (public.is_internal_team_member(client_id));
create policy brand_memory_write on public.brand_memory for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.brand_voice enable row level security;
create policy brand_voice_select on public.brand_voice for select
  using (public.is_internal_team_member(client_id));
create policy brand_voice_write on public.brand_voice for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.brand_visual_identity enable row level security;
create policy brand_visual_identity_select on public.brand_visual_identity for select
  using (public.is_internal_team_member(client_id));
create policy brand_visual_identity_write on public.brand_visual_identity for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.brand_products enable row level security;
create policy brand_products_select on public.brand_products for select
  using (public.is_internal_team_member(client_id));
create policy brand_products_write on public.brand_products for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.brand_learning enable row level security;
create policy brand_learning_select on public.brand_learning for select
  using (public.is_internal_team_member(client_id));
create policy brand_learning_write on public.brand_learning for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.brand_examples enable row level security;
create policy brand_examples_select on public.brand_examples for select
  using (public.is_internal_team_member(client_id));
create policy brand_examples_write on public.brand_examples for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

alter table public.ai_generations enable row level security;
create policy ai_generations_select on public.ai_generations for select
  using (public.is_internal_team_member(client_id));
create policy ai_generations_write on public.ai_generations for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));
