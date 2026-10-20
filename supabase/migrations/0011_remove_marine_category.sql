-- AR Group CMS — remove the "marineAnticorrosion" product category.
-- The Marine service line (and its matching "Marine and Anti-Corrosion
-- Products" product category) was removed from the frontend taxonomy
-- (src/data/products.js + locales/*/products.json) — this migration
-- narrows products.category_key's CHECK constraint to match, mirroring the
-- same "constraint follows the frontend-controlled taxonomy" approach
-- 0005_products_additional_category.sql used when adding a category.
--
-- BEFORE RUNNING: this DROPs 'marineAnticorrosion' from the allowed set, so
-- any existing row still using it would start violating the constraint.
-- Run this check first in the SQL Editor and confirm it returns 0 rows:
--
--   select id, name, category_key from public.products
--   where category_key = 'marineAnticorrosion';
--
-- If it returns any rows, re-categorize or remove those products first
-- (e.g. via the admin Products UI, or
--   update public.products set category_key = 'additionalProducts'
--   where category_key = 'marineAnticorrosion';
-- ) — only re-run this migration once that query returns 0 rows, or the
-- `add constraint` step below will fail with a check-constraint violation.

alter table public.products
  drop constraint if exists products_category_key_check;

alter table public.products
  add constraint products_category_key_check check (category_key in (
    'vibrationInsulation',
    'soundAcoustic',
    'supportFitting',
    'couplings',
    'passiveFireProtection',
    'thermalInsulation',
    'pipes',
    'fans',
    'additionalProducts'
  ));
