-- AR Group CMS — Storage write-policy folder scoping (security hardening,
-- defense in depth).
--
-- Adversarial audit finding: media_admin_insert/update/delete (see
-- 0002_storage.sql) only check `bucket_id = 'media'` — any authenticated
-- session can write/overwrite/delete ANY object anywhere in the bucket, not
-- just inside the folder-per-entity convention the upload code actually
-- uses. Not independently exploitable today (anon has no Storage write
-- grant at all, and public self-signup/anonymous sign-in are confirmed
-- disabled on this project), but worth tightening as defense in depth per
-- the audit's recommendation, without touching the already-applied
-- 0002_storage.sql.
--
-- The folder list below is derived directly from the real upload code, not
-- guessed — every `STORAGE_FOLDER` constant actually used by an `.upload()`
-- call in src/lib/cms/*.js, confirmed by reading each file:
--   src/lib/cms/projects.js      -> 'projects'
--   src/lib/cms/products.js      -> 'products'
--   src/lib/cms/brands.js        -> 'brands'
--   src/lib/cms/partners.js      -> 'partners'
--   src/lib/cms/customers.js     -> 'customers'
--   src/lib/cms/awards.js        -> 'awards'
--   src/lib/cms/teamMembers.js   -> 'team'
--   src/lib/cms/catalog.js       -> 'catalog'
-- (team_categories has no image/upload of its own — teamMembers.js's 'team'
-- folder already covers every team-related photo.) If a future CMS area
-- adds a new upload folder, it must be added to this list too, or its
-- uploads will be rejected by these policies.
--
-- Public read (`media_public_read`) is untouched — still applies to the
-- whole bucket, since every object currently in it is meant to be publicly
-- servable. Only the authenticated-write policies are narrowed.

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (
      name like 'projects/%'
      or name like 'products/%'
      or name like 'brands/%'
      or name like 'partners/%'
      or name like 'customers/%'
      or name like 'awards/%'
      or name like 'team/%'
      or name like 'catalog/%'
    )
  );

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (
      name like 'projects/%'
      or name like 'products/%'
      or name like 'brands/%'
      or name like 'partners/%'
      or name like 'customers/%'
      or name like 'awards/%'
      or name like 'team/%'
      or name like 'catalog/%'
    )
  )
  with check (
    bucket_id = 'media'
    and (
      name like 'projects/%'
      or name like 'products/%'
      or name like 'brands/%'
      or name like 'partners/%'
      or name like 'customers/%'
      or name like 'awards/%'
      or name like 'team/%'
      or name like 'catalog/%'
    )
  );

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (
      name like 'projects/%'
      or name like 'products/%'
      or name like 'brands/%'
      or name like 'partners/%'
      or name like 'customers/%'
      or name like 'awards/%'
      or name like 'team/%'
      or name like 'catalog/%'
    )
  );
