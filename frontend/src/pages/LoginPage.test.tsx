import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { INVALID_CREDENTIALS } from '../forms/loginForm'
import { fakeApi, json, PASSWORD } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function logIn(login: string, password: string) {
  fill('Nazwa użytkownika lub e-mail', login)
  fill('Hasło', password)
  fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))
}

async function openLoginPage(path = '/logowanie') {
  const result = renderRoute(path)
  await screen.findByRole('heading', { level: 1, name: 'Zaloguj się' })
  return result
}

describe('LoginPage', () => {
  it('shows the login form with its links', async () => {
    fakeApi()
    await openLoginPage()

    expect(screen.getByRole('link', { name: 'Strona główna' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Przeglądaj ranking jako gość' })).toHaveAttribute('href', '/ranking')
    expect(screen.getByRole('link', { name: 'Załóż je za darmo' })).toHaveAttribute('href', '/rejestracja')
  })

  it('is also available at /login', async () => {
    fakeApi()
    const { router } = await openLoginPage('/login')

    expect(router.state.location.pathname).toBe('/logowanie')
  })

  it('asks for both fields without calling the API', async () => {
    const api = fakeApi()
    await openLoginPage()

    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    expect(screen.getByText('Podaj nazwę użytkownika lub e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Podaj hasło.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nazwa użytkownika lub e-mail')).toHaveFocus()
    expect(api.callsTo('/api/auth/login')).toHaveLength(0)
  })

  it('opens the lobby after logging in with correct credentials', async () => {
    const api = fakeApi()
    const { router } = await openLoginPage()

    logIn('  kamil_g ', PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lobby')
    const [, init] = api.callsTo('/api/auth/login')[0]
    expect(JSON.parse(String(init!.body))).toEqual({ login: 'kamil_g', password: PASSWORD })
    expect(new Headers(init!.headers).get('X-CSRFToken')).toBe('test-token')
  })

  it('accepts an e-mail address instead of the username', async () => {
    fakeApi()
    await openLoginPage()

    logIn('kamil@przyklad.pl', PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
  })

  it.each([
    ['a wrong password', 'kamil_g', 'zle-haslo'],
    ['an unknown user', 'ktos_inny', PASSWORD],
  ])('shows one message for %s, without saying which field was wrong', async (_case, login, password) => {
    fakeApi()
    const { router } = await openLoginPage()

    logIn(login, password)

    expect(await screen.findByRole('alert')).toHaveTextContent(INVALID_CREDENTIALS)
    expect(screen.getByLabelText('Nazwa użytkownika lub e-mail')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('Hasło')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('Hasło')).toHaveValue('')
    expect(router.state.location.pathname).toBe('/logowanie')
  })

  it('shows a message when the server fails', async () => {
    fakeApi({ handlers: { '/api/auth/login': () => new Response('Internal Server Error', { status: 500 }) } })
    await openLoginPage()

    logIn('kamil_g', PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent('Wystąpił błąd serwera.')
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeEnabled()
  })

  it('blocks the form while the request is in progress', async () => {
    let finish!: (response: Response) => void
    const api = fakeApi({
      handlers: {
        '/api/auth/login': (_init, session) =>
          new Promise((resolve) => {
            finish = (response) => {
              session.loggedIn = true
              resolve(response)
            }
          }),
      },
    })
    await openLoginPage()

    logIn('kamil_g', PASSWORD)

    const button = await screen.findByRole('button', { name: 'Logowanie…' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    await waitFor(() => expect(api.callsTo('/api/auth/login')).toHaveLength(1))

    finish(json({ id: 1, username: 'kamil_g', email: '', display_name: '', balance: 0 }))
    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
  })

  it('sends a player who is already logged in to the lobby', async () => {
    fakeApi({ loggedIn: true })
    const { router } = renderRoute('/logowanie')

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lobby')
  })
})
