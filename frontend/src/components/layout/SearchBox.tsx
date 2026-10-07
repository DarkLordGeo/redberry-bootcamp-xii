import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { searchMovies } from '@/api/endpoints'
import { buttonClass } from '@/components/ui/Button'
import { formatPrice, formatRuntime } from '@/lib/format'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Bolds the part of the title that matches the query, as in the design. */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0 || !query) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-extrabold">{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  )
}

const SearchIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="9" r="5.5" />
    <path d="M13.5 13.5L17 17" strokeLinecap="round" />
  </svg>
)

function Prompt({ icon, title, body, onBrowse }: { icon: ReactNode; title: string; body: string; onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-ink-3">{icon}</span>
      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-1 text-[13px] text-mute">{body}</p>
      <button type="button" onClick={onBrowse} className={`${buttonClass('secondary', 'sm')} mt-5`}>
        Browse all sessions
      </button>
    </div>
  )
}

export function SearchBox() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounced = useDebounced(q.trim(), 250)
  const navigate = useNavigate()
  const listId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  const results = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchMovies(debounced),
    enabled: debounced.length > 0,
    staleTime: 60_000,
  })

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const items = results.data ?? []
  const close = () => {
    setOpen(false)
    setQ('')
  }
  const go = (slug: string) => {
    close()
    navigate(`/movies/${slug}`)
  }
  const browse = () => {
    close()
    navigate('/sessions')
  }

  return (
    <div ref={boxRef} className="relative w-[380px]">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
        <SearchIcon />
      </span>
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Search films and live events"
        placeholder="Search films and live events"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, items.length - 1))
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
          else if (e.key === 'Enter' && items[active]) go(items[active].slug)
          else if (e.key === 'Escape') setOpen(false)
        }}
        className="h-10 w-full rounded-full bg-ink-3 pl-10 pr-4 text-sm outline-none placeholder:text-mute focus:ring-1 focus:ring-velvet [&::-webkit-search-cancel-button]:hidden"
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-line/60 bg-ink shadow-2xl shadow-black/60"
        >
          {!debounced ? (
            <Prompt
              icon={
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M5 9h14l-1.6 11H6.6L5 9z" strokeLinejoin="round" />
                  <path d="M7 9a2.5 2.5 0 014-2 2.5 2.5 0 014 0 2.5 2.5 0 014 2M10 12v5M14 12v5" strokeLinecap="round" />
                </svg>
              }
              title="What do you want to watch?"
              body="Search by title, director or cast"
              onBrowse={browse}
            />
          ) : results.isPending ? (
            <div className="space-y-3 p-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-12 w-9" />
                  <div className="skeleton h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : results.isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <p className="font-bold">Search didn’t load</p>
              <button type="button" onClick={() => results.refetch()} className={buttonClass('secondary', 'sm')}>
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <Prompt
              icon={<SearchIcon className="size-5" />}
              title={`No results for “${debounced}”`}
              body="Check the spelling or try another film or live event."
              onBrowse={browse}
            />
          ) : (
            <>
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <span className="eyebrow text-mute">Films &amp; events</span>
                <span className="text-xs text-mute">
                  {items.length} {items.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              <div className="pb-2">
                {items.map((m, i) => (
                  <button
                    key={m.id}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(m.slug)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left ${i === active ? 'bg-ink-2' : ''}`}
                  >
                    <div className="h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-ink-3">
                      {m.posterUrl && <img src={m.posterUrl} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <Highlight text={m.title} query={debounced} />
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {m.kind === 'event' ? 'Event' : 'Film'} · {m.ageRating.code} · {formatRuntime(m.runtimeMinutes)}
                      </p>
                    </div>
                    {m.isComingSoon ? (
                      <span className="text-xs font-semibold text-brass">Coming Soon</span>
                    ) : (
                      <span className="text-xs font-bold">from {formatPrice(m.fromPrice)}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
