-- Single aggregate RPC for the dashboard, avoids N waterfall queries from the
-- client. NOT security definer: RLS on clients/content_items/stories still
-- filters rows per the calling user, so the numbers are naturally scoped to
-- whatever that user can see (same as every other query in the app).
create or replace function public.dashboard_stats(p_client_id uuid default null)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'clientes_activos', (
      select count(*) from public.clients
      where status = 'activo' and (p_client_id is null or id = p_client_id)
    ),
    'contenidos_mes', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id)
        and date_trunc('month', coalesce(fecha_publicacion, created_at::date)) = date_trunc('month', current_date)
    ),
    'pendientes_posts', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id)
        and tipo_contenido = 'post' and status not in ('publicado', 'archivado', 'medido')
    ),
    'pendientes_historias', (
      select count(*) from public.stories
      where (p_client_id is null or client_id = p_client_id)
        and status not in ('publicada', 'archivada')
    ),
    'pendientes_reels', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id)
        and tipo_contenido = 'reel' and status not in ('publicado', 'archivado', 'medido')
    ),
    'en_diseno', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'diseno'
    ),
    'en_edicion', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'edicion'
    ),
    'esperando_aprobacion', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'enviado_al_cliente'
    ),
    'aprobados', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'aprobado'
    ),
    'publicados', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'publicado'
    ),
    'correcciones_pendientes', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id) and status = 'correcciones'
    ),
    'piezas_semana', (
      select count(*) from public.content_items
      where (p_client_id is null or client_id = p_client_id)
        and status = 'publicado'
        and fecha_publicacion >= date_trunc('week', current_date)::date
    ),
    'avance_mensual_pct', (
      select case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status in ('publicado', 'medido', 'archivado')) / count(*))
      end
      from public.content_items
      where (p_client_id is null or client_id = p_client_id)
        and date_trunc('month', coalesce(fecha_publicacion, created_at::date)) = date_trunc('month', current_date)
    )
  );
$$;

grant execute on function public.dashboard_stats(uuid) to authenticated;
