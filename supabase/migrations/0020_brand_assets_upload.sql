-- =============================================================================
-- Biblioteca de marca: adds file-metadata columns to brand_assets (mirroring
-- the shared `files` table shape) and storage RLS for the
-- {client_id}/_brand/{uuid}-{filename} path convention in the existing
-- private `content-files` bucket. brand_assets stays internal-only
-- (is_internal_team_member), no client-portal exposure this round.
-- =============================================================================

alter table public.brand_assets
  add column mime_type text,
  add column size_bytes bigint;

create policy storage_brand_assets_select on storage.objects for select
  using (
    bucket_id = 'content-files'
    and (storage.foldername(name))[2] = '_brand'
    and public.is_internal_team_member((storage.foldername(name))[1]::uuid)
  );

create policy storage_brand_assets_insert on storage.objects for insert
  with check (
    bucket_id = 'content-files'
    and (storage.foldername(name))[2] = '_brand'
    and public.is_internal_team_member((storage.foldername(name))[1]::uuid)
  );

create policy storage_brand_assets_delete on storage.objects for delete
  using (
    bucket_id = 'content-files'
    and (storage.foldername(name))[2] = '_brand'
    and public.is_internal_team_member((storage.foldername(name))[1]::uuid)
  );
