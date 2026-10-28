import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, getCookie } from './client'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function setCookie(value: string) {
  document.cookie = value
}

function clearCookies() {
  for (const part of document.cookie.split('; ')) {
    const name = part.split('=')[0]
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

function lastRequest() {
  const [url, init] = fetchMock.mock.lastCall!
  return { url, init: init!, headers: new Headers(init!.headers) }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  clearCookies()
})

describe('getCookie', () => {
  it('reads a decoded cookie value by name', () => {
    setCookie('other=1')
    setCookie('csrftoken=abc%20123')

    expect(getCookie('csrftoken')).toBe('abc 123')
    expect(getCookie('missing')).toBeUndefined()
  })
})

describe('api client', () => {
  it('sends GET with same-origin credentials and returns parsed JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok' }))

    const data = await api.get<{ status: string }>('/api/health')

    expect(data).toEqual({ status: 'ok' })
    const { url, init, headers } = lastRequest()
    expect(url).toBe('/api/health')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('same-origin')
    expect(headers.has('X-CSRFToken')).toBe(false)
  })

  it('sends POST as JSON with the CSRF token from the cookie', async () => {
    setCookie('csrftoken=token-from-django')
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }, 201))

    await api.post('/api/auth/register', { username: 'gracz' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const { init, headers } = lastRequest()
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"username":"gracz"}')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-CSRFToken')).toBe('token-from-django')
  })

  it('fetches the CSRF cookie first when it is missing', async () => {
    fetchMock.mockImplementationOnce(async () => {
      setCookie('csrftoken=fresh-token')
      return new Response(null, { status: 204 })
    })
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await api.post('/api/auth/logout')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/csrf')
    expect(lastRequest().headers.get('X-CSRFToken')).toBe('fresh-token')
  })

  it('returns undefined for 204 No Content', async () => {
    setCookie('csrftoken=t')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(api.delete('/api/something/1')).resolves.toBeUndefined()
  })

  it('throws ApiError with status and the DRF error body', async () => {
    setCookie('csrftoken=t')
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: ['A user with that e-mail address already exists.'] }, 400))

    const error = await api.post('/api/auth/register', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).data).toEqual({ email: ['A user with that e-mail address already exists.'] })
  })
})
