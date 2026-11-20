import type { BlackjackTable, HandResult, HandView } from './api/blackjack'
import { SHOE_CARDS } from './api/blackjack'
import { formatChips } from './format'

export const SETUP_PATH = '/gry/blackjack'
export const TABLE_PATH = '/gry/blackjack/stol'

// Checks a bet before it is sent. The server checks it again; this only saves a round trip
// and explains the limits. Returns the message to show, or undefined when the bet is fine.
export function validateBet(amount: number, { min_bet, max_bet, balance }: Pick<BlackjackTable, 'min_bet' | 'max_bet' | 'balance'>) {
  if (!Number.isInteger(amount) || amount < min_bet) return `Minimalna stawka to ${formatChips(min_bet)} żetonów.`
  if (amount > max_bet) return `Maksymalna stawka to ${formatChips(max_bet)} żetonów.`
  if (amount > balance) return `Masz tylko ${formatChips(balance)} żetonów.`
  return undefined
}

// The player's hands in this round (two after a split).
export function playerHands(table: BlackjackTable): HandView[] {
  return table.hands[String(table.seat)] ?? []
}

// Bet of the last round without doubles, for "Powtórz" (bet the same again).
export function lastBaseBet(table: BlackjackTable): number | undefined {
  const first = playerHands(table)[0]
  if (!first) return undefined
  return first.doubled ? first.bet / 2 : first.bet
}

export const resultLabels: Record<HandResult, string> = {
  blackjack: 'Blackjack!',
  win: 'Wygrana',
  push: 'Remis',
  loss: 'Przegrana',
}

// "Wygrywasz 150 żetonów" etc. for a settled round.
export function roundSummary(hands: HandView[]): string {
  const stake = hands.reduce((sum, h) => sum + h.bet, 0)
  const payout = hands.reduce((sum, h) => sum + (h.payout ?? 0), 0)
  const net = payout - stake
  if (net > 0) return `Wygrywasz ${formatChips(net)} żetonów`
  if (net < 0) return `Przegrywasz ${formatChips(-net)} żetonów`
  return 'Remis — stawka wraca do Ciebie'
}

// How much of the shoe has been dealt, 0–1.
export function shoeDealt(table: BlackjackTable): number {
  return Math.min(1, Math.max(0, 1 - table.shoe.remaining / SHOE_CARDS))
}

// "17" or, for a soft hand, "7/17" (ace counted as 1 or 11).
export function handTotal(hand: Pick<HandView, 'total' | 'soft'>): string {
  return hand.soft && hand.total <= 21 ? `${hand.total - 10}/${hand.total}` : String(hand.total)
}
