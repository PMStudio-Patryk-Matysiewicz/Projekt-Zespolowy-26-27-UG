import { describe, expect, it } from 'vitest'

import { claimedBonus, NOW, transactions } from './test/walletData'
import { bonusStatus, filterTransactions, transactionKind, weekResult } from './wallet'

const now = NOW.getTime()

describe('filterTransactions', () => {
  it('keeps everything for "all", newest first', () => {
    expect(filterTransactions(transactions, 'all').map((t) => t.id)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1])
  })

  it('keeps one type', () => {
    expect(filterTransactions(transactions, 'win').map((t) => t.id)).toEqual([9, 7])
    expect(filterTransactions(transactions, 'bet').map((t) => t.id)).toEqual([8, 6, 5, 2])
    expect(filterTransactions(transactions, 'bonus').map((t) => t.id)).toEqual([4])
    expect(filterTransactions(transactions, 'refund').map((t) => t.id)).toEqual([3])
  })

  it('does not change the list it gets', () => {
    const copy = [...transactions]
    filterTransactions(transactions, 'all')
    expect(transactions).toEqual(copy)
  })
})

describe('weekResult', () => {
  it('adds up bets, wins and refunds of the last 7 days, per day', () => {
    const week = weekResult(transactions, now)

    // 18.10: -100 + 100; 19.10: -500 - 200 + 2840 - 100 + 200. Bonus and starting pool are left out.
    expect(week.total).toBe(2240)
    expect(week.days).toEqual([0, 0, 0, 0, 0, 0, 2240])
  })

  it('leaves out games older than 7 days', () => {
    const old = { ...transactions[8], id: 99, created_at: new Date(2026, 9, 12, 23, 59).toISOString() }
    const lastDay = { ...transactions[8], id: 98, amount: -50, created_at: new Date(2026, 9, 13, 0, 1).toISOString() }

    expect(weekResult([old, lastDay], now)).toEqual({ total: -50, days: [-50, 0, 0, 0, 0, 0, 0] })
  })

  it('is zero without transactions', () => {
    expect(weekResult([], now)).toEqual({ total: 0, days: [0, 0, 0, 0, 0, 0, 0] })
  })
})

describe('bonusStatus', () => {
  it('is claimed while the next bonus is in the future', () => {
    const status = bonusStatus(claimedBonus, now)

    expect(status).toMatchObject({ state: 'claimed', amount: 500 })
    expect(status.state === 'claimed' && status.nextIn).toBe((19 * 60 + 45) * 60_000)
  })

  it('is available when it was never claimed or the wait is over', () => {
    expect(bonusStatus({ amount: 500, last_claimed_at: null, next_available_at: null }, now).state).toBe('available')
    expect(bonusStatus(claimedBonus, new Date(2026, 9, 20, 9, 15).getTime()).state).toBe('available')
  })
})

describe('transactionKind', () => {
  it('has a label for unknown types', () => {
    expect(transactionKind('jackpot').label).toBe('Inne')
    expect(transactionKind('refund').label).toBe('Zwrot')
  })
})
