-- =============================================================================
-- Stage 2: Client Portal.
--
-- PRE-DEPLOY SANITY CHECK (run before applying, should return 0):
--   select count(*) from public.client_members cm
--   join public.profiles p on p.id = cm.profile_id
--   where p.role = 'client';
-- If this is not 0, the has_client_access -> is_internal_team_member sweep
-- below changes behavior for already-existing client_members rows; confirm
-- that's intended before proceeding.
--
-- Context: has_client_access(client_id) resolves to true for ANYONE in
-- client_members, internal team member or not. It was safe to use for both
-- read and write policies in Stage 1 because only internal team members were
-- ever added to client_members. Now that client-role users are added to the
-- same table (so they can read their own client's data), every WRITE policy
-- still keyed on has_client_access would silently grant them full internal
-- write rights. This migration:
--   1. Adds is_internal_team_member(), and swaps it into every write policy
--      that was previously internal-only.
--   2. Narrows content_items/comments/files read access for the client role
--      (via a security_invoker view for content_items, since column-hiding
--      and status-narrowing can't be done via a second permissive policy).
--   3. Adds submit_client_approval(), a security-definer RPC that is the
--      ONLY way a client can move a content_item to aprobado/correcciones.
-- =============================================================================

create or replace function public.is_internal_team_member(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    public.is_admin_or_pm()
    or exists (
      select 1
      from public.client_members cm
      join public.profiles p on p.id = cm.profile_id
      where cm.client_id = target_client_id
        and cm.profile_id = auth.uid()
        and p.role <> 'client'
    );
$$;

-- ---------------------------------------------------------------------------
-- Write-policy sweep: has_client_access -> is_internal_team_member.
-- Postgres has no `create or replace policy`, so each is dropped and recreated.
-- ---------------------------------------------------------------------------

drop policy if exists content_items_insert on public.content_items;
create policy content_items_insert on public.content_items for insert
  with check (public.is_internal_team_member(client_id));

-- Load-bearing for submit_client_approval() being the only client write path:
-- without this swap, a client (now in client_members) could UPDATE any
-- column of content_items directly via PostgREST, bypassing the RPC entirely.
drop policy if exists content_items_update on public.content_items;
create policy content_items_update on public.content_items for update
  using (public.is_internal_team_member(client_id) or assignee_id = auth.uid());

drop policy if exists stories_insert on public.stories;
create policy stories_insert on public.stories for insert
  with check (public.is_internal_team_member(client_id));

drop policy if exists stories_update on public.stories;
create policy stories_update on public.stories for update
  using (public.is_internal_team_member(client_id) or assignee_id = auth.uid());

drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert on public.campaigns for insert
  with check (public.is_internal_team_member(client_id));

drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update on public.campaigns for update
  using (public.is_internal_team_member(client_id));

drop policy if exists pillars_write on public.pillars;
create policy pillars_write on public.pillars for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)));

drop policy if exists subpillars_write on public.subpillars;
create policy subpillars_write on public.subpillars for all
  using (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and ((p.client_id is null and public.is_admin()) or (p.client_id is not null and public.is_internal_team_member(p.client_id)))
  ))
  with check (exists (
    select 1 from public.pillars p
    where p.id = subpillars.pillar_id
      and ((p.client_id is null and public.is_admin()) or (p.client_id is not null and public.is_internal_team_member(p.client_id)))
  ));

drop policy if exists formats_write on public.formats;
create policy formats_write on public.formats for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)));

drop policy if exists sub_formats_write on public.sub_formats;
create policy sub_formats_write on public.sub_formats for all
  using (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and ((f.client_id is null and public.is_admin()) or (f.client_id is not null and public.is_internal_team_member(f.client_id)))
  ))
  with check (exists (
    select 1 from public.formats f
    where f.id = sub_formats.format_id
      and ((f.client_id is null and public.is_admin()) or (f.client_id is not null and public.is_internal_team_member(f.client_id)))
  ));

drop policy if exists story_types_write on public.story_types;
create policy story_types_write on public.story_types for all
  using ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)))
  with check ((client_id is null and public.is_admin()) or (client_id is not null and public.is_internal_team_member(client_id)));

drop policy if exists content_days_write on public.content_days;
create policy content_days_write on public.content_days for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

drop policy if exists content_day_shots_write on public.content_day_shots;
create policy content_day_shots_write on public.content_day_shots for all
  using (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.is_internal_team_member(cd.client_id)
  ))
  with check (exists (
    select 1 from public.content_days cd where cd.id = content_day_shots.content_day_id and public.is_internal_team_member(cd.client_id)
  ));

drop policy if exists brand_assets_write on public.brand_assets;
create policy brand_assets_write on public.brand_assets for all
  using (public.is_internal_team_member(client_id))
  with check (public.is_internal_team_member(client_id));

-- Latent-gap sweep: no client-facing UI touches these tables in Stage 2, but
-- has_client_access would still quietly over-grant them once client-role
-- users exist in client_members, so they're closed now rather than re-audited
-- later.
drop policy if exists content_versions_write on public.content_versions;
create policy content_versions_write on public.content_versions for all
  using (exists (
    select 1 from public.content_items ci where ci.id = content_versions.content_item_id and public.is_internal_team_member(ci.client_id)
  ))
  with check (exists (
    select 1 from public.content_items ci where ci.id = content_versions.content_item_id and public.is_internal_team_member(ci.client_id)
  ));

