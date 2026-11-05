import { Link } from 'react-router'

import type { Game } from '../../games'
import GameArt from './GameArt'
import styles from './GameCard.module.css'

export default function GameCard({ game }: { game: Game }) {
  return (
    <article className={styles.card}>
      <GameArt game={game.id} />
      <div className={styles.body}>
        <h3 className={styles.title}>{game.name}</h3>
        <p className={styles.description}>{game.description}</p>
        <ul className={styles.tags}>
          {game.tags.map(({ label, tone }) => (
            <li key={label} className={`${styles.tag} ${styles[tone]}`}>
              {label}
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
          <span className={styles.meta}>{game.meta}</span>
          {game.available ? (
            <Link to={game.path} className={styles.play}>
              Graj
            </Link>
          ) : (
            <span className={styles.soon}>Wkrótce</span>
          )}
        </div>
      </div>
    </article>
  )
}
