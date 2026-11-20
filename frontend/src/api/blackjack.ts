import { api } from './client'

// ASSUMED CONTRACT: the blackjack endpoints do not exist yet. It follows the game engine
// (backend/game_engine/blackjack.py): the table is BlackjackGame.view_for(<player's seat>)
// plus a few fields of GAME_SESSION (docs/architecture.md). Bots come in a separate task;
// until then the player sits alone, and `seats` holds only the player's seat.

// Card code from the engine (Card.code): rank + suit, e.g. '10H', 'AS', 'QD'. null = face down.
export type CardCode = string

export type Phase = 'betting' | 'player_turns' | 'settled'
export type Action = 'hit' | 'stand' | 'double' | 'split'
export type HandResult = 'win' | 'loss' | 'push' | 'blackjack'

export type HandView = {
  cards: CardCode[]
  total: number
  soft: boolean
  bet: number // chips on this hand, doubled after a double
  doubled: boolean
  result: HandResult | null // set when the round is settled
  payout: number | null // chips returned for this hand, stake included (0 = lost)
}

export type BlackjackTable = {
  id: number // GAME_SESSION.id
  seat: number // the player's seat, 1–5; String(seat) is the key in `seats`, `hands` and `turn`
  min_bet: number // 10
  max_bet: number // 1000
  balance: number // the player's wallet after the last action, so the page needs no extra request
  // --- view_for(seat) ---
  phase: Phase
  round_no: number
  seats: string[] // seats taking part, in playing order
  turn: { seat: string; hand: number } | null
  actions: Action[] // what the player may do now
  dealer: { cards: (CardCode | null)[]; total: number } // hole card null until settled
  hands: Record<string, HandView[]>
  shoe: { remaining: number; reshuffled: boolean }
}

export const SEATS = [1, 2, 3, 4, 5] as const
export const SHOE_CARDS = 6 * 52
export const SHUFFLE_AT = 0.75 // cut card at ~75% of the shoe

// The player's open table, or 404 when there is none. Loading it again restores the table
// after a page refresh (the state lives in GAME_SESSION.state on the server).
export function getTable(): Promise<BlackjackTable> {
  return api.get('/api/blackjack/table')
}

// Opens a table. 400 { seat: [...] } for a seat outside 1–5.
export function openTable(seat: number): Promise<BlackjackTable> {
  return api.post('/api/blackjack/table', { seat })
}

// Bets and deals a new round; the stake is taken from the wallet.
// 400 { amount: [...] } when the amount is outside min_bet–max_bet or above the balance.
export function placeBet(amount: number): Promise<BlackjackTable> {
  return api.post('/api/blackjack/table/bet', { amount })
}

// hit / stand / double / split on the hand whose turn it is. Double and split take
// another stake from the wallet.
export function playAction(action: Action, hand: number): Promise<BlackjackTable> {
  return api.post(`/api/blackjack/table/${action}`, { hand })
}

// Closes the table (between rounds). 204.
export function leaveTable(): Promise<void> {
  return api.post('/api/blackjack/table/leave')
}
