# Content OS

Sistema operativo interno de producción de contenido para agencias — Etapa 1 (MVP).
Primer cliente: **Smile Motors**.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase (Postgres/Auth/Storage/Realtime) + TanStack React Query + TanStack Table + dnd-kit + FullCalendar + Framer Motion.

## Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (el proyecto todavía no está conectado — ver abajo)

## Puesta en marcha local

```bash
npm install
npm run dev
```

Sin un proyecto de Supabase conectado, la app compila y el shell (login, sidebar, etc.) se puede recorrer, pero cualquier pantalla que lea datos (Dashboard, Clientes, Contenido en el servidor, Settings) va a fallar hasta completar el paso de "Conectar Supabase".

## Conectar Supabase

1. Creá un proyecto nuevo en [supabase.com](https://supabase.com).
2. Copiá `.env.example` a `.env.local` y completá:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings > API).
   - `SUPABASE_SERVICE_ROLE_KEY` (la misma pantalla — nunca la expongas al cliente).
   - `AI_PROVIDER` + la API key del proveedor elegido, para el asistente IA ("Generar con IA", Memoria de Marca y Motor Estratégico) — ver "Proveedor de IA" más abajo.
3. Corré las migraciones de `supabase/migrations/` **en orden** (0001 a 0025) contra tu proyecto:
   - Con la Supabase CLI: `supabase link --project-ref <ref>` y luego `supabase db push`.
   - O pegando cada archivo, en orden, en el SQL Editor del dashboard de Supabase.
4. Creá el bucket de Storage **privado** llamado `content-files` (Storage > New bucket, "Public" desactivado). Las políticas de RLS sobre `storage.objects` ya están en `0013_rls_policies.sql`.
5. (Opcional, solo desarrollo) Corré `supabase/seed.sql` para cargar el cliente Smile Motors y algunas publicaciones de ejemplo.
6. Creá tu propio usuario desde la pantalla de login... en realidad no hay alta pública: el primer usuario admin se crea así:
   - Registrate una vez a través de Supabase Auth (por ejemplo invitándote a vos mismo desde el dashboard de Supabase en Authentication > Users > Invite), lo que dispara el trigger `handle_new_user` y crea tu fila en `profiles` con rol `copywriter`.
   - Promoveté a admin manualmente con SQL: `update public.profiles set role = 'admin' where email = 'tu-email@dominio.com';`
   - Desde ahí, invitá al resto del equipo desde **Configuración > Equipo** dentro de la app.
7. Regenerá los tipos TypeScript desde el esquema real (opcional pero recomendado):
   ```powershell
   ./scripts/gen-types.ps1 -ProjectId <tu-project-ref>
   ```

## Proveedor de IA

Toda la capa de IA (asistente "Generar con IA", Memoria de Marca, Motor Estratégico) pasa por un
único **AI Provider Service** (`src/lib/ai/provider.ts`) — ningún action ni componente llama a un
SDK de proveedor directamente. Cambiar de proveedor es cambiar variables de entorno, nada de código:

```
AI_PROVIDER=anthropic   # o "gemini" u "openai"

ANTHROPIC_API_KEY=...
# ANTHROPIC_MODEL=claude-opus-4-8   (opcional, ese es el default)

GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-3-pro-preview

OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-5.1
```

Solo hace falta la API key del proveedor activo. Para agregar un cuarto proveedor: implementar la
interfaz `AiProvider` (`src/lib/ai/provider-types.ts`) en `src/lib/ai/providers/`, sumarlo al
`switch` de `provider.ts` y a `AI_PROVIDERS` en `src/lib/env.ts`.

## Estructura del proyecto

- `supabase/migrations/` — el esquema completo, en orden. Incluye tablas "stub" (approvals, content_versions, notifications, content_days, etc.) ya preparadas para las Etapas 2 y 3 sin necesitar migraciones que rompan compatibilidad.
- `src/app/(auth)` — login.
- `src/app/(app)` — shell autenticado: dashboard, clientes, contenido (tabla/kanban/calendario), historias, settings.
- `src/lib/actions/` — Server Actions (mutaciones), una por dominio.
- `src/lib/queries/` — hooks de React Query (lecturas del lado cliente para las vistas interactivas: contenido, kanban, calendario, historias, comentarios).
- `src/lib/types/database.types.ts` — tipos de Supabase escritos a mano para que el proyecto compile antes de conectar un proyecto real; se reemplaza mecánicamente por `scripts/gen-types.ps1` una vez conectado.

## Roles

`admin`, `project_manager`, `designer`, `editor`, `copywriter` (Etapa 1). `client` ya existe en el enum de roles, reservado y sin uso, para que el portal de cliente de la Etapa 2 sea aditivo.

## Etapas siguientes

Este build cubre la **Etapa 1** (uso interno). El **portal de cliente**, la **biblioteca de marca**, **Content Day** y el **banco de ideas** tienen su esquema ya preparado pero sin UI (Etapa 2); la **IA**, **métricas automatizadas** y la productización **multi-agencia** quedan para la Etapa 3.
