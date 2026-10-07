import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/auth'
import { useModals } from '@/state/modals'
import { Button } from '@/components/ui/Button'
import { SearchBox } from './SearchBox'

export function Logo({ className = 'text-[20px]' }: { className?: string }) {
  return (
    <Link to="/" aria-label="Kino XII home" className={`display uppercase tracking-tight ${className}`}>
      Kino <span className="text-velvet">XII</span>
    </Link>
  )
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function Avatar({ name, src, className = 'size-9 text-xs' }: { name: string; src: string | null; className?: string }) {
  return src ? (
    <img src={src} alt="" className={`${className} rounded-md object-cover`} />
  ) : (
    <span className={`${className} grid place-items-center rounded-md bg-ink-3 font-bold`}>{initials(name)}</span>
  )
}

function ProfileMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null
  const name = user.fullName ?? user.username
  const item = 'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold hover:bg-ink-3'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu — profile ${user.profileComplete ? 'complete' : 'incomplete'}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-ink-2"
      >
        <span className="relative">
          <Avatar name={name} src={user.avatar} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-ink ${user.profileComplete ? 'bg-ok' : 'bg-brass'}`}
          />
        </span>
        <span className="max-w-32 truncate text-sm font-semibold">{name.split(' ')[0]}</span>
        <svg viewBox="0 0 20 20" className={`size-4 text-mute transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-[280px] rounded-2xl border border-line/60 bg-ink p-2 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={name} src={user.avatar} className="size-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="truncate text-xs text-mute">{user.email}</p>
            </div>
          </div>
          {user.profileComplete ? (
            <p className="mx-1 mb-2 rounded-lg bg-ok/15 px-3 py-2.5 text-[13px] font-semibold text-ok">Profile Complete ✓</p>
          ) : (
            <div className="mx-1 mb-2 rounded-lg bg-brass/15 px-3 py-2.5">
              <p className="text-[13px] font-semibold text-brass">Profile incomplete</p>
              <p className="mt-0.5 text-xs text-mute">Please complete your profile to enable booking.</p>
            </div>
          )}
          <button role="menuitem" className={item} onClick={() => navigate('/profile')}>
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="10" cy="7" r="3.2" />
              <path d="M3.8 17c1.1-3 3.4-4.4 6.2-4.4s5.1 1.4 6.2 4.4" strokeLinecap="round" />
            </svg>
            My Profile
          </button>
          <button role="menuitem" className={item} onClick={() => navigate('/profile?tab=tickets')}>
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M3 6.5a1.5 1.5 0 011.5-1.5h11A1.5 1.5 0 0117 6.5v1.8a1.7 1.7 0 000 3.4v1.8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 13.5v-1.8a1.7 1.7 0 000-3.4V6.5z" strokeLinejoin="round" />
            </svg>
            My Tickets
          </button>
          <div className="my-1 border-t border-line" />
          <button role="menuitem" className={`${item} text-velvet`} onClick={() => signOut()}>
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M8 4H5.5A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8M12 13.5L15.5 10 12 6.5M15.5 10H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, restoring } = useAuth()
  const { requestAuth } = useModals()

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1920px] items-center gap-10 px-16">
        <Logo />
        <nav aria-label="Main">
          <NavLink
            to="/sessions"
            className={({ isActive }) => `eyebrow transition-colors ${isActive ? 'text-screen' : 'text-mute hover:text-screen'}`}
          >
            Sessions
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <SearchBox />
          {restoring ? (
            <div className="skeleton h-10 w-40 rounded-full" />
          ) : user ? (
            <ProfileMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => requestAuth('register')}>
                Sign up
              </Button>
              <Button size="sm" variant="light" onClick={() => requestAuth('login')}>
                Log in
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
