import type { ReactNode } from 'react'
import { Button } from './Button'
import { ApiError } from '@/api/client'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />
}

export function ErrorState({
  error,
  onRetry,
  title = 'This didn’t load',
  compact = false,
}: {
  error?: unknown
  onRetry?: () => void
  title?: string
  compact?: boolean
}) {
  const message = error instanceof ApiError || error instanceof Error ? error.message : undefined
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-lg border border-line bg-ink-2 text-center ${compact ? 'px-4 py-6' : 'px-6 py-14'}`}
    >
      <p className="text-lg font-semibold">{title}</p>
      {message && <p className="max-w-md text-sm text-mute">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {body && <p className="max-w-md text-sm text-mute">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
