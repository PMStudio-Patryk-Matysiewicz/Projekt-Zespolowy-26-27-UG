import type { DailyBonus, Transaction, TransactionType } from './api/wallet'

// How each transaction type looks in the table.
export const transactionKinds: Record<TransactionType, { label: string; tone: 'win' | 'bet' | 'bonus' | 'info' }> = {
  win: { label: 'Wygrana', tone: 'win' },
  bet: { label: 'Zakład', tone: 'bet' },
  bonus: { label: 'Bonus', tone: 'bonus' },
  refund: { label: 'Zwrot', tone: 'info' },
  starting_pool: { label: 'Start', tone: 'info' },
}

export function transactionKind(type: string) {
  return transactionKinds[type as TransactionType] ?? { label: 'Inne', tone: 'bet' as const }
}

// Filter buttons above the table.
export const transactionFilters = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'win', label: 'Wygrane' },
  { id: 'bet', label: 'Zakłady' },
  { id: 'bonus', label: 'Bonusy' },
  { id: 'refund', label: 'Zwroty' },
] as const

export type TransactionFilter = (typeof transactionFilters)[number]['id']

// Newest first; the filter keeps one type ('all' keeps everything, also the starting pool).
export function filterTransactions(transactions: Transaction[], filter: TransactionFilter): Transaction[] {
  const kept = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)
  return [...kept].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id)
}

// Types that come from playing; the 7-day result leaves out bonuses and the starting pool.
const GAME_TYPES = new Set<string>(['bet', 'win', 'refund'])

export type WeekResult = {
  total: number
  days: number[] // 7 values, oldest day first, today last
}

function startOfDay(time: number): number {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

// Result of the games from today and the 6 days before (local time), in total and per day.
export function weekResult(transactions: Transaction[], now: number): WeekResult {
  const today = startOfDay(now)
  const days = Array<number>(7).fill(0)

  for (const t of transactions) {
    if (!GAME_TYPES.has(t.type)) continue
    const day = startOfDay(Date.parse(t.created_at))
    // Rounding copes with days of 23 or 25 hours when the clock changes.
    const daysAgo = Math.round((today - day) / 86_400_000)
    if (daysAgo >= 0 && daysAgo < 7) days[6 - daysAgo] += t.amount
  }

  return { total: days.reduce((sum, value) => sum + value, 0), days }
}

export type BonusStatus =
  | { state: 'claimed'; amount: number; claimedAt: Date; nextIn: number }
  | { state: 'available'; amount: number }

// Claimed = the next bonus is still in the future; otherwise it is waiting to be picked up.
export function bonusStatus(bonus: DailyBonus, now: number): BonusStatus {
  const next = bonus.next_available_at ? Date.parse(bonus.next_available_at) : NaN
  if (bonus.last_claimed_at && next > now) {
    return { state: 'claimed', amount: bonus.amount, claimedAt: new Date(bonus.last_claimed_at), nextIn: next - now }
  }
  return { state: 'available', amount: bonus.amount }
}

export function isSameDay(a: Date, now: number): boolean {
  return startOfDay(a.getTime()) === startOfDay(now)
}
