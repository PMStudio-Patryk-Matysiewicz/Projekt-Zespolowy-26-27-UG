import { vi } from 'vitest'

import type { Player } from '../api/auth'

export const player: Player = {
  id: 1,
  username: 'kamil_g',
  email: 'kamil@przyklad.pl',
  display_name: 'Kamil',
  balance: 12450,
}

export const PASSWORD = 'tajne-haslo-1'

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const notLoggedIn = () => json({ detail: 'Authentication credentials were not provided.' }, 403)

export type Session = { loggedIn: boolean }
export type Handler = (init: RequestInit | undefined, session: Session) => Response | Promise<Response>
export type Handlers = Record<string, Handler>

// Replaces fetch with a tiny fake of the Django API. Like the session cookie, `session.loggedIn`
// survives unmounting the app, so rendering the routes again behaves like a page refresh.
// `handlers` replace the default answer for a URL.

export function fakeApi({ loggedIn = false, handlers = {} }: { loggedIn?: boolean; handlers?: Handlers } = {}) {
  const session: Session = { loggedIn }

  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input)
    const handler = handlers[url]
    if (handler) return handler(init, session)

    switch (url) {
      case '/api/auth/csrf':
        document.cookie = 'csrftoken=test-token'
        return new Response(null, { status: 204 })
      case '/api/auth/me':
        return session.loggedIn ? json(player) : notLoggedIn()
      case '/api/auth/login': {
        const body = JSON.parse(String(init?.body))
        const known = body.login === player.username || body.login === player.email
        if (!known || body.password !== PASSWORD) {
          return json({ non_field_errors: ['Invalid login or password.'] }, 400)
        }
        session.loggedIn = true
        return json(player)
      }
      case '/api/auth/logout':
        session.loggedIn = false
        return new Response(null, { status: 204 })
      case '/api/wallet':
        return session.loggedIn ? json({ balance: player.balance }) : notLoggedIn()
      default:
        return new Response(null, { status: 404 })
    }
  })

  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    session,
    callsTo: (url: string) => fetchMock.mock.calls.filter(([input]) => String(input) === url),
  }
}
