-- =============================================================================
-- Fixes a regression introduced by 0018: comments_select/comments_insert both
-- check content_item access via `exists (select 1 from content_items ci
-- where ci.id = ... and has_client_access(ci.client_id))`. That subquery
-- selects directly FROM content_items, which is itself subject to
-- content_items_select's own RLS -- and 0018 tightened content_items_select
-- to deny the client role entirely (by design, so clients can't bypass the
-- portal RPC and read the base table). The unintended side effect: a client
-- could no longer read or post their OWN client-visible comments either,
-- since the correlated subquery inside comments_select/comments_insert now
-- silently sees zero rows in content_items for them, regardless of
-- has_client_access's own answer.
--
-- Found by manual testing: a client's own well-formed comment insert
-- (author_type='client', is_client_visible=true) was rejected by RLS after
-- 0018 shipped.
--
-- Fix: look up the content_item's client_id through a SECURITY DEFINER
-- function (same bypass-the-caller's-RLS mechanism has_client_access itself
-- already relies on for client_members), instead of a direct correlated
-- subquery against content_items.
-- =============================================================================

create or replace function public.content_item_has_client_access(target_content_item_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_client_access(client_id) from public.content_items where id = target_content_item_id;
$$;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select
  using (
    (
      (content_item_id is not null and public.content_item_has_client_access(content_item_id))
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
      (content_item_id is not null and public.content_item_has_client_access(content_item_id))
      or
      (story_id is not null and exists (
        select 1 from public.stories s
        where s.id = comments.story_id and public.has_client_access(s.client_id)
      ))
    )
    and (public.current_role() <> 'client' or (author_type = 'client' and is_client_visible = true))
  );
