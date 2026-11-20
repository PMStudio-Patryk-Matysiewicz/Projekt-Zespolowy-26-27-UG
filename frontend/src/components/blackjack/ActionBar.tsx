import type { Action, HandView } from '../../api/blackjack'
import { handKind, handTotal } from '../../blackjack'
import { formatChips } from '../../format'
import Button, { type ButtonVariant } from '../ui/Button'
import styles from './Controls.module.css'

type ActionBarProps = {
  hand: HandView | undefined // the hand whose turn it is
  actions: Action[] // allowed now, from the server
  onAction: (action: Action) => void
  pending: boolean
}

// Screen 11: the player's move. Shows the hand and its stake, and the four moves; the ones
// the rules do not allow now are disabled. Double and split cost one more stake.
export default function ActionBar({ hand, actions, onAction, pending }: ActionBarProps) {
  const stake = hand ? formatChips(hand.bet) : ''
  const buttons: { action: Action; label: string; variant: ButtonVariant }[] = [
    { action: 'stand', label: 'Stój', variant: 'secondary' },
    { action: 'hit', label: 'Dobierz', variant: 'primary' },
    { action: 'double', label: `Podwój +${stake}`, variant: 'secondary' },
    { action: 'split', label: `Rozdziel +${stake}`, variant: 'gold' },
  ]

  let tip: string | undefined
  if (actions.includes('split')) tip = 'Masz parę — możesz rozdzielić rękę na dwie.'
  else if (actions.includes('double')) tip = 'Możesz podwoić stawkę — dostaniesz wtedy dokładnie jedną kartę.'

  return (
    <div className={styles.bar}>
      {hand && (
        <div className={styles.betInfo}>
          <span className={styles.betLabel}>Twoja ręka</span>
          <output className={`${styles.betValue} ${styles.handValue}`} aria-label="Suma Twojej ręki">
            {handTotal(hand)}
          </output>
          <span className={styles.limits}>
            ręka {handKind(hand)} · stawka {stake}
          </span>
        </div>
      )}

      {tip && <p className={styles.tip}>{tip}</p>}

      <div className={styles.buttons}>
        {buttons.map(({ action, label, variant }) => (
          <Button
            key={action}
            variant={variant}
            size="large"
            onClick={() => onAction(action)}
            disabled={pending || !actions.includes(action)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
