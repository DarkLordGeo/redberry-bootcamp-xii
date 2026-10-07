const pageList = (current: number, last: number): (number | '…')[] => {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (p: number) => void }) {
  if (lastPage <= 1) return null
  const arrow = 'grid size-10 place-items-center rounded-md border border-line enabled:hover:border-mute disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-mute">
        Page {page} of {lastPage}
      </p>
      <div className="flex items-center gap-1.5">
        <button className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {pageList(page, lastPage).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-mute">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`h-10 min-w-10 rounded-md px-2 text-sm font-semibold ${p === page ? 'bg-velvet text-screen' : 'border border-line hover:border-mute'}`}
            >
              {p}
            </button>
          ),
        )}
        <button className={arrow} disabled={page >= lastPage} onClick={() => onChange(page + 1)} aria-label="Next page">
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
