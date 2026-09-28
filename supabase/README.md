# Supabase — CMS backend foundation (Phase 1)

This directory holds the reproducible SQL for the future admin CMS's
backend. Nothing here is wired into the public site yet — see the Phase 1
report in-conversation for exactly what is and isn't connected.

## Applying the migrations

You need a Supabase project first (see "Manual setup" below). Once you have
one:

1. Open the project's **SQL Editor** in the Supabase dashboard.
2. Paste and run `migrations/0001_init_schema.sql`, then
   `migrations/0002_storage.sql`, in that order.

Both files are safe to re-run (every `create` is guarded with
`if not exists` / `drop ... if exists` / `on conflict`), so re-running them
after a schema tweak won't duplicate anything.

If you prefer the Supabase CLI instead of the dashboard SQL editor:
`supabase link` your project, then `supabase db push` picks up everything in
`migrations/` in filename order.

## Manual setup required (not something code can do for you)

1. Create a Supabase account/project at supabase.com if you don't have one.
2. From **Project Settings → API**, copy the **Project URL** and the
   **publishable key** (NOT the `service_role` / secret key) into your local
   `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — see
   `.env.example` at the repo root.
3. Run the two migration files above via the SQL Editor.
4. When Phase 2 (admin login) is built, create the 1–3 admin accounts under
   **Authentication → Users → Add user** in the dashboard — there is no
   public sign-up form anywhere in this app, by design.

## What's in the schema

Seven CMS entities: `projects`, `brands`, `partners`, `customers`, `awards`,
`team_members`, `products` — see `migrations/0001_init_schema.sql`'s
per-table comments for exactly how each maps to the current `src/data/*.js`
files.

- Product **categories** are intentionally not a table — the existing
  9-category taxonomy stays frontend-controlled; `products.category_key` is
  constrained to those 9 keys via a `check` constraint.
- `partners` / `customers` mirror `src/data/partners.js` / `customers.js`
  (currently anonymous logo lists): `name` is nullable and CMS/admin-facing
  only for now — the public frontend is not changed to display it. `partners`
  has an optional `website_url`; `customers` doesn't, since the current
  frontend never renders a customer link.
- `awards` and `team_members` are new tables with no real data yet (`awards`)
  or only partially-named real data (`team_members`) — see their comments in
  the migration for the exact multilingual/hierarchy strategy.
- `team_members.parent_id` self-references the same table to reproduce the
  real hierarchy tree in `src/data/team.js`; no separate hierarchy-level
  column, and a trigger blocks cyclic parent assignments.
- One storage bucket, `media`, holding all uploaded images under
  `media/projects/`, `media/products/`, `media/brands/`, `media/partners/`,
  `media/customers/`, `media/awards/`, `media/team/` — a folder convention
  for upload code to follow later, not separate buckets/policies.

## Row Level Security

Every table: anonymous/public read is restricted to `published = true`;
any authenticated session can read everything and write everything. There
is no per-admin-user distinction (no roles) — matching the "very small,
fixed set of admin users, no RBAC" requirement. Storage mirrors the same
shape: public read, authenticated-only write, `media` bucket only.
