-- "Generar con IA" debe poder clasificar lo que genera con la MISMA taxonomia
-- que el resto del pipeline (pilar/subpilar, formato/sub-formato, tipo de
-- contenido = content_objectives), en vez de dejar esas columnas vacias en
-- content_items cuando se guarda una generacion. Se elige en el dialogo y
-- viaja con la generacion para que ademas el prompt tenga en cuenta la
-- clasificacion elegida.
alter table public.ai_generations
  add column pilar_id uuid references public.pillars(id) on delete set null,
  add column subpilar_id uuid references public.subpillars(id) on delete set null,
  add column formato_id uuid references public.formats(id) on delete set null,
  add column sub_formato_id uuid references public.sub_formats(id) on delete set null,
  add column content_objetivo text;
