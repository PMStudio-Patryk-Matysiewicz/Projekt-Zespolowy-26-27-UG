import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderRoute } from '../test/renderRoute'

const fetchMock = vi.fn<typeof fetch>()

function walletResponse(balance: number) {
  return new Response(JSON.stringify({ balance }), { status: 200 })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('LobbyPage', () => {
  it('shows the balance from GET /api/wallet in the top bar', async () => {
    fetchMock.mockResolvedValue(walletResponse(12450))
    renderRoute('/lobby')

    const topBar = screen.getByRole('banner')
    expect(await within(topBar).findByText('12 450')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/wallet', expect.anything())
  })

  it('shows a dash when the balance cannot be loaded', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }))
    renderRoute('/lobby')

    expect(await within(screen.getByRole('banner')).findByText('—')).toBeInTheDocument()
  })

  it('shows three game cards marked as coming soon', async () => {
    fetchMock.mockResolvedValue(walletResponse(0))
    renderRoute('/lobby')

    const cards = await screen.findAllByRole('article')
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
    fetchMock.mockResolvedValue(walletResponse(0))
    renderRoute('/lobby')

    const menu = await screen.findByRole('navigation', { name: 'Menu gracza' })
    expect(within(menu).getByRole('link', { name: 'Portfel' })).toHaveAttribute('href', '/portfel')
    expect(within(menu).getByRole('link', { name: 'Historia gier' })).toHaveAttribute('href', '/historia')
    expect(within(menu).getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/profil')
    expect(within(menu).getByRole('link', { name: 'Ranking' })).toHaveAttribute('href', '/ranking')
    expect(within(menu).getByRole('link', { name: 'Lobby' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the not found page for account pages that do not exist yet', async () => {
    renderRoute('/portfel')

    expect(await screen.findByRole('heading', { name: 'Nie znaleziono strony' })).toBeInTheDocument()
  })
})
