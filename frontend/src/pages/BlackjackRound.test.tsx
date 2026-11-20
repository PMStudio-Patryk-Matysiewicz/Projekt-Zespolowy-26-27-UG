import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { HandView } from '../api/blackjack'
import { blackjackServer, makeTable } from '../test/blackjackApi'
import { json } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

// Screens 11 (the player's move) and 12 (the settled round) of the blackjack table.

const plain = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim()

function hand(cards: string[], total: number, bet: number, extra: Partial<HandView> = {}): HandView {
  return { cards, total, soft: false, bet, doubled: false, result: null, payout: null, ...extra }
}

async function openTable() {
  const result = renderRoute('/gry/blackjack/stol')
  await screen.findByRole('heading', { level: 1, name: 'Blackjack' })
  return result
}

// Bets 150 with chips and waits for the deal (fake server: 10♥ 6♠ against the dealer's 9♣).
async function dealRound(amount = 150) {
  if (amount === 150) {
    fireEvent.click(screen.getByRole('button', { name: 'Dołóż 100' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dołóż 25' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dołóż 25' }))
  } else {
    fireEvent.click(screen.getByRole('button', { name: `Dołóż ${amount}` }))
  }
  fireEvent.click(screen.getByRole('button', { name: 'Rozdaj karty' }))
  await screen.findByText('Twój ruch', { selector: '[role="status"]' })
}

function panel() {
  return screen.getByRole('complementary', { name: /Przebieg rundy|Wyniki rundy/ })
}

function betCalls(api: ReturnType<typeof blackjackServer>) {
  return api.callsTo('/api/blackjack/table/bet').map(([, init]) => JSON.parse(String(init!.body)))
}

describe('blackjack: the player’s move (screen 11)', () => {
  it('shows the hand, its stake and the moves with their cost', async () => {
    blackjackServer(makeTable())
    await openTable()
    await dealRound()

    expect(plain(screen.getByLabelText('Suma Twojej ręki').textContent)).toBe('16')
    expect(screen.getByText('ręka twarda · stawka 150')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stój' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Dobierz' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Podwój +150' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Rozdziel +150' })).toBeDisabled()
    expect(within(screen.getByRole('group', { name: 'Twoja ręka' })).getByText('Twój ruch')).toBeInTheDocument()
  })

  it('tells how the round goes, without any info box', async () => {
    blackjackServer(makeTable())
    await openTable()
    await dealRound()

    const side = panel()
    expect(within(side).getByRole('heading', { name: 'Przebieg rundy' })).toBeInTheDocument()
    const lines = within(side).getAllByRole('listitem').map((li) => plain(li.textContent))
    expect(lines[0]).toBe('Krupierpokazuje 99♣ + zakryta')
    expect(lines[1]).toBe('TyTwój ruch10♥ + 6♠ = 16 · stawka 150')

    // Only the round's lines: no info box (strategy or shoe) below them.
    expect(within(side).queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(within(side).queryByText(/Podstawowa strategia|Sugerowany ruch|Zostało/)).not.toBeInTheDocument()
  })

  it('points out a pair that can be split', async () => {
    const pair = makeTable({
      phase: 'player_turns',
      round_no: 3,
      turn: { seat: '3', hand: 0 },
      actions: ['hit', 'stand', 'double', 'split'],
      dealer: { cards: ['10D', null], total: 10 },
      hands: { '3': [hand(['8H', '8S'], 16, 150)] },
    })
    blackjackServer(pair)
    await openTable()

    expect(await screen.findByText('Masz parę — możesz rozdzielić rękę na dwie.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rozdziel +150' })).toBeEnabled()
  })

  it('shows both hands after a split and marks the one being played', async () => {
    blackjackServer(
      makeTable({
        phase: 'player_turns',
        turn: { seat: '3', hand: 1 },
        actions: ['hit', 'stand', 'double'],
        dealer: { cards: ['6C', null], total: 6 },
        hands: { '3': [hand(['8H', '10S'], 18, 150), hand(['8D', '3C'], 11, 150)] },
      }),
    )
    await openTable()

    const first = await screen.findByRole('group', { name: 'Ręka 1' })
    const second = screen.getByRole('group', { name: 'Ręka 2' })
    expect(second).toHaveAttribute('aria-current', 'true')
    expect(within(second).getByText('Twój ruch')).toBeInTheDocument()
    expect(within(first).queryByText('Twój ruch')).not.toBeInTheDocument()
    const lines = within(panel()).getAllByRole('listitem').map((li) => plain(li.textContent))
    expect(lines.slice(1)).toEqual([
      'Ty · ręka 1stoi8♥ + 10♠ = 18 · stawka 150',
      'Ty · ręka 2Twój ruch8♦ + 3♣ = 11 · stawka 150',
    ])
  })
})

