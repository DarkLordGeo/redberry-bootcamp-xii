import { dayLabel, dayNumber, monthShort, nextSevenDays } from '@/lib/format'

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
            className={`flex flex-col items-center rounded-md border py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
              selected ? 'border-velvet bg-velvet text-screen' : 'border-line bg-ink-2 enabled:hover:border-mute'
            }`}
          >
            <span className={`text-[11px] font-semibold ${selected ? 'text-screen/80' : 'text-mute'}`}>{dayLabel(d)}</span>
            <span className={`display ${compact ? 'text-[22px]' : 'text-[26px]'}`}>{dayNumber(d)}</span>
            <span className={`text-[11px] ${selected ? 'text-screen/80' : 'text-mute'}`}>{monthShort(d)}</span>
          </button>
        )
      })}
    </div>
  )
}
