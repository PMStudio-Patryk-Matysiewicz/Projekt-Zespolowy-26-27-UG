import type { Game } from '../../games'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
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
            <li key={label}>
              <Badge tone={tone}>{label}</Badge>
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
          <span className={styles.meta}>{game.meta}</span>
          {game.available ? (
            <Button to={game.path} size="small">
              Graj
            </Button>
          ) : (
            <Badge>Wkrótce</Badge>
          )}
        </div>
      </div>
    </article>
  )
}
