import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { createHold, fetchHold, fetchSeatMap, fetchSession, releaseHold } from '@/api/endpoints'
import type { Order, Seat, SeatHold, Session, TicketType, TicketTypeSlug } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { formatLongDate, formatPrice } from '@/lib/format'
import { useAuth } from '@/state/auth'
import { useModals } from '@/state/modals'
import { useFilterOptions } from '@/state/queries'
import { ageGateMessage, PROFILE_REQUIRED_MESSAGE } from '@/state/useProtectedAction'
import { CheckoutForm } from './CheckoutForm'
import { HoldTimer } from './HoldTimer'
import { SeatMap } from './SeatMap'

type Step = 'seats' | 'checkout' | 'done'
type Banner = { tone: 'error' | 'warning'; message: string } | null

const HOLD_KEY = (sessionId: number) => `kino.hold.${sessionId}`
const EXPIRED_MESSAGE = 'Your hold time expired. Please re-select your seats.'
const round2 = (n: number) => Math.round(n * 100) / 100

const storage = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v) sessionStorage.setItem(k, v)
      else sessionStorage.removeItem(k)
    } catch {
      /* unavailable */
    }
  },
}

/** Segmented step bar from the design: Seats | Checkout, active half filled red. */
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: 'seats', label: '1. Seats' },
    { id: 'checkout', label: '2. Checkout' },
  ] as const
  return (
    <ol className="grid grid-cols-2 rounded-full bg-ink-3 p-1" aria-label="Booking steps">
      {steps.map((s) => {
        const active = s.id === step
        return (
          <li
            key={s.id}
            aria-current={active ? 'step' : undefined}
            className={`eyebrow rounded-full py-2 text-center !text-[11px] ${active ? 'bg-velvet text-screen' : 'text-mute'}`}
          >
            {s.label}
          </li>
        )
      })}
    </ol>
  )
}

function SessionHeader({ session }: { session: Session }) {
  return (
    <p className="mt-1.5 text-xs text-mute">
      {session.venue.name} · Hall {session.hall.name} · {formatLongDate(session.date)} · {session.time} · {session.format.name} ·{' '}
      {session.language.name}
    </p>
  )
}

