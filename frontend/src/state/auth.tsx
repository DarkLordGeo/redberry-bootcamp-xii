import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tokenStore } from '@/api/client'
import { fetchMe, logout as apiLogout, type AuthPayload } from '@/api/endpoints'
import type { User } from '@/api/types'

interface AuthState {
  user: User | null
  /** True while restoring a stored session on boot. */
  restoring: boolean
  signIn: (payload: AuthPayload) => void
  signOut: () => Promise<void>
  setUser: (user: User) => void
}

const AuthCtx = createContext<AuthState | null>(null)
export const ME_KEY = ['me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [hasToken, setHasToken] = useState(() => !!tokenStore.get())

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await fetchMe()
      } catch (e) {
        // A 401 here means the stored token is stale: drop it and continue as a guest.
        tokenStore.set(null)
        setHasToken(false)
        throw e
      }
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const signIn = useCallback(
    ({ user, token }: AuthPayload) => {
      tokenStore.set(token)
      qc.setQueryData(ME_KEY, user)
      setHasToken(true)
      // Data that depends on who is signed in (age gates, notify state, tickets).
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    },
    [qc],
  )

  const signOut = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* clear locally regardless */
    }
    tokenStore.set(null)
    setHasToken(false)
    qc.setQueryData(ME_KEY, null)
    qc.removeQueries({ queryKey: ['tickets'] })
    qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
  }, [qc])

  const setUser = useCallback((user: User) => qc.setQueryData(ME_KEY, user), [qc])

  const user = hasToken ? (me.data ?? null) : null
  const value = useMemo(
    () => ({ user, restoring: hasToken && me.isPending, signIn, signOut, setUser }),
    [user, hasToken, me.isPending, signIn, signOut, setUser],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
