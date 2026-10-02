-- AR Group CMS — adds optional per-member contact fields to team_members.
-- Both columns are nullable text with no default, so every existing row
-- simply gets phone/email = null on migrate (no data loss, no invented
-- values) and continues to work exactly as before. The admin decides which
-- members get public contact info by filling these in per the approved
-- Team CMS contact-fields spec — never auto-filled from the company's
-- general contact details. Safe to re-run (guarded with IF NOT EXISTS).

alter table public.team_members
  add column if not exists phone text,
  add column if not exists email text;
