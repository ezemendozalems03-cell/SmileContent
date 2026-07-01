-- Shared upload pipeline for both content_items and stories.
-- Storage bucket: content-files (private).
-- Path convention: {client_id}/{content_item_id_or_story_id}/{kind}/{uuid}-{filename}
create table public.files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  kind file_kind not null default 'otro',
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint files_one_parent_check check (
    (content_item_id is not null and story_id is null) or
    (content_item_id is null and story_id is not null)
  )
);

create index files_content_item_idx on public.files(content_item_id);
create index files_story_idx on public.files(story_id);
create index files_client_idx on public.files(client_id);

-- Storage bucket is created via the Supabase dashboard/CLI once the project
-- is connected (private bucket named content-files); see README for the
-- one-time setup step. RLS for storage.objects is defined in 0013.