drop policy if exists content_metrics_write on public.content_metrics;
create policy content_metrics_write on public.content_metrics for all
  using (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.is_internal_team_member(ci.client_id)
  ))
  with check (exists (
    select 1 from public.content_items ci where ci.id = content_metrics.content_item_id and public.is_internal_team_member(ci.client_id)
  ));

drop policy if exists ideas_write on public.ideas;
create policy ideas_write on public.ideas for all
  using (client_id is null or public.is_internal_team_member(client_id))
  with check (client_id is null or public.is_internal_team_member(client_id));

drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all
  using (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.is_internal_team_member(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.is_internal_team_member(s.client_id)
    ))
  )
  with check (
    (content_item_id is not null and exists (
      select 1 from public.content_items ci where ci.id = tasks.content_item_id and public.is_internal_team_member(ci.client_id)
    ))
    or
    (story_id is not null and exists (
      select 1 from public.stories s where s.id = tasks.story_id and public.is_internal_team_member(s.client_id)
    ))
  );

drop policy if exists files_insert on public.files;
create policy files_insert on public.files for insert
  with check (public.is_internal_team_member(client_id));

drop policy if exists storage_content_files_insert on storage.objects;
create policy storage_content_files_insert on storage.objects for insert
  with check (bucket_id = 'content-files' and public.is_internal_team_member((storage.foldername(name))[1]::uuid));

drop policy if exists storage_content_files_delete on storage.objects;
create policy storage_content_files_delete on storage.objects for delete
  using (bucket_id = 'content-files' and public.is_internal_team_member((storage.foldername(name))[1]::uuid));

-- ---------------------------------------------------------------------------
-- Read narrowing for the client role: files (never archivo_editable).
-- ---------------------------------------------------------------------------

drop policy if exists files_select on public.files;
create policy files_select on public.files for select
  using (
    public.has_client_access(client_id)
    and (public.current_role() <> 'client' or kind in ('archivo_final', 'miniatura'))
  );

drop policy if exists storage_content_files_select on storage.objects;
create policy storage_content_files_select on storage.objects for select
  using (
    bucket_id = 'content-files'
    and public.has_client_access((storage.foldername(name))[1]::uuid)
    and (public.current_role() <> 'client' or (storage.foldername(name))[3] in ('miniatura', 'archivo_final'))
  );

-- ---------------------------------------------------------------------------
-- Read/write narrowing for the client role: comments (only is_client_visible
-- rows are readable; client-authored rows are forced client/visible).
-- ---------------------------------------------------------------------------

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select
  using (
    (
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
    and (public.current_role() <> 'client' or is_client_visible = true)
  );

drop policy if exists comments_insert on public.comments;
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
    and (public.current_role() <> 'client' or (author_type = 'client' and is_client_visible = true))
  );

-- ---------------------------------------------------------------------------
-- content_items_portal: security_invoker view. Omits observaciones_internas
-- (RLS is row-level, can't hide columns on the base table) and narrows rows
-- to non-WIP statuses for the client role. security_invoker means it still
-- enforces content_items' own RLS as the querying user -- this is a
-- projection, not a privilege escalation.
-- ---------------------------------------------------------------------------

create view public.content_items_portal
with (security_invoker = true) as
select
  id, client_id, campaign_id, titulo, descripcion, formato_id, sub_formato_id,
  pilar_id, subpilar_id, tipo_contenido, objetivo, status, priority,
  assignee_id, created_by, fecha_publicacion, hora_sugerida, hook, guion,
  copy, cta, hashtags, link_drive, link_canva, link_capcut,
  link_publicacion_final, vistas, likes, comentarios_count, compartidos,
  guardados, consultas_generadas, feedback_cliente, created_at, updated_at
from public.content_items
where
  public.current_role() <> 'client'
  or status not in ('idea', 'investigacion', 'guion', 'diseno', 'grabacion', 'edicion', 'revision_interna');

grant select on public.content_items_portal to authenticated;

-- ---------------------------------------------------------------------------
-- submit_client_approval: the only write path a client has onto
-- content_items. Security definer so it can apply the change despite the
-- client having zero direct UPDATE grant on content_items (see
-- content_items_update above).
-- ---------------------------------------------------------------------------

create or replace function public.submit_client_approval(
  p_content_item_id uuid,
  p_decision approval_status,
  p_notes text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
  v_status content_status;
  v_new_status content_status;
begin
  if public.current_role() <> 'client' then
    raise exception 'Solo un usuario cliente puede aprobar o rechazar publicaciones.';
  end if;

  select client_id, status into v_client_id, v_status
  from public.content_items
  where id = p_content_item_id;

  if v_client_id is null then
    raise exception 'Publicacion no encontrada.';
  end if;

  if not exists (
    select 1 from public.client_members cm
    where cm.client_id = v_client_id and cm.profile_id = auth.uid()
  ) then
    raise exception 'No tenes acceso a esta publicacion.';
  end if;

  if v_status not in ('enviado_al_cliente', 'correcciones') then
    raise exception 'Esta publicacion no esta esperando tu revision.';
  end if;

  if p_decision = 'approved' then
    v_new_status := 'aprobado';
  elsif p_decision = 'changes_requested' then
    v_new_status := 'correcciones';
  else
    raise exception 'Decision invalida.';
  end if;

  update public.content_items
  set status = v_new_status, feedback_cliente = p_notes
  where id = p_content_item_id;

  insert into public.approvals (content_item_id, status, resolved_by, resolved_at, notes)
  values (p_content_item_id, p_decision, auth.uid(), now(), p_notes);
end;
$$;

grant execute on function public.submit_client_approval(uuid, approval_status, text) to authenticated;
