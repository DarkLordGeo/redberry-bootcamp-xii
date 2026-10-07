import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { fetchMovie, fetchMovieSessions } from '@/api/endpoints'
import type { MovieDetail } from '@/api/types'
import { Chip, RatingChip, RuntimeChip } from '@/components/ui/Badges'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { NotifyButton, Poster } from '@/features/movies/MovieCards'
import { DatePicker } from '@/features/sessions/DatePicker'
import { SessionButton } from '@/features/sessions/SessionButton'
import { formatLongDate, formatPrice, formatReleaseDate, nextSevenDays, todayISO } from '@/lib/format'
import { addRecentlyViewed } from '@/lib/recentlyViewed'
import { useAuth } from '@/state/auth'
import { ageGateMessage } from '@/state/useProtectedAction'
import NotFoundPage from './NotFoundPage'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="eyebrow !text-[11px] text-mute">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold">{children}</dd>
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
    <section aria-labelledby="sessions-heading">
      <h2 id="sessions-heading" className="display text-[20px]">
        Sessions
      </h2>
      <p className="mt-2 text-xs text-mute">{formatLongDate(date)}</p>
      <div className="mt-4 w-full max-w-[560px]">
        <DatePicker value={date} onChange={setDate} available={movie.availableDates} />
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
          <div className="space-y-8">
            {sessions.data.map(({ venue, sessions: list }) => {
              const halls = [...new Set(list.map((s) => s.hall.name))]
              return (
                <div key={venue.id}>
                  <h3 className="text-[15px] font-extrabold">
                    {venue.name} <span className="text-xs font-normal text-mute">· {venue.city}</span>
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {halls.map((hall) => (
                      <div key={hall} className="rounded-2xl border border-line/60 p-3">
                        <p className="mb-2.5 px-1 text-xs font-bold text-mute">Hall {hall}</p>
                        <div className="flex flex-wrap gap-2.5">
                          {list
                            .filter((s) => s.hall.name === hall)
                            .map((s) => (
                              <SessionButton key={s.id} session={s} ageRating={movie.ageRating} showVenue={false} blockedReason={blocked} />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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
      <div className="mx-auto max-w-[1920px] px-4 sm:px-8 xl:px-16 pt-10" aria-busy="true">
        <Skeleton className="-mt-[72px] h-[560px] w-full rounded-none" />
        <div className="mt-10 flex gap-10">
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    )
  }
  if (movie.isError) {
    if (movie.error instanceof ApiError && movie.error.status === 404) return <NotFoundPage />
    return (
      <div className="mx-auto max-w-[1920px] px-4 sm:px-8 xl:px-16 pt-10">
        <ErrorState error={movie.error} onRetry={() => movie.refetch()} title="This film didn’t load" />
      </div>
    )
  }

  const m = movie.data
  const restricted = m.ageRating.minAge >= 16
  return (
    <article>
      <div className="relative -mt-[72px] overflow-hidden">
        {m.backdropUrl && <img src={m.backdropUrl} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_12_28/0.9)_0%,rgb(7_12_28/0.55)_50%,rgb(7_12_28/0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
        <div className="relative mx-auto flex max-w-[1920px] flex-col gap-6 px-4 pb-10 pt-[120px] sm:px-8 md:flex-row md:items-end md:gap-12 md:pb-16 md:pt-[136px] xl:px-16">
          <Poster movie={m} className="aspect-[2/3] w-[160px] shrink-0 rounded-2xl md:w-[220px] lg:w-[280px] shadow-2xl shadow-black/60" />
          <div className="min-w-0 max-w-[760px] pb-2">
            <span className="eyebrow text-velvet">
              {m.isComingSoon ? `Coming soon · ${formatReleaseDate(m.releaseDate)}` : m.genres.map((g) => g.name).join(' / ')}
            </span>
            <h1 className="display mt-3 text-[28px] uppercase md:text-[40px] [text-wrap:balance]">{m.title}</h1>
            <p className="mt-4 max-w-[68ch] leading-[1.3] text-screen/90">{m.synopsis}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <RatingChip rating={m.ageRating} />
              <RuntimeChip minutes={m.runtimeMinutes} />
              {m.formats.map((f) => (
                <Chip key={f.id}>{f.name}</Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1920px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-[1fr_360px] lg:gap-16 xl:grid-cols-[1fr_400px] xl:px-16">
        <div className="min-w-0">
          {m.isComingSoon ? (
            <section className="flex flex-col gap-4 rounded-2xl bg-ink-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8 md:py-7">
              <div>
                <h2 className="display text-[20px]">Opens {formatReleaseDate(m.releaseDate)}</h2>
                <p className="mt-2 text-mute">Sessions aren’t on sale yet. Get a heads-up when they are.</p>
              </div>
              <NotifyButton movie={m} />
            </section>
          ) : (
            <Sessions movie={m} />
          )}
        </div>

        <aside aria-labelledby="details-heading">
          <h2 id="details-heading" className="display text-[20px]">
            Details
          </h2>
          <dl className="mt-5 space-y-4">
            <Fact label="Director">{m.director || '—'}</Fact>
            <Fact label="Main cast">{m.cast || '—'}</Fact>
            <Fact label="Genre">{m.genres.map((g) => g.name).join(', ') || '—'}</Fact>
            <Fact label="Duration">{m.runtimeMinutes} minutes</Fact>
            <Fact label="Release date">{formatReleaseDate(m.releaseDate)}</Fact>
            <Fact label="Formats">{m.formats.map((f) => f.name).join(', ') || '—'}</Fact>
            {!m.isComingSoon && <Fact label="From">{formatPrice(m.fromPrice)}</Fact>}
            <Fact label="Age rating">
              <span className="flex items-start gap-2">
                <RatingChip rating={m.ageRating} small />
                <span className="text-xs text-mute">{m.ageRating.description}</span>
              </span>
            </Fact>
          </dl>
          {restricted && (
            <div className="mt-6 rounded-xl border border-brass/40 bg-brass/10 px-4 py-3">
              <p className="eyebrow text-brass">Warning</p>
              <p className="mt-1.5 text-xs leading-[1.3] text-screen/90">
                <span className="font-bold text-velvet">{m.ageRating.code}</span> · {m.ageRating.description}
              </p>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
