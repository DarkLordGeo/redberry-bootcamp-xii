import type { Seat, SeatMap as SeatMapData } from '@/api/types'

export type SeatView = 'available' | 'selected' | 'sold' | 'held' | 'unavailable'

const hatch = 'bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.14)_0_2px,transparent_2px_6px)]'
const seatClass: Record<SeatView, string> = {
  available: 'border-line bg-ink-3 text-screen hover:border-velvet',
  selected: 'border-velvet bg-velvet text-screen',
  sold: `border-line/60 bg-ink-2 text-transparent ${hatch}`,
  held: 'border-brass/50 bg-brass/15 text-transparent',
  unavailable: 'border-dashed border-line/60 bg-transparent text-transparent',
}

export const SEAT_LEGEND: { view: SeatView; label: string }[] = [
  { view: 'available', label: 'Available' },
  { view: 'selected', label: 'Your selection' },
  { view: 'sold', label: 'Sold' },
  { view: 'held', label: 'Held by someone else' },
  { view: 'unavailable', label: 'Unavailable' },
]

export function SeatSwatch({ view }: { view: SeatView }) {
  return <span aria-hidden className={`inline-block size-4 rounded-[5px] border ${seatClass[view]}`} />
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
      <div className="mb-8 w-full max-w-[560px] rounded-md bg-ink-3 py-1.5 text-center" aria-hidden>
        <span className="overline !text-[10px] text-mute">Screen</span>
      </div>

      <div className="flex flex-col gap-8">
        {map.sections.map((section) => (
          <div key={section.name} role="group" aria-label={section.name} className="flex flex-col items-center gap-2">
            <p className="overline mb-2 !text-[10px] text-mute">
              {section.name} · Rows {section.rows[0]?.label}–{section.rows[section.rows.length - 1]?.label}
            </p>
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
                        className={`grid size-9 place-items-center rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed ${seatClass[view]} ${
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

      <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Seat legend">
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
