import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { AgeRating, User } from '@/api/types'
import { tokenStore } from '@/api/client'
import { fetchMe } from '@/api/endpoints'
import { ME_KEY, useAuth } from './auth'
import { useModals } from './modals'
import { useToast } from './toast'

export const ageGateMessage = (rating: AgeRating) =>
  `This film is rated ${rating.code}. You cannot buy tickets for it with this account.`

export const PROFILE_REQUIRED_MESSAGE = 'Please complete your profile to enable booking.'

interface Options {
  /** Booking-style actions need name, mobile and date of birth. */
  requireCompleteProfile?: boolean
  /** Age gate for the film the action belongs to. */
  ageRating?: AgeRating
}

/**
 * Runs `action` for a signed-in user. Guests get the login modal first and the
 * action continues automatically after they sign in — no second click needed.
 */
export function useProtectedAction() {
  const { user } = useAuth()
  const { requestAuth } = useModals()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()

  return useCallback(
    async (action: (user: User) => void | Promise<void>, opts: Options = {}) => {
      let current = user
      // Session still being restored on boot: wait for it rather than asking a signed-in user to log in.
      if (!current && tokenStore.get()) {
        current = await qc.fetchQuery({ queryKey: ME_KEY, queryFn: fetchMe }).catch(() => null)
      }
      if (!current) {
        const signedIn = await requestAuth('login')
        if (!signedIn) return
        current = qc.getQueryData<User>(ME_KEY) ?? null
        if (!current) return
      }
      if (opts.requireCompleteProfile && !current.profileComplete) {
        toast.push(PROFILE_REQUIRED_MESSAGE, 'warning')
        navigate('/profile')
        return
      }
      if (opts.ageRating && opts.ageRating.minAge > 0 && (current.age ?? 0) < opts.ageRating.minAge) {
        toast.push(ageGateMessage(opts.ageRating), 'error')
        return
      }
      await action(current)
    },
    [user, requestAuth, qc, navigate, toast],
  )
}