function BannerView({ banner, onDismiss }: { banner: Banner; onDismiss: () => void }) {
  if (!banner) return null
  return (
    <div
      role="alert"
      className={`mb-5 flex items-start gap-3 rounded-md border px-4 py-3 text-[15px] ${
        banner.tone === 'error' ? 'border-err/50 bg-err/10 text-err' : 'border-brass/50 bg-brass/10 text-brass'
      }`}
    >
      <span className="flex-1">{banner.message}</span>
      <button onClick={onDismiss} aria-label="Dismiss message" className="opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  )
}

function Confirmation({ order, onTickets, onClose }: { order: Order; onTickets: () => void; onClose: () => void }) {
  const s = order.session
  const counts = order.tickets.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.ticketType.name]: (acc[t.ticketType.name] ?? 0) + 1 }), {})
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center py-4 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-ok text-ink">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="display mt-5 text-[24px]">Booking confirmed!</h3>
      <p className="mt-2 text-sm text-mute">Your tickets are ready. We’ve sent the confirmation to {order.contact.email}.</p>
      <p className="eyebrow mt-5 rounded-full bg-ink-3 px-4 py-2 !text-[11px]">Order {order.reference}</p>

      <div className="mt-6 w-full rounded-2xl bg-ink-3/60 p-5 text-left">
        <div className="flex items-center gap-4 border-b border-line/70 pb-4">
          {s.movie.posterUrl && <img src={s.movie.posterUrl} alt="" className="h-16 w-11 rounded-md object-cover" />}
          <div>
            <p className="font-extrabold uppercase">{s.movie.title}</p>
            <p className="mt-1 text-xs text-mute">
              {s.venue.name} · Hall {s.hall.name} · {formatLongDate(s.date)} · {s.time}
            </p>
          </div>
        </div>
        <dl className="space-y-2.5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Seats</dt>
            <dd className="font-semibold">{order.tickets.map((t) => t.seatCode).join(', ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Tickets</dt>
            <dd className="font-semibold">
              {Object.entries(counts)
                .map(([name, n]) => `${n} × ${name}`)
                .join(', ')}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Card</dt>
            <dd className="font-semibold">•••• {order.cardLastFour}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between border-t border-line/70 pt-4">
          <span className="eyebrow text-mute">Total paid</span>
          <span className="display text-[24px]">{formatPrice(order.totalPrice)}</span>
        </div>
      </div>

      <div className="mt-7 flex gap-3">
        <Button onClick={onTickets}>My Tickets</Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function BookingFlow({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const options = useFilterOptions()
  const session = useQuery({ queryKey: ['session', sessionId], queryFn: () => fetchSession(sessionId) })
  const seatMap = useQuery({ queryKey: ['seats', sessionId], queryFn: () => fetchSeatMap(sessionId), staleTime: 0 })

  const [step, setStep] = useState<Step>('seats')
  const [selection, setSelection] = useState<Map<number, TicketTypeSlug>>(new Map())
  const [lost, setLost] = useState<Set<string>>(new Set())
  const [hold, setHold] = useState<SeatHold | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [banner, setBanner] = useState<Banner>(null)
  const [resuming, setResuming] = useState(() => !!storage.get(HOLD_KEY(sessionId)))

  const maxSeats = options.data?.maxSeatsPerOrder ?? 3
  const ticketTypes: TicketType[] = options.data?.ticketTypes ?? []
  const rating = session.data?.movie.ageRating

  // A refresh mid-checkout resumes the live hold instead of losing the seats.
  useEffect(() => {
    const holdId = storage.get(HOLD_KEY(sessionId))
    if (!holdId) return
    fetchHold(holdId)
      .then((h) => {
        if (h.isLive) {
          setHold(h)
          setSelection(new Map(h.seats.map((s) => [s.seatId, s.ticketType.slug])))
          setStep('checkout')
        } else storage.set(HOLD_KEY(sessionId), null)
      })
      .catch(() => storage.set(HOLD_KEY(sessionId), null))
      .finally(() => setResuming(false))
  }, [sessionId])

  // Seats lookup: id → seat + section (the section is the seat type in the summary).
  const seatIndex = useMemo(() => {
    const idx = new Map<number, { seat: Seat; section: string }>()
    seatMap.data?.sections.forEach((sec) => sec.rows.forEach((r) => r.seats.forEach((seat) => idx.set(seat.id, { seat, section: sec.name }))))
    return idx
  }, [seatMap.data])

  const lines = [...selection.entries()].map(([seatId, slug]) => {
    const info = seatIndex.get(seatId)
    const type = ticketTypes.find((t) => t.slug === slug)
    const price = round2((session.data?.price ?? 0) * (type?.priceRatio ?? 1))
    const blocked =
      type?.blockedFromRatingAge != null && rating != null && rating.minAge >= type.blockedFromRatingAge
        ? `${type.name} tickets aren’t available for ${rating.code} films.`
        : null
    return { seatId, code: info?.seat.code ?? `#${seatId}`, section: info?.section ?? '', slug, type, price, blocked }
  })
  const subtotal = round2(lines.reduce((n, l) => n + l.price, 0))
  const violations = lines.filter((l) => l.blocked)
  const tooYoung = !!rating && user?.age != null && user.age < rating.minAge
  const profileIncomplete = !!user && !user.profileComplete

  const toggleSeat = (seat: Seat) => {
    setBanner(null)
    setSelection((cur) => {
      const next = new Map(cur)
      if (next.has(seat.id)) next.delete(seat.id)
      else if (next.size >= maxSeats) {
        setBanner({ tone: 'warning', message: `You can select up to ${maxSeats} seats per order.` })
        return cur
      } else next.set(seat.id, 'adult')
      return next
    })
  }

  const handleConflict = useCallback(
    (contested: string[], message: string) => {
      // Mark the lost seats sold, drop them, keep the rest, and redraw from the server.
      setLost((cur) => new Set([...cur, ...contested]))
      setSelection((cur) => {
        const next = new Map(cur)
        for (const [id] of next) if (contested.includes(seatIndex.get(id)?.seat.code ?? '')) next.delete(id)
        return next
      })
      setHold(null)
      storage.set(HOLD_KEY(sessionId), null)
      setStep('seats')
      setBanner({
        tone: 'error',
        message: contested.length
          ? `Seat${contested.length > 1 ? 's' : ''} ${contested.join(', ')} ${contested.length > 1 ? 'were' : 'was'} just taken by someone else. Your other seats are still selected.`
          : message,
      })
      seatMap.refetch()
    },
    [seatIndex, seatMap, sessionId],
  )

  const expire = useCallback(
    (message = EXPIRED_MESSAGE) => {
      setHold(null)
      setSelection(new Map())
      storage.set(HOLD_KEY(sessionId), null)
      setStep('seats')
      setBanner({ tone: 'warning', message })
      seatMap.refetch()
    },
    [seatMap, sessionId],
  )

  const holdMutation = useMutation({
    mutationFn: () =>
      createHold(
        sessionId,
        lines.map((l) => ({ seatId: l.seatId, ticketType: l.slug })),
      ),
    onSuccess: (h) => {
      setHold(h)
      storage.set(HOLD_KEY(sessionId), h.holdId)
      setLost(new Set())
      setBanner(null)
      setStep('checkout')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) return handleConflict(err.contested ?? [], err.message)
      if (err instanceof ApiError && err.status === 422 && !err.errors && /profile/i.test(err.message)) {
        onClose()
        navigate('/profile')
        return
      }
      // 422 rule messages (age, session started) are already written for the user.
      setBanner({ tone: 'error', message: err.message })
    },
  })

  const finishOrder = (o: Order) => {
    storage.set(HOLD_KEY(sessionId), null)
    setHold(null)
    setOrder(o)
    setStep('done')
    qc.invalidateQueries({ queryKey: ['tickets'] })
    qc.invalidateQueries({ queryKey: ['sessions'] })
    qc.invalidateQueries({ queryKey: ['movie-sessions'] })
    qc.invalidateQueries({ queryKey: ['seats', sessionId] })
  }

  // Closing without paying gives the seats straight back to everyone else.
  const close = () => {
    if (hold && step !== 'done') {
      releaseHold(hold.holdId).catch(() => undefined)
      storage.set(HOLD_KEY(sessionId), null)
      qc.invalidateQueries({ queryKey: ['seats', sessionId] })
    }
    onClose()
  }

  const title = session.data?.movie.title ?? 'Book tickets'
  const loading = session.isPending || seatMap.isPending || options.isPending || resuming
  const loadError = session.error ?? seatMap.error ?? options.error

  const canContinue =
    !!user && !profileIncomplete && !tooYoung && selection.size > 0 && violations.length === 0 && !holdMutation.isPending

  return (
    <Modal
      open
      onClose={close}
      title={step === 'done' ? <span className="sr-only">Booking confirmed</span> : <span className="uppercase">{title}</span>}
      width={step === 'done' ? 'max-w-[680px]' : 'max-w-[1240px]'}
      header={
        session.data && step !== 'done' ? (
          <div className="flex items-start justify-between gap-6 pr-4">
            <SessionHeader session={session.data} />
            {hold && <HoldTimer expiresAt={hold.expiresAt} onExpire={() => expire()} />}
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex gap-8" aria-busy="true" aria-label="Loading hall map">
          <Skeleton className="h-[520px] flex-1" />
          <Skeleton className="h-[520px] w-[380px]" />
        </div>
      ) : loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => {
            session.refetch()
            seatMap.refetch()
            options.refetch()
          }}
          title="The booking couldn’t load"
        />
      ) : step === 'done' && order ? (
        <Confirmation
          order={order}
          onClose={onClose}
          onTickets={() => {
            onClose()
            navigate('/profile?tab=tickets')
          }}
        />
      ) : (
        <>
          <BannerView banner={banner} onDismiss={() => setBanner(null)} />
          {profileIncomplete && (
            <div role="alert" className="mb-5 rounded-md border border-brass/50 bg-brass/10 px-4 py-3 text-[15px] text-brass">
              {PROFILE_REQUIRED_MESSAGE}
            </div>
          )}
          {tooYoung && rating && (
            <div role="alert" className="mb-5 rounded-md border border-err/50 bg-err/10 px-4 py-3 text-[15px] text-err">
              {ageGateMessage(rating)}
            </div>
          )}

          <div className="flex items-stretch gap-6">
            <div className="min-w-0 flex-1">
              <StepIndicator step={step} />
              <div className="mt-5">
              {step === 'seats' ? (
                <SeatMap
                  map={seatMap.data!}
                  selected={new Set(selection.keys())}
                  lost={lost}
                  onToggle={toggleSeat}
                  disabled={holdMutation.isPending}
                />
              ) : (
                hold &&
                user && (
                  <CheckoutForm
                    hold={hold}
                    user={user}
                    onBack={() => {
                      // Keep the hold: the user still wants these seats.
                      setStep('seats')
                      setBanner(null)
                    }}
                    onPaid={finishOrder}
                    onExpired={expire}
                    onConflict={handleConflict}
                  />
                )
              )}
              </div>
            </div>

            <aside className="flex w-[360px] shrink-0 flex-col" aria-label="Order summary">
              <h3 className="text-[15px] font-extrabold">
                {step === 'seats' ? `Your seats · Max ${maxSeats}` : 'Summary'}
              </h3>
              <p className="mt-1.5 text-xs text-mute">
                {step === 'seats'
                  ? `Pick up to ${maxSeats} seats from the map. Each seat can carry its own ticket type.`
                  : `${selection.size} of ${maxSeats} seats held for you`}
              </p>

              {step === 'checkout' && hold ? (
                <div className="mt-4 rounded-2xl bg-ink-3/60 p-4">
                  <p className="font-extrabold uppercase">{session.data?.movie.title}</p>
                  <p className="mt-1 text-xs text-mute">
                    {session.data && `${formatLongDate(session.data.date)} · ${session.data.time}`}
                  </p>
                  <ul className="mt-3 divide-y divide-line/70 border-t border-line/70">
                    {hold.seats.map((s) => (
                      <li key={s.seatId} className="flex items-center justify-between py-2.5 text-[13px]">
                        <span>
                          <span className="font-bold">{s.code}</span>
                          <span className="text-mute">
                            {' '}
                            · {seatIndex.get(s.seatId)?.section} · {s.ticketType.name}
                          </span>
                        </span>
                        <span className="font-semibold">{formatPrice(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : lines.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-xs text-mute">
                  No seats selected yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {lines.map((l) => (
                    <li key={l.seatId} className={`rounded-2xl bg-ink-3/60 p-3 ${l.blocked ? 'ring-1 ring-err' : ''}`}>
                      <div className="flex items-center gap-3 px-1">
                        <p className="min-w-0 flex-1 text-[13px]">
                          <span className="text-mute">Seat </span>
                          <span className="font-bold">{l.code}</span>
                          <span className="text-mute"> · {l.section}</span>
                        </p>
                        <span className="text-[13px] font-bold">{formatPrice(l.price)}</span>
                        <button
                          onClick={() =>
                            setSelection((cur) => {
                              const next = new Map(cur)
                              next.delete(l.seatId)
                              return next
                            })
                          }
                          aria-label={`Remove seat ${l.code}`}
                          className="grid size-6 place-items-center rounded-full text-mute hover:bg-line hover:text-screen"
                        >
                          ×
                        </button>
                      </div>
                      <div role="radiogroup" aria-label={`Ticket type for seat ${l.code}`} className="mt-2.5 grid grid-cols-3 gap-1.5">
                        {[...ticketTypes]
                          .sort((a, b) => a.priceRatio - b.priceRatio)
                          .map((t) => {
                            const on = t.slug === l.slug
                            return (
                              <button
                                key={t.slug}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => setSelection((cur) => new Map(cur).set(l.seatId, t.slug))}
                                className={`h-8 rounded-full text-[11px] font-bold transition-colors ${
                                  on ? 'bg-velvet text-screen' : 'bg-ink-3 text-mute hover:text-screen'
                                }`}
                              >
                                {t.name} {Math.round(t.priceRatio * 100)}%
                              </button>
                            )
                          })}
                      </div>
                      {l.blocked && (
                        <p className="mt-1.5 text-[13px] text-err" role="alert">
                          Seat {l.code}: {l.blocked}
                        </p>
                      )}
                      {!l.blocked && l.type?.note && <p className="mt-1.5 text-[13px] text-mute">{l.type.note}</p>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="eyebrow text-mute">Subtotal</span>
                <span className="display text-[28px] text-screen">
                  {formatPrice(step === 'checkout' && hold ? hold.subtotal : subtotal)}
                </span>
              </div>

              {step === 'seats' && (
                <Button
                  className="mt-4 w-full"
                  disabled={!canContinue}
                  loading={holdMutation.isPending}
                  onClick={() => holdMutation.mutate()}
                >
                  Next: Checkout
                </Button>
              )}
              {step === 'seats' && violations.length > 0 && (
                <p className="mt-2 text-center text-[13px] text-err">Fix the ticket types above to continue.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </Modal>
  )
}

export function BookingModal() {
  const { bookingSessionId, closeBooking } = useModals()
  if (bookingSessionId == null) return null
  return <BookingFlow key={bookingSessionId} sessionId={bookingSessionId} onClose={closeBooking} />
}
