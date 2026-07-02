-- =============================================================================
-- Adds client-portal read + approve/comment support for stories, mirroring
-- the content_items portal pattern from 0017/0018/0019.
--
-- Also fixes a latent bug carried since 0019: comments_select/comments_insert
-- checked story access via a direct correlated subquery against `stories`,
-- which is itself subject to stories_select -- and stories_select (0018)
-- unconditionally denies the client role. That silently broke client
-- comment read/insert on stories (returns zero rows / fails) even though no
-- portal UI surfaced stories yet. Same root cause and same fix pattern 0019
-- already applied to content_item_id via content_item_has_client_access().
-- =============================================================================

create or replace function public.story_has_client_access(target_story_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_client_access(client_id) from public.stories where id = target_story_id;
$$;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select
  using (
    (
      (content_item_id is not null and public.content_item_has_client_access(content_item_id))
      or
      (story_id is not null and public.story_has_client_access(story_id))
    )
    and (public.current_role() <> 'client' or is_client_visible = true)
  );

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert
  with check (
    author_id = auth.uid()
    and (
      (content_item_id is not null and public.content_item_has_client_access(content_item_id))
      or
      (story_id is not null and public.story_has_client_access(story_id))
    )
    and (public.current_role() <> 'client' or (author_type = 'client' and is_client_visible = true))
  );

-- ---------------------------------------------------------------------------
-- get_portal_stories: security-definer read path, mirrors
-- get_portal_content_items exactly. Story pipeline has no dedicated WIP/
-- pending/approved three-state split like content_status, so the mapping is:
--   - 'idea'/'diseno'  -> internal-only, hidden from client role (WIP analog)
--   - 'lista'          -> pending client review (analog of enviado_al_cliente)
--   - 'programada'/'publicada'/'archivada' -> visible, resolved (no action)
-- ---------------------------------------------------------------------------
create or replace function public.get_portal_stories(p_story_id uuid default null)
returns table (
  id uuid,
  client_id uuid,
  nombre text,
  fecha date,
  hora time,
  story_type_id uuid,
  objetivo text,
  status story_status,
  assignee_id uuid,
  texto text,
  sticker text,
  link text,
  cta text,
  observacion text,
  respuesta_esperada text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    s.id, s.client_id, s.nombre, s.fecha, s.hora, s.story_type_id, s.objetivo, s.status,
    s.assignee_id, s.texto, s.sticker, s.link, s.cta, s.observacion, s.respuesta_esperada,
    s.created_by, s.created_at, s.updated_at
  from public.stories s
  where
    (p_story_id is null or s.id = p_story_id)
    and public.has_client_access(s.client_id)
    and (public.current_role() <> 'client' or s.status not in ('idea', 'diseno'));
$$;

grant execute on function public.get_portal_stories(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_client_story_approval: the only client write path onto stories,
-- mirrors submit_client_approval exactly. No feedback_cliente column exists
-- on stories (unlike content_items) -- client notes are captured on the
-- approvals row only (notes/resolved_at/resolved_by), not denormalized onto
-- stories, to avoid a schema change there.
-- ---------------------------------------------------------------------------
create or replace function public.submit_client_story_approval(
  p_story_id uuid,
  p_decision approval_status,
  p_notes text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
  v_status story_status;
  v_new_status story_status;
begin
  if public.current_role() <> 'client' then
    raise exception 'Solo un usuario cliente puede aprobar o rechazar historias.';
  end if;

  select client_id, status into v_client_id, v_status
  from public.stories
  where id = p_story_id;

  if v_client_id is null then
    raise exception 'Historia no encontrada.';
  end if;

  if not exists (
    select 1 from public.client_members cm
    where cm.client_id = v_client_id and cm.profile_id = auth.uid()
  ) then
    raise exception 'No tenés acceso a esta historia.';
  end if;

  if v_status <> 'lista' then
    raise exception 'Esta historia no está esperando tu revisión.';
  end if;

  if p_decision = 'approved' then
    v_new_status := 'programada';
  elsif p_decision = 'changes_requested' then
    v_new_status := 'diseno';
  else
    raise exception 'Decisión inválida.';
  end if;

  update public.stories
  set status = v_new_status
  where id = p_story_id;

  insert into public.approvals (story_id, status, resolved_by, resolved_at, notes)
  values (p_story_id, p_decision, auth.uid(), now(), p_notes);
end;
$$;

grant execute on function public.submit_client_story_approval(uuid, approval_status, text) to authenticated;

-- Note: stories_select/stories_insert/stories_update need no changes -- they
-- intentionally stay client-excluded (0018), same as content_items_select;
-- the portal reads exclusively through get_portal_stories, and writes
-- exclusively through submit_client_story_approval.
