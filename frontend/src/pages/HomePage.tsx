import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchComingSoon, fetchFeatured, fetchNowPlaying } from '@/api/endpoints'
import { Hero } from '@/features/movies/Hero'
import { CardRowSkeleton, ComingSoonCard, NowPlayingCard, Poster } from '@/features/movies/MovieCards'
import { AgeBadge } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { getRecentlyViewed } from '@/lib/recentlyViewed'
import { formatRuntime } from '@/lib/format'

function Row({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="relative">
      <div ref={ref} className="relative flex snap-x gap-6 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin]" aria-label={label}>
        {children}
      </div>
      <div className="pointer-events-none absolute -top-14 right-0 flex gap-2">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            onClick={() => scroll(d)}
            aria-label={d < 0 ? `Scroll ${label} left` : `Scroll ${label} right`}
            className="pointer-events-auto grid size-10 place-items-center rounded-full border border-line text-mute hover:border-mute hover:text-screen"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={d < 0 ? 'M12 4l-6 6 6 6' : 'M8 4l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto mt-20 max-w-[1600px] px-10">
      <div className="mb-6 flex items-end gap-6 pr-28">
        <h2 className="display text-[44px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
  const featured = useQuery({ queryKey: ['movies', 'featured'], queryFn: fetchFeatured })
  const nowPlaying = useQuery({ queryKey: ['movies', 'now-playing'], queryFn: () => fetchNowPlaying() })
  const comingSoon = useQuery({ queryKey: ['movies', 'coming-soon'], queryFn: () => fetchComingSoon() })
  const recent = getRecentlyViewed()

  return (
    <>
      <Hero movies={featured.data} loading={featured.isPending} error={featured.error} onRetry={() => featured.refetch()} />

      {recent.length > 0 && (
        <Section title="Recently viewed">
          <Row label="Recently viewed films">
            {recent.map((m) => (
              <Link key={m.id} to={`/movies/${m.slug}`} className="group w-[160px] shrink-0 snap-start">
                <Poster movie={m} className="aspect-[2/3] w-full transition-transform group-hover:-translate-y-1" />
                <p className="mt-2 truncate text-sm font-semibold group-hover:text-brass">{m.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-mute">
                  <AgeBadge rating={m.ageRating} withTooltip={false} />
                  {m.isComingSoon ? 'Coming soon' : formatRuntime(m.runtimeMinutes)}
                </div>
              </Link>
            ))}
          </Row>
        </Section>
      )}

      <Section
        title="Now Playing"
        action={
          <Link to="/sessions" className="mb-1.5 text-[15px] font-semibold text-brass hover:underline">
            See All
          </Link>
        }
      >
        {nowPlaying.isPending ? (
          <CardRowSkeleton />
        ) : nowPlaying.isError ? (
          <ErrorState error={nowPlaying.error} onRetry={() => nowPlaying.refetch()} title="Now Playing didn’t load" />
        ) : nowPlaying.data.length === 0 ? (
          <EmptyState title="Nothing is showing right now" body="Check Coming Soon below for what opens next." />
        ) : (
          <Row label="Now playing films">
            {nowPlaying.data.map((m) => (
              <div key={m.id} className="snap-start">
                <NowPlayingCard movie={m} />
              </div>
            ))}
          </Row>
        )}
      </Section>

      <Section title="Coming Soon">
        {comingSoon.isPending ? (
          <CardRowSkeleton width="w-[220px]" count={6} />
        ) : comingSoon.isError ? (
          <ErrorState error={comingSoon.error} onRetry={() => comingSoon.refetch()} title="Coming Soon didn’t load" />
        ) : comingSoon.data.length === 0 ? (
          <EmptyState title="No upcoming releases announced yet" />
        ) : (
          <Row label="Coming soon films">
            {comingSoon.data.map((m) => (
              <div key={m.id} className="snap-start">
                <ComingSoonCard movie={m} />
              </div>
            ))}
          </Row>
        )}
      </Section>
    </>
  )
}
