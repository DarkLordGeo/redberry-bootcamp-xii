import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Movie } from '@/api/types'
import { AgeBadge } from '@/components/ui/Badges'
import { buttonClass } from '@/components/ui/Button'
import { Skeleton, ErrorState } from '@/components/ui/States'
import { formatPrice, formatRuntime } from '@/lib/format'

const ROTATE_MS = 7000

/** Featured films: crossfading backdrop, marquee title, and a strip of poster tabs to switch. */
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

  useEffect(() => {
    if (paused || featured.length < 2) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % featured.length), ROTATE_MS)
    return () => window.clearTimeout(t)
  }, [index, paused, featured.length])

  if (loading) {
    return (
      <section className="mx-auto max-w-[1920px] px-16 pt-8">
        <Skeleton className="h-[620px] w-full rounded-lg" />
      </section>
    )
  }
  if (error) {
    return (
      <section className="mx-auto max-w-[1920px] px-16 pt-8">
        <ErrorState error={error} onRetry={onRetry} title="Featured films didn’t load" />
      </section>
    )
  }
  if (!featured.length) return null
  const current = featured[index] ?? featured[0]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured films"
      className="mx-auto max-w-[1920px] px-16 pt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[620px] overflow-hidden rounded-lg border border-line/60 bg-ink-2">
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
        {/* Projector-light falloff: the image reads like it's on a screen in a dark room. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_75%,transparent)_38%,transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

        <div key={current.id} className="relative flex h-full max-w-[640px] flex-col justify-end gap-5 p-14 motion-safe:animate-[fadeUp_700ms_ease-out]">
          <div className="flex items-center gap-3 text-sm text-mute">
            <AgeBadge rating={current.ageRating} />
            <span>{formatRuntime(current.runtimeMinutes)}</span>
            <span>{current.genres.map((g) => g.name).join(', ')}</span>
          </div>
          <h1 className="display text-[56px] uppercase text-screen [text-wrap:balance]">{current.title}</h1>
          {current.synopsis && <p className="line-clamp-3 max-w-[56ch] text-[17px] leading-relaxed text-screen/85">{current.synopsis}</p>}
          <div className="mt-2 flex items-center gap-4">
            <Link to={`/movies/${current.slug}`} className={buttonClass('primary', 'lg')}>
              Buy Ticket
            </Link>
            <span className="text-mute">
              from <span className="font-semibold text-screen">{formatPrice(current.fromPrice)}</span>
            </span>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 flex gap-3" role="tablist" aria-label="Choose featured film">
          {featured.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === index}
              aria-label={m.title}
              onClick={() => setIndex(i)}
              className={`relative h-[120px] w-[80px] overflow-hidden rounded-md border-2 transition-all ${
                i === index ? 'border-brass' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {m.posterUrl && <img src={m.posterUrl} alt="" className="size-full object-cover" />}
              {i === index && !paused && featured.length > 1 && (
                <span
                  key={index}
                  className="absolute inset-x-0 bottom-0 h-1 origin-left bg-velvet motion-safe:animate-[progress_7000ms_linear]"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      `}</style>
    </section>
  )
}
