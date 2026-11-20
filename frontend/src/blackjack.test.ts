import { describe, expect, it } from 'vitest'

import type { HandView } from './api/blackjack'
import { handTotal, lastBaseBet, roundSummary, shoeDealt, validateBet } from './blackjack'
import { makeTable } from './test/blackjackApi'

const limits = { min_bet: 10, max_bet: 1000, balance: 5000 }

function hand(bet: number, payout: number | null, extra: Partial<HandView> = {}): HandView {
  return { cards: [], total: 0, soft: false, bet, doubled: false, result: null, payout, ...extra }
}

describe('validateBet', () => {
  it('accepts 10 to 1000 chips', () => {
    expect(validateBet(10, limits)).toBeUndefined()
    expect(validateBet(150, limits)).toBeUndefined()
    expect(validateBet(1000, limits)).toBeUndefined()
  })

  it('rejects other amounts', () => {
    expect(validateBet(0, limits)).toBe('Minimalna stawka to 10 żetonów.')
    expect(validateBet(9, limits)).toBe('Minimalna stawka to 10 żetonów.')
    expect(validateBet(10.5, limits)).toBe('Minimalna stawka to 10 żetonów.')
    expect(validateBet(1001, limits)).toMatch(/^Maksymalna stawka to 1\s000 żetonów\.$/)
  })

  it('rejects more than the balance', () => {
    expect(validateBet(500, { ...limits, balance: 499 })).toBe('Masz tylko 499 żetonów.')
  })
})

describe('round helpers', () => {
  it('sums up a settled round', () => {
    expect(roundSummary([hand(100, 200)])).toBe('Wygrywasz 100 żetonów')
    expect(roundSummary([hand(100, 250)])).toBe('Wygrywasz 150 żetonów') // blackjack 3:2
    expect(roundSummary([hand(200, 0, { doubled: true })])).toBe('Przegrywasz 200 żetonów')
    expect(roundSummary([hand(100, 100)])).toBe('Remis — stawka wraca do Ciebie')
    expect(roundSummary([hand(100, 200), hand(100, 0)])).toBe('Remis — stawka wraca do Ciebie') // split
  })

  it('shows a soft total as both values', () => {
    expect(handTotal({ total: 17, soft: true })).toBe('7/17')
    expect(handTotal({ total: 17, soft: false })).toBe('17')
  })

  it('repeats the last bet without the double', () => {
    expect(lastBaseBet(makeTable())).toBeUndefined()
    expect(lastBaseBet(makeTable({ hands: { '3': [hand(300, 0, { doubled: true })] } }))).toBe(150)
  })

  it('tells how much of the shoe is dealt', () => {
    expect(shoeDealt(makeTable({ shoe: { remaining: 312, reshuffled: false } }))).toBe(0)
    expect(shoeDealt(makeTable({ shoe: { remaining: 78, reshuffled: false } }))).toBe(0.75)
  })
})
