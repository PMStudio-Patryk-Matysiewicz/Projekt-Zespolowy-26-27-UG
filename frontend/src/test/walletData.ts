import type { DailyBonus, Transaction } from '../api/wallet'

// "Now" in the wallet tests: 19 October 2026, 13:30 local time.
export const NOW = new Date(2026, 9, 19, 13, 30)

// Local time, so the expected dates do not depend on the time zone of the machine.
const at = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute).toISOString()

// Same data as the mockup, in the order the backend keeps them (oldest first).
export const transactions: Transaction[] = [
  { id: 1, type: 'starting_pool', amount: 5000, balance_after: 5000, description: 'Pula startowa', created_at: at(2, 18, 3) },
  { id: 2, type: 'bet', amount: -100, balance_after: 9610, description: 'Wyścig #2477 · zwycięzca', created_at: at(18, 21, 40) },
  { id: 3, type: 'refund', amount: 100, balance_after: 9710, description: 'Blackjack · stół zamknięty w trakcie rundy', created_at: at(18, 21, 47) },
  { id: 4, type: 'bonus', amount: 500, balance_after: 10210, description: 'Bonus dzienny', created_at: at(19, 9, 15) },
  { id: 5, type: 'bet', amount: -500, balance_after: 9710, description: 'Makao · wpisowe do puli', created_at: at(19, 12, 30) },
  { id: 6, type: 'bet', amount: -200, balance_after: 9510, description: 'Wyścig #2481 · dokładna dwójka', created_at: at(19, 12, 39) },
  { id: 7, type: 'win', amount: 2840, balance_after: 12350, description: 'Wyścig #2481 · dokładna dwójka', created_at: at(19, 12, 41) },
  { id: 8, type: 'bet', amount: -100, balance_after: 12250, description: 'Blackjack · runda 12', created_at: at(19, 12, 58) },
  { id: 9, type: 'win', amount: 200, balance_after: 12450, description: 'Blackjack · runda 12', created_at: at(19, 13, 2) },
]

// Claimed today at 09:15, the next one tomorrow at 09:15 (19 h 45 min after NOW).
export const claimedBonus: DailyBonus = {
  amount: 500,
  last_claimed_at: at(19, 9, 15),
  next_available_at: at(20, 9, 15),
}
