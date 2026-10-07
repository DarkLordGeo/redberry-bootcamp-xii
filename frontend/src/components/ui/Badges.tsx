import type { ReactNode } from 'react'
import type { AgeRating, Format, Language } from '@/api/types'
import { formatRuntime } from '@/lib/format'

/** Neutral tag from the design: white-tinted pill, SemiBold 12. */
export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

/** Age rating in the design: red-tinted chip with red text, description as tooltip. */
export function RatingChip({ rating, small = false }: { rating: AgeRating; small?: boolean }) {
  return (
    <span
      title={rating.description}
      className={`relative inline-flex items-center rounded-md bg-velvet/15 font-semibold text-velvet ${small ? 'h-5 px-1.5 text-[11px]' : 'h-7 px-2.5 text-xs'}`}
    >
      <span className="sr-only">Rated </span>
      {rating.code}
    </span>
  )
}

export function RuntimeChip({ minutes }: { minutes: number }) {
  return (
    <Chip>
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.8V8l2 1.4" strokeLinecap="round" />
      </svg>
      {formatRuntime(minutes)}
    </Chip>
  )
}

/** Kept for existing callers. */
export function AgeBadge({ rating }: { rating: AgeRating; withTooltip?: boolean }) {
  return <RatingChip rating={rating} small />
}

export function FormatBadge({ format }: { format: Format }) {
  return (
    <span className="inline-flex h-5 items-center rounded-sm bg-white/10 px-1.5 text-[11px] font-semibold">{format.name}</span>
  )
}

export function LanguageBadge({ language }: { language: Language }) {
  return (
    <span title={language.name} className="inline-flex h-5 items-center rounded-sm bg-white/10 px-1.5 text-[11px] font-semibold text-mute">
      {language.code}
    </span>
  )
}
