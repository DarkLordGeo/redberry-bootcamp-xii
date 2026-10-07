import type { Movie } from '@/api/types'

const KEY = 'kino.recentlyViewed'
const MAX = 8

type Stored = Pick<Movie, 'id' | 'slug' | 'title' | 'posterUrl' | 'runtimeMinutes' | 'ageRating' | 'isComingSoon'>

export const getRecentlyViewed = (): Stored[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Stored[]
  } catch {
    return []
  }
}

export const addRecentlyViewed = (m: Movie) => {
  const entry: Stored = {
    id: m.id,
    slug: m.slug,
    title: m.title,
    posterUrl: m.posterUrl,
    runtimeMinutes: m.runtimeMinutes,
    ageRating: m.ageRating,
    isComingSoon: m.isComingSoon,
  }
  try {
    const next = [entry, ...getRecentlyViewed().filter((x) => x.id !== m.id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}
