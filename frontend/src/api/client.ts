// Thin wrapper around fetch for the Django API.
// - same-origin cookies: the session cookie goes with every request,
// - X-CSRFToken on POST/PUT/PATCH/DELETE, read from Django's csrftoken cookie,
// - JSON in and out, ApiError with the DRF error body when the response is not 2xx.

const CSRF_COOKIE = 'csrftoken'
const CSRF_ENDPOINT = '/api/auth/csrf'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getCookie(name: string): string | undefined {
  const prefix = `${name}=`
  const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : undefined
}

async function csrfToken(): Promise<string | undefined> {
  if (!getCookie(CSRF_COOKIE)) {
    await fetch(CSRF_ENDPOINT, { credentials: 'same-origin' })
  }
  return getCookie(CSRF_COOKIE)
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!SAFE_METHODS.has(method)) {
    const token = await csrfToken()
    if (token) headers.set('X-CSRFToken', token)
  }

  const response = await fetch(path, { ...init, method, headers, credentials: 'same-origin' })
  const data = await parseBody(response)

  if (!response.ok) throw new ApiError(response.status, data)
  return data as T
}

const json = (body: unknown) => (body === undefined ? undefined : JSON.stringify(body))

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body: json(body) }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: json(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
