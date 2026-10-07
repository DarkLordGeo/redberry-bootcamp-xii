/** Lari amounts come from the API as plain numbers (24, 14.5). */
export const formatPrice = (amount: number) =>
  `₾${Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/0$/, '')}`

export const formatRuntime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

/** YYYY-MM-DD in the viewer's local time zone. */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayISO = () => toISODate(new Date())

/** Today plus the next six days. */
export const nextSevenDays = () => {
  const start = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toISODate(d)
  })
}

const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const dayLabel = (iso: string) => {
  const today = todayISO()
  if (iso === today) return 'Today'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (iso === toISODate(tomorrow)) return 'Tomorrow'
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short' })
}

export const weekdayShort = (iso: string) => parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short' })
export const dayNumber = (iso: string) => parseISODate(iso).getDate()
export const monthShort = (iso: string) => parseISODate(iso).toLocaleDateString('en-GB', { month: 'short' })

export const formatLongDate = (iso: string) =>
  parseISODate(iso.slice(0, 10)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })

export const formatReleaseDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatTime = (isoDateTime: string) =>
  new Date(isoDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const formatCountdown = (totalSeconds: number) => {
  const s = Math.max(0, totalSeconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const hasStarted = (startsAt: string) => new Date(startsAt).getTime() <= Date.now()
