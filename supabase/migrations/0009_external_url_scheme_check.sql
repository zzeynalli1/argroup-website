-- AR Group CMS — external URL scheme hardening (security hardening).
-- Adversarial audit finding: brands.website_url, partners.website_url, and
-- products.external_link are free `text` columns with only client-side
-- `type="url"` validation (src/pages/admin/*/*FormModal.jsx) — HTML5
-- `type="url"` accepts any absolute-URL-shaped string, including
-- `javascript:`/`data:`/`file:` schemes, and there was no server-side
-- constraint backing it up. Frontend hardening (reusable validator in
-- src/lib/cms/urlValidation.js, now used by every admin form that writes
-- one of these columns, plus a defensive render-site check before any of
-- them becomes a clickable <a href>) is the primary fix; this migration
-- adds the database-level backstop so the constraint holds even for a
-- direct write that bypasses the admin UI entirely.
--
-- Added as NOT VALID deliberately: this repo has no access to the live
-- project's current data from a migration file, so this constraint must
-- not risk failing to apply against any legitimate URL already stored
-- (NOT VALID skips scanning existing rows at ADD CONSTRAINT time). Every
-- *new* insert/update is checked immediately and rejected if it violates
-- this constraint, regardless of NOT VALID — the exemption is only for
-- rows that already existed before this migration ran. Null is always
-- allowed (these fields are optional); a non-null value must start with
-- `http://` or `https://` (case-insensitive).
--
-- Recommended follow-up once you've confirmed (e.g. via a quick
-- `select website_url from brands where website_url !~* '^https?://'`,
-- repeated for partners.website_url / products.external_link) that no
-- existing row actually violates this:
--   alter table public.brands   validate constraint brands_website_url_scheme_check;
--   alter table public.partners validate constraint partners_website_url_scheme_check;
--   alter table public.products validate constraint products_external_link_scheme_check;
-- This is optional — even left NOT VALID, the constraint already blocks
-- every new write going forward, which is the actual security boundary.

alter table public.brands
  drop constraint if exists brands_website_url_scheme_check;
alter table public.brands
  add constraint brands_website_url_scheme_check
  check (website_url is null or website_url ~* '^https?://')
  not valid;

alter table public.partners
  drop constraint if exists partners_website_url_scheme_check;
alter table public.partners
  add constraint partners_website_url_scheme_check
  check (website_url is null or website_url ~* '^https?://')
  not valid;

alter table public.products
  drop constraint if exists products_external_link_scheme_check;
alter table public.products
  add constraint products_external_link_scheme_check
  check (external_link is null or external_link ~* '^https?://')
  not valid;
