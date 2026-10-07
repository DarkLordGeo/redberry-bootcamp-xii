import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { fetchMovie, fetchMovieSessions } from '@/api/endpoints'
import type { MovieDetail } from '@/api/types'
import { AgeBadge, FormatBadge } from '@/components/ui/Badges'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { NotifyButton, Poster } from '@/features/movies/MovieCards'
import { DatePicker } from '@/features/sessions/DatePicker'
import { SessionButton } from '@/features/sessions/SessionButton'
import { formatLongDate, formatReleaseDate, formatRuntime, nextSevenDays, todayISO } from '@/lib/format'
import { addRecentlyViewed } from '@/lib/recentlyViewed'
import { useAuth } from '@/state/auth'
import { ageGateMessage } from '@/state/useProtectedAction'
import NotFoundPage from './NotFoundPage'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-mute">{label}</dt>
      <dd className="mt-1 text-[15px]">{children}</dd>
    </div>
  )
}

function Sessions({ movie }: { movie: MovieDetail }) {
  const { user } = useAuth()
  const week = nextSevenDays()
  const firstAvailable = week.find((d) => movie.availableDates.includes(d)) ?? todayISO()
  const [date, setDate] = useState(firstAvailable)
  const sessions = useQuery({
    queryKey: ['movie-sessions', movie.slug, date],
    queryFn: () => fetchMovieSessions(movie.slug, date),
  })
  const tooYoung = user?.age != null && user.age < movie.ageRating.minAge
  const blocked = tooYoung ? ageGateMessage(movie.ageRating) : undefined

  return (
    <section className="mt-16" aria-labelledby="sessions-heading">
      <div className="flex items-end justify-between gap-8">
        <div>
          <h2 id="sessions-heading" className="display text-[44px]">
            Sessions
          </h2>
          <p className="mt-1 text-mute">{formatLongDate(date)}</p>
        </div>
        <div className="w-[640px]">
          <DatePicker value={date} onChange={setDate} available={movie.availableDates} />
        </div>
      </div>

      {blocked && (
        <div role="alert" className="mt-6 rounded-md border border-err/50 bg-err/10 px-4 py-3 text-[15px] text-err">
          {blocked}
        </div>
      )}

      <div className="mt-8">
        {sessions.isPending ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading sessions">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-56" />
                <div className="mt-4 flex gap-3">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Skeleton key={j} className="h-[96px] w-[220px]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sessions.isError ? (
          <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} title="Sessions didn’t load" />
        ) : sessions.data.length === 0 ? (
          <EmptyState
            title="No sessions on this day"
            body="Pick another date above — days without showtimes are greyed out."
          />
        ) : (
          <div className="space-y-10">
            {sessions.data.map(({ venue, sessions: list }) => (
              <div key={venue.id}>
                <h3 className="text-lg font-semibold">
                  {venue.name} <span className="font-normal text-mute">· {venue.city}</span>
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {list.map((s) => (
                    <SessionButton key={s.id} session={s} ageRating={movie.ageRating} showVenue={false} blockedReason={blocked} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function MoviePage() {
  const { slug = '' } = useParams()
  const movie = useQuery({ queryKey: ['movie', slug], queryFn: () => fetchMovie(slug) })

  useEffect(() => {
    if (movie.data) addRecentlyViewed(movie.data)
  }, [movie.data])

  if (movie.isPending) {
    return (
      <div className="mx-auto max-w-[1600px] px-10 pt-10" aria-busy="true">
        <Skeleton className="h-[440px] w-full rounded-lg" />
        <div className="mt-10 flex gap-10">
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    )
  }
  if (movie.isError) {
    if (movie.error instanceof ApiError && movie.error.status === 404) return <NotFoundPage />
    return (
      <div className="mx-auto max-w-[1600px] px-10 pt-10">
        <ErrorState error={movie.error} onRetry={() => movie.refetch()} title="This film didn’t load" />
      </div>
    )
  }

  const m = movie.data
  return (
    <article>
      <div className="relative h-[460px] overflow-hidden">
        {m.backdropUrl && <img src={m.backdropUrl} alt="" className="absolute inset-0 size-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
      </div>

      <div className="relative mx-auto -mt-64 max-w-[1600px] px-10">
        <div className="flex gap-12">
          <Poster movie={m} className="aspect-[2/3] w-[300px] shrink-0 border border-line shadow-2xl shadow-black/60" />
          <div className="flex min-w-0 flex-1 flex-col pt-24">
            <div className="flex items-center gap-3 text-sm text-mute">
              <AgeBadge rating={m.ageRating} />
              <span>{formatRuntime(m.runtimeMinutes)}</span>
              <span>{m.genres.map((g) => g.name).join(', ')}</span>
              {m.isComingSoon && <span className="font-semibold text-brass">Coming soon</span>}
            </div>
            <h1 className="display mt-4 text-[88px] [text-wrap:balance]">{m.title}</h1>
            <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-screen/85">{m.synopsis}</p>

            <dl className="mt-10 grid max-w-[900px] grid-cols-3 gap-x-10 gap-y-6">
              <Fact label="Age rating">
                <span className="flex items-start gap-2">
                  <AgeBadge rating={m.ageRating} withTooltip={false} />
                  <span className="text-sm text-mute">{m.ageRating.description}</span>
                </span>
              </Fact>
              <Fact label="Release date">{formatReleaseDate(m.releaseDate)}</Fact>
              <Fact label="Duration">{formatRuntime(m.runtimeMinutes)}</Fact>
              <Fact label="Genre">{m.genres.map((g) => g.name).join(', ') || '—'}</Fact>
              <Fact label="Director">{m.director || '—'}</Fact>
              <Fact label="Starring">{m.cast || '—'}</Fact>
              <Fact label="Formats">
                <span className="flex flex-wrap gap-1.5">
                  {m.formats.length ? m.formats.map((f) => <FormatBadge key={f.id} format={f} />) : '—'}
                </span>
              </Fact>
            </dl>
          </div>
        </div>

        {m.isComingSoon ? (
          <section className="mt-16 flex items-center justify-between rounded-lg border border-line bg-ink-2 px-8 py-7">
            <div>
              <h2 className="display text-[36px]">Opens {formatReleaseDate(m.releaseDate)}</h2>
              <p className="mt-1 text-mute">Sessions aren’t on sale yet. Get a heads-up when they are.</p>
            </div>
            <NotifyButton movie={m} />
          </section>
        ) : (
          <Sessions movie={m} />
        )}
      </div>
    </article>
  )
}
