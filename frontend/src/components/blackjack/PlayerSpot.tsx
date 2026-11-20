import type { HandView } from '../../api/blackjack'
import { DISCARD_STEP, handTotal, playerCardDelay, resultLabels } from '../../blackjack'
import { formatChips } from '../../format'
import Chip from '../casino/Chip'
import { toChips } from '../casino/chipValues'
import PlayingCard from '../casino/PlayingCard'
import { UserIcon } from '../icons'
import Badge from '../ui/Badge'
import styles from './PlayerSpot.module.css'

type PlayerSpotProps = {
  hands: HandView[]
  activeHand?: number // index of the hand whose turn it is
  label: string
  discarding?: boolean // the round is over and its cards fly to the discard tray
  resultDelay?: number // ms before the result label shows up: together with the banner in the middle
}

// The player's place: cards, total, the bet as a stack of chips and the result.
// After a split there are two hands side by side.
export default function PlayerSpot({ hands, activeHand, label, discarding = false, resultDelay = 0 }: PlayerSpotProps) {
  return (
    <div className={`${styles.spot} ${discarding ? styles.clearing : ''}`}>
      {hands.length > 0 && (
        <div className={styles.hands}>
          {hands.map((hand, index) => (
            <div
              key={index}
              className={`${styles.hand} ${index === activeHand ? styles.active : ''}`}
              aria-label={hands.length > 1 ? `Ręka ${index + 1}` : 'Twoja ręka'}
              role="group"
              aria-current={index === activeHand ? 'true' : undefined}
            >
              <div className={styles.cards}>
                {hand.cards.map((code, i) => (
                  // The key includes the card, so a card that replaces another after a split is dealt too.
                  <PlayingCard
                    key={`${i}-${code}`}
                    code={code}
                    size="small"
                    className={styles.card}
                    animation={discarding ? 'discard' : 'deal'}
                    delay={discarding ? i * DISCARD_STEP : playerCardDelay(i)}
                  />
                ))}
              </div>
              <span
                className={`${styles.total} ${hand.total > 21 ? styles.bust : ''}`}
                style={discarding ? undefined : { animationDelay: `${playerCardDelay(hand.cards.length - 1) + 300}ms` }}
                aria-label={`Suma: ${hand.total}`}
              >
                {hand.total > 21 ? `${hand.total} · fura` : handTotal(hand)}
              </span>
              {index === activeHand && <Badge tone="green">Twój ruch</Badge>}
              <div className={styles.bet}>
                <span className={styles.stack} aria-hidden="true">
                  {toChips(hand.bet)
                    .slice(0, 4)
                    .map((value, i) => (
                      <span key={i} className={styles.stackChip} style={{ bottom: `${i * 4}px` }}>
                        <Chip value={value} size="small" />
                      </span>
                    ))}
                </span>
                <span className={styles.betAmount}>
                  Stawka {formatChips(hand.bet)}
                  {hand.doubled && ' (x2)'}
                </span>
              </div>
              {hand.result && (
                <span
                  className={`${styles.result} ${styles[hand.result]}`}
                  style={discarding ? undefined : { animationDelay: `${resultDelay}ms` }}
                >
                  {resultLabels[hand.result]}
                  {hand.payout !== null && hand.payout > hand.bet && ` +${formatChips(hand.payout - hand.bet)}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <span className={styles.label}>
        <UserIcon className={styles.icon} />
        {label}
      </span>
    </div>
  )
}
