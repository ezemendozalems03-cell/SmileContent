-- Backs the Ctrl+K command palette. Runs as the calling user (not security
-- definer) so RLS on each unioned table naturally scopes results.
create or replace function public.global_search(q text)
returns table (
  kind text,
  id uuid,
  client_id uuid,
  title text,
  subtitle text
)
language sql
stable
as $$
  select kind, id, client_id, title, subtitle from (
    select 'content_item'::text as kind, ci.id, ci.client_id, ci.titulo as title, c.name as subtitle,
           ci.updated_at as sort_key
    from public.content_items ci
    join public.clients c on c.id = ci.client_id
    where ci.search_vector @@ websearch_to_tsquery('spanish', q)

    union all

    select 'story'::text as kind, s.id, s.client_id, s.nombre as title, c.name as subtitle,
           s.updated_at as sort_key
    from public.stories s
    join public.clients c on c.id = s.client_id
    where s.nombre ilike '%' || q || '%'

    union all

    select 'client'::text as kind, cl.id, cl.id as client_id, cl.name as title, cl.rubro as subtitle,
           cl.updated_at as sort_key
    from public.clients cl
    where cl.name ilike '%' || q || '%'
  ) results
  order by sort_key desc
  limit 10
$$;

grant execute on function public.global_search(text) to authenticated;
