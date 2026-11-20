import { useEffect, useState } from 'react'

import { SEATS, type BlackjackTable } from '../../api/blackjack'
import {
  dealerCardDelay,
  dealerOutcome,
  DISCARD_STEP,
  discardDuration,
  handTotal,
  playerHands,
  resultDelay,
  roundNet,
  roundSummary,
} from '../../blackjack'
import { formatChips } from '../../format'
import { motionAllowed } from '../../motion'
import PlayingCard from '../casino/PlayingCard'
import Badge from '../ui/Badge'
import PlayerSpot from './PlayerSpot'
import styles from './TableFelt.module.css'

function statusText(table: BlackjackTable): string {
  if (table.phase === 'betting') return 'Postaw zakład, aby rozdać karty'
  return table.turn?.seat === String(table.seat) ? 'Twój ruch' : 'Krupier gra…'
}

function cardCount(table: BlackjackTable): number {
  return table.dealer.cards.length + playerHands(table).reduce((sum, hand) => sum + hand.cards.length, 0)
}

// The green table: dealer at the top, the five seats along the edge.
// Seats other than the player's stay empty until bots are added (separate task).
// `balance` is the one to show under the player's seat; the page holds the new balance back
// until the result is revealed.
export default function TableFelt({ table, balance = table.balance }: { table: BlackjackTable; balance?: number }) {
  // When the next round arrives, the previous one stays on the felt for a moment while its
  // cards fly to the discard tray; then the new round is shown and its cards are dealt.
  const [previous, setPrevious] = useState(table)
  const [discarding, setDiscarding] = useState<BlackjackTable | null>(null)
  if (previous !== table) {
    setPrevious(table)
    if (table.round_no !== previous.round_no && cardCount(previous) > 0 && motionAllowed()) setDiscarding(previous)
  }

  useEffect(() => {
    if (!discarding) return
    const timer = setTimeout(() => setDiscarding(null), discardDuration(cardCount(discarding)))
    return () => clearTimeout(timer)
  }, [discarding])

  const shown = discarding ?? table
  const clearing = discarding !== null
  const dealerCards = shown.dealer.cards
  const myTurn = shown.phase === 'player_turns' && shown.turn?.seat === String(shown.seat)
  const settled = shown.phase === 'settled'
  const dealerBust = settled && shown.dealer.total > 21
  const dealerBlackjack = settled && shown.dealer.total === 21 && dealerCards.length === 2
  const net = roundNet(playerHands(shown))

  function dealerAnimation(index: number, code: string | null) {
    if (clearing) return 'discard'
    return index === 1 && code !== null && settled ? 'flip' : 'deal'
  }

  return (
    <section className={`${styles.felt} ${clearing ? styles.clearing : ''}`} aria-label="Stół">
      {/* Discard tray and shoe in the corners, as on a real table. */}
      <div className={`${styles.pile} ${styles.discard}`} aria-hidden="true">
        <PlayingCard size="small" />
        <span>Odrzucone</span>
      </div>
      <div className={`${styles.pile} ${styles.shoe}`} aria-hidden="true">
        <PlayingCard size="small" />
        <span>Shoe · 6 talii</span>
      </div>

      <div className={styles.dealer}>
        <h2 className={styles.dealerLabel}>Krupier</h2>
        <div className={styles.cards}>
          {dealerCards.length === 0 ? (
            <span className={styles.placeholder}>czeka na zakłady</span>
          ) : (
            dealerCards.map((code, index) => (
              // The key changes when the hole card is revealed, so it mounts again and flips.
              <PlayingCard
                key={`${shown.round_no}-${index}-${code ?? 'back'}`}
                code={code}
                animation={dealerAnimation(index, code)}
                delay={clearing ? index * DISCARD_STEP : dealerCardDelay(index, code === null)}
              />
            ))
          )}
        </div>
        {dealerCards.length > 0 && (
          <div
            // Mounts again when the round ends, so the new total waits for the dealer's draws.
            key={`${shown.round_no}-${shown.phase}`}
            className={styles.dealerTotal}
            style={
              clearing
                ? undefined
                : { animationDelay: `${dealerCardDelay(dealerCards.length - 1, dealerCards.at(-1) === null) + 300}ms` }
            }
          >
            <span className={styles.total} aria-label={`Suma krupiera: ${shown.dealer.total}`}>
              {handTotal({ total: shown.dealer.total, soft: false })}
            </span>
            {dealerBust && <Badge tone="red">Fura</Badge>}
            {dealerBlackjack && <Badge tone="gold">Blackjack</Badge>}
          </div>
        )}
      </div>

      <div className={styles.middle}>
        {settled ? (
          // Screen 12: the result of the round in the middle of the table.
          <div
            className={`${styles.result} ${net > 0 ? styles.resultWin : net < 0 ? styles.resultLoss : ''}`}
            style={clearing ? undefined : { animationDelay: `${resultDelay(dealerCards.length)}ms` }}
            role="status"
          >
            <span className={styles.resultReason}>{dealerOutcome(shown)}</span>
            <strong className={styles.resultText}>{roundSummary(playerHands(shown))}</strong>
          </div>
        ) : (
          <p className={`${styles.status} ${myTurn ? styles.statusTurn : ''}`} role="status">
            {statusText(shown)}
          </p>
        )}
        <p className={styles.rule}>Blackjack płaci 3:2</p>
        <p className={styles.ruleSmall}>Krupier dobiera do 16 i staje na miękkim 17</p>
      </div>

      <ol className={styles.seats} aria-label="Miejsca przy stole">
        {SEATS.map((seat) => (
          <li key={seat} className={`${styles.seat} ${styles[`seat${seat}`]} ${seat === shown.seat ? styles.mine : ''}`}>
            {seat === shown.seat ? (
              <PlayerSpot
                // A new round mounts a new spot, so its cards are dealt again.
                key={shown.round_no}
                hands={playerHands(shown)}
                activeHand={myTurn ? shown.turn!.hand : undefined}
                label={`Ty · ${formatChips(balance)}`}
                discarding={clearing}
                resultDelay={resultDelay(dealerCards.length)}
              />
            ) : (
              <span className={styles.empty}>
                <span className={styles.emptyCircle} aria-hidden="true">
                  {seat}
                </span>
                Wolne miejsce
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
