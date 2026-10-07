import type { ReactNode } from 'react'
import type { FilterOptions } from '@/api/types'
import { Skeleton, ErrorState } from '@/components/ui/States'
import { DatePicker } from './DatePicker'
import type { useSessionFilters } from './useSessionFilters'

type Filters = ReturnType<typeof useSessionFilters>

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="mb-3 text-[15px] font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

function Check({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-ink-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid size-5 shrink-0 place-items-center rounded-sm border peer-focus-visible:outline-2 peer-focus-visible:outline-brass ${
          checked ? 'border-brass bg-brass text-ink' : 'border-line'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm">
        {label}
        {sub && <span className="block text-xs text-mute">{sub}</span>}
      </span>
    </label>
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
  const { query, toggle, setVenues, setDate, clearAll, activeCount } = filters

  // Selecting venues narrows the format list to what those venues can actually show.
  const venueFormats = options?.venues.filter((v) => query.venues.includes(v.slug)).flatMap((v) => v.formats ?? [])
  const availableFormats = query.venues.length && venueFormats
    ? options!.formats.filter((f) => venueFormats.some((vf) => vf.slug === f.slug))
    : options?.formats ?? []

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
    <aside className="sticky top-[96px] flex max-h-[calc(100vh-120px)] w-[340px] shrink-0 flex-col rounded-lg border border-line bg-ink-2">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="display text-[28px]">Filters</h2>
        <span className="text-sm text-mute" aria-live="polite">
          {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
        </span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5">
        <div>
          <p className="mb-3 text-[15px] font-semibold">Date</p>
          <DatePicker value={query.date} onChange={setDate} compact />
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
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
            <Group title="Format">
              <div className="flex flex-wrap gap-2">
                {availableFormats.map((f) => {
                  const on = query.formats.includes(f.slug)
                  return (
                    <button
                      key={f.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle('formats', f.slug)}
                      className={`h-9 rounded-md border px-3 text-sm font-semibold ${on ? 'border-brass bg-brass text-ink' : 'border-line hover:border-mute'}`}
                    >
                      {f.name}
                    </button>
                  )
                })}
              </div>
            </Group>
            <Group title="Language">
              {options.languages.map((l) => (
                <Check key={l.slug} checked={query.languages.includes(l.slug)} onChange={() => toggle('languages', l.slug)} label={l.name} />
              ))}
            </Group>
            <Group title="Time of day">
              {options.timeBands.map((b) => (
                <Check key={b.id} checked={query.bands.includes(b.id)} onChange={() => toggle('bands', b.id)} label={b.label} />
              ))}
            </Group>
          </>
        )}
      </div>
      <div className="border-t border-line p-4">
        <button
          type="button"
          onClick={clearAll}
          disabled={activeCount === 0}
          className="h-10 w-full rounded-md border border-line text-sm font-semibold enabled:hover:border-mute disabled:cursor-not-allowed disabled:text-mute"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  )
}
