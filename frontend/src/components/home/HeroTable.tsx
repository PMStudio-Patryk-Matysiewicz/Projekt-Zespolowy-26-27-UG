import styles from './HeroTable.module.css'
import { BotIcon, LogoMark } from './icons'

type Suit = '♠' | '♥' | '♦' | '♣'

const raceOdds = [
  { place: 1, horse: 'Burza', odds: '3.40' },
  { place: 2, horse: 'Kometa', odds: '4.80' },
  { place: 3, horse: 'Grom', odds: '6.10' },
]

function PlayingCard({ rank, suit, className = '' }: { rank: string; suit: Suit; className?: string }) {
  const red = suit === '♥' || suit === '♦'
  return (
    <div className={`${styles.card} ${red ? styles.red : ''} ${className}`}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.suit}>{suit}</span>
    </div>
  )
}

// Decorative picture of a blackjack table built with HTML and CSS, hidden from screen readers.
export default function HeroTable() {
  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={styles.felt}>
        <div className={styles.arc} />

        <div className={`${styles.panel} ${styles.bot}`}>
          <div className={styles.botName}>
            <BotIcon className={styles.botIcon} />
            Bot Ada · HARD
          </div>
          <div className={styles.botStake}>
            Stawka rośnie <span className={styles.mono}>TC +3</span>
          </div>
        </div>

        <div className={styles.dealer}>
          <div className={`${styles.card} ${styles.back}`}>
            <LogoMark className={styles.backMark} />
          </div>
          <PlayingCard rank="7" suit="♦" />
        </div>

        <p className={styles.rules}>Blackjack płaci 3:2 · Krupier staje na miękkim 17</p>

        <div className={styles.player}>
          <PlayingCard rank="A" suit="♠" className={styles.cardLeft} />
          <PlayingCard rank="K" suit="♥" className={styles.cardRight} />
        </div>

        <div className={styles.chips}>
          <div className={styles.stack}>
            <span className={`${styles.chip} ${styles.chipRed}`} />
            <span className={`${styles.chip} ${styles.chipOrange}`} />
            <span className={`${styles.chip} ${styles.chipGold}`}>100</span>
          </div>
          <span className={`${styles.chip} ${styles.chipGreen}`}>25</span>
        </div>

        <div className={`${styles.panel} ${styles.race}`}>
          <div className={styles.raceTitle}>Wyścig #2481 · tor mokry</div>
          {raceOdds.map(({ place, horse, odds }) => (
            <div key={horse} className={styles.raceRow}>
              <span className={styles.place}>{place}</span>
              <span className={styles.horse}>{horse}</span>
              <span className={styles.odds}>{odds}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
