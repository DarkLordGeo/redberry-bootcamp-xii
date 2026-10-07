import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTickets, refundOrder } from '@/api/endpoints'
import type { Order } from '@/api/types'
import { FormatBadge, LanguageBadge } from '@/components/ui/Badges'
import { Button, buttonClass } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Poster } from '@/features/movies/MovieCards'
import { formatLongDate, formatPrice } from '@/lib/format'
import { useToast } from '@/state/toast'

type Tab = 'upcoming' | 'past'
const REFUND_CLOSED = 'Refunds close 2 hours before the session starts.'

function TicketCard({ order, onRefund }: { order: Order; onRefund?: (o: Order) => void }) {
  const s = order.session
  const refunded = order.status === 'refunded'
  return (
    <article className="flex gap-6 rounded-lg border border-line bg-ink p-5">
      <Link to={`/movies/${s.movie.slug}`} tabIndex={-1} aria-hidden className="shrink-0">
        <Poster movie={s.movie} className="h-[168px] w-[112px]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">
              <Link to={`/movies/${s.movie.slug}`} className="hover:text-brass">
                {s.movie.title}
              </Link>
            </h3>
            <p className="mt-1 text-[15px] text-mute">
              {s.venue.name} · Hall {s.hall.name} · {formatLongDate(s.date)} · <span className="text-screen">{s.time}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-mute">Order</p>
            <p className="font-semibold">{order.reference}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <FormatBadge format={s.format} />
          <LanguageBadge language={s.language} />
          {refunded && <span className="ml-2 rounded-sm bg-err/15 px-2 py-0.5 text-xs font-semibold text-err">Refunded</span>}
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {order.tickets.map((t) => (
            <li key={t.id} className="rounded-md border border-line px-2.5 py-1 text-sm">
              <span className="font-semibold">{t.seatCode}</span> <span className="text-mute">· {t.ticketType.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <p className="text-[15px]">
            <span className="text-mute">{refunded ? 'Refunded' : 'Total paid'} </span>
            <span className="font-semibold text-brass">{formatPrice(order.totalPrice)}</span>
          </p>
          {onRefund && (
            <div className="flex items-center gap-3">
              {!order.isRefundable && <span className="text-sm text-mute">{REFUND_CLOSED}</span>}
              <Button variant="secondary" size="sm" disabled={!order.isRefundable} title={order.isRefundable ? undefined : REFUND_CLOSED} onClick={() => onRefund(order)}>
                Refund
              </Button>
            </div>
          )}
        </div>
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
    <section aria-labelledby="tickets-heading" className="rounded-lg border border-line bg-ink-2 p-8">
      <div className="flex items-center justify-between gap-6">
        <h2 id="tickets-heading" className="display text-[36px]">
          My Tickets
        </h2>
        <div role="tablist" aria-label="Ticket period" className="flex rounded-md border border-line p-1">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-9 rounded-sm px-5 text-sm font-semibold capitalize ${tab === t ? 'bg-brass text-ink' : 'text-mute hover:text-screen'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6" role="tabpanel">
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
