import { api } from './client'
import type {
  FilterOptions,
  Movie,
  MovieDetail,
  Order,
  Seat,
  SeatHold,
  SeatMap,
  Session,
  SessionsQuery,
  SessionsResponse,
  TicketTypeSlug,
  User,
  Venue,
} from './types'

type Data<T> = { data: T }

const toForm = (values: Record<string, string | Blob | number | null | undefined>) => {
  const form = new FormData()
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === '') continue
    form.append(k, typeof v === 'number' ? String(v) : v)
  }
  return form
}

// ---- Auth & profile ----
export interface AuthPayload {
  user: User
  token: string
}

export const login = async (body: { email: string; password: string }) =>
  (await api.post<Data<AuthPayload>>('/login', body)).data.data

export const register = async (body: {
  username: string
  email: string
  password: string
  password_confirmation: string
  avatar?: File | null
}) => (await api.post<Data<AuthPayload>>('/register', toForm({ ...body, avatar: body.avatar ?? undefined }))).data.data

export const logout = async () => {
  await api.post('/logout')
}

export const fetchMe = async () => (await api.get<Data<User>>('/me')).data.data

export const updateProfile = async (body: {
  fullName: string
  mobileNumber: string
  dateOfBirth: string
  preferredVenueId?: number | null
  avatar?: File | null
}) => (await api.put<Data<User>>('/profile', toForm({ ...body, avatar: body.avatar ?? undefined }))).data.data

// ---- Catalogue ----
export const fetchFilterOptions = async () => {
  const data = (await api.get<Data<FilterOptions>>('/filter-options')).data.data
  return { ...data, venues: data.venues as (Venue & { formats: NonNullable<Venue['formats']> })[] }
}

export const searchMovies = async (q: string) => (await api.get<Data<Movie[]>>('/search', { params: { q } })).data.data

export const fetchNowPlaying = async (limit?: number) =>
  (await api.get<Data<Movie[]>>('/movies/now-playing', { params: { limit } })).data.data

export const fetchComingSoon = async (limit?: number) =>
  (await api.get<Data<Movie[]>>('/movies/coming-soon', { params: { limit } })).data.data

export const fetchFeatured = async () => (await api.get<Data<Movie[]>>('/movies/featured')).data.data

export const fetchMovie = async (slug: string) => (await api.get<Data<MovieDetail>>(`/movies/${slug}`)).data.data

export const fetchMovieSessions = async (slug: string, date: string) =>
  (await api.get<Data<{ venue: Venue; sessions: Session[] }[]>>(`/movies/${slug}/sessions`, { params: { date } })).data
    .data

export const notifyMe = async (slug: string) => (await api.post(`/movies/${slug}/notify`)).data

// ---- Sessions ----
export const fetchSessions = async (q: SessionsQuery) =>
  (
    await api.get<SessionsResponse>('/sessions', {
      params: {
        date: q.date,
        venues: q.venues,
        formats: q.formats,
        languages: q.languages,
        bands: q.bands,
        sort: q.sort,
        page: q.page,
      },
      // indexes:false → venues[]=a&venues[]=b
      paramsSerializer: { indexes: false },
    })
  ).data

export const fetchSession = async (id: number) => (await api.get<Data<Session>>(`/sessions/${id}`)).data.data

export const fetchSeatMap = async (id: number) => (await api.get<Data<SeatMap>>(`/sessions/${id}/seats`)).data.data

// ---- Booking ----
export const createHold = async (sessionId: number, seats: { seatId: Seat['id']; ticketType: TicketTypeSlug }[]) =>
  (await api.post<Data<SeatHold>>(`/sessions/${sessionId}/holds`, { seats })).data.data

export const fetchHold = async (holdId: string) => (await api.get<Data<SeatHold>>(`/holds/${holdId}`)).data.data

export const releaseHold = async (holdId: string) => {
  await api.delete(`/holds/${holdId}`)
}

export const createOrder = async (body: {
  holdId: string
  fullName: string
  email: string
  mobileNumber: string
  cardNumber: string
  expiry: string
  cvv: string
}) => (await api.post<Data<Order>>('/orders', body)).data.data

// ---- Tickets ----
export const fetchTickets = async (filter: 'upcoming' | 'past') =>
  (await api.get<Data<Order[]>>('/tickets', { params: { filter } })).data.data

export const refundOrder = async (reference: string) =>
  (await api.post<Data<Order>>(`/orders/${reference}/refund`)).data.data
