import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderRoute } from '../test/renderRoute'

const fetchMock = vi.fn<typeof fetch>()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillValidForm() {
  fill('Nazwa użytkownika', 'kamil_g')
  fill('E-mail', 'kamil@przyklad.pl')
  fill('Nazwa wyświetlana', 'Kamil')
  fill('Hasło', 'tajne-haslo-1')
  fill('Powtórz hasło', 'tajne-haslo-1')
  fireEvent.click(screen.getByLabelText('Mam ukończone 18 lat i akceptuję regulamin'))
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Załóż konto i odbierz/ }))
}

// Answers the CSRF request and GET /api/wallet (lobby after sign-up); the register call is up to the test.
function mockApi(registerResponse: () => Promise<Response>) {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input)
    if (url === '/api/auth/csrf') {
      document.cookie = 'csrftoken=test-token'
      return new Response(null, { status: 204 })
    }
    if (url === '/api/auth/register') return registerResponse()
    if (url === '/api/wallet') return json({ balance: 5000 })
    return new Response(null, { status: 404 })
  })
}

function registerCalls() {
  return fetchMock.mock.calls.filter(([url]) => url === '/api/auth/register')
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('RegisterPage', () => {
  it('shows the sign-up form', async () => {
    renderRoute('/rejestracja')

    expect(await screen.findByRole('heading', { level: 1, name: 'Załóż konto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/logowanie')
  })

  it('validates the form without calling the API', async () => {
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fill('Hasło', 'tajne-haslo-1')
    fill('Powtórz hasło', 'inne-haslo-1')
    submit()

    expect(screen.getByText('Podaj nazwę użytkownika.')).toBeInTheDocument()
    expect(screen.getByText('Hasła nie są takie same.')).toBeInTheDocument()
    expect(screen.getByText('Musisz potwierdzić wiek i zaakceptować regulamin.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nazwa użytkownika')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nazwa użytkownika')).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('hides a field error once the player edits the field', async () => {
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    submit()
    fill('Nazwa użytkownika', 'k')

    expect(screen.queryByText('Podaj nazwę użytkownika.')).not.toBeInTheDocument()
  })

  it('sends the form and opens the lobby after a successful sign-up', async () => {
    mockApi(async () => json({ id: 1, username: 'kamil_g' }, 201))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    const [, init] = registerCalls()[0]
    expect(JSON.parse(String(init!.body))).toEqual({
      username: 'kamil_g',
      email: 'kamil@przyklad.pl',
      display_name: 'Kamil',
      password: 'tajne-haslo-1',
    })
    expect(new Headers(init!.headers).get('X-CSRFToken')).toBe('test-token')
  })

  it('shows field errors returned by the API', async () => {
    mockApi(async () =>
      json({ username: ['A user with that username already exists.'], password: ['This password is too common.'] }, 400),
    )
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    expect(await screen.findByText('A user with that username already exists.')).toBeInTheDocument()
    expect(screen.getByText('This password is too common.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nazwa użytkownika')).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a message when the server fails', async () => {
    mockApi(async () => new Response('Internal Server Error', { status: 500 }))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Wystąpił błąd serwera.')
    expect(screen.getByRole('button', { name: /Załóż konto i odbierz/ })).toBeEnabled()
  })

  it('shows a message when the server cannot be reached', async () => {
    mockApi(() => Promise.reject(new TypeError('Failed to fetch')))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się połączyć z serwerem.')
  })

  it('blocks the form while the request is in progress', async () => {
    let finish!: (response: Response) => void
    mockApi(() => new Promise((resolve) => (finish = resolve)))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    const button = await screen.findByRole('button', { name: 'Zakładanie konta…' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    await waitFor(() => expect(registerCalls()).toHaveLength(1))

    finish(json({ id: 1 }, 201))
    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
  })
})
