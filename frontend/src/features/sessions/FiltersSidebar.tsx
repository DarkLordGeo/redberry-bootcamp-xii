import { useEffect, useState, type ReactNode } from 'react'
import type { FilterOptions } from '@/api/types'
import { Skeleton, ErrorState } from '@/components/ui/States'
import { DatePicker } from './DatePicker'
import type { useSessionFilters } from './useSessionFilters'

type Filters = ReturnType<typeof useSessionFilters>

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line/70 pt-5">
      <legend className="overline mb-3 text-mute">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  )
}

function Check({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md py-1.5 text-sm hover:text-screen">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brass ${
          checked ? 'border-velvet bg-velvet text-screen' : 'border-dim'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-semibold">{label}</span>
      {sub && <span className="text-xs text-mute">{sub}</span>}
    </label>
  )
}

/** Title search: typed locally, written to the URL after a pause so history isn't flooded. */
function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return
    const t = setTimeout(() => onChange(text), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return (
    <div className="relative">
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label="Search sessions by film title"
        placeholder="Search by film title"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-10 w-full rounded-full bg-ink-3 pl-10 pr-4 text-sm outline-none placeholder:text-mute focus:ring-1 focus:ring-velvet"
      />
    </div>
  )
}

export function FiltersSidebar({
  options,
  loading,
  error,
  onRetry,
  filters,
}: {
  options?: FilterOptions
  loading: boolean
  error: unknown
  onRetry: () => void
  filters: Filters
}) {
  const { query, toggle, setVenues, setDate, setSearch, clearAll, activeCount } = filters

  // Selecting venues narrows the format list to what those venues can actually show.
  const venueFormats = options?.venues.filter((v) => query.venues.includes(v.slug)).flatMap((v) => v.formats ?? [])
  const availableFormats =
    query.venues.length && venueFormats
      ? options!.formats.filter((f) => venueFormats.some((vf) => vf.slug === f.slug))
      : (options?.formats ?? [])

  const toggleVenue = (slug: string) => {
    if (!options) return
    const venues = query.venues.includes(slug) ? query.venues.filter((v) => v !== slug) : [...query.venues, slug]
    const allowed = new Set(
      venues.length
        ? options.venues.filter((v) => venues.includes(v.slug)).flatMap((v) => (v.formats ?? []).map((f) => f.slug))
        : options.formats.map((f) => f.slug),
    )
    setVenues(venues, query.formats.filter((f) => allowed.has(f)))
  }

  return (
    <aside className="sticky top-[96px] flex max-h-[calc(100vh-120px)] w-[340px] shrink-0 flex-col rounded-2xl bg-ink-2">
      <div className="flex items-center justify-between px-6 pb-4 pt-6">
        <h2 className="display text-[18px]">Filters</h2>
        <span className="text-xs text-mute" aria-live="polite">
          {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
        </span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-6">
        <SearchField value={query.search} onChange={setSearch} />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : error || !options ? (
          <ErrorState compact error={error} onRetry={onRetry} title="Filters didn’t load" />
        ) : (
          <>
            <Group title="Venue">
              {options.venues.map((v) => (
                <Check key={v.slug} checked={query.venues.includes(v.slug)} onChange={() => toggleVenue(v.slug)} label={v.name} sub={v.city} />
              ))}
            </Group>
            <fieldset className="border-t border-line/70 pt-5">
              <legend className="overline mb-3 text-mute">Date</legend>
              <DatePicker value={query.date} onChange={setDate} compact />
            </fieldset>
            <Group title="Format">
              {availableFormats.map((f) => (
                <Check key={f.slug} checked={query.formats.includes(f.slug)} onChange={() => toggle('formats', f.slug)} label={f.name} />
              ))}
            </Group>
            <Group title="Language">
              {options.languages.map((l) => (
                <Check key={l.slug} checked={query.languages.includes(l.slug)} onChange={() => toggle('languages', l.slug)} label={l.name} />
              ))}
            </Group>
            <Group title="Time of day">
              {options.timeBands.map((b) => {
                const [name, hint] = b.label.split(/\s*\((.*)\)/)
                return (
                  <Check key={b.id} checked={query.bands.includes(b.id)} onChange={() => toggle('bands', b.id)} label={name} sub={hint} />
                )
              })}
            </Group>
          </>
        )}
      </div>
      <div className="border-t border-line/70 p-4">
        <button
          type="button"
          onClick={clearAll}
          disabled={activeCount === 0}
          className="h-10 w-full rounded-full bg-ink-3 text-sm font-bold enabled:hover:bg-line disabled:cursor-not-allowed disabled:text-dim"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  )
}
