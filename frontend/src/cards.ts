// A standard 52-card deck (no jokers), in the engine's card codes: rank + suit, e.g. '10H', 'AS'.

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
export const SUITS = ['C', 'D', 'H', 'S'] as const

export type Rank = (typeof RANKS)[number]
export type Suit = (typeof SUITS)[number]
export type Card = { rank: Rank; suit: Suit }

export const SUIT_SYMBOLS: Record<Suit, string> = { C: '♣', D: '♦', H: '♥', S: '♠' }

const SUIT_NAMES: Record<Suit, string> = { C: 'trefl', D: 'karo', H: 'kier', S: 'pik' }
const RANK_NAMES: Partial<Record<Rank, string>> = { J: 'Walet', Q: 'Dama', K: 'Król', A: 'As' }

export function isRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D'
}

// '10H' -> { rank: '10', suit: 'H' }; undefined for anything that is not one of the 52 cards.
export function parseCard(code: string): Card | undefined {
  const rank = code.slice(0, -1) as Rank
  const suit = code.slice(-1) as Suit
  return RANKS.includes(rank) && SUITS.includes(suit) ? { rank, suit } : undefined
}

// "As kier", "10 trefl", "Dama pik"
export function cardName({ rank, suit }: Card): string {
  return `${RANK_NAMES[rank] ?? rank} ${SUIT_NAMES[suit]}`
}

export const fullDeck: string[] = SUITS.flatMap((suit) => RANKS.map((rank) => rank + suit))
