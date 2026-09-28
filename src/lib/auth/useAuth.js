import { useContext } from 'react'
import { AuthContext } from './context'

/**
 * useAuth() -> { session, user, loading, signOut }
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
