import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../lib/auth/useAuth'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/ui/Logo'

const FIELD_CLASSES =
  'w-full rounded-sm border border-base-50/15 bg-industrial-950/50 py-3.5 pl-4 pr-11 text-sm text-base-50 placeholder:text-neutral-custom-400 outline-none transition-colors focus:border-ember-600'

/**
 * Email/password only — no signup, magic link, social, or forgot-password
 * flow (Phase 2 scope). Supabase error details are never shown to the
 * user; `signInWithPassword` failures collapse to one generic message.
 */
export default function AdminLogin() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-industrial-950">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-50/20 border-t-ember-600" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!supabase) {
      setError('Admin girişi hazırda əlçatan deyil.')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('E-poçt və ya şifrə yanlışdır.')
      setSubmitting(false)
      return
    }

    // Success: onAuthStateChange updates the shared session and this
    // component re-renders into the `session` redirect above.
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-industrial-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo className="h-12" inverted showBackground />
        </div>

        <div className="rounded-sm border border-base-50/10 bg-industrial-900 p-8">
          <h1 className="font-heading text-xl font-bold text-base-50">Admin girişi</h1>
          <span aria-hidden="true" className="mt-3 block h-px w-10 bg-ember-600" />
          <p className="mt-3 text-sm text-neutral-custom-400">
            Sayt məzmununun idarəetmə panelinə daxil olun.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                E-poçt
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-poçt"
                  className={FIELD_CLASSES}
                />
                <Mail
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Şifrə
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifrə"
                  className={FIELD_CLASSES}
                />
                <Lock
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-custom-400"
                />
              </div>
            </div>

            {error && <p className="text-sm text-ember-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-ember-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-base-50 transition-colors hover:bg-ember-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Daxil olunur…' : 'Daxil ol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
