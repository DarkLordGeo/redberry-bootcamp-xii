import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTickets, refundOrder } from '@/api/endpoints'
import type { Order } from '@/api/types'
import { RatingChip } from '@/components/ui/Badges'
import { Button, buttonClass } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Poster } from '@/features/movies/MovieCards'
import { formatLongDate, formatPrice, formatRuntime } from '@/lib/format'
import { useToast } from '@/state/toast'

type Tab = 'upcoming' | 'past'
const REFUND_CLOSED = 'Refunds close 2 hours before the session starts.'

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow !text-[10px] text-mute">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold">{children}</p>
    </div>
  )
}

const refundUntil = (startsAt: string) => {
  const d = new Date(new Date(startsAt).getTime() - 2 * 3600_000)
  return `${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
}

function TicketCard({ order, onRefund }: { order: Order; onRefund?: (o: Order) => void }) {
  const s = order.session
  const refunded = order.status === 'refunded'
  return (
    <article className="flex gap-6 rounded-2xl bg-ink-2 p-5">
      <Link to={`/movies/${s.movie.slug}`} tabIndex={-1} aria-hidden className="shrink-0">
        <Poster movie={s.movie} className="h-[132px] w-[88px] rounded-lg" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[17px] font-extrabold uppercase">
            <Link to={`/movies/${s.movie.slug}`} className="hover:text-velvet-hi">
              {s.movie.title}
            </Link>
          </h3>
          <RatingChip rating={s.movie.ageRating} small />
          <span className="text-xs text-mute">{formatRuntime(s.movie.runtimeMinutes)}</span>
          {refunded && <span className="rounded-md bg-err/15 px-2 py-0.5 text-[11px] font-semibold text-err">Refunded</span>}
        </div>
        <div className="mt-3 flex gap-12">
          <Info label="Date">
            {formatLongDate(s.date)} · {s.time}
          </Info>
          <Info label="Venue">
            {s.venue.name} · Hall {s.hall.name}
          </Info>
          <Info label="Format">
            {s.format.name} · {s.language.name}
          </Info>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span className="eyebrow mr-1 !text-[10px] text-mute">Seats</span>
          {order.tickets.map((t) => (
            <span key={t.id} className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold">
              {t.seatCode} · {t.ticketType.name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex w-[240px] shrink-0 flex-col">
        <p className="eyebrow !text-[10px] text-mute">Order</p>
        <p className="mt-1 text-[13px] font-bold">#{order.reference}</p>
        <div className="mt-auto flex items-end justify-between pb-3">
          <span className="text-xs text-mute">{refunded ? 'Refunded' : 'Total paid'}</span>
          <span className="display text-[22px]">{formatPrice(order.totalPrice)}</span>
        </div>
        {onRefund && (
          <>
            <Button variant="secondary" size="sm" className="w-full" disabled={!order.isRefundable} title={order.isRefundable ? undefined : REFUND_CLOSED} onClick={() => onRefund(order)}>
              Refund
            </Button>
            <p className="mt-2 text-center text-[11px] text-mute">
              {order.isRefundable ? `Refundable until ${refundUntil(s.startsAt)}` : REFUND_CLOSED}
            </p>
          </>
        )}
      </div>
    </article>
  )
}

export function MyTickets() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('view') === 'past' ? 'past' : 'upcoming'
  const qc = useQueryClient()
  const toast = useToast()
  const [confirming, setConfirming] = useState<Order | null>(null)
  const tickets = useQuery({ queryKey: ['tickets', tab], queryFn: () => fetchTickets(tab) })
  const other = useQuery({ queryKey: ['tickets', tab === 'upcoming' ? 'past' : 'upcoming'], queryFn: () => fetchTickets(tab === 'upcoming' ? 'past' : 'upcoming') })
  const counts: Record<Tab, number | undefined> =
    tab === 'upcoming' ? { upcoming: tickets.data?.length, past: other.data?.length } : { past: tickets.data?.length, upcoming: other.data?.length }

  const refund = useMutation({
    mutationFn: (o: Order) => refundOrder(o.reference),
    onSuccess: (o) => {
      toast.push(`Order ${o.reference} refunded. The seats are back on sale.`, 'success')
      setConfirming(null)
      // Re-read both tabs from the server instead of moving the card locally.
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['seats', o.session.id] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (e) => {
      toast.push(e.message, 'error')
      setConfirming(null)
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params)
    next.set('tab', 'tickets')
    if (t === 'past') next.set('view', 'past')
    else next.delete('view')
    setParams(next, { replace: true })
  }

  return (
    <section aria-label="My tickets">
      <div role="tablist" aria-label="Ticket period" className="inline-flex rounded-full bg-ink-2 p-1">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex h-8 items-center gap-2 rounded-full px-4 text-[13px] font-bold capitalize ${tab === t ? 'bg-ink-3 text-screen' : 'text-mute hover:text-screen'}`}
          >
            {t}
            {counts[t] != null && <span className="text-[11px] font-semibold text-mute">{counts[t]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5" role="tabpanel">
        {tickets.isPending ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading tickets">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-[210px] w-full" />
            ))}
          </div>
        ) : tickets.isError ? (
          <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} title="Your tickets didn’t load" />
        ) : tickets.data.length === 0 ? (
          tab === 'upcoming' ? (
            <EmptyState
              title="No upcoming tickets"
              body="When you book a session it will appear here."
              action={
                <Link to="/sessions" className={buttonClass('primary')}>
                  Browse sessions
                </Link>
              }
            />
          ) : (
            <EmptyState title="No past tickets" body="Films you’ve seen and refunded orders will show up here." />
          )
        ) : (
          <div className="space-y-4">
            {tickets.data.map((o) => (
              <TicketCard key={o.id} order={o} onRefund={tab === 'upcoming' ? setConfirming : undefined} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!confirming}
        onClose={() => !refund.isPending && setConfirming(null)}
        title="Refund this order?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirming(null)} disabled={refund.isPending}>
              Keep tickets
            </Button>
            <Button loading={refund.isPending} onClick={() => confirming && refund.mutate(confirming)}>
              Refund {confirming ? formatPrice(confirming.totalPrice) : ''}
            </Button>
          </div>
        }
      >
        {confirming && (
          <p className="text-[15px] text-mute">
            {confirming.session.movie.title}, {formatLongDate(confirming.session.date)} at {confirming.session.time}. Seats{' '}
            {confirming.tickets.map((t) => t.seatCode).join(', ')} go back on sale. This can’t be undone.
          </p>
        )}
      </Modal>
    </section>
  )
}
