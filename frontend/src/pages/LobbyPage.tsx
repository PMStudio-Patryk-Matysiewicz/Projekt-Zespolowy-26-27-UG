import { Link } from 'react-router'

import { GiftIcon } from '../components/icons'
import GameCard from '../components/lobby/GameCard'
import { games } from '../games'
import styles from './LobbyPage.module.css'

// Bonus, recent games and the ranking have no backend endpoints yet,
// so they show their layout with a "coming soon" or empty state instead of made-up numbers.
export default function LobbyPage() {
  return (
    <>
      <h1 className={styles.srOnly}>Lobby</h1>

      <section className={styles.bonus} aria-labelledby="bonus-title">
        <span className={styles.bonusIcon}>
          <GiftIcon />
        </span>
        <div className={styles.bonusText}>
          <h2 id="bonus-title" className={styles.bonusTitle}>
            Bonus dzienny
          </h2>
          <p className={styles.bonusDescription}>Codziennie odbierzesz +500 żetonów. Już wkrótce.</p>
        </div>
        <button type="button" className={styles.bonusButton} disabled>
          Wkrótce
        </button>
      </section>

      <section aria-labelledby="games-title">
        <div className={styles.sectionHeader}>
          <h2 id="games-title" className={styles.sectionTitle}>
            Gry
          </h2>
          <span className={styles.sectionHint}>Grasz wyłącznie wirtualnymi żetonami</span>
        </div>
        <div className={styles.games}>
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      <div className={styles.panels}>
        <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.panelHeader}>
            <h2 id="recent-title" className={styles.panelTitle}>
              Ostatnie gry
            </h2>
            <Link to="/historia" className={styles.panelLink}>
              Pełna historia
            </Link>
          </div>
          <p className={styles.empty}>Nie masz jeszcze rozegranych gier.</p>
        </section>

        <section className={styles.panel} aria-labelledby="ranking-title">
          <div className={styles.panelHeader}>
            <h2 id="ranking-title" className={styles.panelTitle}>
              Ranking — top 3
            </h2>
            <Link to="/ranking" className={styles.panelLink}>
              Pełny ranking
            </Link>
          </div>
          <p className={styles.empty}>Ranking pojawi się, gdy gracze rozegrają pierwsze gry.</p>
        </section>
      </div>
    </>
  )
}
