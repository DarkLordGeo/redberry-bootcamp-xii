import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '@/api/client'

type AuthModal = 'login' | 'register' | null

interface ModalsState {
  authModal: AuthModal
  /** Opens the auth modal; resolves true once signed in, false if dismissed. */
  requestAuth: (start?: 'login' | 'register') => Promise<boolean>
  switchAuth: (to: 'login' | 'register') => void
  finishAuth: (signedIn: boolean) => void
  bookingSessionId: number | null
  openBooking: (sessionId: number) => void
  closeBooking: () => void
}

const ModalsCtx = createContext<ModalsState | null>(null)

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [authModal, setAuthModal] = useState<AuthModal>(null)
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null)
  const waiters = useRef<((ok: boolean) => void)[]>([])

  const requestAuth = useCallback((start: 'login' | 'register' = 'login') => {
    setAuthModal((cur) => cur ?? start)
    return new Promise<boolean>((resolve) => waiters.current.push(resolve))
  }, [])

  const finishAuth = useCallback((signedIn: boolean) => {
    setAuthModal(null)
    const pending = waiters.current
    waiters.current = []
    pending.forEach((resolve) => resolve(signedIn))
  }, [])

  const switchAuth = useCallback((to: 'login' | 'register') => setAuthModal(to), [])

  // Any 401 from a protected endpoint opens the login modal and replays the request afterwards.
  useEffect(() => {
    setUnauthorizedHandler(() => requestAuth('login'))
    return () => setUnauthorizedHandler(null)
  }, [requestAuth])

  const value = useMemo(
    () => ({
      authModal,
      requestAuth,
      switchAuth,
      finishAuth,
      bookingSessionId,
      openBooking: (id: number) => setBookingSessionId(id),
      closeBooking: () => setBookingSessionId(null),
    }),
    [authModal, requestAuth, switchAuth, finishAuth, bookingSessionId],
  )
  return <ModalsCtx.Provider value={value}>{children}</ModalsCtx.Provider>
}

export const useModals = () => {
  const ctx = useContext(ModalsCtx)
  if (!ctx) throw new Error('useModals outside ModalsProvider')
  return ctx
}
