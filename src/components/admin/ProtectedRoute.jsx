import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/useAuth'

function AuthResolvingFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-industrial-950">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-50/20 border-t-ember-600" />
    </div>
  )
}

/**
 * Gates its children on an actual Supabase session, not just hiding UI —
 * while auth state is resolving it shows a minimal loader (never the
 * protected content), and redirects to /admin/login the moment it's clear
 * there's no session.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <AuthResolvingFallback />
  if (!session) return <Navigate to="/admin/login" replace />

  return children
}
