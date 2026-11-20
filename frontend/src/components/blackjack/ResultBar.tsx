import type { HandView } from '../../api/blackjack'
import { roundNet } from '../../blackjack'
import { formatChips, formatSignedChips } from '../../format'
import Button from '../ui/Button'
import styles from './Controls.module.css'

type ResultBarProps = {
  hands: HandView[]
  nextBet: number // stake of the next round: the last one, without doubles
  onNextRound: () => void
  onChangeBet: () => void
  pending: boolean
}

// Screen 12: the round is settled. Shows the result and starts the next round with the same
// stake, or goes back to building a new bet.
export default function ResultBar({ hands, nextBet, onNextRound, onChangeBet, pending }: ResultBarProps) {
  const net = roundNet(hands)
  const tone = net > 0 ? styles.plus : net < 0 ? styles.minus : ''
  let note = 'Stawka wraca do Ciebie'
  if (net > 0) note = 'Stawka wraca razem z wygraną'
  if (net < 0) note = 'Stawka przepada'

  return (
    <div className={styles.bar}>
      <div className={styles.betInfo}>
        <span className={styles.betLabel}>Wynik rundy</span>
        <output className={`${styles.betValue} ${tone}`} aria-label="Wynik rundy">
          {formatSignedChips(net)}
        </output>
        <span className={styles.limits}>{note}</span>
      </div>

      <div className={styles.buttons}>
        <Button variant="secondary" size="large" onClick={onChangeBet} disabled={pending}>
          Zmień stawkę
        </Button>
        <Button size="large" onClick={onNextRound} disabled={pending}>
          {pending ? 'Rozdawanie…' : `Następna runda · ${formatChips(nextBet)}`}
        </Button>
      </div>
    </div>
  )
}
