-- Global defaults (client_id = null). These are the "seeded defaults" that
-- every client starts with; clients can add their own on top via
-- Configuración > Pilares y formatos without ever touching this table again.

-- ---------------------------------------------------------------------------
-- Formats + sub-formats
-- ---------------------------------------------------------------------------
insert into public.formats (name, sort_order) values
  ('Reel', 1),
  ('Carrusel', 2),
  ('Post estático', 3),
  ('Historia', 4),
  ('TikTok', 5),
  ('UGC', 6),
  ('Testimonio', 7),
  ('Flyer', 8),
  ('Meme', 9),
  ('Foto producto', 10),
  ('Video showroom', 11),
  ('Video educativo', 12),
  ('Video de venta', 13),
  ('Video institucional', 14);

insert into public.sub_formats (format_id, name, sort_order)
select f.id, v.name, v.sort_order
from public.formats f
join (values
  ('Reel', 'Reel tendencia', 1),
  ('Reel', 'Reel educativo', 2),
  ('Reel', 'Reel venta', 3),
  ('Reel', 'Reel storytelling', 4),
  ('Reel', 'Reel testimonial', 5),
  ('Reel', 'Reel comparativo', 6),
  ('Reel', 'Reel behind the scenes', 7),
  ('Carrusel', 'Carrusel educativo', 1),
  ('Carrusel', 'Carrusel comparativa', 2),
  ('Carrusel', 'Carrusel FAQ', 3),
  ('Carrusel', 'Carrusel venta', 4),
  ('Post estático', 'Post producto', 1),
  ('Post estático', 'Post institucional', 2),
  ('Post estático', 'Post frase', 3),
  ('Post estático', 'Post comunidad', 4),
  ('Post estático', 'Testimonio', 5),
  ('Post estático', 'UGC', 6),
  ('Post estático', 'Oferta', 7),
  ('Post estático', 'Novedad', 8),
  ('Post estático', 'Caso real', 9)
) as v(format_name, name, sort_order) on v.format_name = f.name
where f.client_id is null;

-- ---------------------------------------------------------------------------
-- Pillars + subpillars
-- ---------------------------------------------------------------------------
insert into public.pillars (name, description, sort_order) values
  ('Autoridad', 'Contenido para posicionar a la marca como referente.', 1),
  ('Educación', 'Contenido para enseñar y generar confianza.', 2),
  ('Comunidad', 'Contenido para humanizar la marca.', 3),
  ('Conversión', 'Contenido para generar consultas y ventas.', 4);

insert into public.subpillars (pillar_id, name, sort_order)
select p.id, v.name, v.sort_order
from public.pillars p
join (values
  ('Autoridad', 'Experiencia', 1),
  ('Autoridad', 'Procesos', 2),
  ('Autoridad', 'Showroom', 3),
  ('Autoridad', 'Envíos', 4),
  ('Autoridad', 'Diferenciales', 5),
  ('Autoridad', 'Casos reales', 6),
  ('Autoridad', 'Resultados', 7),
  ('Autoridad', 'Garantías', 8),
  ('Educación', 'Consejos', 1),
  ('Educación', 'Comparativas', 2),
  ('Educación', 'Mitos', 3),
  ('Educación', 'Errores comunes', 4),
  ('Educación', 'Preguntas frecuentes', 5),
  ('Educación', 'Cómo elegir', 6),
  ('Educación', 'Beneficios', 7),
  ('Educación', 'Recomendaciones', 8),
  ('Comunidad', 'Clientes', 1),
  ('Comunidad', 'Equipo', 2),
  ('Comunidad', 'Detrás de escena', 3),
  ('Comunidad', 'Entregas', 4),
  ('Comunidad', 'Testimonios', 5),
  ('Comunidad', 'Día a día', 6),
  ('Comunidad', 'Humor', 7),
  ('Comunidad', 'Experiencias', 8),
  ('Conversión', 'Promociones', 1),
  ('Conversión', 'Stock', 2),
  ('Conversión', 'Financiación', 3),
  ('Conversión', 'Modelos disponibles', 4),
  ('Conversión', 'Lanzamientos', 5),
  ('Conversión', 'Oferta limitada', 6),
  ('Conversión', 'CTA directo', 7),
  ('Conversión', 'WhatsApp', 8)
) as v(pillar_name, name, sort_order) on v.pillar_name = p.name
where p.client_id is null;

-- ---------------------------------------------------------------------------
-- Story types
-- ---------------------------------------------------------------------------
insert into public.story_types (name, sort_order) values
  ('Encuesta', 1),
  ('Pregunta', 2),
  ('Quiz', 3),
  ('Barra de interacción', 4),
  ('Oferta', 5),
  ('Repost', 6),
  ('Detrás de escena', 7),
  ('Cliente feliz', 8),
  ('Testimonio', 9),
  ('Producto', 10),
  ('FAQ', 11),
  ('Cuenta regresiva', 12),
  ('Novedad', 13),
  ('Promoción', 14),
  ('Video selfie', 15),
  ('Proceso', 16),
  ('Comparativa', 17),
  ('Antes/después', 18);
