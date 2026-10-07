import { useEffect, useRef, useState } from 'react'
import { formatCountdown } from '@/lib/format'

/** Counts down from the server's `expiresAt` (not secondsRemaining), so background tabs don't drift. */
export function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const end = new Date(expiresAt).getTime()
  const [left, setLeft] = useState(() => Math.max(0, Math.round((end - Date.now()) / 1000)))
  const fired = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    fired.current = false
    const tick = () => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000))
      setLeft(s)
      if (s === 0 && !fired.current) {
        fired.current = true
        onExpireRef.current()
      }
    }
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [end])

  const urgent = left <= 60
  return (
    <div
      role="timer"
      aria-label={`Seats held for ${formatCountdown(left)}`}
      className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${urgent ? 'border-err/60 text-err' : 'border-brass/50 text-brass'}`}
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="10" cy="11" r="6.5" />
        <path d="M10 7.5V11l2.2 1.6M8 2.5h4" strokeLinecap="round" />
      </svg>
      <span className="text-sm">Seats held for</span>
      <span className="display w-[3.2ch] text-[22px] tabular-nums">{formatCountdown(left)}</span>
    </div>
  )
}
