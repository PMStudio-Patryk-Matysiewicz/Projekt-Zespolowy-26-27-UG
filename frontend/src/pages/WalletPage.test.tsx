import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Transaction } from '../api/wallet'
import { fakeApi, json, type Handlers } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'
import { claimedBonus, NOW, transactions } from '../test/walletData'

const TRANSACTIONS_URL = '/api/wallet/transactions?days=30'
const BONUS_URL = '/api/wallet/bonus'

// Intl puts non-breaking spaces between thousands; compare with plain ones.
const plain = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim()

function apiWith(list: Transaction[] = transactions, extra: Handlers = {}) {
  return fakeApi({
    loggedIn: true,
    handlers: {
      '/api/wallet': () => json({ balance: 12450 }),
      [TRANSACTIONS_URL]: () => json(list),
      [BONUS_URL]: () => json(claimedBonus),
      ...extra,
    },
  })
}

async function openWallet() {
  renderRoute('/portfel')
  return screen.findByRole('heading', { level: 1, name: 'Portfel' })
}

function card(title: string) {
  return screen.getByRole('region', { name: title })
}

function tableRows() {
  const [, ...rows] = screen.getAllByRole('row') // first row = column headers
  return rows.map((row) => within(row).getAllByRole('cell').map((cell) => plain(cell.textContent)))
}

beforeEach(() => {
  // Only Date is faked: timers stay real, so findBy* keeps working.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WalletPage', () => {
  it('shows the title in the top bar and marks Portfel in the sidebar', async () => {
    apiWith()
    await openWallet()

    expect(screen.getByText('Saldo, bonus dzienny i historia transakcji')).toBeInTheDocument()
    const menu = screen.getByRole('navigation', { name: 'Menu gracza' })
    expect(within(menu).getByRole('link', { name: 'Portfel' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the balance, the daily bonus status and the 7-day result', async () => {
    apiWith()
    await openWallet()

    expect(await within(card('Saldo')).findByText((_, el) => el?.tagName === 'SPAN' && plain(el.textContent) === '12 450')).toBeInTheDocument()

    const bonus = card('Bonus dzienny')
    expect(await within(bonus).findByText('Odebrany')).toBeInTheDocument()
    expect(plain(bonus.textContent)).toContain('+500dziś o 09:15')
    expect(plain(bonus.textContent)).toContain('Następny bonus za 19 h 45 min')

    expect(plain(card('Bilans 7 dni').textContent)).toContain('+2 240')
  })

  it('shows a bonus that is waiting to be claimed', async () => {
    apiWith(transactions, { [BONUS_URL]: () => json({ amount: 500, last_claimed_at: null, next_available_at: null }) })
    await openWallet()

    const bonus = card('Bonus dzienny')
    expect(await within(bonus).findByText('Do odebrania')).toBeInTheDocument()
    expect(within(bonus).getByText('Bonus czeka na odebranie.')).toBeInTheDocument()
  })

  it('lists transactions newest first with date, type, description, amount and balance after', async () => {
    apiWith()
    await openWallet()
    await screen.findByText('Pula startowa')

    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Data',
      'Typ',
      'Opis',
      'Kwota',
      'Saldo po',
    ])
    const rows = tableRows()
    expect(rows).toHaveLength(9)
    expect(rows[0]).toEqual(['19.10, 13:02', 'Wygrana', 'Blackjack · runda 12', '+200', '12 450'])
    expect(rows[5]).toEqual(['19.10, 09:15', 'Bonus', 'Bonus dzienny', '+500', '10 210'])
    expect(rows[6]).toEqual(['18.10, 21:47', 'Zwrot', 'Blackjack · stół zamknięty w trakcie rundy', '+100', '9 710'])
    expect(rows[8]).toEqual(['02.10, 18:03', 'Start', 'Pula startowa', '+5 000', '5 000'])
  })

  it('filters transactions by type', async () => {
    apiWith()
    await openWallet()
    await screen.findByText('Pula startowa')
    const filters = screen.getByRole('group', { name: 'Typ transakcji' })
    expect(within(filters).getByRole('button', { name: 'Wszystkie' })).toHaveAttribute('aria-pressed', 'true')

    const expected = { Wygrane: 'Wygrana', Zakłady: 'Zakład', Bonusy: 'Bonus', Zwroty: 'Zwrot' }
    for (const [button, type] of Object.entries(expected)) {
      fireEvent.click(within(filters).getByRole('button', { name: button }))

      expect(within(filters).getByRole('button', { name: button })).toHaveAttribute('aria-pressed', 'true')
      const rows = tableRows()
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.every((row) => row[1] === type)).toBe(true)
    }
    expect(tableRows()).toHaveLength(1) // Zwroty

    fireEvent.click(within(filters).getByRole('button', { name: 'Wszystkie' }))
    expect(tableRows()).toHaveLength(9)
  })

  it('says when a filter has nothing to show', async () => {
    apiWith(transactions.filter((t) => t.type !== 'bonus'))
    await openWallet()
    await screen.findByText('Pula startowa')

    fireEvent.click(screen.getByRole('button', { name: 'Bonusy' }))

    expect(screen.getByText('Brak bonusów z ostatnich 30 dni.')).toBeInTheDocument()
  })

  it('says when there are no transactions at all', async () => {
    apiWith([])
    await openWallet()

    expect(await screen.findByText('Brak transakcji z ostatnich 30 dni.')).toBeInTheDocument()
    expect(plain(card('Bilans 7 dni').textContent)).toContain('Bilans 7 dni0')
  })

  it('shows unavailable states while the backend has no transaction and bonus endpoints', async () => {
    // fakeApi answers 404 for URLs it does not know.
    fakeApi({ loggedIn: true })
    await openWallet()

    expect(await screen.findByText('Historia transakcji jest chwilowo niedostępna.')).toBeInTheDocument()
    expect(await within(card('Bonus dzienny')).findByText('Bonus dzienny będzie dostępny wkrótce.')).toBeInTheDocument()
    expect(within(card('Bilans 7 dni')).getByText('Brak danych o transakcjach.')).toBeInTheDocument()
    // The balance still comes from GET /api/wallet.
    expect(await within(card('Saldo')).findByText('żetonów')).toBeInTheDocument()
  })

  it('needs a logged-in player', async () => {
    fakeApi()
    const { router } = renderRoute('/portfel')

    expect(await screen.findByRole('heading', { name: 'Zaloguj się' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/logowanie')
  })
})
