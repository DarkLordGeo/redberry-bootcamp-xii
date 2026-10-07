import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SessionSort, SessionsQuery } from '@/api/types'
import { todayISO } from '@/lib/format'

const ARRAY_KEYS = ['venues', 'formats', 'languages', 'bands'] as const
export type ArrayFilter = (typeof ARRAY_KEYS)[number]
const SORTS: SessionSort[] = ['time_asc', 'time_desc', 'price_asc', 'price_desc', 'title_asc']

/**
 * The sessions page state lives entirely in the URL, using the API's own parameter
 * names (venues[]=galleria&date=…&sort=…&page=2), so links, refresh and Back all work.
 */
export function useSessionFilters() {
  const [params, setParams] = useSearchParams()

  const query: SessionsQuery = useMemo(() => {
    const sort = params.get('sort') as SessionSort | null
    const page = Number(params.get('page'))
    return {
      date: params.get('date') || todayISO(),
      venues: params.getAll('venues[]'),
      formats: params.getAll('formats[]'),
      languages: params.getAll('languages[]'),
      bands: params.getAll('bands[]'),
      search: params.get('search') ?? '',
      sort: sort && SORTS.includes(sort) ? sort : 'time_asc',
      page: Number.isInteger(page) && page > 0 ? page : 1,
    }
  }, [params])

  /** Writes a new state. Any change other than the page itself resets to page 1. */
  const write = useCallback(
    (next: SessionsQuery, keepPage = false) => {
      const p = new URLSearchParams()
      p.set('date', next.date)
      for (const key of ARRAY_KEYS) for (const v of next[key]) p.append(`${key}[]`, v)
      if (next.search.trim()) p.set('search', next.search)
      if (next.sort !== 'time_asc') p.set('sort', next.sort)
      if (keepPage && next.page > 1) p.set('page', String(next.page))
      setParams(p)
    },
    [setParams],
  )

  const toggle = (key: ArrayFilter, value: string, extra?: Partial<SessionsQuery>) => {
    const list = query[key]
    const nextList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    write({ ...query, ...extra, [key]: nextList })
  }

  return {
    query,
    toggle,
    setVenues: (venues: string[], formats: string[]) => write({ ...query, venues, formats }),
    setDate: (date: string) => write({ ...query, date }),
    setSort: (sort: SessionSort) => write({ ...query, sort }),
    setSearch: (search: string) => write({ ...query, search }),
    setPage: (page: number) => write({ ...query, page }, true),
    clearAll: () => write({ ...query, venues: [], formats: [], languages: [], bands: [], search: '' }),
    activeCount: ARRAY_KEYS.reduce((n, k) => n + query[k].length, 0) + (query.search.trim() ? 1 : 0),
  }
}
