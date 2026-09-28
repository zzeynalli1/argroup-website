import { supabase } from '../supabase'

const TABLE = 'contact_messages'

const COLUMNS = ['id', 'name', 'email', 'phone', 'service', 'message', 'status', 'created_at', 'updated_at'].join(', ')

// Postgres CHECK constraint violation (0003_contact_messages.sql) — thrown
// if a caller somehow bypasses ContactForm.jsx's own client-side validation
// (e.g. a direct API call) and sends malformed/oversized data.
const CHECK_VIOLATION_CODE = '23514'

function toSafeError(action, error) {
  console.error(`[cms/contactMessages] ${action} failed:`, error)
  if (error?.code === CHECK_VIOLATION_CODE) return new Error('Göndərilən məlumat düzgün formatda deyil.')
  return new Error('Əməliyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.')
}

function requireClient() {
  if (!supabase) throw new Error('Supabase qoşulması mövcud deyil.')
  return supabase
}

/**
 * Public: the ONLY operation an anonymous visitor's session can perform on
 * this table (see the migration's RLS policies — no anon SELECT/UPDATE/
 * DELETE policy exists at all). Never resolves with the inserted row's data
 * back to the caller beyond success/failure, since the public form has no
 * use for it.
 */
export async function submitContactMessage({ name, email, phone, service, message }) {
  const client = requireClient()
  const { error } = await client.from(TABLE).insert({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    service: service || null,
    message: message.trim(),
  })
  if (error) throw toSafeError('submitContactMessage', error)
}

/** Admin: every message, newest first. */
export async function fetchAllMessagesForAdmin() {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).select(COLUMNS).order('created_at', { ascending: false })
  if (error) throw toSafeError('fetchAllMessagesForAdmin', error)
  return data
}

export async function setMessageStatus(id, status) {
  const client = requireClient()
  const { data, error } = await client.from(TABLE).update({ status }).eq('id', id).select(COLUMNS).single()
  if (error) throw toSafeError('setMessageStatus', error)
  return data
}

export async function deleteMessage(id) {
  const client = requireClient()
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw toSafeError('deleteMessage', error)
}
