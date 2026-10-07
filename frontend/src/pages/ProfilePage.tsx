import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTickets } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/States'
import { MyTickets } from '@/features/profile/MyTickets'
import { ProfileForm } from '@/features/profile/ProfileForm'
import { useAuth } from '@/state/auth'
import { useModals } from '@/state/modals'

export default function ProfilePage() {
  const { user, restoring } = useAuth()
  const { requestAuth } = useModals()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const upcoming = useQuery({ queryKey: ['tickets', 'upcoming'], queryFn: () => fetchTickets('upcoming'), enabled: !!user })
  const upcomingCount = upcoming.data?.length ?? 0
  const ticketsRef = useRef<HTMLDivElement>(null)
  const asked = useRef(false)

  // Guests landing here get the login modal; the page fills in once they sign in.
  useEffect(() => {
    if (!restoring && !user && !asked.current) {
      asked.current = true
      requestAuth('login').then((ok) => {
        if (!ok) navigate('/', { replace: true })
      })
    }
  }, [restoring, user, requestAuth, navigate])


  if (restoring) {
    return (
      <div className="mx-auto max-w-[1920px] space-y-8 px-16 pt-10">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
        <h1 className="display text-[32px]">Log in to see your profile</h1>
        <p className="text-mute">Your details and tickets live here.</p>
        <Button onClick={() => requestAuth('login')}>Log In</Button>
      </div>
    )
  }

  const tab = params.get('tab') === 'tickets' ? 'tickets' : 'info'
  const setTab = (t: 'info' | 'tickets') => setParams(t === 'tickets' ? { tab: 'tickets' } : {}, { replace: true })
  const tabClass = (on: boolean) =>
    `relative -mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors ${
      on ? 'border-velvet text-screen' : 'border-transparent text-mute hover:text-screen'
    }`

  return (
    <div className="mx-auto max-w-[1920px] px-16 pt-10">
      <h1 className="display text-[24px]">My Profile</h1>
      <div role="tablist" aria-label="Profile sections" className="mt-6 flex gap-8 border-b border-line/70">
        <button role="tab" aria-selected={tab === 'info'} className={tabClass(tab === 'info')} onClick={() => setTab('info')}>
          Personal information
          {!user.profileComplete && <span className="size-2 rounded-full bg-brass" aria-label="incomplete" />}
        </button>
        <button role="tab" aria-selected={tab === 'tickets'} className={tabClass(tab === 'tickets')} onClick={() => setTab('tickets')}>
          My Tickets
          {upcomingCount > 0 && (
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-velvet px-1 text-[10px] font-bold text-screen">
              {upcomingCount}
            </span>
          )}
        </button>
      </div>
      <div ref={ticketsRef} className="mt-8" role="tabpanel">
        {tab === 'info' ? <ProfileForm key={user.id} user={user} /> : <MyTickets />}
      </div>
    </div>
  )
}
