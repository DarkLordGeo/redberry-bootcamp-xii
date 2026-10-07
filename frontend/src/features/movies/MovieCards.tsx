import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/api/types'
import { notifyMe } from '@/api/endpoints'
import { AgeBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/States'
import { formatPrice, formatReleaseDate, formatRuntime } from '@/lib/format'
import { useProtectedAction } from '@/state/useProtectedAction'
import { useToast } from '@/state/toast'

export function Poster({ movie, className = '' }: { movie: Pick<Movie, 'posterUrl' | 'title'>; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-md bg-ink-3 ${className}`}>
      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center p-3 text-center text-sm text-mute">{movie.title}</div>
      )}
    </div>
  )
}

/** Now Playing: big poster card with price and a Buy Ticket action. */
export function NowPlayingCard({ movie }: { movie: Movie }) {
  const navigate = useNavigate()
  return (
    <article className="group flex w-[200px] shrink-0 sm:w-[264px] flex-col rounded-2xl bg-ink-2 p-3 transition-colors hover:bg-ink-3">
      <Link to={`/movies/${movie.slug}`} className="block" tabIndex={-1} aria-hidden>
        <Poster movie={movie} className="aspect-[2/3] w-full rounded-xl" />
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-2 px-1 pb-1">
        <h3 className="truncate text-[15px] font-extrabold uppercase">
          <Link to={`/movies/${movie.slug}`}>{movie.title}</Link>
        </h3>
        <div className="flex items-center gap-2 text-xs text-mute">
          <AgeBadge rating={movie.ageRating} />
          <span>{formatRuntime(movie.runtimeMinutes)}</span>
          <span className="ml-auto text-[13px] font-bold text-screen">from {formatPrice(movie.fromPrice)}</span>
        </div>
        <Button size="sm" className="mt-1 w-full" onClick={() => navigate(`/movies/${movie.slug}`)}>
          Buy Ticket
        </Button>
      </div>
    </article>
  )
}

export function NotifyButton({ movie, className = "", size = "md" }: { movie: Movie; className?: string; size?: "sm" | "md" }) {
  const protect = useProtectedAction()
  const qc = useQueryClient()
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: () => notifyMe(movie.slug),
    onSuccess: () => {
      toast.push(`We’ll let you know when ${movie.title} opens.`, 'success')
      // Re-read from the server so the button reflects the stored subscription.
      qc.invalidateQueries({ queryKey: ['movies'] })
      qc.invalidateQueries({ queryKey: ['movie', movie.slug] })
    },
    onError: (e) => toast.push(e.message, 'error'),
  })

  if (movie.isNotified) {
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        ✓ You’ll be notified
      </Button>
    )
  }
  return (
    <Button
      variant="secondary"
      size={size}
      className={className}
      loading={mutation.isPending}
      onClick={() => protect(() => mutation.mutateAsync().then(() => undefined, () => undefined))}
    >
      Notify Me
    </Button>
  )
}

/** Coming Soon: no sessions, so the card leads to details and a Notify Me action — never to seat selection. */
export function ComingSoonCard({ movie }: { movie: Movie }) {
  return (
    <article className="flex w-[180px] shrink-0 sm:w-[232px] flex-col rounded-2xl bg-ink-2 p-3">
      <Link to={`/movies/${movie.slug}`} className="relative block">
        <Poster movie={movie} className="aspect-[2/3] w-full rounded-xl" />
        <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-2 py-1 text-[11px] font-semibold text-brass">
          {formatReleaseDate(movie.releaseDate)}
        </span>
      </Link>
      <h3 className="mt-3 truncate px-1 text-[15px] font-extrabold uppercase">
        <Link to={`/movies/${movie.slug}`}>{movie.title}</Link>
      </h3>
      <div className="mt-2 flex items-center gap-2 px-1 text-xs text-mute">
        <AgeBadge rating={movie.ageRating} />
        <span>{formatRuntime(movie.runtimeMinutes)}</span>
      </div>
      <NotifyButton movie={movie} className="mt-3 w-full" size="sm" />
    </article>
  )
}

export function CardRowSkeleton({ count = 5, width = 'w-[280px]' }: { count?: number; width?: string }) {
  return (
    <div className="flex gap-6 overflow-hidden" aria-busy="true" aria-label="Loading films">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${width} shrink-0`}>
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-4 h-5 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
