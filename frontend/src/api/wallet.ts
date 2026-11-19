import { api } from './client'

// Response of GET /api/wallet (wallet.WalletSerializer), in chips.
export type Wallet = {
  balance: number
}

export function getWallet(): Promise<Wallet> {
  return api.get<Wallet>('/api/wallet')
}

// One entry of the wallet ledger (wallet.Transaction). `amount` is signed: negative = chips spent.
// `type` is one of TransactionType; the backend may add more, so the page copes with unknown ones.
export type Transaction = {
  id: number
  type: string
  amount: number
  balance_after: number
  description: string
  created_at: string // ISO 8601
}

// Values of wallet.Transaction.Type. `bonus` does not exist yet; it comes with the daily bonus.
export type TransactionType = 'starting_pool' | 'bet' | 'win' | 'refund' | 'bonus'

export const TRANSACTION_DAYS = 30

// ASSUMED CONTRACT, the endpoint does not exist yet:
// GET /api/wallet/transactions?days=30 -> Transaction[] of the logged-in player from the last `days` days
// (any order; the page sorts them). Until it exists the page shows "unavailable".
export function getTransactions(days = TRANSACTION_DAYS): Promise<Transaction[]> {
  return api.get<Transaction[]>(`/api/wallet/transactions?days=${days}`)
}

// ASSUMED CONTRACT, the endpoint does not exist yet (docs/architecture.md: WALLET.last_bonus_at,
// WalletService.claim_daily_bonus):
// GET /api/wallet/bonus -> DailyBonus. Until it exists the page shows "coming soon".
export type DailyBonus = {
  amount: number // chips per claim
  last_claimed_at: string | null // ISO 8601, null = never claimed
  next_available_at: string | null // ISO 8601, null or in the past = can be claimed now
}

export function getDailyBonus(): Promise<DailyBonus> {
  return api.get<DailyBonus>('/api/wallet/bonus')
}
