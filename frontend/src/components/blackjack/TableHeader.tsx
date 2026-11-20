import { Link } from 'react-router'

import type { BlackjackTable } from '../../api/blackjack'
import { SHUFFLE_AT } from '../../api/blackjack'
import { shoeDealt } from '../../blackjack'
import { formatChips } from '../../format'
import { ArrowLeftIcon, CoinIcon, SpadeIcon } from '../icons'
import styles from './TableHeader.module.css'

type TableHeaderProps = {
  table: BlackjackTable
  onLeave: () => void
  canLeave: boolean
}

export default function TableHeader({ table, onLeave, canLeave }: TableHeaderProps) {
  const dealt = Math.round(shoeDealt(table) * 100)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/lobby" className={styles.back}>
          <ArrowLeftIcon className={styles.backIcon} />
          Lobby
        </Link>
        <h1 className={styles.title}>
          <SpadeIcon className={styles.titleIcon} />
          Blackjack
        </h1>
        <ul className={styles.tags}>
          <li className={styles.tag}>Stół #{table.id}</li>
          <li className={`${styles.tag} ${styles.tagBlue}`}>Runda {table.round_no}</li>
          <li className={styles.tag}>Miejsce {table.seat}</li>
        </ul>
      </div>

      <div className={styles.right}>
        <div className={styles.shoe}>
          <span className={styles.shoeLabel}>
            Shoe <strong>{dealt}%</strong> · tasowanie przy {SHUFFLE_AT * 100}%
          </span>
          <span
            className={styles.shoeBar}
            role="meter"
            aria-label="Rozdane karty z shoe"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={dealt}
          >
            <span className={styles.shoeFill} style={{ width: `${dealt}%` }} />
            <span className={styles.shoeCut} style={{ left: `${SHUFFLE_AT * 100}%` }} />
          </span>
        </div>

        <p className={styles.balance}>
          <CoinIcon className={styles.coin} />
          <span className={styles.amount}>{formatChips(table.balance)}</span>
          <span className={styles.unit}>żetonów</span>
        </p>

        <button
          type="button"
          className={styles.leave}
          onClick={onLeave}
          disabled={!canLeave}
          title={canLeave ? undefined : 'Od stołu można odejść po zakończeniu rundy'}
        >
          Odejdź od stołu
        </button>
      </div>
    </header>
  )
}
