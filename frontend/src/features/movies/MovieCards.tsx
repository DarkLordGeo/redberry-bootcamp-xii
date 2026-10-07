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
    <article className="group flex w-[280px] shrink-0 flex-col">
      <Link to={`/movies/${movie.slug}`} className="block" tabIndex={-1} aria-hidden>
        <Poster movie={movie} className="aspect-[2/3] w-full transition-transform duration-300 group-hover:-translate-y-1" />
      </Link>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <h3 className="text-lg font-semibold leading-snug">
          <Link to={`/movies/${movie.slug}`} className="hover:text-brass">
            {movie.title}
          </Link>
        </h3>
        <div className="flex items-center gap-3 text-sm text-mute">
          <AgeBadge rating={movie.ageRating} />
          <span>{formatRuntime(movie.runtimeMinutes)}</span>
          <span className="ml-auto font-semibold text-brass">from {formatPrice(movie.fromPrice)}</span>
        </div>
        <Button className="mt-2 w-full" onClick={() => navigate(`/movies/${movie.slug}`)}>
          Buy Ticket
        </Button>
      </div>
    </article>
  )
}

export function NotifyButton({ movie, className = '' }: { movie: Movie; className?: string }) {
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
      <Button variant="secondary" disabled className={className}>
        ✓ You’ll be notified
      </Button>
    )
  }
  return (
    <Button
      variant="secondary"
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
    <article className="flex w-[220px] shrink-0 flex-col">
      <Link to={`/movies/${movie.slug}`} className="relative block">
        <Poster movie={movie} className="aspect-[2/3] w-full" />
        <span className="absolute left-2 top-2 rounded-sm bg-ink/85 px-2 py-1 text-xs font-semibold text-brass">
          {formatReleaseDate(movie.releaseDate)}
        </span>
      </Link>
      <h3 className="mt-3 font-semibold leading-snug">
        <Link to={`/movies/${movie.slug}`} className="hover:text-brass">
          {movie.title}
        </Link>
      </h3>
      <div className="mt-1.5 flex items-center gap-3 text-sm text-mute">
        <AgeBadge rating={movie.ageRating} />
        <span>{formatRuntime(movie.runtimeMinutes)}</span>
      </div>
      <NotifyButton movie={movie} className="mt-3 w-full" />
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
