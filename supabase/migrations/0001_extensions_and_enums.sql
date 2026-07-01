-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Roles: 'client' is reserved now (unused) so Stage 2's client portal is an
-- additive ALTER TYPE ... ADD VALUE-free change (already present).
create type user_role as enum (
  'admin',
  'project_manager',
  'designer',
  'editor',
  'copywriter',
  'client'
);

-- The 14-stage production pipeline. Order here matches Kanban column order.
create type content_status as enum (
  'idea',
  'investigacion',
  'guion',
  'diseno',
  'grabacion',
  'edicion',
  'revision_interna',
  'enviado_al_cliente',
  'correcciones',
  'aprobado',
  'programado',
  'publicado',
  'medido',
  'archivado'
);

create type content_priority as enum ('baja', 'media', 'alta', 'urgente');

create type content_kind as enum ('post', 'story', 'reel', 'tiktok');

create type client_status as enum ('activo', 'pausado', 'finalizado', 'prospecto');

create type file_kind as enum ('miniatura', 'archivo_editable', 'archivo_final', 'otro');

create type comment_author_type as enum ('internal', 'client');

create type approval_status as enum ('pending', 'approved', 'rejected', 'changes_requested');

create type notification_type as enum (
  'assigned',
  'status_changed',
  'comment_added',
  'due_soon',
  'overdue',
  'approval_requested',
  'approval_resolved'
);

create type story_status as enum ('idea', 'diseno', 'lista', 'programada', 'publicada', 'archivada');
