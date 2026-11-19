import { useState } from 'react'

import { getDailyBonus, getTransactions, TRANSACTION_DAYS } from '../api/wallet'
import TransactionTable from '../components/wallet/TransactionTable'
import WalletCards from '../components/wallet/WalletCards'
import { useApiData } from '../hooks/useApiData'
import { useNow } from '../hooks/useNow'
import { useWallet } from '../hooks/useWallet'
import type { TransactionFilter } from '../wallet'

const loadTransactions = () => getTransactions(TRANSACTION_DAYS)

// "Portfel": balance, daily bonus, 7-day result and the transaction history.
// The title comes from the route's handle and is shown in the top bar.
// Transactions are loaded once (last 30 days); filtering and the 7-day result are worked out here.
export default function WalletPage() {
  const wallet = useWallet()
  const bonus = useApiData(getDailyBonus)
  const transactions = useApiData(loadTransactions)
  const now = useNow()
  const [filter, setFilter] = useState<TransactionFilter>('all')

  return (
    <>
      <WalletCards wallet={wallet} bonus={bonus} transactions={transactions} now={now} />
      <TransactionTable transactions={transactions} filter={filter} onFilterChange={setFilter} days={TRANSACTION_DAYS} />
    </>
  )
}
