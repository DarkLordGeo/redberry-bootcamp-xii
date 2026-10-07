import { dayNumber, nextSevenDays, weekdayShort } from '@/lib/format'

/** Next 7 days, one selectable. `available` (when given) disables dates without sessions. */
export function DatePicker({
  value,
  onChange,
  available,
  compact = false,
}: {
  value: string
  onChange: (date: string) => void
  available?: string[]
  compact?: boolean
}) {
  const days = nextSevenDays()
  return (
    <div role="radiogroup" aria-label="Date" className={`grid grid-cols-7 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {days.map((d) => {
        const selected = d === value
        const empty = available ? !available.includes(d) : false
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={empty}
            title={empty ? 'No sessions on this day' : undefined}
            onClick={() => onChange(d)}
            className={`flex flex-col items-center gap-1 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
              compact ? 'py-2' : 'py-3'
            } ${selected ? 'bg-velvet text-screen' : 'bg-ink-3 enabled:hover:bg-line'}`}
          >
            <span className={`text-[11px] font-semibold ${selected ? 'text-screen' : 'text-mute'}`}>{weekdayShort(d)}</span>
            <span className={`font-extrabold ${compact ? 'text-[13px]' : 'text-[18px]'}`}>{dayNumber(d)}</span>
          </button>
        )
      })}
    </div>
  )
}
