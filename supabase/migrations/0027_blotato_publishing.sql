-- ETAPA 3: publicación/calendarización automática vía Blotato.
-- Content OS sigue siendo el centro (calendario, aprobación, estrategia);
-- Blotato es solo la capa externa de distribución. El pipeline editorial
-- (content_status) NO cambia: la publicación externa vive en publish_status
-- y en scheduled_posts (historial completo de intentos, nunca se borra).

create type publish_status as enum (
  'draft',
  'ready_for_review',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- social_accounts: cuentas sociales conectadas en el proveedor externo
-- (Blotato), sincronizadas acá y asignadas manualmente a un cliente.
-- client_id null = cuenta sincronizada pero todavía sin asignar.
-- ---------------------------------------------------------------------------
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  provider text not null default 'blotato',
  platform text not null,
  account_id text not null,
  account_name text,
  username text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index social_accounts_provider_account_unique
  on public.social_accounts (provider, account_id);
create index social_accounts_client_idx on public.social_accounts(client_id);

create trigger social_accounts_set_updated_at before update on public.social_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- scheduled_posts: cada envío a la capa de publicación (intentos incluidos).
-- payload_json guarda el payload EXACTO enviado, para reintentar y auditar.
-- ---------------------------------------------------------------------------
create table public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  scheduled_at timestamptz,
  published_at timestamptz,
  status publish_status not null default 'scheduled',
  external_provider text not null default 'blotato',
  external_post_id text,
  external_submission_id text,
  error_message text,
  payload_json jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scheduled_posts_content_item_idx on public.scheduled_posts(content_item_id);
create index scheduled_posts_client_idx on public.scheduled_posts(client_id);
create index scheduled_posts_status_idx on public.scheduled_posts(status);

create trigger scheduled_posts_set_updated_at before update on public.scheduled_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- content_items: espejo del último estado de publicación externa (el
-- historial completo vive en scheduled_posts).
-- ---------------------------------------------------------------------------
alter table public.content_items
  add column publish_status publish_status,
  add column scheduled_at timestamptz,
  add column published_at timestamptz,
  add column external_provider text,
  add column external_post_id text,
  add column external_submission_id text;

-- ---------------------------------------------------------------------------
-- RLS: interno de agencia. Los usuarios del portal (rol client) no gestionan
-- la publicación externa.
-- ---------------------------------------------------------------------------
-- Las filas sin cliente asignado (recién sincronizadas) son de admins/PMs.
alter table public.social_accounts enable row level security;
create policy social_accounts_select on public.social_accounts for select
  using (
    (client_id is null and public.is_admin_or_pm())
    or (client_id is not null and public.is_internal_team_member(client_id))
  );
create policy social_accounts_write on public.social_accounts for all
  using (
    (client_id is null and public.is_admin_or_pm())
    or (client_id is not null and public.is_internal_team_member(client_id))
  )
  with check (
    (client_id is null and public.is_admin_or_pm())
    or (client_id is not null and public.is_internal_team_member(client_id))
  );

alter table public.scheduled_posts enable row level security;
create policy scheduled_posts_select on public.scheduled_posts for select
  using (public.is_internal_team_member(client_id));
create policy scheduled_posts_write on public.scheduled_posts for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));
