import type { DailyBonus, Transaction } from '../../api/wallet'
import { formatChips, formatDayMonth, formatDuration, formatSignedChips, formatTime } from '../../format'
import type { ApiData } from '../../hooks/useApiData'
import type { WalletState } from '../../hooks/useWallet'
import { bonusStatus, isSameDay, weekResult } from '../../wallet'
import Badge from '../ui/Badge'
import styles from './WalletCards.module.css'

type WalletCardsProps = {
  wallet: WalletState
  bonus: ApiData<DailyBonus>
  transactions: ApiData<Transaction[]>
  now: number
}

// Three cards above the table: balance, daily bonus and the result of the last 7 days.
export default function WalletCards({ wallet, bonus, transactions, now }: WalletCardsProps) {
  return (
    <div className={styles.cards}>
      <BalanceCard wallet={wallet} />
      <BonusCard bonus={bonus} now={now} />
      <WeekCard transactions={transactions} now={now} />
    </div>
  )
}

function BalanceCard({ wallet }: { wallet: WalletState }) {
  return (
    <section className={styles.card} aria-labelledby="balance-title">
      <h2 id="balance-title" className={styles.title}>
        Saldo
      </h2>
      {wallet.status === 'ready' ? (
        <p className={styles.value}>
          <span className={styles.number}>{formatChips(wallet.balance)}</span>
          <span className={styles.unit}>żetonów</span>
        </p>
      ) : (
        <p className={styles.value}>{wallet.status === 'loading' ? '…' : '—'}</p>
      )}
      <p className={styles.note}>
        {wallet.status === 'error' ? 'Nie udało się pobrać salda.' : 'Żetonów nie da się kupić ani wypłacić.'}
      </p>
    </section>
  )
}

function BonusCard({ bonus, now }: { bonus: ApiData<DailyBonus>; now: number }) {
  const status = bonus.status === 'ready' ? bonusStatus(bonus.data, now) : undefined

  return (
    <section className={styles.card} aria-labelledby="bonus-title">
      <div className={styles.header}>
        <h2 id="bonus-title" className={styles.title}>
          Bonus dzienny
        </h2>
        {status?.state === 'claimed' && <Badge tone="green">Odebrany</Badge>}
        {status?.state === 'available' && <Badge tone="gold">Do odebrania</Badge>}
      </div>

      {bonus.status === 'loading' && <p className={styles.value}>…</p>}

      {bonus.status === 'error' && (
        <>
          <p className={styles.value}>—</p>
          <p className={styles.note}>Bonus dzienny będzie dostępny wkrótce.</p>
        </>
      )}

      {status?.state === 'claimed' && (
        <>
          <p className={styles.value}>
            <span className={`${styles.number} ${styles.gold}`}>{formatSignedChips(status.amount)}</span>
            <span className={styles.unit}>
              {isSameDay(status.claimedAt, now) ? 'dziś' : formatDayMonth(status.claimedAt)} o {formatTime(status.claimedAt)}
            </span>
          </p>
          <p className={styles.note}>Następny bonus za {formatDuration(status.nextIn)}</p>
        </>
      )}

      {status?.state === 'available' && (
        <>
          <p className={styles.value}>
            <span className={`${styles.number} ${styles.gold}`}>{formatSignedChips(status.amount)}</span>
          </p>
          <p className={styles.note}>Bonus czeka na odebranie.</p>
        </>
      )}
    </section>
  )
}

function WeekCard({ transactions, now }: { transactions: ApiData<Transaction[]>; now: number }) {
  const week = transactions.status === 'ready' ? weekResult(transactions.data, now) : undefined
  const scale = week ? Math.max(1, ...week.days.map(Math.abs)) : 1
  const tone = !week || week.total === 0 ? '' : week.total > 0 ? styles.positive : styles.negative

  return (
    <section className={styles.card} aria-labelledby="week-title">
      <h2 id="week-title" className={styles.title}>
        Bilans 7 dni
      </h2>
      <div className={styles.weekRow}>
        <div>
          <p className={styles.value}>
            <span className={`${styles.number} ${tone}`}>
              {week ? formatSignedChips(week.total) : transactions.status === 'loading' ? '…' : '—'}
            </span>
          </p>
          <p className={styles.note}>
            {transactions.status === 'error' ? 'Brak danych o transakcjach.' : 'Wynik gier: wygrane, zakłady i zwroty.'}
          </p>
        </div>

        {week && (
          // The number above says it all; the bars are decoration.
          <div className={styles.bars} aria-hidden="true">
            {week.days.map((value, index) => (
              <span
                key={index}
                className={`${styles.bar} ${value < 0 ? styles.barLoss : styles.barWin}`}
                style={{ height: `${Math.max(8, (Math.abs(value) / scale) * 100)}%`, opacity: value === 0 ? 0.25 : 1 }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
