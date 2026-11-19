import type { Transaction } from '../../api/wallet'
import { formatChips, formatDateTime, formatSignedChips } from '../../format'
import type { ApiData } from '../../hooks/useApiData'
import { filterTransactions, transactionFilters, transactionKind, type TransactionFilter } from '../../wallet'
import styles from './TransactionTable.module.css'

type TransactionTableProps = {
  transactions: ApiData<Transaction[]>
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  days: number
}

const emptyMessages: Record<TransactionFilter, string> = {
  all: 'Brak transakcji',
  win: 'Brak wygranych',
  bet: 'Brak zakładów',
  bonus: 'Brak bonusów',
  refund: 'Brak zwrotów',
}

// Ledger of the wallet with filter buttons by type.
export default function TransactionTable({ transactions, filter, onFilterChange, days }: TransactionTableProps) {
  const rows = transactions.status === 'ready' ? filterTransactions(transactions.data, filter) : []

  let message: string | undefined
  if (transactions.status === 'loading') message = 'Ładowanie transakcji…'
  else if (transactions.status === 'error') message = 'Historia transakcji jest chwilowo niedostępna.'
  else if (rows.length === 0) message = `${emptyMessages[filter]} z ostatnich ${days} dni.`

  return (
    <section aria-labelledby="transactions-title">
      <h2 id="transactions-title" className={styles.srOnly}>
        Historia transakcji
      </h2>

      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Typ transakcji">
          {transactionFilters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={styles.filter}
              aria-pressed={filter === id}
              onClick={() => onFilterChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.period}>Ostatnie {days} dni</span>
      </div>

      <div className={styles.tableBox}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Typ</th>
              <th scope="col">Opis</th>
              <th scope="col" className={styles.numeric}>
                Kwota
              </th>
              <th scope="col" className={styles.numeric}>
                Saldo po
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const kind = transactionKind(t.type)
              return (
                <tr key={t.id}>
                  <td className={styles.date}>{formatDateTime(new Date(t.created_at))}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[kind.tone]}`}>{kind.label}</span>
                  </td>
                  <td>{t.description || kind.label}</td>
                  <td className={`${styles.numeric} ${t.amount > 0 ? styles.plus : ''}`}>
                    {formatSignedChips(t.amount)}
                  </td>
                  <td className={`${styles.numeric} ${styles.after}`}>{formatChips(t.balance_after)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {message && (
          <p className={styles.message} role={transactions.status === 'loading' ? 'status' : undefined}>
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