describe('blackjack: the settled round (screen 12)', () => {
  it('shows the win in the middle of the table, in the panel and in the bottom bar', async () => {
    blackjackServer(makeTable())
    await openTable()
    await dealRound()

    fireEvent.click(screen.getByRole('button', { name: 'Dobierz' }))

    const banner = await screen.findByText('Wygrywasz 150 żetonów')
    expect(banner.parentElement).toHaveTextContent('Krupier ma 17')
    expect(plain(screen.getByLabelText('Wynik rundy').textContent)).toBe('+150')
    expect(screen.getByText('Stawka wraca razem z wygraną')).toBeInTheDocument()
    const side = panel()
    expect(within(side).getByRole('heading', { name: 'Wyniki rundy' })).toBeInTheDocument()
    expect(plain(within(side).getAllByRole('listitem')[1].textContent)).toBe('Ty+15010♥ + 6♠ + 5♦ = 21 · stawka 150')
    expect(screen.getByText('Wygrana +150')).toBeInTheDocument()
  })

  it('shows a lost round', async () => {
    blackjackServer(makeTable())
    await openTable()
    await dealRound()

    fireEvent.click(screen.getByRole('button', { name: 'Stój' }))

    expect(await screen.findByText('Przegrywasz 150 żetonów')).toBeInTheDocument()
    expect(plain(screen.getByLabelText('Wynik rundy').textContent)).toBe('-150')
    expect(screen.getByText('Stawka przepada')).toBeInTheDocument()
    expect(plain(within(panel()).getAllByRole('listitem')[1].textContent)).toMatch(/^Ty-150/)
  })

  it('marks a dealer who went over 21', async () => {
    blackjackServer(
      makeTable({
        phase: 'settled',
        round_no: 7,
        dealer: { cards: ['10S', '6D', '9H'], total: 25 },
        hands: { '3': [hand(['10H', '9S'], 19, 150, { result: 'win', payout: 300 })] },
        balance: 12600,
      }),
    )
    await openTable()

    expect(await screen.findByText('Krupier przekroczył 21')).toBeInTheDocument()
    expect(screen.getByText('Fura')).toBeInTheDocument()
    expect(plain(within(panel()).getAllByRole('listitem')[0].textContent)).toBe('Krupier25 · fura10♠ + 6♦ + 9♥')
  })

  it('starts the next round with the same stake', async () => {
    const api = blackjackServer(makeTable())
    await openTable()
    await dealRound()
    fireEvent.click(screen.getByRole('button', { name: 'Stój' }))
    await screen.findByText('Przegrywasz 150 żetonów')

    fireEvent.click(screen.getByRole('button', { name: 'Następna runda · 150' }))

    expect(await screen.findByText('Twój ruch', { selector: '[role="status"]' })).toBeInTheDocument()
    expect(betCalls(api)).toEqual([{ amount: 150 }, { amount: 150 }])
    expect(screen.getByText('Runda 2')).toBeInTheDocument()
  })

  it('lets the player change the stake before the next round', async () => {
    const api = blackjackServer(makeTable())
    await openTable()
    await dealRound()
    fireEvent.click(screen.getByRole('button', { name: 'Stój' }))
    await screen.findByText('Przegrywasz 150 żetonów')

    fireEvent.click(screen.getByRole('button', { name: 'Zmień stawkę' }))
    await dealRound(500)

    expect(betCalls(api)).toEqual([{ amount: 150 }, { amount: 500 }])
  })

  it('does not start the next round when the balance is too low', async () => {
    const api = blackjackServer(
      makeTable({
        phase: 'settled',
        balance: 100,
        dealer: { cards: ['10S', '9D'], total: 19 },
        hands: { '3': [hand(['10H', '7S'], 17, 150, { result: 'loss', payout: 0 })] },
      }),
    )
    await openTable()

    fireEvent.click(await screen.findByRole('button', { name: 'Następna runda · 150' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Masz tylko 100 żetonów.')
    expect(betCalls(api)).toHaveLength(0)
  })

  it('shows the server message when the next round cannot start', async () => {
    blackjackServer(
      makeTable({
        phase: 'settled',
        dealer: { cards: ['10S', '9D'], total: 19 },
        hands: { '3': [hand(['10H', '9S'], 19, 150, { result: 'push', payout: 150 })] },
      }),
      { '/api/blackjack/table/bet': () => json({ amount: ['Stół jest zamknięty.'] }, 400) },
    )
    await openTable()
    expect(await screen.findByText('Remis — stawka wraca do Ciebie')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Następna runda · 150' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Stół jest zamknięty.')
  })
})

describe('blackjack: clearing the table', () => {
  it('sends the old cards to the discard tray before showing the next round', async () => {
    // A browser without "reduce motion" (jsdom has no matchMedia, which turns animations off).
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    const api = blackjackServer(makeTable())
    await openTable()
    await dealRound()
    fireEvent.click(screen.getByRole('button', { name: 'Stój' }))
    await screen.findByText('Przegrywasz 150 żetonów')

    // The result (and with it the next-round button) shows once the felt has revealed it.
    fireEvent.click(await screen.findByRole('button', { name: 'Następna runda · 150' }, { timeout: 2000 }))
    await waitFor(() => expect(betCalls(api)).toHaveLength(2))

    // The server has answered (the bottom bar shows the new hand), but the felt still shows the
    // old round while its cards fly away…
    expect(await screen.findByLabelText('Suma Twojej ręki')).toBeInTheDocument()
    expect(screen.getByText('Przegrywasz 150 żetonów')).toBeInTheDocument()

    // …and then the new round.
    expect(await screen.findByText('Twój ruch', { selector: '[role="status"]' }, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.queryByText('Przegrywasz 150 żetonów')).not.toBeInTheDocument()
  })
})

describe('blackjack: revealing the result', () => {
  it('keeps the balance, the panel and the bottom bar from giving the result away too early', async () => {
    // A browser without "reduce motion" (jsdom has no matchMedia, which turns animations off).
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    blackjackServer(makeTable())
    await openTable()
    await dealRound() // 12 450 - 150 = 12 300

    fireEvent.click(screen.getByRole('button', { name: 'Dobierz' })) // wins: +300 back

    // The felt has the result (it fades in there after the dealer's cards)…
    expect(await screen.findByText('Wygrywasz 150 żetonów')).toBeInTheDocument()
    // …but the rest still shows the table from before it.
    expect(screen.getByText('Ty · 12 300')).toBeInTheDocument()
    expect(screen.queryByLabelText('Wynik rundy')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stój' })).toBeDisabled()
    expect(within(panel()).getByRole('heading', { name: 'Przebieg rundy' })).toBeInTheDocument()

    // Together with the banner, everything shows the result.
    expect(await screen.findByLabelText('Wynik rundy', {}, { timeout: 2000 })).toHaveTextContent('+150')
    expect(screen.getByText('Ty · 12 600')).toBeInTheDocument()
    expect(within(panel()).getByRole('heading', { name: 'Wyniki rundy' })).toBeInTheDocument()
  })
})
