import type { AgeRating, Session } from '@/api/types'
import { FormatBadge } from '@/components/ui/Badges'
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

  const low = !session.isSoldOut && !started && session.seatsLeft <= 20
  const seatTone = session.isSoldOut || started ? 'text-mute' : low ? 'text-velvet' : 'text-ok'

  return (
    <button
      type="button"
      disabled={disabled}
      title={blockedReason}
      onClick={() => startBooking(session, ageRating)}
      aria-label={`${session.time}, ${session.venue.name} hall ${session.hall.name}, ${session.format.name}, ${session.language.name}, from ${formatPrice(session.price)}, ${status}`}
      className="flex w-[216px] flex-col gap-2 rounded-xl bg-ink-2 p-4 text-left transition-colors enabled:hover:bg-ink-3 enabled:hover:ring-1 enabled:hover:ring-velvet/60 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`display text-[18px] ${session.isSoldOut ? 'line-through decoration-2' : ''}`}>{session.time}</span>
        <FormatBadge format={session.format} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-mute" title={session.language.name}>
          {session.language.name}
        </span>
        <span className={`flex shrink-0 items-center gap-1 font-semibold ${seatTone}`}>
          {!session.isSoldOut && !started && (
            <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden>
              <path d="M2.5 5.5V3.5a1 1 0 011-1h5a1 1 0 011 1v2M1.5 6h9v2.5h-9zM2.5 8.5V10M9.5 8.5V10" stroke="currentColor" strokeWidth="0.8" fill="none" />
            </svg>
          )}
          {session.isSoldOut ? 'Sold out' : started ? 'Started' : `${session.seatsLeft} left`}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold">
          {showVenue ? `${session.venue.name} · ` : ''}Hall {session.hall.name}
        </span>
        <span className="shrink-0 text-sm font-extrabold">
          <span className="text-[11px] font-semibold text-mute">from </span>
          {formatPrice(session.price)}
        </span>
      </div>
    </button>
  )
}
