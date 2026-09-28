-- AR Group CMS — storage foundation.
-- One public bucket, `media`, holding all CMS-uploaded images under a
-- folder-per-entity convention:
--   media/projects/<file>
--   media/products/<file>
--   media/brands/<file>
--   media/partners/<file>
--   media/customers/<file>
--   media/awards/<file>
--   media/team/<file>
-- A single bucket keeps setup to one policy set instead of seven; the folder
-- prefixes are a naming convention enforced by upload code (Phase 2+), not by
-- separate storage policies — every authenticated admin may write anywhere
-- in the bucket, which is fine since only the small, known set of admin
-- accounts (Phase 2) will ever hold write access at all.
--
-- Only CMS-managed content belongs in this bucket. 3D models/textures,
-- panorama/environment assets, Services process images, technical
-- illustrations, and decorative/general UI assets stay in the frontend
-- (public/) and are never moved here.
--
-- Team photos are approved to be public (R4) — the About page already shows
-- them publicly on the live site; public read matches that.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB, per the audit's security checklist
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');
