import type { Action } from '../../api/blackjack'
import Button from '../ui/Button'
import styles from './Controls.module.css'

const buttons: { action: Action; label: string; hint: string }[] = [
  { action: 'hit', label: 'Dobierz', hint: 'Hit' },
  { action: 'stand', label: 'Stój', hint: 'Stand' },
  { action: 'double', label: 'Podwój', hint: 'Double' },
  { action: 'split', label: 'Rozdziel', hint: 'Split' },
]

type ActionBarProps = {
  actions: Action[] // allowed now, from the server
  onAction: (action: Action) => void
  pending: boolean
}

// During the round: the four moves; the ones the rules do not allow now are disabled.
export default function ActionBar({ actions, onAction, pending }: ActionBarProps) {
  return (
    <div className={styles.bar}>
      <p className={styles.betLabel}>Twój ruch</p>
      <div className={styles.buttons}>
        {buttons.map(({ action, label, hint }) => (
          <Button
            key={action}
            variant={action === 'hit' ? 'primary' : 'secondary'}
            size="large"
            className={styles.move}
            onClick={() => onAction(action)}
            disabled={pending || !actions.includes(action)}
          >
            {label}
            <span className={styles.buttonHint}>{hint}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
