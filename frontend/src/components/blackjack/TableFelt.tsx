import { SEATS, type BlackjackTable } from '../../api/blackjack'
import { handTotal, playerHands, roundSummary } from '../../blackjack'
import { formatChips } from '../../format'
import PlayingCard from '../casino/PlayingCard'
import PlayerSpot from './PlayerSpot'
import styles from './TableFelt.module.css'

function statusText(table: BlackjackTable): string {
  if (table.phase === 'betting') return 'Postaw zakład, aby rozdać karty'
  if (table.phase === 'settled') return `${roundSummary(playerHands(table))} · postaw zakład na kolejną rundę`
  return table.turn?.seat === String(table.seat) ? 'Twój ruch' : 'Krupier gra…'
}

// The green table: dealer at the top, the five seats along the edge.
// Seats other than the player's stay empty until bots are added (separate task).
export default function TableFelt({ table }: { table: BlackjackTable }) {
  const dealerCards = table.dealer.cards
  const myTurn = table.phase === 'player_turns' && table.turn?.seat === String(table.seat)

  return (
    <section className={styles.felt} aria-label="Stół">
      <div className={styles.dealer}>
        <h2 className={styles.dealerLabel}>Krupier</h2>
        <div className={styles.cards}>
          {dealerCards.length === 0 ? (
            <span className={styles.placeholder}>czeka na zakłady</span>
          ) : (
            dealerCards.map((code, index) => <PlayingCard key={index} code={code} />)
          )}
        </div>
        {dealerCards.length > 0 && (
          <span className={styles.total} aria-label={`Suma krupiera: ${table.dealer.total}`}>
            {handTotal({ total: table.dealer.total, soft: false })}
          </span>
        )}
      </div>

      <div className={styles.middle}>
        <p className={`${styles.status} ${myTurn ? styles.statusTurn : ''}`} role="status">
          {statusText(table)}
        </p>
        <p className={styles.rule}>Blackjack płaci 3:2</p>
        <p className={styles.ruleSmall}>Krupier dobiera do 16 i staje na miękkim 17</p>
      </div>

      <ol className={styles.seats} aria-label="Miejsca przy stole">
        {SEATS.map((seat) => (
          <li key={seat} className={`${styles.seat} ${styles[`seat${seat}`]} ${seat === table.seat ? styles.mine : ''}`}>
            {seat === table.seat ? (
              <PlayerSpot
                hands={playerHands(table)}
                activeHand={myTurn ? table.turn!.hand : undefined}
                label={`Ty · ${formatChips(table.balance)}`}
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
