import type { Seat, SeatMap as SeatMapData } from '@/api/types'

export type SeatView = 'available' | 'selected' | 'sold' | 'held' | 'unavailable'

const seatClass: Record<SeatView, string> = {
  available: 'border-mute/70 bg-transparent text-mute hover:border-velvet hover:text-screen',
  selected: 'border-velvet bg-velvet text-screen',
  sold: 'border-transparent bg-ink-3 text-transparent',
  held: 'border-brass/40 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-brass)_35%,transparent)_0_3px,transparent_3px_7px)] text-transparent',
  unavailable: 'border-dashed border-line bg-transparent text-transparent',
}

export const SEAT_LEGEND: { view: SeatView; label: string }[] = [
  { view: 'available', label: 'Available' },
  { view: 'selected', label: 'Your selection' },
  { view: 'sold', label: 'Sold' },
  { view: 'held', label: 'Held by someone else' },
  { view: 'unavailable', label: 'Unavailable' },
]

export function SeatSwatch({ view }: { view: SeatView }) {
  return <span aria-hidden className={`inline-block size-5 rounded-t-md rounded-b-sm border-2 ${seatClass[view]}`} />
}

/** Seat state for the viewer. `isMine` seats are held by this user, so they count as their own selection. */
export const viewOf = (seat: Seat, selected: boolean, lost: Set<string>): SeatView => {
  if (selected) return 'selected'
  if (lost.has(seat.code)) return 'sold'
  if (seat.isMine) return 'available'
  return seat.state
}

/**
 * Hall drawn entirely from the API response: sections → rows → seats, with aisles
 * where `aisleAfter` says. No row or seat is hardcoded, so every hall shape renders.
 */
export function SeatMap({
  map,
  selected,
  lost,
  onToggle,
  disabled,
}: {
  map: SeatMapData
  selected: Set<number>
  lost: Set<string>
  onToggle: (seat: Seat) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      {/* The screen: a lit arc the whole auditorium faces. */}
      <div className="relative mb-10 w-full max-w-[640px]" aria-hidden>
        <svg viewBox="0 0 640 40" className="w-full">
          <defs>
            <linearGradient id="screen-glow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--color-screen)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--color-screen)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M10 30 Q320 -6 630 30 L630 40 Q320 4 10 40 Z" fill="url(#screen-glow)" />
          <path d="M10 30 Q320 -6 630 30" fill="none" stroke="var(--color-screen)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="mt-1 text-center text-xs text-mute">Screen</p>
      </div>

      <div className="flex flex-col gap-8">
        {map.sections.map((section) => (
          <div key={section.name} role="group" aria-label={section.name} className="flex flex-col items-center gap-2">
            <p className="mb-1 text-[13px] font-semibold text-mute">{section.name}</p>
            {section.rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-semibold text-mute">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  {row.seats.map((seat) => {
                    const isSelected = selected.has(seat.id)
                    const view = viewOf(seat, isSelected, lost)
                    const pickable = view === 'available' || view === 'selected'
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!pickable || disabled}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.code}, ${SEAT_LEGEND.find((l) => l.view === view)?.label}`}
                        title={`${seat.code} · ${section.name}`}
                        onClick={() => onToggle(seat)}
                        className={`grid size-8 place-items-center rounded-t-lg rounded-b-sm border-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed ${seatClass[view]} ${
                          seat.aisleAfter ? 'mr-5' : ''
                        }`}
                      >
                        {view === 'available' || view === 'selected' ? seat.label : ''}
                      </button>
                    )
                  })}
                </div>
                <span className="w-5 text-xs font-semibold text-mute">{row.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Seat legend">
        {SEAT_LEGEND.map((l) => (
          <li key={l.view} className="flex items-center gap-2 text-[13px] text-mute">
            <SeatSwatch view={l.view} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
