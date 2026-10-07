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
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-center ${urgent ? 'border-err/60 bg-err/10' : 'border-line bg-ink-3'}`}
    >
      <p className="eyebrow !text-[10px] text-mute">Seats held</p>
      <p className={`mt-0.5 text-[15px] font-extrabold tabular-nums ${urgent ? 'text-err' : ''}`}>{formatCountdown(left)}</p>
    </div>
  )
}
