import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fakeApi, json, player } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

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

// Fake API (anonymous visitor) where the answer to POST /api/auth/register is up to the test.
function mockApi(registerResponse: () => Promise<Response> = async () => json(player, 201)) {
  return fakeApi({ handlers: { '/api/auth/register': registerResponse } })
}

describe('RegisterPage', () => {
  it('shows the sign-up form', async () => {
    mockApi()
    renderRoute('/rejestracja')

    expect(await screen.findByRole('heading', { level: 1, name: 'Załóż konto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/logowanie')
  })

  it('validates the form without calling the API', async () => {
    const api = mockApi()
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
    expect(api.callsTo('/api/auth/register')).toHaveLength(0)
  })

  it('hides a field error once the player edits the field', async () => {
    mockApi()
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    submit()
    fill('Nazwa użytkownika', 'k')

    expect(screen.queryByText('Podaj nazwę użytkownika.')).not.toBeInTheDocument()
  })

  it('sends the form and opens the lobby after a successful sign-up', async () => {
    const api = mockApi(async () => json({ id: 1, username: 'kamil_g' }, 201))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    const [, init] = api.callsTo('/api/auth/register')[0]
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
    const api = mockApi(() => new Promise((resolve) => (finish = resolve)))
    renderRoute('/rejestracja')
    await screen.findByRole('heading', { name: 'Załóż konto' })

    fillValidForm()
    submit()

    const button = await screen.findByRole('button', { name: 'Zakładanie konta…' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    await waitFor(() => expect(api.callsTo('/api/auth/register')).toHaveLength(1))

    finish(json({ id: 1 }, 201))
    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
  })

  it('sends a player who is already logged in to the lobby', async () => {
    fakeApi({ loggedIn: true })
    const { router } = renderRoute('/rejestracja')

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lobby')
  })
})
