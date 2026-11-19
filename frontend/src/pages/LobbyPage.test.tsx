import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fakeApi, json, type Handlers } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

// The lobby needs a logged-in player; fakeApi's player has 12 450 chips.
async function openLobby(handlers?: Handlers) {
  const api = fakeApi({ loggedIn: true, handlers })
  renderRoute('/lobby')
  await screen.findByRole('heading', { name: 'Lobby' })
  return api
}

describe('LobbyPage', () => {
  it('shows the balance from GET /api/wallet in the top bar', async () => {
    const api = await openLobby({ '/api/wallet': () => json({ balance: 32000 }) })

    const topBar = screen.getByRole('banner')
    expect(await within(topBar).findByText('32 000')).toBeInTheDocument()
    expect(api.callsTo('/api/wallet')).toHaveLength(1)
  })

  it('greets the player by name', async () => {
    await openLobby()

    expect(within(screen.getByRole('banner')).getByText('Cześć, Kamil!')).toBeInTheDocument()
  })

  it('shows a dash when the balance cannot be loaded', async () => {
    await openLobby({ '/api/wallet': () => new Response('', { status: 404 }) })

    expect(await within(screen.getByRole('banner')).findByText('—')).toBeInTheDocument()
  })

  it('shows three game cards marked as coming soon', async () => {
    await openLobby()

    const cards = screen.getAllByRole('article')
    expect(cards.map((card) => within(card).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Blackjack',
      'Makao',
      'Wyścigi konne',
    ])
    for (const card of cards) {
      expect(within(card).getByText('Wkrótce')).toBeInTheDocument()
      expect(within(card).queryByRole('link', { name: 'Graj' })).not.toBeInTheDocument()
    }
  })

  it('links the sidebar to wallet, history, profile and ranking', async () => {
    await openLobby()

    const menu = screen.getByRole('navigation', { name: 'Menu gracza' })
    expect(within(menu).getByRole('link', { name: 'Portfel' })).toHaveAttribute('href', '/portfel')
    expect(within(menu).getByRole('link', { name: 'Historia gier' })).toHaveAttribute('href', '/historia')
    expect(within(menu).getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/profil')
    expect(within(menu).getByRole('link', { name: 'Ranking' })).toHaveAttribute('href', '/ranking')
    expect(within(menu).getByRole('link', { name: 'Lobby' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the not found page for account pages that do not exist yet', async () => {
    fakeApi({ loggedIn: true })
    renderRoute('/profil')

    expect(await screen.findByRole('heading', { name: 'Nie znaleziono strony' })).toBeInTheDocument()
  })
})
