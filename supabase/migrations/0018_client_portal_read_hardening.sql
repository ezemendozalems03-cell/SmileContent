-- =============================================================================
-- Follow-up to 0017: closes a read-side gap proven by manual testing against
-- the live project after 0017 shipped.
--
-- 0017 correctly locked down WRITE policies (has_client_access ->
-- is_internal_team_member) and added a narrowed content_items_portal VIEW
-- with security_invoker=true for the client-facing read path. Testing showed
-- the view's row/column narrowing worked, but a client-role user could still
-- bypass the app entirely and call PostgREST directly against the BASE
-- content_items table (`/rest/v1/content_items`), because content_items_select
-- itself was left on has_client_access (unchanged from Stage 1) -- which,
-- exactly like the write policies, now also returns true for client-role
-- members of client_members. That meant a client could read every status
-- (including internal-WIP) and the observaciones_internas column directly,
-- completely bypassing the view.
--
-- Root cause: a security_invoker view can only ever be as strict as the base
-- table's own RLS, since it enforces that same RLS as the querying user. So
-- content_items_select can't be tightened to exclude clients (breaking the
-- view) while ALSO being the thing that lets the view work for clients.
-- Fix: replace the view with a SECURITY DEFINER function instead. Security
-- definer functions run with the function owner's privileges against the
-- underlying table (the same mechanism has_client_access()/current_role()
-- already rely on), so the function's own WHERE clause becomes the sole
-- access control, independent of content_items_select. That frees
-- content_items_select to be locked down to internal-only, closing the leak,
-- without breaking the portal's read path.
--
-- Given the same has_client_access-includes-clients issue applies to every
-- other read policy with no portal UI behind it (campaigns, pillars/
-- subpillars/formats/sub_formats/story_types, content_versions, approvals,
-- content_metrics, ideas, tasks, content_days, content_day_shots,
-- brand_assets, clients), this migration sweeps those the same way 0017 swept
-- writes -- same flaw, same fix, applied consistently rather than patched
-- table-by-table later. files_select/comments_select are intentionally left
-- alone: those already have deliberate, narrower client-facing access (kind
-- filter, is_client_visible filter) added in 0017 and are not part of this
-- leak. profiles_select_all_authenticated is also tightened: with client-role
-- accounts now existing, "any authenticated user reads every profile" would
-- let a client enumerate the whole agency's staff directory and every other
-- client's own portal users -- narrowed to self + authors of comments visible
-- to that client (needed so CommentThread can still show who wrote a
-- client-visible internal comment).
-- =============================================================================

drop policy if exists content_items_select on public.content_items;
create policy content_items_select on public.content_items for select
  using (public.current_role() <> 'client' and (public.has_client_access(client_id) or assignee_id = auth.uid()));

drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories for select
  using (public.current_role() <> 'client' and (public.has_client_access(client_id) or assignee_id = auth.uid()));

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select
  using (public.is_internal_team_member(id));

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns for select
  using (public.is_internal_team_member(client_id));

drop policy if exists pillars_select on public.pillars;
create policy pillars_select on public.pillars for select
  using (client_id is null or public.is_internal_team_member(client_id));

drop policy if exists subpillars_select on public.subpillars;
create policy subpillars_select on public.subpillars for select
  using (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and (p.client_id is null or public.is_internal_team_member(p.client_id))
  ));

drop policy if exists formats_select on public.formats;
create policy formats_select on public.formats for select
  using (client_id is null or public.is_internal_team_member(client_id));

drop policy if exists sub_formats_select on public.sub_formats;
create policy sub_formats_select on public.sub_formats for select
  using (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and (f.client_id is null or public.is_internal_team_member(f.client_id))
  ));

drop policy if exists story_types_select on public.story_types;
create policy story_types_select on public.story_types for select
  using (client_id is null or public.is_internal_team_member(client_id));

drop policy if exists content_versions_select on public.content_versions;
create policy content_versions_select on public.content_versions for select
  using (exists (
    select 1 from public.content_items ci where ci.id = content_versions.content_item_id and public.is_internal_team_member(ci.client_id)
  ));

