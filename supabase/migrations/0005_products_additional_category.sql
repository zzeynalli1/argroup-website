-- AR Group CMS — widen products.category_key to allow the new
-- "additionalProducts" ("Əlavə məhsullar") category, added as the 10th
-- entry in the frontend-controlled taxonomy (src/data/products.js +
-- locales/*/products.json), per the same scope note as 0001_init_schema.sql:
-- categories stay frontend-controlled, this CHECK constraint just mirrors
-- whatever that taxonomy currently allows. Purely additive — no existing
-- row's category_key is affected, no data loss. Safe to re-run.

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
    'marineAnticorrosion',
    'additionalProducts'
  ));
