import type { BlackjackTable } from '../../api/blackjack'
import { SHUFFLE_AT } from '../../api/blackjack'
import { shoeDealt } from '../../blackjack'
import { formatChips } from '../../format'
import { ArrowLeftIcon, CoinIcon, SpadeIcon } from '../icons'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
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
        <Button to="/lobby" variant="secondary" size="small">
          <ArrowLeftIcon className={styles.backIcon} />
          Lobby
        </Button>
        <h1 className={styles.title}>
          <SpadeIcon className={styles.titleIcon} />
          Blackjack
        </h1>
        <ul className={styles.tags}>
          <li>
            <Badge dot={false}>Stół #{table.id}</Badge>
          </li>
          <li>
            <Badge tone="blue" dot={false}>
              Runda {table.round_no}
            </Badge>
          </li>
          <li>
            <Badge dot={false}>Miejsce {table.seat}</Badge>
          </li>
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

        <Button
          variant="secondary"
          size="small"
          onClick={onLeave}
          disabled={!canLeave}
          title={canLeave ? undefined : 'Od stołu można odejść po zakończeniu rundy'}
        >
          Odejdź od stołu
        </Button>
      </div>
    </header>
  )
}
