import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchSessions } from '@/api/endpoints'
import type { SessionSort } from '@/api/types'
import { AgeBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { FiltersSidebar } from '@/features/sessions/FiltersSidebar'
import { SessionButton } from '@/features/sessions/SessionButton'
import { useSessionFilters } from '@/features/sessions/useSessionFilters'
import { Poster } from '@/features/movies/MovieCards'
import { formatLongDate, formatRuntime } from '@/lib/format'
import { useFilterOptions } from '@/state/queries'
import { useAuth } from '@/state/auth'
import { ageGateMessage } from '@/state/useProtectedAction'

const SORT_LABELS: Record<SessionSort, string> = {
  time_asc: 'Showtime: Earliest First',
  time_desc: 'Showtime: Latest First',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  title_asc: 'Title: A–Z',
}

function ListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading sessions">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-6 rounded-lg border border-line p-5">
          <Skeleton className="h-[150px] w-[100px] shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-1/5" />
            <div className="flex gap-3 pt-2">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-[104px] w-[220px]" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SessionsPage() {
  const filters = useSessionFilters()
  const { query, setSort, setPage, clearAll, activeCount } = filters
  const options = useFilterOptions()
  const { user } = useAuth()
  const sessions = useQuery({ queryKey: ['sessions', query], queryFn: () => fetchSessions(query) })

  const sortOptions = options.data?.sorts ?? (Object.keys(SORT_LABELS) as SessionSort[]).map((id) => ({ id, label: SORT_LABELS[id] }))

  return (
    <div className="mx-auto max-w-[1920px] px-16 pt-10">
      <h1 className="display text-[24px]">Sessions</h1>
      <p className="mt-2 text-xs text-mute">Showtimes across all venues · {formatLongDate(query.date)}</p>

      <div className="mt-8 flex items-start gap-8">
        <FiltersSidebar
          options={options.data}
          loading={options.isPending}
          error={options.error}
          onRetry={() => options.refetch()}
          filters={filters}
        />

        <section className="min-w-0 flex-1" aria-labelledby="results-count">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p id="results-count" className="text-[13px] font-semibold" aria-live="polite">
              {sessions.isPending
                ? 'Finding sessions…'
                : sessions.data?.meta.totalSessions
                  ? `Showing ${sessions.data.meta.totalSessions} sessions`
                  : 'No sessions found'}
            </p>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-mute">Sort:</span>
              <select
                value={query.sort}
                onChange={(e) => setSort(e.target.value as SessionSort)}
                className="h-9 cursor-pointer rounded-full bg-transparent pr-2 text-[13px] font-bold outline-none focus-visible:ring-1 focus-visible:ring-velvet [&>option]:bg-ink-2"
              >
                {sortOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {SORT_LABELS[s.id] ?? s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {sessions.isPending ? (
            <ListSkeleton />
          ) : sessions.isError ? (
            <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} title="Sessions didn’t load" />
          ) : sessions.data.data.length === 0 ? (
            <EmptyState
              title="No sessions match these filters"
              body="Try another date, or remove a filter to see more showtimes."
              action={
                activeCount > 0 ? (
                  <Button variant="secondary" onClick={clearAll}>
                    Clear All Filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ol className="divide-y divide-line/70">
                {sessions.data.data.map(({ movie, sessions: list }) => {
                  // Guests can still click; the age check runs after they sign in.
                  const tooYoung = user?.age != null && user.age < movie.ageRating.minAge
                  return (
                    <li key={movie.id} className="py-6 first:pt-0">
                      <div className="flex items-center gap-4">
                        <Link to={`/movies/${movie.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
                          <Poster movie={movie} className="h-[60px] w-[42px] rounded-md" />
                        </Link>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-[17px] font-extrabold">
                              <Link to={`/movies/${movie.slug}`} className="hover:text-velvet-hi">
                                {movie.title}
                              </Link>
                            </h2>
                            <AgeBadge rating={movie.ageRating} />
                          </div>
                          <p className="mt-1 text-xs text-mute">{formatRuntime(movie.runtimeMinutes)}</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        {tooYoung && <p className="mt-1 text-sm text-err">{ageGateMessage(movie.ageRating)}</p>}
                        <div className="mt-4 flex flex-wrap gap-3">
                          {list.map((s) => (
                            <SessionButton
                              key={s.id}
                              session={s}
                              ageRating={movie.ageRating}
                              blockedReason={tooYoung ? ageGateMessage(movie.ageRating) : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-8">
                <Pagination
                  page={sessions.data.meta.currentPage}
                  lastPage={sessions.data.meta.lastPage}
                  onChange={(p) => {
                    setPage(p)
                    window.scrollTo({ top: 0 })
                  }}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
