-- AR Group CMS — initial schema (Phase 1 foundation).
-- Derived from the approved CMS scope audit against the actual current
-- frontend data shape (src/data/projects.js, projectDetails.js, brands.js,
-- partners.js, customers.js, awards.js, team.js, products.js,
-- categoryMaterials.js, proflameProducts.js). Nothing has been applied to
-- the real Supabase project yet, so this file is the single clean initial
-- migration for all seven CMS entities — no corrective migrations layered
-- on top. Run this in the Supabase SQL editor (or `supabase db push` via the
-- CLI) against a fresh project. Safe to re-run: every statement is guarded.
--
-- Scope note: product CATEGORIES are intentionally NOT a table here — the
-- 9-category taxonomy stays frontend-controlled (src/data/products.js +
-- locales/*/products.json) per the approved CMS scope. `products.category_key`
-- below is constrained to those 9 existing keys via a CHECK constraint so
-- every CMS-created product still slots into a category the frontend
-- actually renders, without introducing a category table to manage.
--
-- Multilingual convention used throughout: proper nouns (project title,
-- client, brand/partner/customer/team-member name) are single-value columns
-- — matching today's data, where those never differ per locale. Content
-- that's actually written as prose (descriptions, work performed, award
-- title/organization, team member position) gets one column per locale
-- (`_az/_en/_ru/_tr`), matching src/locales' own az-is-primary /
-- en-ru-tr-fall-back-to-az convention (see CLAUDE.md).

-- Shared trigger: keeps `updated_at` current on every UPDATE, for every
-- table below (defined once, reused seven times).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- PROJECTS
-- Mirrors src/data/projects.js (per-project facts) merged with
-- src/data/projectDetails.js (per-locale description/workPerformed) into one
-- table — the two-file split in the current codebase exists only because the
-- detail copy was transcribed later, not because they're logically separate.
--
-- image_url: ONE image per project (approved decision — do not preserve the
-- current frontend's dual imageWebp/imageJpg fallback fields in the
-- database; a single optimized web-friendly image, preferably WebP, is
-- expected). The frontend's <picture>/JPG-fallback markup is adapted later,
-- during explicit frontend integration — out of scope for this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id                 bigint generated always as identity primary key,
  slug               text not null unique,
  title              text not null,               -- proper noun, identical across locales today
  client             text not null,                -- proper noun, identical across locales today
  location           text not null,
  status             text not null check (status in ('ongoing', 'completed')),
  start_date         date,
  end_date           date,                          -- null = ongoing, matches projectDetails.js today
  completion_date    date,                          -- distinct from end_date — see data/projects.js's own header comment; always null today, reserved for later admin entry
  description_az     text,
  description_en     text,
  description_ru     text,
  description_tr     text,
  work_performed_az  text[] not null default '{}',
  work_performed_en  text[] not null default '{}',
  work_performed_ru  text[] not null default '{}',
  work_performed_tr  text[] not null default '{}',
  image_url          text,
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- BRANDS
-- Mirrors src/data/brands.js exactly (the real, named Brands grid).
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id                 bigint generated always as identity primary key,
  name               text not null,
  logo_url           text not null,
  website_url        text,                          -- null = non-clickable, matches brand-10 (AMC Mecanocaucho) today
  -- Presentation-only visual correction (see BrandsSection.jsx / brands.js's
  -- own comment: "tuned by eye against the full rendered grid, not derived
  -- from a formula"). Column exists so no data is lost when brands migrate,
  -- but per the audit's guardrail, the future admin UI should treat this as
  -- a constrained nudge, not a free-form CSS control. Kept ONLY here —
  -- Partners/Customers have no equivalent because their current frontend
  -- has no per-logo visual correction to preserve.
  logo_scale         numeric not null default 1,
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.brands;
create trigger set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PARTNERS
-- src/data/partners.js today is just an array of anonymous logo paths — no
-- name or URL exists anywhere in the current codebase for any of the 7
-- partner logos. `name` is CMS/admin-facing only for now (approved R1): the
-- public frontend is NOT changed by this migration to display it as a
-- caption/tooltip — that's a separate, later frontend decision. `name`
-- stays nullable so existing anonymous logos migrate cleanly and the client
-- fills it in later. `website_url` optional per approved R5 — wiring the
-- actual clickable-link frontend behavior happens later, during explicit
-- frontend integration, not in this schema-only phase.
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id                 bigint generated always as identity primary key,
  name               text,                          -- nullable — unknown for all 7 existing logos today
  logo_url           text not null,
  website_url        text,                          -- optional; null = non-clickable, never "#"
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.partners;
create trigger set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- CUSTOMERS
-- Same shape as Partners minus website_url — src/data/customers.js is also
-- just anonymous logo paths today, and CustomersSection.jsx never renders a
-- link for any customer, so no URL column is added (per the audit: don't
-- add URL capability the current frontend doesn't actually use).
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id                 bigint generated always as identity primary key,
  name               text,                          -- nullable — unknown for all 19 existing logos today
  logo_url           text not null,
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.customers;
create trigger set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AWARDS
-- src/data/awards.js currently holds only two clearly-marked dev placeholders
-- — no real AR Group award is confirmed yet (see docs/argroup-knowledge-base.md,
-- "Known Gaps"). title/organization get per-locale columns since they're
-- CMS-authored prose, not proper nouns. `year` is a nullable integer
-- (approved R6) — never invent a year for incomplete/placeholder awards.
-- ---------------------------------------------------------------------------
create table if not exists public.awards (
  id                 bigint generated always as identity primary key,
  title_az           text,
  title_en           text,
  title_ru           text,
  title_tr           text,
  organization_az    text,
  organization_en    text,
  organization_ru    text,
  organization_tr    text,
  year               integer,                       -- nullable — do not invent a year for unconfirmed awards
  image_url          text,
  description_az     text,
  description_en     text,
  description_ru     text,
  description_tr     text,
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.awards;
create trigger set_updated_at
  before update on public.awards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TEAM_MEMBERS
-- Reproduces the real hierarchy tree in src/data/team.js (TeamTree.jsx) with
-- the simplest relationship that can express it: parent_id self-reference +
-- sort_order for sibling ordering, with NO separate hierarchy_level column
-- (approved R3) — level is fully derivable by walking parent_id, and storing
-- it redundantly would only let it drift out of sync after an edit.
--
-- position is stored as CMS multilingual content (position_az/en/ru/tr), NOT
-- a fixed translation-key lookup into locales/*/about.json (approved R3) —
-- the client must be able to create a new role/title without a developer
-- adding a translation key first. position_az is NOT NULL (every team card
-- always renders a title; az is this project's primary content language —
-- see locales' own az-is-real / others-fall-back-to-az convention);
-- en/ru/tr are nullable and fall back to az at render time, same as the
-- rest of the site's i18n.
--
-- name stays a single nullable column, not per-locale — like brands/
-- partners/customers/project client names, a person's name is a proper noun
-- that doesn't get translated. Nullable because 3 of the 5 current roles
-- have no verified individual attached yet (never invent a name).
--
-- Self-reference safety: a CHECK guards the trivial parent_id = id case
-- declaratively; a BEFORE INSERT/UPDATE trigger walks the full ancestor
-- chain to also reject deeper cycles (A -> B -> A), which a CHECK alone
-- cannot express.
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id                 bigint generated always as identity primary key,
  name               text,                          -- nullable — no verified individual for every role yet
  position_az        text not null,
  position_en        text,
  position_ru        text,
  position_tr        text,
  photo_url          text,
  parent_id          bigint references public.team_members(id) on delete restrict,
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint team_members_no_self_parent check (parent_id is null or parent_id <> id)
);

create index if not exists team_members_parent_id_idx on public.team_members (parent_id);

drop trigger if exists set_updated_at on public.team_members;
create trigger set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

create or replace function public.team_members_prevent_cycle()
returns trigger
language plpgsql
as $$
declare
  current_id bigint;
  hops integer := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  current_id := new.parent_id;
  while current_id is not null loop
    hops := hops + 1;
    if hops > 100 then
      raise exception 'team_members: parent chain too deep or cyclic starting at id=%', new.id;
    end if;
    if current_id = new.id then
      raise exception 'team_members: assigning parent_id=% to id=% would create a cycle', new.parent_id, new.id;
    end if;
    select parent_id into current_id from public.team_members where id = current_id;
  end loop;

  return new;
end;
$$;

drop trigger if exists prevent_cycle on public.team_members;
create trigger prevent_cycle
  before insert or update of parent_id on public.team_members
  for each row when (new.parent_id is not null)
  execute function public.team_members_prevent_cycle();

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- Individual products WITHIN the existing, frontend-owned category taxonomy
-- (see scope note above). Richer than what today's frontend actually renders
-- per product (today: image + name only, except Proflame's 4 items) — this
-- table is the approved final CMS shape the client will author into, not a
-- 1:1 migration of existing rich records.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                 bigint generated always as identity primary key,
  category_key       text not null check (category_key in (
                        'vibrationInsulation',
                        'soundAcoustic',
                        'supportFitting',
                        'couplings',
                        'passiveFireProtection',
                        'thermalInsulation',
                        'pipes',
                        'fans',
                        'marineAnticorrosion'
                      )),
  name               text not null,                -- proper noun (brand/product-line name), identical across locales — matches today's data
  description_az     text,
  description_en     text,
  description_ru     text,
  description_tr     text,
  brand              text,                          -- nullable; distinct from `name` only for Proflame-style items
  external_link      text,
  image_urls         text[] not null default '{}',  -- one or more images; first = primary
  sort_order         integer not null default 0,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Public/anonymous visitors (the live website) may only ever SELECT
-- published rows, and can never insert/update/delete. Only an authenticated
-- session (the future admin — see Phase 2) may write, and may also read
-- unpublished rows for editing. No public write path exists anywhere below,
-- by design. No public sign-up exists in this app.
-- ---------------------------------------------------------------------------
alter table public.projects     enable row level security;
alter table public.brands       enable row level security;
alter table public.partners     enable row level security;
alter table public.customers    enable row level security;
alter table public.awards       enable row level security;
alter table public.team_members enable row level security;
alter table public.products     enable row level security;

grant select on public.projects, public.brands, public.partners, public.customers,
  public.awards, public.team_members, public.products to anon, authenticated;
grant insert, update, delete on public.projects, public.brands, public.partners, public.customers,
  public.awards, public.team_members, public.products to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'projects', 'brands', 'partners', 'customers', 'awards', 'team_members', 'products'
  ] loop
    execute format('drop policy if exists "public_read_published" on public.%I', t);
    execute format(
      'create policy "public_read_published" on public.%I for select to anon using (published = true)', t
    );

    execute format('drop policy if exists "admin_read_all" on public.%I', t);
    execute format(
      'create policy "admin_read_all" on public.%I for select to authenticated using (true)', t
    );

    execute format('drop policy if exists "admin_insert" on public.%I', t);
    execute format(
      'create policy "admin_insert" on public.%I for insert to authenticated with check (true)', t
    );

    execute format('drop policy if exists "admin_update" on public.%I', t);
    execute format(
      'create policy "admin_update" on public.%I for update to authenticated using (true) with check (true)', t
    );

    execute format('drop policy if exists "admin_delete" on public.%I', t);
    execute format(
      'create policy "admin_delete" on public.%I for delete to authenticated using (true)', t
    );
  end loop;
end $$;
