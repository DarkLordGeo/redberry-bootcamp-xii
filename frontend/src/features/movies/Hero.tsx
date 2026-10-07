import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Movie } from '@/api/types'
import { buttonClass } from '@/components/ui/Button'
import { Chip, RatingChip, RuntimeChip } from '@/components/ui/Badges'
import { Skeleton, ErrorState } from '@/components/ui/States'

const ROTATE_MS = 7000

const TicketIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
    <path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v1.5a1.5 1.5 0 000 3V12a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.5a1.5 1.5 0 000-3V6z" transform="rotate(-20 10 9)" />
  </svg>
)

function Arrow({ dir, onClick, label }: { dir: 'prev' | 'next'; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full bg-ink/60 text-screen backdrop-blur hover:bg-ink/80"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={dir === 'prev' ? 'M12 4l-6 6 6 6' : 'M8 4l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/** Featured films: crossfading backdrops, progress bars per slide, prev/next arrows. */
export function Hero({
  movies,
  loading,
  error,
  onRetry,
}: {
  movies: Movie[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
}) {
  const featured = (movies ?? []).slice(0, 4)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = featured.length

  useEffect(() => {
    if (paused || count < 2) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearTimeout(t)
  }, [index, paused, count])

  if (loading) return <Skeleton className="-mt-[72px] h-[600px] w-full rounded-none md:h-[720px]" />
  if (error) {
    return (
      <section className="mx-auto max-w-[1920px] px-4 sm:px-8 xl:px-16 pt-10">
        <ErrorState error={error} onRetry={onRetry} title="Featured films didn’t load" />
      </section>
    )
  }
  if (!count) return null
  const current = featured[index] ?? featured[0]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured films"
      className="relative -mt-[72px] h-[600px] overflow-hidden md:h-[720px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {featured.map((m, i) => (
        <img
          key={m.id}
          src={m.backdropUrl ?? m.posterUrl ?? ''}
          alt=""
          aria-hidden
          className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${
            i === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_12_28/0.85)_0%,rgb(7_12_28/0.45)_45%,transparent_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/70 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1920px] flex-col justify-end px-4 pb-28 sm:px-8 md:pb-36 xl:px-16">
        <div key={current.id} className="max-w-[620px] motion-safe:animate-[fadeUp_700ms_ease-out]">
          <span className="eyebrow inline-block rounded-sm bg-velvet/15 px-2.5 py-1.5 !text-[11px] text-velvet">
            {current.isComingSoon ? 'Coming soon' : 'Now showing'} · {current.genres.map((g) => g.name).slice(0, 2).join(' / ')}
          </span>
          <h1 className="display mt-4 text-[28px] uppercase md:text-[40px] [text-wrap:balance]">{current.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RatingChip rating={current.ageRating} />
            <RuntimeChip minutes={current.runtimeMinutes} />
            {current.formats.map((f) => (
              <Chip key={f.id}>{f.name}</Chip>
            ))}
          </div>
          {current.synopsis && <p className="mt-4 line-clamp-3 max-w-[56ch] leading-[1.3] text-screen/90">{current.synopsis}</p>}
          <div className="mt-6 flex items-center gap-3">
            <Link to={`/movies/${current.slug}`} className={buttonClass('primary', 'md')}>
              <TicketIcon />
              Buy tickets
            </Link>
            <Link to="/sessions" className={buttonClass('secondary', 'md')}>
              All sessions
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 md:bottom-12">
        <div className="mx-auto flex max-w-[1920px] items-center gap-6 px-4 sm:px-8 xl:px-16">
          <div className="flex flex-1 gap-2" role="tablist" aria-label="Choose featured film">
            {featured.map((m, i) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={i === index}
                aria-label={m.title}
                onClick={() => setIndex(i)}
                className="group relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-screen/35 group-hover:bg-screen/60" />
                {i < index && <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-screen" />}
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className={`absolute inset-x-0 top-1/2 h-[3px] origin-left -translate-y-1/2 rounded-full bg-velvet ${
                      paused || count < 2 ? '' : 'motion-safe:animate-[progress_7000ms_linear]'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Arrow dir="prev" label="Previous film" onClick={() => setIndex((i) => (i - 1 + count) % count)} />
            <Arrow dir="next" label="Next film" onClick={() => setIndex((i) => (i + 1) % count)} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes progress { from { transform: translateY(-50%) scaleX(0) } to { transform: translateY(-50%) scaleX(1) } }
      `}</style>
    </section>
  )
}
