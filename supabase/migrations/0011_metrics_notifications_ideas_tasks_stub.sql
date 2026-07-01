-- Stage 3 skeleton: time-series metrics (distinct from the current-snapshot
-- columns on content_items), notifications, idea bank, and lightweight tasks.
create table public.content_metrics (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  captured_at timestamptz not null default now(),
  vistas bigint,
  likes bigint,
  comentarios bigint,
  compartidos bigint,
  guardados bigint,
  source text not null default 'manual'
);

create index content_metrics_content_item_idx on public.content_metrics(content_item_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications(recipient_id, is_read);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  description text,
  pilar_id uuid references public.pillars(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  promoted_content_item_id uuid references public.content_items(id) on delete set null,
  created_at timestamptz not null default now()
);

create index ideas_client_idx on public.ideas(client_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now()
);

create index tasks_content_item_idx on public.tasks(content_item_id);
create index tasks_story_idx on public.tasks(story_id);
