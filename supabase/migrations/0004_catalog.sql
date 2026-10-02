-- AR Group CMS — catalog PDF management.
-- Adds a singleton `catalog_document` table holding metadata for the one
-- active company/product catalog PDF, and extends the existing `media`
-- Storage bucket (see 0002_storage.sql) to also accept `application/pdf`
-- under a new `catalog/` folder — no new bucket, no new Storage policies:
-- 0002_storage.sql's four `media_*` policies already apply to every path
-- inside the bucket, catalog/ included.
--
-- Only ONE row ever exists (id is pinned to 1 via a CHECK), so "replace the
-- catalog" is a plain upsert on id=1 from the app layer — no uncontrolled
-- list of catalog records, no separate "active" flag needed.

create table if not exists public.catalog_document (
  id          integer primary key default 1,
  file_name   text not null,
  file_path   text not null,      -- Storage object path (media/catalog/...) — admin-internal only, never rendered as user-facing text
  file_url    text not null,      -- public Storage URL — what the public site links to
  file_size   bigint,
  updated_at  timestamptz not null default now(),
  constraint catalog_document_singleton check (id = 1)
);

drop trigger if exists set_updated_at on public.catalog_document;
create trigger set_updated_at
  before update on public.catalog_document
  for each row execute function public.set_updated_at();

-- RLS: public may always read the (single) row — there is no "unpublished"
-- state for a catalog, it either exists or it doesn't. Only authenticated
-- admin sessions may insert/update/delete, and only ever row id=1.
alter table public.catalog_document enable row level security;

grant select on public.catalog_document to anon, authenticated;
grant insert, update, delete on public.catalog_document to authenticated;

drop policy if exists "public_read_catalog" on public.catalog_document;
create policy "public_read_catalog"
  on public.catalog_document for select
  to anon, authenticated
  using (true);

drop policy if exists "admin_insert_catalog" on public.catalog_document;
create policy "admin_insert_catalog"
  on public.catalog_document for insert
  to authenticated
  with check (id = 1);

drop policy if exists "admin_update_catalog" on public.catalog_document;
create policy "admin_update_catalog"
  on public.catalog_document for update
  to authenticated
  using (true)
  with check (id = 1);

drop policy if exists "admin_delete_catalog" on public.catalog_document;
create policy "admin_delete_catalog"
  on public.catalog_document for delete
  to authenticated
  using (true);

-- Extend the existing `media` bucket (created in 0002_storage.sql) to also
-- accept PDFs, and raise its file_size_limit enough for a real catalog PDF.
-- This is a bucket-wide cap — it does NOT loosen the per-image size limit
-- CMS image uploaders already enforce client-side (5 MB, unchanged in
-- src/lib/cms/*.js's own MAX_IMAGE_BYTES checks); it only raises the outer
-- Storage-level ceiling so a legitimate catalog PDF isn't rejected by it.
update storage.buckets
set
  file_size_limit = 20971520, -- 20 MB
  allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'application/pdf']
where id = 'media';
