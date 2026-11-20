import type { BlackjackTable } from '../../api/blackjack'
import { lastBaseBet } from '../../blackjack'
import { formatChips } from '../../format'
import Chip from '../casino/Chip'
import { CHIP_VALUES } from '../casino/chipValues'
import styles from './Controls.module.css'

type BetBarProps = {
  table: BlackjackTable
  bet: number
  onBetChange: (bet: number) => void
  onDeal: (amount: number) => void
  pending: boolean
}

// Between rounds: build the bet from chips, then deal. Limits are checked when dealing,
// so the player sees why 5 or 1 500 chips are not accepted.
export default function BetBar({ table, bet, onBetChange, onDeal, pending }: BetBarProps) {
  const repeat = lastBaseBet(table)

  return (
    <div className={styles.bar}>
      <div className={styles.betInfo}>
        <span className={styles.betLabel}>Twoja stawka</span>
        <output className={styles.betValue} aria-label="Twoja stawka">
          {formatChips(bet)}
        </output>
        <span className={styles.limits}>
          min {formatChips(table.min_bet)} · max {formatChips(table.max_bet)}
        </span>
      </div>

      <div className={styles.chips} role="group" aria-label="Dołóż żeton do stawki">
        {CHIP_VALUES.map((value) => (
          <Chip key={value} value={value} onClick={() => onBetChange(bet + value)} disabled={pending} label={`Dołóż ${value}`} />
        ))}
      </div>
      <span className={styles.hint}>Kliknij żeton, aby dołożyć go do stawki</span>

      <div className={styles.buttons}>
        <button type="button" className={styles.ghost} onClick={() => onBetChange(0)} disabled={pending || bet === 0}>
          Wyczyść
        </button>
        {repeat !== undefined && (
          <button type="button" className={styles.secondary} onClick={() => onDeal(repeat)} disabled={pending}>
            Powtórz {formatChips(repeat)}
          </button>
        )}
        <button type="button" className={styles.primary} onClick={() => onDeal(bet)} disabled={pending || bet === 0}>
          {pending ? 'Rozdawanie…' : 'Rozdaj karty'}
        </button>
      </div>
    </div>
  )
}
