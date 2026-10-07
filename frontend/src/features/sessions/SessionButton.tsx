import type { AgeRating, Session } from '@/api/types'
import { FormatBadge, LanguageBadge } from '@/components/ui/Badges'
import { formatPrice, hasStarted } from '@/lib/format'
import { useModals } from '@/state/modals'
import { useProtectedAction } from '@/state/useProtectedAction'

/** Opens the booking modal for a session: login → complete profile → age gate, then continues automatically. */
export function useStartBooking() {
  const protect = useProtectedAction()
  const { openBooking } = useModals()
  return (session: Session, ageRating: AgeRating) =>
    protect(() => openBooking(session.id), { requireCompleteProfile: true, ageRating })
}

export function SessionButton({
  session,
  ageRating,
  showVenue = true,
  blockedReason,
}: {
  session: Session
  ageRating: AgeRating
  showVenue?: boolean
  /** Set when the signed-in user is too young for this film. */
  blockedReason?: string
}) {
  const startBooking = useStartBooking()
  const started = hasStarted(session.startsAt)
  const disabled = session.isSoldOut || started || !!blockedReason
  const status = session.isSoldOut ? 'Sold out' : started ? 'Started' : `${session.seatsLeft} seats left`

  return (
    <button
      type="button"
      disabled={disabled}
      title={blockedReason}
      onClick={() => startBooking(session, ageRating)}
      aria-label={`${session.time}, ${session.venue.name} hall ${session.hall.name}, ${session.format.name}, ${session.language.name}, from ${formatPrice(session.price)}, ${status}`}
      className="group flex w-[220px] flex-col gap-2.5 rounded-md border border-line bg-ink-2 p-3.5 text-left transition-colors enabled:hover:border-brass disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`display text-[30px] ${session.isSoldOut ? 'line-through decoration-2' : ''}`}>{session.time}</span>
        <span className="text-sm font-semibold text-brass">from {formatPrice(session.price)}</span>
      </div>
      {showVenue && (
        <p className="truncate text-[13px] text-mute">
          {session.venue.name} · Hall {session.hall.name}
        </p>
      )}
      {!showVenue && <p className="text-[13px] text-mute">Hall {session.hall.name}</p>}
      <div className="flex items-center gap-1.5">
        <FormatBadge format={session.format} />
        <LanguageBadge language={session.language} />
        <span
          className={`ml-auto text-xs font-semibold ${
            session.isSoldOut || started ? 'text-err' : session.seatsLeft <= 10 ? 'text-brass' : 'text-mute'
          }`}
        >
          {status}
        </span>
      </div>
    </button>
  )
}
