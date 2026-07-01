-- Stage 2 skeleton: created now (empty, RLS-enabled, no UI) so approvals and
-- versioning never require a schema-breaking migration onto a live table.
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version_number int not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number)
);

create index content_versions_content_item_idx on public.content_versions(content_item_id);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  version_id uuid references public.content_versions(id) on delete set null,
  status approval_status not null default 'pending',
  requested_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  notes text,
  constraint approvals_one_parent_check check (
    (content_item_id is not null and story_id is null) or
    (content_item_id is null and story_id is not null)
  )
);

create index approvals_content_item_idx on public.approvals(content_item_id);
create index approvals_story_idx on public.approvals(story_id);
