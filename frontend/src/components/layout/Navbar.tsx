import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/auth'
import { useModals } from '@/state/modals'
import { useProtectedAction } from '@/state/useProtectedAction'
import { Button } from '@/components/ui/Button'
import { SearchBox } from './SearchBox'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Kino XII home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="7" fill="var(--color-ink-3)" />
        <path d="M8 22c0-5 3.6-9 8-9s8 4 8 9" fill="none" stroke="var(--color-brass)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="11" cy="24" r="1.8" fill="var(--color-velvet)" />
        <circle cx="16" cy="24" r="1.8" fill="var(--color-velvet)" />
        <circle cx="21" cy="24" r="1.8" fill="var(--color-velvet)" />
      </svg>
      <span className="display text-[26px]">Kino XII</span>
    </Link>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-[15px] font-medium transition-colors ${isActive ? 'text-screen' : 'text-mute hover:text-screen'}`

export function Navbar() {
  const { user, restoring, signOut } = useAuth()
  const { requestAuth } = useModals()
  const protect = useProtectedAction()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-8 px-10">
        <Logo />
        <nav className="flex items-center gap-1" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/sessions" className={navClass}>
            Sessions
          </NavLink>
          <button
            className="rounded-md px-3 py-2 text-[15px] font-medium text-mute hover:text-screen"
            onClick={() => protect(() => navigate('/profile?tab=tickets'))}
          >
            My Tickets
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <SearchBox />
          {restoring ? (
            <div className="skeleton h-10 w-40" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-3 hover:bg-ink-2"
                aria-label={`Profile — ${user.profileComplete ? 'complete' : 'incomplete'}`}
              >
                <span className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-ink-3 text-sm font-bold uppercase">
                      {(user.fullName ?? user.username).charAt(0)}
                    </span>
                  )}
                  <span
                    className={`absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-ink ${user.profileComplete ? 'bg-ok' : 'bg-brass'}`}
                    title={user.profileComplete ? 'Profile complete' : 'Profile incomplete'}
                  />
                </span>
                <span className="max-w-32 truncate text-sm font-semibold">{user.username}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => requestAuth('login')}>
                Log In
              </Button>
              <Button size="sm" onClick={() => requestAuth('register')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
