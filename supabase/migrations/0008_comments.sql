-- Comments attach to either a content_item or a story (never both), with a
-- single level of replies. author_type/is_client_visible exist now (default
-- internal/false) so Stage 2 client-visible comments are additive.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_type comment_author_type not null default 'internal',
  is_client_visible boolean not null default false,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_one_parent_check check (
    (content_item_id is not null and story_id is null) or
    (content_item_id is null and story_id is not null)
  )
);

create index comments_content_item_idx on public.comments(content_item_id);
create index comments_story_idx on public.comments(story_id);
create index comments_parent_idx on public.comments(parent_comment_id);

create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();
