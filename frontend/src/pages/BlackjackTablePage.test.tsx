import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { blackjackServer, makeTable } from '../test/blackjackApi'
import { renderRoute } from '../test/renderRoute'

const plain = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim()

async function openTable() {
  const result = renderRoute('/gry/blackjack/stol')
  await screen.findByRole('heading', { level: 1, name: 'Blackjack' })
  return result
}

function addChip(value: number, times = 1) {
  for (let i = 0; i < times; i++) fireEvent.click(screen.getByRole('button', { name: `Dołóż ${value}` }))
}

function stake() {
  return plain(screen.getByLabelText('Twoja stawka').textContent)
}

function balance() {
  // Amount next to the coin in the header, e.g. "12 450".
  return plain(screen.getByRole('banner').querySelector('p span:nth-of-type(1)')?.textContent ?? '')
}

function betCalls(api: ReturnType<typeof blackjackServer>) {
  return api.callsTo('/api/blackjack/table/bet').map(([, init]) => JSON.parse(String(init!.body)))
}

describe('BlackjackTablePage', () => {
  it('shows the table: seat, round, balance and the betting controls', async () => {
    blackjackServer(makeTable({ seat: 2, seats: ['2'], round_no: 6 }))
    await openTable()

    expect(screen.getByText('Stół #418')).toBeInTheDocument()
    expect(screen.getByText('Runda 6')).toBeInTheDocument()
    expect(screen.getByText('Miejsce 2')).toBeInTheDocument()
    expect(balance()).toBe('12 450')
    expect(within(screen.getByRole('region', { name: 'Stół' })).getByRole('status')).toHaveTextContent('Postaw zakład')
    const seats = within(screen.getByRole('list', { name: 'Miejsca przy stole' })).getAllByRole('listitem')
    expect(seats).toHaveLength(5)
    expect(within(seats[1]).getByText('Ty · 12 450')).toBeInTheDocument()
    expect(within(seats[0]).getByText('Wolne miejsce')).toBeInTheDocument()
  })

  it('accepts a bet between 10 and 1000: it is sent, deducted and the cards are dealt', async () => {
    const api = blackjackServer(makeTable())
    await openTable()

    addChip(100)
    addChip(25, 2)
    expect(stake()).toBe('150')
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))

    expect(await screen.findByText('Twój ruch', { selector: '[role="status"]' })).toBeInTheDocument()
    expect(betCalls(api)).toEqual([{ amount: 150 }])
    expect(balance()).toBe('12 300')
    const myHand = screen.getByRole('group', { name: 'Twoja ręka' })
    expect(within(myHand).getByRole('img', { name: '10 kier' })).toBeInTheDocument()
    expect(within(myHand).getByRole('img', { name: '6 pik' })).toBeInTheDocument()
    expect(within(myHand).getByText('Stawka 150')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Karta zakryta' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '9 trefl' })).toBeInTheDocument()
  })

  it.each([
    ['below the minimum', 5, 'Minimalna stawka to 10 żetonów.'],
    ['above the maximum', 1500, 'Maksymalna stawka to 1 000 żetonów.'],
  ])('rejects a bet %s without sending it', async (_case, amount, message) => {
    const api = blackjackServer(makeTable())
    await openTable()

    if (amount === 5) addChip(5)
    else addChip(500, 3)
    expect(stake()).toBe(amount === 5 ? '5' : '1 500')
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))

    expect(plain(screen.getByRole('alert').textContent)).toBe(message)
    expect(betCalls(api)).toHaveLength(0)
    expect(balance()).toBe('12 450')
  })

  it('rejects a bet above the balance', async () => {
    const api = blackjackServer(makeTable({ balance: 90 }))
    await openTable()

    addChip(100)
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Masz tylko 90 żetonów.')
    expect(betCalls(api)).toHaveLength(0)
  })

  it('shows the message when the server rejects a bet', async () => {
    blackjackServer(makeTable(), {
      '/api/blackjack/table/bet': () =>
        new Response(JSON.stringify({ amount: ['Stawka musi wynosić od 10 do 1000 żetonów.'] }), { status: 400 }),
    })
    await openTable()

    addChip(25)
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Stawka musi wynosić od 10 do 1000 żetonów.')
    expect(balance()).toBe('12 450')
  })

  it('clears the bet', async () => {
    blackjackServer(makeTable())
    await openTable()

    addChip(500)
    fireEvent.click(screen.getByRole('button', { name: 'Wyczyść' }))

    expect(stake()).toBe('0')
    expect(screen.getByRole('button', { name: 'Rozdaj karty' })).toBeDisabled()
  })

  it('offers only the moves the server allows', async () => {
    blackjackServer(makeTable())
    await openTable()
    addChip(25)
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))
    await screen.findByText('Twój ruch', { selector: '[role="status"]' })

    expect(screen.getByRole('button', { name: /Dobierz/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Stój/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Podwój/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Rozdziel/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Odejdź od stołu' })).toBeDisabled()
  })

  it('plays a round to the end and pays out a win', async () => {
    const api = blackjackServer(makeTable())
    await openTable()
    addChip(100)
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))
    await screen.findByText('Twój ruch', { selector: '[role="status"]' })

    fireEvent.click(screen.getByRole('button', { name: /Dobierz/ }))

    expect(await screen.findByText(/Wygrywasz 100 żetonów/)).toBeInTheDocument()
    expect(JSON.parse(String(api.callsTo('/api/blackjack/table/hit')[0][1]!.body))).toEqual({ hand: 0 })
    expect(screen.getByText('Wygrana +100')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '8 karo' })).toBeInTheDocument() // hole card shown
    expect(balance()).toBe('12 550')
    // Next round with the same stake (screen 12).
    expect(screen.getByRole('button', { name: 'Następna runda · 100' })).toBeInTheDocument()
  })

  it('keeps the table, cards and bet after a page refresh', async () => {
    const api = blackjackServer(makeTable())
    const first = await openTable()
    addChip(25, 2)
    fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))
    await screen.findByText('Twój ruch', { selector: '[role="status"]' })

    // Refresh: the app starts from scratch and asks the server for the table again.
    first.unmount()
    await openTable()

    expect(await screen.findByText('Twój ruch', { selector: '[role="status"]' })).toBeInTheDocument()
    expect(screen.getByText('Runda 1')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '10 kier' })).toBeInTheDocument()
    expect(screen.getByText('Stawka 50')).toBeInTheDocument()
    expect(balance()).toBe('12 400')
    expect(api.callsTo('/api/blackjack/table')).toHaveLength(2)
  })

  it('leaves the table between rounds', async () => {
    const api = blackjackServer(makeTable())
    const { router } = await openTable()

    fireEvent.click(screen.getByRole('button', { name: 'Odejdź od stołu' }))

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lobby')
    expect(api.server.table).toBeNull()
  })

  it('sends a player without an open table to the seat choice', async () => {
    blackjackServer(null)
    const { router } = renderRoute('/gry/blackjack/stol')

    expect(await screen.findByRole('group', { name: 'Wybierz miejsce przy stole' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/gry/blackjack')
  })

  it('says so when the table cannot be loaded', async () => {
    blackjackServer(null, { '/api/blackjack/table': () => new Response('', { status: 500 }) })
    renderRoute('/gry/blackjack/stol')

    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się wczytać stołu.')
  })

  it('needs a logged-in player', async () => {
    const api = blackjackServer(makeTable())
    api.session.loggedIn = false
    const { router } = renderRoute('/gry/blackjack/stol')

    await screen.findByRole('heading', { name: 'Zaloguj się' })
    await act(async () => {})
    expect(router.state.location.pathname).toBe('/logowanie')
  })
})
