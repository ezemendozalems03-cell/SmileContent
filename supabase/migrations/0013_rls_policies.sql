-- =============================================================================
-- Row Level Security: enabled on every table. Two access axes:
--   1. Role: admin/project_manager see everything internal; designer/editor/
--      copywriter see only clients they belong to (client_members), or items
--      where they are the assignee.
--   2. Client scope: every policy ultimately resolves to a client_id (direct
--      or via join). This is what lets Stage 2 add a `client` role branch to
--      has_client_access() additively, without touching existing policies.
-- =============================================================================

create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_pm()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('admin', 'project_manager');
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.has_client_access(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    public.is_admin_or_pm()
    or exists (
      select 1 from public.client_members cm
      where cm.client_id = target_client_id and cm.profile_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_all_authenticated on public.profiles for select
  using (auth.uid() is not null);

create policy profiles_update_self_or_admin on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- clients / client_members
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy clients_select on public.clients for select
  using (public.has_client_access(id));

create policy clients_insert on public.clients for insert
  with check (public.is_admin_or_pm());

create policy clients_update on public.clients for update
  using (public.is_admin_or_pm());

create policy clients_delete on public.clients for delete
  using (public.is_admin());

alter table public.client_members enable row level security;

create policy client_members_select on public.client_members for select
  using (public.is_admin_or_pm() or profile_id = auth.uid());

create policy client_members_write on public.client_members for all
  using (public.is_admin_or_pm())
  with check (public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
alter table public.campaigns enable row level security;

create policy campaigns_select on public.campaigns for select
  using (public.has_client_access(client_id));

create policy campaigns_insert on public.campaigns for insert
  with check (public.has_client_access(client_id));

create policy campaigns_update on public.campaigns for update
  using (public.has_client_access(client_id));

create policy campaigns_delete on public.campaigns for delete
  using (public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- pillars / subpillars / formats / sub_formats / story_types
-- Global rows (client_id is null) are admin-managed; client-scoped rows are
-- managed by anyone with access to that client.
-- ---------------------------------------------------------------------------
alter table public.pillars enable row level security;

create policy pillars_select on public.pillars for select
  using (client_id is null or public.has_client_access(client_id));

create policy pillars_write on public.pillars for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)));

alter table public.subpillars enable row level security;

create policy subpillars_select on public.subpillars for select
  using (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and (p.client_id is null or public.has_client_access(p.client_id))
  ));

create policy subpillars_write on public.subpillars for all
  using (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and ((p.client_id is null and public.is_admin()) or (p.client_id is not null and public.has_client_access(p.client_id)))
  ))
  with check (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and ((p.client_id is null and public.is_admin()) or (p.client_id is not null and public.has_client_access(p.client_id)))
  ));

alter table public.formats enable row level security;

create policy formats_select on public.formats for select
  using (client_id is null or public.has_client_access(client_id));

create policy formats_write on public.formats for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)));

alter table public.sub_formats enable row level security;

create policy sub_formats_select on public.sub_formats for select
  using (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and (f.client_id is null or public.has_client_access(f.client_id))
  ));

create policy sub_formats_write on public.sub_formats for all
  using (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and ((f.client_id is null and public.is_admin()) or (f.client_id is not null and public.has_client_access(f.client_id)))
  ))
  with check (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and ((f.client_id is null and public.is_admin()) or (f.client_id is not null and public.has_client_access(f.client_id)))
  ));

alter table public.story_types enable row level security;

create policy story_types_select on public.story_types for select
  using (client_id is null or public.has_client_access(client_id));

create policy story_types_write on public.story_types for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.has_client_access(client_id)));

-- ---------------------------------------------------------------------------
-- content_items (core publications table)
-- ---------------------------------------------------------------------------
alter table public.content_items enable row level security;

create policy content_items_select on public.content_items for select
  using (public.has_client_access(client_id) or assignee_id = auth.uid());

create policy content_items_insert on public.content_items for insert
  with check (public.has_client_access(client_id));

create policy content_items_update on public.content_items for update
  using (public.has_client_access(client_id) or assignee_id = auth.uid());

create policy content_items_delete on public.content_items for delete
  using (public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
alter table public.stories enable row level security;

create policy stories_select on public.stories for select
  using (public.has_client_access(client_id) or assignee_id = auth.uid());

create policy stories_insert on public.stories for insert
  with check (public.has_client_access(client_id));

create policy stories_update on public.stories for update
  using (public.has_client_access(client_id) or assignee_id = auth.uid());

create policy stories_delete on public.stories for delete
  using (public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- comments (polymorphic-lite: content_item or story parent)
-- ---------------------------------------------------------------------------
alter table public.comments enable row level security;

create policy comments_select on public.comments for select
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci
      where ci.id = comments.content_item_id and public.has_client_access(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s
      where s.id = comments.story_id and public.has_client_access(s.client_id)
    ))
  );