drop policy if exists approvals_select on public.approvals;
create policy approvals_select on public.approvals for select
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = approvals.content_item_id and public.is_internal_team_member(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = approvals.story_id and public.is_internal_team_member(s.client_id)
    ))
  );

drop policy if exists content_metrics_select on public.content_metrics;
create policy content_metrics_select on public.content_metrics for select
  using (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.is_internal_team_member(ci.client_id)
  ));

drop policy if exists ideas_select on public.ideas;
create policy ideas_select on public.ideas for select
  using (client_id is null or public.is_internal_team_member(client_id));

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.is_internal_team_member(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.is_internal_team_member(s.client_id)
    ))
    or assignee_id = auth.uid()
  );

drop policy if exists content_days_select on public.content_days;
create policy content_days_select on public.content_days for select
  using (public.is_internal_team_member(client_id));

drop policy if exists content_day_shots_select on public.content_day_shots;
create policy content_day_shots_select on public.content_day_shots for select
  using (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.is_internal_team_member(cd.client_id)
  ));

drop policy if exists brand_assets_select on public.brand_assets;
create policy brand_assets_select on public.brand_assets for select
  using (public.is_internal_team_member(client_id));

drop policy if exists profiles_select_all_authenticated on public.profiles;
create policy profiles_select on public.profiles for select
  using (
    auth.uid() is not null
    and (
      public.current_role() <> 'client'
      or id = auth.uid()
      or exists (
        select 1 from public.comments c
        where c.author_id = profiles.id
          and c.is_client_visible = true
          and (
            (c.content_item_id is not null and exists (
              select 1 from public.content_items ci where ci.id = c.content_item_id and public.has_client_access(ci.client_id)
            ))
            or
            (c.story_id is not null and exists (
              select 1 from public.stories s where s.id = c.story_id and public.has_client_access(s.client_id)
            ))
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Replace content_items_portal (a security_invoker view, which could only
-- ever be as permissive as content_items_select and therefore couldn't
-- survive the lockdown above) with a SECURITY DEFINER function. Same
-- has_client_access/current_role checks, now self-contained.
-- ---------------------------------------------------------------------------

drop view if exists public.content_items_portal;

create or replace function public.get_portal_content_items(p_content_item_id uuid default null)
returns table (
  id uuid,
  client_id uuid,
  campaign_id uuid,
  titulo text,
  descripcion text,
  formato_id uuid,
  sub_formato_id uuid,
  pilar_id uuid,
  subpilar_id uuid,
  tipo_contenido content_kind,
  objetivo text,
  status content_status,
  priority content_priority,
  assignee_id uuid,
  created_by uuid,
  fecha_publicacion date,
  hora_sugerida time,
  hook text,
  guion text,
  copy text,
  cta text,
  hashtags text[],
  link_drive text,
  link_canva text,
  link_capcut text,
  link_publicacion_final text,
  vistas bigint,
  likes bigint,
  comentarios_count bigint,
  compartidos bigint,
  guardados bigint,
  consultas_generadas bigint,
  feedback_cliente text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    ci.id, ci.client_id, ci.campaign_id, ci.titulo, ci.descripcion, ci.formato_id, ci.sub_formato_id,
    ci.pilar_id, ci.subpilar_id, ci.tipo_contenido, ci.objetivo, ci.status, ci.priority, ci.assignee_id,
    ci.created_by, ci.fecha_publicacion, ci.hora_sugerida, ci.hook, ci.guion, ci.copy, ci.cta, ci.hashtags,
    ci.link_drive, ci.link_canva, ci.link_capcut, ci.link_publicacion_final, ci.vistas, ci.likes,
    ci.comentarios_count, ci.compartidos, ci.guardados, ci.consultas_generadas, ci.feedback_cliente,
    ci.created_at, ci.updated_at
  from public.content_items ci
  where
    (p_content_item_id is null or ci.id = p_content_item_id)
    and public.has_client_access(ci.client_id)
    and (
      public.current_role() <> 'client'
      or ci.status not in ('idea', 'investigacion', 'guion', 'diseno', 'grabacion', 'edicion', 'revision_interna')
    );
$$;

grant execute on function public.get_portal_content_items(uuid) to authenticated;
