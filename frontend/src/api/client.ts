import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'kino.token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable */
    }
  },
}

/** Normalised API failure. `errors` present = field validation, absent = rule/message only. */
export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  contested?: string[]

  constructor(status: number, message: string, errors?: Record<string, string[]>, contested?: string[]) {
    super(message)
    this.status = status
    this.errors = errors
    this.contested = contested
  }

  get isValidation() {
    return this.status === 422 && !!this.errors
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.kinoxii.redberryinternship.ge/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Called on a 401 from any protected endpoint. Resolves true once the user has
 * signed in again (the request is then replayed), false if they dismissed the login modal.
 */
type UnauthorizedHandler = () => Promise<boolean>
let onUnauthorized: UnauthorizedHandler | null = null
export const setUnauthorizedHandler = (fn: UnauthorizedHandler | null) => {
  onUnauthorized = fn
}

const AUTH_ENDPOINTS = ['/login', '/register', '/me', '/logout']

type RetriableConfig = InternalAxiosRequestConfig & { _replayed?: boolean }

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string; errors?: Record<string, string[]>; contested?: string[] }>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status ?? 0
    const body = error.response?.data

    // /me 401 on boot just means a stale token: treat as guest, no modal.
    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => config?.url?.endsWith(p))
    if (status === 401 && config && !isAuthEndpoint && !config._replayed && onUnauthorized) {
      tokenStore.set(null)
      const signedIn = await onUnauthorized()
      if (signedIn) {
        config._replayed = true
        config.headers.Authorization = `Bearer ${tokenStore.get()}`
        return api.request(config)
      }
    }

    const message =
      body?.message ??
      (status === 0 ? 'Network error. Check your connection and try again.' : 'Something went wrong. Please try again.')
    return Promise.reject(new ApiError(status, message, body?.errors, body?.contested))
  },
)