create policy comments_insert on public.comments for insert
  with check (
    author_id = auth.uid()
    and (
      (content_item_id is not null and exists (
        select 1 from public.content_items ci
        where ci.id = comments.content_item_id and public.has_client_access(ci.client_id)
      ))
      or
      (story_id is not null and exists (
        select 1 from public.stories s
        where s.id = comments.story_id and public.has_client_access(s.client_id)
      ))
    )
  );

create policy comments_update on public.comments for update
  using (author_id = auth.uid() or public.is_admin_or_pm());

create policy comments_delete on public.comments for delete
  using (author_id = auth.uid() or public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- files
-- ---------------------------------------------------------------------------
alter table public.files enable row level security;

create policy files_select on public.files for select
  using (public.has_client_access(client_id));

create policy files_insert on public.files for insert
  with check (public.has_client_access(client_id));

create policy files_delete on public.files for delete
  using (uploaded_by = auth.uid() or public.is_admin_or_pm());

-- ---------------------------------------------------------------------------
-- Stub tables: RLS enabled now with a has_client_access-shaped policy so no
-- "forgot to enable RLS" gap exists when Stage 2/3 UI lands on top of them.
-- ---------------------------------------------------------------------------
alter table public.content_versions enable row level security;
create policy content_versions_select on public.content_versions for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = content_versions.content_item_id and public.has_client_access(ci.client_id)
  ));
create policy content_versions_write on public.content_versions for all
  using (exists (
    select 1 from public.content_items ci
    where ci.id = content_versions.content_item_id and public.has_client_access(ci.client_id)
  ))
  with check (exists (
    select 1 from public.content_items ci
    where ci.id = content_versions.content_item_id and public.has_client_access(ci.client_id)
  ));

alter table public.approvals enable row level security;
create policy approvals_select on public.approvals for select
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = approvals.content_item_id and public.has_client_access(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = approvals.story_id and public.has_client_access(s.client_id)
    ))
  );
create policy approvals_write on public.approvals for all
  using (public.is_admin_or_pm())
  with check (public.is_admin_or_pm());

alter table public.content_metrics enable row level security;
create policy content_metrics_select on public.content_metrics for select
  using (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.has_client_access(ci.client_id)
  ));
create policy content_metrics_write on public.content_metrics for all
  using (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.has_client_access(ci.client_id)
  ))
  with check (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.has_client_access(ci.client_id)
  ));

alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select
  using (recipient_id = auth.uid());
create policy notifications_update on public.notifications for update
  using (recipient_id = auth.uid());
create policy notifications_insert on public.notifications for insert
  with check (true);

alter table public.ideas enable row level security;
create policy ideas_select on public.ideas for select
  using (client_id is null or public.has_client_access(client_id));
create policy ideas_write on public.ideas for all
  using (client_id is null or public.has_client_access(client_id))
  with check (client_id is null or public.has_client_access(client_id));

alter table public.tasks enable row level security;
create policy tasks_select on public.tasks for select
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.has_client_access(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.has_client_access(s.client_id)
    ))
    or assignee_id = auth.uid()
  );
create policy tasks_write on public.tasks for all
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.has_client_access(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.has_client_access(s.client_id)
    ))
  )
  with check (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.has_client_access(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.has_client_access(s.client_id)
    ))
  );

alter table public.content_days enable row level security;
create policy content_days_select on public.content_days for select
  using (public.has_client_access(client_id));
create policy content_days_write on public.content_days for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

alter table public.content_day_shots enable row level security;
create policy content_day_shots_select on public.content_day_shots for select
  using (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.has_client_access(cd.client_id)
  ));
create policy content_day_shots_write on public.content_day_shots for all
  using (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.has_client_access(cd.client_id)
  ))
  with check (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.has_client_access(cd.client_id)
  ));

alter table public.brand_assets enable row level security;
create policy brand_assets_select on public.brand_assets for select
  using (public.has_client_access(client_id));
create policy brand_assets_write on public.brand_assets for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- ---------------------------------------------------------------------------
-- Storage: bucket `content-files` is private. Path convention is
-- {client_id}/{parent_id}/{kind}/{uuid}-{filename}, so the first path segment
-- is always the client_id, which has_client_access() can check directly.
-- Bucket creation itself happens once a live Supabase project exists.
-- ---------------------------------------------------------------------------
create policy storage_content_files_select on storage.objects for select
  using (bucket_id = 'content-files' and public.has_client_access((storage.foldername(name))[1]::uuid));

create policy storage_content_files_insert on storage.objects for insert
  with check (bucket_id = 'content-files' and public.has_client_access((storage.foldername(name))[1]::uuid));

create policy storage_content_files_delete on storage.objects for delete
  using (bucket_id = 'content-files' and public.has_client_access((storage.foldername(name))[1]::uuid));
