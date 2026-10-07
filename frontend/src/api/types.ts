export type AgeRatingCode = 'G' | 'PG' | '12+' | '16+' | '18+'

export interface Format {
  id: number
  slug: string
  name: string
  priceUplift: number
}

export interface Venue {
  id: number
  slug: string
  name: string
  city: string
  formats?: Format[]
}

export interface Language {
  id: number
  slug: string
  name: string
  code: string
}

export interface Genre {
  id: number
  slug: string
  name: string
}

export interface AgeRating {
  code: AgeRatingCode
  minAge: number
  description: string
}

export type TicketTypeSlug = 'adult' | 'child' | 'student'

export interface TicketType {
  id: number
  slug: TicketTypeSlug
  name: string
  priceRatio: number
  note: string | null
  blockedFromRatingAge: number | null
}

export interface Movie {
  id: number
  slug: string
  title: string
  kind: 'film' | 'event'
  runtimeMinutes: number
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string
  isComingSoon: boolean
  isNotified?: boolean
  isFeatured: boolean
  fromPrice: number
  ageRating: AgeRating
  genres: Genre[]
  formats: Format[]
  synopsis?: string
}

export interface MovieDetail extends Movie {
  synopsis: string
  director: string | null
  cast: string | null
  availableDates: string[]
}

export type TimeBand = 'morning' | 'afternoon' | 'evening'

export interface Session {
  id: number
  startsAt: string
  date: string
  time: string
  timeBand: TimeBand
  price: number
  seatsLeft: number
  isSoldOut: boolean
  hall: { id: number; name: string; venue?: Venue }
  venue: Venue
  format: Format
  language: Language
  movie: Movie
}

export type SeatState = 'available' | 'sold' | 'held' | 'unavailable'

export interface Seat {
  id: number
  code: string
  label: string
  state: SeatState
  aisleAfter: boolean
  isMine: boolean
}

export interface SeatMap {
  sessionId: number
  hall: { id: number; name: string; venue: Venue }
  sections: { name: string; rows: { label: string; seats: Seat[] }[] }[]
}

export interface SeatHold {
  holdId: string
  sessionId: number
  expiresAt: string
  secondsRemaining: number
  isLive: boolean
  subtotal: number
  seats: { seatId: number; code: string; ticketType: { slug: TicketTypeSlug; name: string }; price: number }[]
}

export interface Order {
  id: number
  reference: string
  status: 'paid' | 'refunded'
  totalPrice: number
  paidAt: string
  refundedAt: string | null
  isUpcoming: boolean
  isRefundable: boolean
  cardLastFour: string
  contact: { fullName: string; email: string; mobileNumber: string }
  session: Session
  tickets: { id: number; seatCode: string; ticketType: { slug: TicketTypeSlug; name: string }; price: number }[]
}

export interface User {
  id: number
  username: string
  email: string
  avatar: string | null
  fullName: string | null
  mobileNumber: string | null
  dateOfBirth: string | null
  age: number | null
  preferredVenue: Venue | null
  profileComplete: boolean
}

export interface FilterOptions {
  venues: Venue[]
  formats: Format[]
  languages: Language[]
  timeBands: { id: TimeBand; label: string }[]
  sorts: { id: SessionSort; label: string }[]
  ticketTypes: TicketType[]
  ageRatings: AgeRating[]
  maxSeatsPerOrder: number
  holdMinutes: number
}

export type SessionSort = 'time_asc' | 'time_desc' | 'price_asc' | 'price_desc' | 'title_asc'

export interface SessionsQuery {
  date: string
  venues: string[]
  formats: string[]
  languages: string[]
  bands: string[]
  sort: SessionSort
  page: number
}

export interface SessionsResponse {
  data: { movie: Movie; sessions: Session[] }[]
  meta: {
    currentPage: number
    lastPage: number
    perPage: number
    totalSessions: number
    totalMovies: number
    date: string
  }
}
