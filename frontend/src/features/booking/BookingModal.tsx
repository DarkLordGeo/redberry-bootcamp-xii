import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { createHold, fetchHold, fetchSeatMap, fetchSession, releaseHold } from '@/api/endpoints'
import type { Order, Seat, SeatHold, Session, TicketType, TicketTypeSlug } from '@/api/types'
import { FormatBadge, LanguageBadge, AgeBadge } from '@/components/ui/Badges'
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

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: 'seats', label: 'Seats' },
    { id: 'checkout', label: 'Checkout' },
  ] as const
  const activeIndex = step === 'seats' ? 0 : 1
  return (
    <ol className="flex items-center gap-3" aria-label="Booking steps">
      {steps.map((s, i) => {
        const done = i < activeIndex || step === 'done'
        const active = i === activeIndex && step !== 'done'
        return (
          <li key={s.id} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className={`h-px w-10 ${done || active ? 'bg-brass' : 'bg-line'}`} />}
            <span
              className={`grid size-7 place-items-center rounded-full text-sm font-bold ${
                active ? 'bg-velvet text-screen' : done ? 'bg-brass/25 text-brass' : 'bg-ink-3 text-mute'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={`text-sm font-semibold ${active ? 'text-screen' : 'text-mute'}`}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function SessionHeader({ session, step }: { session: Session; step: Step }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-mute">
        <AgeBadge rating={session.movie.ageRating} />
        <span className="text-screen">{session.venue.name}</span>
        <span>Hall {session.hall.name}</span>
        <span>{formatLongDate(session.date)}</span>
        <span className="font-semibold text-screen">{session.time}</span>
        <FormatBadge format={session.format} />
        <LanguageBadge language={session.language} />
      </div>
      <StepIndicator step={step} />
    </div>
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
  return (
    <div className="mx-auto flex max-w-[620px] flex-col items-center py-6 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-ok/15 text-ok">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="display mt-5 text-[48px]">You’re booked</h3>
      <p className="mt-2 text-mute">A confirmation has been sent to {order.contact.email}.</p>
      <p className="mt-6 text-sm text-mute">Order reference</p>
      <p className="display text-[28px] text-velvet">{order.reference}</p>

      <div className="mt-8 w-full rounded-lg border border-line bg-ink p-5 text-left">
        <p className="text-lg font-semibold">{s.movie.title}</p>
        <p className="mt-1 text-sm text-mute">
          {s.venue.name} · Hall {s.hall.name} · {formatLongDate(s.date)} · {s.time} · {s.format.name} · {s.language.name}
        </p>
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {order.tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5 text-[15px]">
              <span>
                Seat <span className="font-semibold">{t.seatCode}</span> · {t.ticketType.name}
              </span>
              <span>{formatPrice(t.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-3 font-semibold">
          <span>Total paid</span>
          <span className="text-brass">{formatPrice(order.totalPrice)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-mute">Card ending {order.cardLastFour}</p>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onTickets}>My Tickets</Button>
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
      title={step === 'done' ? 'Booking confirmed' : title}
      width="max-w-[1240px]"
      header={session.data && step !== 'done' ? <SessionHeader session={session.data} step={step} /> : undefined}
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

          <div className="flex items-start gap-8">
            <div className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-6 py-8">
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

            <aside className="sticky top-0 w-[380px] shrink-0 rounded-lg border border-line bg-ink p-5" aria-label="Order summary">
              {hold && <HoldTimer expiresAt={hold.expiresAt} onExpire={() => expire()} />}
              <h3 className={`text-lg font-semibold ${hold ? 'mt-5' : ''}`}>
                {step === 'seats' ? 'Your seats' : 'Order summary'}
              </h3>
              <p className="mt-1 text-sm text-mute">
                {selection.size} of {maxSeats} seats selected
              </p>

              {step === 'checkout' && hold ? (
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {hold.seats.map((s) => (
                    <li key={s.seatId} className="flex items-center justify-between py-3 text-[15px]">
                      <span>
                        <span className="font-semibold">{s.code}</span>
                        <span className="text-mute"> · {seatIndex.get(s.seatId)?.section}</span>
                        <span className="block text-sm text-mute">{s.ticketType.name}</span>
                      </span>
                      <span>{formatPrice(s.price)}</span>
                    </li>
                  ))}
                </ul>
              ) : lines.length === 0 ? (
                <p className="mt-4 rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
                  Pick seats on the map. You can choose up to {maxSeats}.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {lines.map((l) => (
                    <li key={l.seatId} className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px]">
                            <span className="font-semibold">{l.code}</span>
                            <span className="text-mute"> · {l.section}</span>
                          </p>
                        </div>
                        <label className="sr-only" htmlFor={`tt-${l.seatId}`}>
                          Ticket type for seat {l.code}
                        </label>
                        <select
                          id={`tt-${l.seatId}`}
                          value={l.slug}
                          onChange={(e) =>
                            setSelection((cur) => new Map(cur).set(l.seatId, e.target.value as TicketTypeSlug))
                          }
                          className={`h-9 rounded-md border bg-ink-3 px-2 text-sm outline-none focus:border-velvet ${l.blocked ? 'border-err' : 'border-line'}`}
                        >
                          {ticketTypes.map((t) => (
                            <option key={t.slug} value={t.slug}>
                              {t.name} ({Math.round(t.priceRatio * 100)}%)
                            </option>
                          ))}
                        </select>
                        <span className="w-16 text-right text-[15px]">{formatPrice(l.price)}</span>
                        <button
                          onClick={() => setSelection((cur) => {
                            const next = new Map(cur)
                            next.delete(l.seatId)
                            return next
                          })}
                          aria-label={`Remove seat ${l.code}`}
                          className="text-mute hover:text-screen"
                        >
                          ×
                        </button>
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

              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">{step === 'checkout' ? 'Total' : 'Subtotal'}</span>
                <span className="display text-[28px] text-screen">
                  {formatPrice(step === 'checkout' && hold ? hold.subtotal : subtotal)}
                </span>
              </div>

              {step === 'seats' && (
                <Button
                  size="lg"
                  className="mt-5 w-full"
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
