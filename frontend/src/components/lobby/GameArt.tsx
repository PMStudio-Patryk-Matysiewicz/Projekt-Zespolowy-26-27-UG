import type { GameId } from '../../games'
import { LogoMark } from '../icons'
import styles from './GameArt.module.css'

type Suit = '♠' | '♥' | '♦' | '♣'

function MiniCard({ rank, suit, className = '' }: { rank: string; suit: Suit; className?: string }) {
  const red = suit === '♥' || suit === '♦'
  return (
    <span className={`${styles.card} ${red ? styles.red : ''} ${className}`}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.suit}>{suit}</span>
    </span>
  )
}

function CardBack({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.card} ${styles.back} ${className}`}>
      <LogoMark className={styles.backMark} />
    </span>
  )
}

const horses = [
  { color: '#3ddc84', progress: 82 },
  { color: '#e3b341', progress: 70 },
  { color: '#5b9cf5', progress: 76 },
  { color: '#e5574f', progress: 45 },
  { color: '#eef3f0', progress: 61 },
]

// Decorative pictures on top of the game cards, drawn with HTML and CSS.
export default function GameArt({ game }: { game: GameId }) {
  return (
    <div className={styles.art} aria-hidden="true">
      {game === 'blackjack' && (
        <>
          <MiniCard rank="10" suit="♠" className={styles.bj1} />
          <CardBack className={styles.bj2} />
          <MiniCard rank="A" suit="♥" className={styles.bj3} />
          <MiniCard rank="9" suit="♠" className={styles.bj4} />
          <span className={styles.chip}>25</span>
        </>
      )}

      {game === 'makao' && (
        <>
          <CardBack className={styles.mk0} />
          <MiniCard rank="7" suit="♣" className={styles.mk1} />
          <MiniCard rank="8" suit="♦" className={styles.mk2} />
          <MiniCard rank="Q" suit="♥" className={styles.mk3} />
          <MiniCard rank="A" suit="♠" className={styles.mk4} />
        </>
      )}

      {game === 'racing' && (
        <div className={styles.track}>
          {horses.map(({ color, progress }) => (
            <span key={color} className={styles.lane}>
              <span className={styles.trail} style={{ width: `${progress}%`, background: `${color}66` }} />
              <span className={styles.horse} style={{ left: `${progress}%`, background: color }} />
            </span>
          ))}
          <span className={styles.finish} />
        </div>
      )}
    </div>
  )
}
