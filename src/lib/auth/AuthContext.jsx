import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context'
import { supabase } from '../supabase'

/**
 * Restores the Supabase session on mount and keeps it in sync via
 * `onAuthStateChange` (covers sign-in, sign-out, and token refresh in one
 * listener — no separate polling/refresh logic needed).
 *
 * `supabase` is `null` when env vars are missing (see lib/supabase.js);
 * that's treated as "no session" rather than thrown, matching how the
 * client itself degrades.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // No supabase client (missing env) means there's nothing to resolve —
  // start "not loading" instead of setting it from inside the effect body.
  const [loading, setLoading] = useState(() => Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, signOut }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
