import { api } from './client'

// Response of GET /api/wallet. Assumed shape until the backend endpoint exists:
// WALLET.balance from docs/architecture.md, in chips.
export type Wallet = {
  balance: number
}

export function getWallet(): Promise<Wallet> {
  return api.get<Wallet>('/api/wallet')
}
