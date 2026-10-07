import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Navbar, Logo } from './Navbar'
import { AuthModals } from '@/features/auth/AuthModals'
import { BookingModal } from '@/features/booking/BookingModal'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-24 border-t border-line/60">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between px-16 py-8 text-xs text-mute">
          <Logo className="text-[16px] text-screen" />
          <p>© {new Date().getFullYear()} Kino XII. All rights reserved.</p>
        </div>
      </footer>
      {/* Auth renders last so a login prompted mid-booking sits on top of the booking modal. */}
      <BookingModal />
      <AuthModals />
      <ScrollRestoration />
    </div>
  )
}
