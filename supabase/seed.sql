-- Dev-only sample data. NOT part of the numbered migrations and NOT meant to
-- run in production — run manually against a local/dev Supabase project
-- after 0001-0014 have applied, to have something real to click through
-- while building the UI.

insert into public.clients (name, slug, rubro, status, plan_contratado, instagram_url, tiktok_url, brand_colors, notes)
values (
  'Smile Motors',
  'smile-motors',
  'Concesionaria de motos (combustión, híbridas y eléctricas)',
  'activo',
  'Gestión integral: feed, reels, historias, TikTok, comunidad, planificación, copy, diseño, edición, programación y análisis',
  'https://instagram.com/smilemotors',
  'https://tiktok.com/@smilemotors',
  '["#0A0A0A", "#FFD400"]'::jsonb,
  'Marca ya existente. Rebranding progresivo, no se arranca desde cero.'
)
on conflict (slug) do nothing;

-- Sample content_items across a few pipeline stages, so the table/Kanban/
-- calendar views have real rows to render during development.
with c as (select id from public.clients where slug = 'smile-motors'),
     f_reel as (select id from public.formats where client_id is null and name = 'Reel'),
     f_carrusel as (select id from public.formats where client_id is null and name = 'Carrusel'),
     f_historia as (select id from public.formats where client_id is null and name = 'Historia'),
     p_autoridad as (select id from public.pillars where client_id is null and name = 'Autoridad'),
     p_conversion as (select id from public.pillars where client_id is null and name = 'Conversión'),
     p_educacion as (select id from public.pillars where client_id is null and name = 'Educación')
insert into public.content_items (client_id, titulo, descripcion, formato_id, pilar_id, tipo_contenido, status, priority, fecha_publicacion, hook, copy)
select c.id, v.titulo, v.descripcion, v.formato_id, v.pilar_id, v.tipo_contenido, v.status, v.priority, v.fecha_publicacion, v.hook, v.copy
from c,
(values
  ('Llegada de motos nuevas al showroom', 'Reel mostrando la descarga y acomodo de la nueva partida.', (select id from f_reel), (select id from p_autoridad), 'reel'::content_kind, 'idea'::content_status, 'media'::content_priority, current_date + 3, 'Llegó lo nuevo 🏍️', null),
  ('Comparativa híbrida vs eléctrica', 'Carrusel educativo comparando autonomía, mantenimiento y costos.', (select id from f_carrusel), (select id from p_educacion), 'post'::content_kind, 'guion'::content_status, 'media'::content_priority, current_date + 5, '¿Híbrida o eléctrica? Te lo explicamos', null),
  ('Financiación disponible esta semana', 'Historia promocionando planes de financiación.', (select id from f_historia), (select id from p_conversion), 'story'::content_kind, 'diseno'::content_status, 'alta'::content_priority, current_date + 1, 'Estrená tu moto ya', null),
  ('Cliente retirando su moto 0km', 'Reel testimonial con cliente feliz en el showroom.', (select id from f_reel), (select id from p_autoridad), 'reel'::content_kind, 'revision_interna'::content_status, 'media'::content_priority, current_date + 7, 'Otra entrega más 🎉', null),
  ('Envío a Cuba: cómo funciona', 'Carrusel explicando el proceso de envío internacional.', (select id from f_carrusel), (select id from p_educacion), 'post'::content_kind, 'enviado_al_cliente'::content_status, 'media'::content_priority, current_date + 10, '¿Sabías que enviamos a Cuba?', null)
) as v(titulo, descripcion, formato_id, pilar_id, tipo_contenido, status, priority, fecha_publicacion, hook, copy);
