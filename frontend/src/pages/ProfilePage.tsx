import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [params] = useSearchParams()
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

  useEffect(() => {
    if (user && params.get('tab') === 'tickets') ticketsRef.current?.scrollIntoView({ block: 'start' })
  }, [user, params])

  if (restoring) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-8 px-10 pt-10">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
        <h1 className="display text-[48px]">Log in to see your profile</h1>
        <p className="text-mute">Your details and tickets live here.</p>
        <Button onClick={() => requestAuth('login')}>Log In</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-10 pt-10">
      <div className="flex items-center gap-5">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <span className="grid size-20 place-items-center rounded-full bg-ink-3 text-3xl font-bold uppercase">
            {(user.fullName ?? user.username).charAt(0)}
          </span>
        )}
        <div>
          <h1 className="display text-[56px]">{user.fullName ?? user.username}</h1>
          <p className="text-mute">@{user.username}</p>
        </div>
      </div>
      <div className="mt-10 space-y-10">
        <ProfileForm key={user.id} user={user} />
        <div ref={ticketsRef} className="scroll-mt-28">
          <MyTickets />
        </div>
      </div>
    </div>
  )
}
