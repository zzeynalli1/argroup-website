import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * This is the single Supabase client for the app — imported by every
 * src/lib/cms/*.js module and the admin auth layer. It stays `null` instead
 * of throwing when the env vars aren't set, so a missing/placeholder .env
 * doesn't break the build.
 *
 * `VITE_SUPABASE_PUBLISHABLE_KEY` is the public "publishable" key, safe to
 * ship in client-side code — every table it can touch is restricted by Row
 * Level Security policies (see supabase/migrations). The service-role key
 * must never appear here or anywhere else in this repo.
 */
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null

if (import.meta.env.DEV && !supabase) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — Supabase client not initialized.',
  )
}
