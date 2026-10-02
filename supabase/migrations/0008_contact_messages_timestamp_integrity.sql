-- AR Group CMS — contact_messages timestamp integrity (security hardening).
-- Adversarial audit finding: the public_insert_message policy (see
-- 0003_contact_messages.sql) correctly pins `status = 'unread'` via its
-- WITH CHECK, but created_at/updated_at are ordinary timestamptz columns
-- with only a `default now()` — nothing stops an anon client from bypassing
-- ContactForm.jsx and sending an explicit, attacker-chosen value for either
-- column directly (e.g. `supabase.from('contact_messages').insert({...,
-- created_at: '2020-01-01'})`), letting a submission's recorded timestamp be
-- forged. `set_updated_at()` doesn't help here — it only fires BEFORE
-- UPDATE, never BEFORE INSERT.
--
-- Fix: a dedicated BEFORE INSERT trigger that unconditionally overwrites
-- both columns with now(), the same "the database decides, not the client"
-- pattern set_updated_at() already uses for updates. This only affects new
-- inserts going forward — existing rows and their historical timestamps are
-- untouched, and every existing capability (anonymous submission, admin
-- read/mark-read/mark-unread/delete) is unaffected since none of them write
-- created_at/updated_at themselves.
create or replace function public.contact_messages_force_insert_timestamps()
returns trigger
language plpgsql
as $$
begin
  new.created_at = now();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists force_insert_timestamps on public.contact_messages;
create trigger force_insert_timestamps
  before insert on public.contact_messages
  for each row execute function public.contact_messages_force_insert_timestamps();
