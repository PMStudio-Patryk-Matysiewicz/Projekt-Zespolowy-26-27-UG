import type { BlackjackTable, HandView } from '../api/blackjack'
import { fakeApi, json, type Handlers } from './fakeApi'

export function makeTable(overrides: Partial<BlackjackTable> = {}): BlackjackTable {
  return {
    id: 418,
    seat: 3,
    min_bet: 10,
    max_bet: 1000,
    balance: 12450,
    phase: 'betting',
    round_no: 0,
    seats: ['3'],
    turn: null,
    actions: [],
    dealer: { cards: [], total: 0 },
    hands: {},
    shoe: { remaining: 312, reshuffled: false },
    ...overrides,
  }
}

const body = (init?: RequestInit) => JSON.parse(String(init?.body ?? '{}'))

function hand(cards: string[], total: number, bet: number, extra: Partial<HandView> = {}): HandView {
  return { cards, total, soft: false, bet, doubled: false, result: null, payout: null, ...extra }
}

// A fake blackjack server with a fixed deal: the player gets 10♥ 6♠ (16), the dealer 9♣ + hole card.
// Hit draws 5♦ (21) and wins; stand loses to the dealer's 17. Like GAME_SESSION, the table
// lives on the "server", so rendering the page again behaves like a refresh.
export function blackjackServer(initial: BlackjackTable | null, extra: Handlers = {}) {
  const server = { table: initial }
  const seatKey = () => String(server.table!.seat)

  function settle(cards: string[], total: number, result: 'win' | 'loss') {
    const t = server.table!
    const [mine] = t.hands[seatKey()]
    const payout = result === 'win' ? mine.bet * 2 : 0
    server.table = {
      ...t,
      phase: 'settled',
      turn: null,
      actions: [],
      balance: t.balance + payout,
      dealer: { cards: ['9C', '8D'], total: 17 },
      hands: { [seatKey()]: [hand(cards, total, mine.bet, { result, payout })] },
    }
    return json(server.table)
  }

  const api = fakeApi({
    loggedIn: true,
    handlers: {
      '/api/blackjack/table': (init) => {
        if (init?.method === 'POST') {
          const { seat } = body(init)
          if (![1, 2, 3, 4, 5].includes(seat)) return json({ seat: ['Wybierz miejsce od 1 do 5.'] }, 400)
          server.table = makeTable({ seat, seats: [String(seat)] })
          return json(server.table, 201)
        }
        return server.table ? json(server.table) : json({ detail: 'Not found.' }, 404)
      },
      '/api/blackjack/table/bet': (init) => {
        const t = server.table!
        const { amount } = body(init)
        if (!Number.isInteger(amount) || amount < t.min_bet || amount > t.max_bet) {
          return json({ amount: ['Stawka musi wynosić od 10 do 1000 żetonów.'] }, 400)
        }
        if (amount > t.balance) return json({ amount: ['Za mało żetonów.'] }, 400)
        server.table = {
          ...t,
          phase: 'player_turns',
          round_no: t.round_no + 1,
          balance: t.balance - amount,
          turn: { seat: seatKey(), hand: 0 },
          actions: ['hit', 'stand', 'double'],
          dealer: { cards: ['9C', null], total: 9 },
          hands: { [seatKey()]: [hand(['10H', '6S'], 16, amount)] },
          shoe: { remaining: t.shoe.remaining - 4, reshuffled: false },
        }
        return json(server.table)
      },
      '/api/blackjack/table/hit': () => settle(['10H', '6S', '5D'], 21, 'win'),
      '/api/blackjack/table/stand': () => settle(['10H', '6S'], 16, 'loss'),
      '/api/blackjack/table/leave': () => {
        server.table = null
        return new Response(null, { status: 204 })
      },
      ...extra,
    },
  })

  return { ...api, server }
}
