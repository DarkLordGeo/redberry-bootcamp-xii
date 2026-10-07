import { useEffect, useId, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { searchMovies } from '@/api/endpoints'
import { AgeBadge } from '@/components/ui/Badges'
import { formatRuntime } from '@/lib/format'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
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
  const go = (slug: string) => {
    setOpen(false)
    setQ('')
    navigate(`/movies/${slug}`)
  }

  return (
    <div ref={boxRef} className="relative w-[300px]">
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        role="combobox"
        aria-expanded={open && debounced.length > 0}
        aria-controls={listId}
        aria-label="Search films"
        placeholder="Search films"
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
        className="h-10 w-full rounded-md border border-line bg-ink-2 pl-9 pr-3 text-sm outline-none placeholder:text-mute focus:border-brass"
      />
      {open && debounced.length > 0 && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-md border border-line bg-ink-2 shadow-2xl shadow-black/50">
          {results.isPending ? (
            <p className="px-4 py-3 text-sm text-mute">Searching…</p>
          ) : results.isError ? (
            <p className="px-4 py-3 text-sm text-err">Search failed. Try again.</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-mute">No films match “{debounced}”.</p>
          ) : (
            items.map((m, i) => (
              <button
                key={m.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(m.slug)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? 'bg-ink-3' : ''}`}
              >
                <div className="h-12 w-8 shrink-0 overflow-hidden rounded-sm bg-ink-3">
                  {m.posterUrl && <img src={m.posterUrl} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.title}</p>
                  <p className="text-xs text-mute">
                    {m.isComingSoon ? 'Coming soon' : formatRuntime(m.runtimeMinutes)}
                  </p>
                </div>
                <AgeBadge rating={m.ageRating} withTooltip={false} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
