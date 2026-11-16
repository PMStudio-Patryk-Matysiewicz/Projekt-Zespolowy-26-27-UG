import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fakeApi, PASSWORD } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

describe('auth: ProtectedRoute and the session', () => {
  it('sends an anonymous visitor from /lobby to the login page', async () => {
    fakeApi()
    const { router } = renderRoute('/lobby')

    expect(await screen.findByRole('heading', { level: 1, name: 'Zaloguj się' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/logowanie')
  })

  it('shows a loading state, not the login page, while the session is being checked', async () => {
    fakeApi({ handlers: { '/api/auth/me': () => new Promise<Response>(() => {}) } })
    renderRoute('/lobby')

    expect(await screen.findByRole('status')).toHaveTextContent('Ładowanie…')
    expect(screen.queryByRole('heading', { name: 'Zaloguj się' })).not.toBeInTheDocument()
  })

  it('treats an unreachable server as logged out', async () => {
    fakeApi({ handlers: { '/api/auth/me': () => Promise.reject(new TypeError('Failed to fetch')) } })
    renderRoute('/lobby')

    expect(await screen.findByRole('heading', { name: 'Zaloguj się' })).toBeInTheDocument()
  })

  it('keeps the player logged in after a page refresh', async () => {
    const api = fakeApi()
    const first = renderRoute('/logowanie')
    await screen.findByRole('heading', { name: 'Zaloguj się' })
    fireEvent.change(screen.getByLabelText('Nazwa użytkownika lub e-mail'), { target: { value: 'kamil_g' } })
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))
    await screen.findByRole('heading', { name: 'Lobby' })

    // Refresh: the React app starts from scratch, only the (fake) session cookie is left.
    first.unmount()
    const { router } = renderRoute('/lobby')

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    expect(await screen.findByText('Cześć, Kamil!')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lobby')
    expect(api.callsTo('/api/auth/me')).toHaveLength(2)
  })

  it('logs out: ends the session, and /lobby then redirects to the login page', async () => {
    const api = fakeApi({ loggedIn: true })
    const { router } = renderRoute('/lobby')
    await screen.findByRole('heading', { name: 'Lobby' })

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj się' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Emocje kasyna. Zero ryzyka.' })).toBeInTheDocument()
    await waitFor(() => expect(api.callsTo('/api/auth/logout')).toHaveLength(1))
    await waitFor(() => expect(api.session.loggedIn).toBe(false))

    await act(() => router.navigate('/lobby'))

    expect(await screen.findByRole('heading', { name: 'Zaloguj się' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/logowanie')
  })

  it('logs out locally even when the logout request fails', async () => {
    fakeApi({ loggedIn: true, handlers: { '/api/auth/logout': () => Promise.reject(new TypeError('Failed to fetch')) } })
    const { router } = renderRoute('/lobby')
    await screen.findByRole('heading', { name: 'Lobby' })

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj się' }))
    await screen.findByRole('heading', { name: 'Emocje kasyna. Zero ryzyka.' })
    await act(() => router.navigate('/lobby'))

    expect(await screen.findByRole('heading', { name: 'Zaloguj się' })).toBeInTheDocument()
  })
})
