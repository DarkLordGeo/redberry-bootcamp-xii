import type { AgeRating, Format, Language } from '@/api/types'

const ratingTone: Record<string, string> = {
  G: 'border-ok/60 text-ok',
  PG: 'border-ok/60 text-ok',
  '12+': 'border-brass/70 text-brass',
  '16+': 'border-velvet-hi/70 text-velvet-hi',
  '18+': 'border-err text-err',
}

export function AgeBadge({ rating, withTooltip = true }: { rating: AgeRating; withTooltip?: boolean }) {
  return (
    <span
      title={withTooltip ? rating.description : undefined}
      className={`inline-flex h-6 min-w-9 items-center justify-center rounded-sm border px-1.5 text-xs font-bold ${ratingTone[rating.code] ?? 'border-line text-mute'}`}
    >
      <span className="sr-only">Rated </span>
      {rating.code}
    </span>
  )
}

export function FormatBadge({ format }: { format: Format }) {
  return (
    <span className="inline-flex h-6 items-center rounded-sm bg-ink-3 px-2 text-[11px] font-bold tracking-wide text-screen">
      {format.name}
    </span>
  )
}

export function LanguageBadge({ language }: { language: Language }) {
  return (
    <span
      title={language.name}
      className="inline-flex h-6 items-center rounded-sm border border-line px-2 text-[11px] font-semibold text-mute"
    >
      {language.code}
    </span>
  )
}
