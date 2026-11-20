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
  const net = roundNet(hands)
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

// Chips won (+) or lost (-) in a settled round, over all the player's hands.
export function roundNet(hands: HandView[]): number {
  return hands.reduce((sum, h) => sum + (h.payout ?? 0) - h.bet, 0)
}

// How the dealer's hand ended, for the result banner and the round panel.
export function dealerOutcome(table: BlackjackTable): string | undefined {
  if (table.phase !== 'settled' || table.dealer.cards.length === 0) return undefined
  const { cards, total } = table.dealer
  if (total > 21) return 'Krupier przekroczył 21'
  if (total === 21 && cards.length === 2) return 'Krupier ma blackjacka'
  return `Krupier ma ${total}`
}

// "twarda" (no ace counted as 11) or "miękka" (an ace counts as 11).
export function handKind(hand: Pick<HandView, 'soft'>): string {
  return hand.soft ? 'miękka' : 'twarda'
}

// --- dealing animation timing (ms) ---------------------------------------------------------
// The first two cards go round the table like at a real table: you, dealer, you, dealer
// (face down). Cards drawn later (hit, double, the dealer's draws) come one after another.

export const DEAL_STEP = 180
const DEALER_DRAW_START = 450 // after the hole card has flipped
const DEALER_DRAW_STEP = 380

export function playerCardDelay(index: number): number {
  return index < 2 ? index * 2 * DEAL_STEP : 0
}

export function dealerCardDelay(index: number, faceDown: boolean): number {
  if (index === 0) return DEAL_STEP
  if (index === 1) return faceDown ? 3 * DEAL_STEP : 0 // revealed: flips right away
  return DEALER_DRAW_START + (index - 2) * DEALER_DRAW_STEP
}

// The result banner waits until the dealer's last card has landed.
export function resultDelay(dealerCards: number): number {
  return dealerCards > 2 ? DEALER_DRAW_START + (dealerCards - 2) * DEALER_DRAW_STEP + 200 : 450
}

// Clearing the table before the next round: the old cards fly to the discard tray one after
// another (DISCARD_STEP apart); the next round is shown once the last one is gone.
export const DISCARD_STEP = 60
const DISCARD_FLIGHT = 450

export function discardDuration(cardCount: number): number {
  return DISCARD_FLIGHT + Math.max(0, cardCount - 1) * DISCARD_STEP + 100
}
