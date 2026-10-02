-- AR Group CMS — Team Categories.
-- Adds a small, admin-managed organizational grouping for team members,
-- kept strictly independent of the existing parent_id reporting hierarchy
-- (see team_members.parent_id / the prevent_cycle trigger in
-- 0001_init_schema.sql — that relationship is untouched here). Category
-- names are NOT hardcoded anywhere in the frontend: the client creates
-- whichever categories match their real organization via Admin ->
-- Haqqımızda -> Komandamız -> Kateqoriyalar.
--
-- name_az is NOT NULL (this project's primary content language — same
-- az-is-real / others-fall-back-to-az convention as team_members.position_*
-- and every other multilingual column in this schema); name_en/ru/tr are
-- nullable and fall back to az at render time.
--
-- team_members.category_id is nullable and ON DELETE RESTRICT — a category
-- currently assigned to any member cannot be deleted (the app layer turns
-- that FK violation into a friendly warning, same pattern already used for
-- team_members.parent_id's own RESTRICT). Existing team_members rows get
-- category_id = null; nothing is auto-assigned to an invented category.
-- ---------------------------------------------------------------------------

create table if not exists public.team_categories (
  id          bigint generated always as identity primary key,
  name_az     text not null,
  name_en     text,
  name_ru     text,
  name_tr     text,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.team_categories;
create trigger set_updated_at
  before update on public.team_categories
  for each row execute function public.set_updated_at();

alter table public.team_members
  add column if not exists category_id bigint references public.team_categories(id) on delete restrict;

create index if not exists team_members_category_id_idx on public.team_members (category_id);

-- RLS: same public_read_published / admin_read_all / admin_insert /
-- admin_update / admin_delete shape every other CMS table already uses
-- (see 0001_init_schema.sql's own policy loop) — written out directly here
-- rather than editing that already-applied migration.
alter table public.team_categories enable row level security;

grant select on public.team_categories to anon, authenticated;
grant insert, update, delete on public.team_categories to authenticated;

drop policy if exists "public_read_published" on public.team_categories;
create policy "public_read_published" on public.team_categories for select to anon using (published = true);

drop policy if exists "admin_read_all" on public.team_categories;
create policy "admin_read_all" on public.team_categories for select to authenticated using (true);

drop policy if exists "admin_insert" on public.team_categories;
create policy "admin_insert" on public.team_categories for insert to authenticated with check (true);

drop policy if exists "admin_update" on public.team_categories;
create policy "admin_update" on public.team_categories for update to authenticated using (true) with check (true);

drop policy if exists "admin_delete" on public.team_categories;
create policy "admin_delete" on public.team_categories for delete to authenticated using (true);
