-- AR Group CMS — contact form submissions (Phase 8.1).
-- Standalone table for public ContactForm.jsx submissions. Does NOT modify
-- any of the seven existing CMS tables (0001_init_schema.sql) or their RLS.
--
-- Schema mirrors the REAL current form fields (src/components/sections/
-- ContactForm.jsx) exactly — no marketing/CRM fields invented:
--   name     (required, max 100 chars client-side)
--   email    (required, max 254 chars, format-validated client-side)
--   phone    (optional, max 30 chars)
--   service  (optional — the selected service's `key`, e.g.
--              'passiveFireProtection', from src/data/servicesDetail.js;
--              stored as free text, not a foreign key, since the service
--              taxonomy is frontend-owned data, same reasoning as
--              products.category_key's comment in 0001_init_schema.sql —
--              except this is NOT constrained to a fixed list, since unlike
--              products' 9-category taxonomy this list isn't declared
--              frozen, and a mismatch here should never block a real
--              visitor's message from being saved)
--   message  (required, max 2000 chars)
--
-- `status` is the one admin-workflow field approved for this phase (read/
-- unread) — nothing richer (no assignee, no notes, no CRM fields).
--
-- SECURITY MODEL (deliberately asymmetric — see Phase 8.1 §4):
-- Anonymous/public may INSERT only — never SELECT/UPDATE/DELETE, so one
-- visitor can never read another visitor's submission. Authenticated admin
-- may SELECT/UPDATE/DELETE but not INSERT (messages only ever originate
-- from the public form).
--
-- ABUSE SURFACE (documented, not solved here — v1 is intentionally simple
-- per Phase 8.1 §6): allowing anonymous INSERT means any script can flood
-- this table with junk rows — there is no CAPTCHA, honeypot, or rate limit
-- in this migration or in ContactForm.jsx. The length/format CHECK
-- constraints below only guard against malformed/oversized rows, not
-- automated spam volume. If abuse becomes a real problem, future options
-- (not implemented, needs approval): a honeypot field, a Postgres-level
-- rate limit (e.g. cap inserts per IP/time via an edge function in front of
-- this table, since RLS alone can't see the caller's IP), or a CAPTCHA.
create table if not exists public.contact_messages (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) between 1 and 100),
  email        text not null check (char_length(email) between 1 and 254)
                 check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  phone        text check (phone is null or char_length(phone) <= 30),
  service      text check (service is null or char_length(service) <= 100),
  message      text not null check (char_length(message) between 1 and 2000),
  status       text not null default 'unread' check (status in ('unread', 'read')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.contact_messages;
create trigger set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.contact_messages enable row level security;

-- Anonymous visitors may only ever INSERT (and only ever as 'unread' — see
-- the WITH CHECK below, which blocks a malicious client from inserting a
-- row pre-marked 'read'). No anon SELECT/UPDATE/DELETE policy exists at
-- all, which under RLS means those operations are denied outright.
grant insert on public.contact_messages to anon;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "public_insert_message" on public.contact_messages;
create policy "public_insert_message"
  on public.contact_messages for insert
  to anon
  with check (status = 'unread');

drop policy if exists "admin_read_messages" on public.contact_messages;
create policy "admin_read_messages"
  on public.contact_messages for select
  to authenticated
  using (true);

drop policy if exists "admin_update_messages" on public.contact_messages;
create policy "admin_update_messages"
  on public.contact_messages for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_delete_messages" on public.contact_messages;
create policy "admin_delete_messages"
  on public.contact_messages for delete
  to authenticated
  using (true);
