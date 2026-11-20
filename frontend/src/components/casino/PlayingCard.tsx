import { cardName, isRed, parseCard, SUIT_SYMBOLS } from '../../cards'
import { LogoMark } from '../icons'
import styles from './PlayingCard.module.css'

type PlayingCardProps = {
  // Engine card code ('AS', '10H'); null or omitted = face down.
  code?: string | null
  size?: 'small' | 'medium' | 'large'
  className?: string
}

// One card of a standard 52-card deck, or its back. Screen readers hear its name ("As kier").
export default function PlayingCard({ code, size = 'medium', className = '' }: PlayingCardProps) {
  const card = code ? parseCard(code) : undefined
  const classes = `${styles.card} ${styles[size]} ${className}`

  if (!card) {
    return (
      <span role="img" aria-label="Karta zakryta" className={`${classes} ${styles.back}`}>
        <LogoMark className={styles.backMark} />
      </span>
    )
  }

  const symbol = SUIT_SYMBOLS[card.suit]
  return (
    <span role="img" aria-label={cardName(card)} className={`${classes} ${isRed(card.suit) ? styles.red : styles.black}`}>
      <span className={styles.corner} aria-hidden="true">
        {card.rank}
      </span>
      <span className={styles.pip} aria-hidden="true">
        {symbol}
      </span>
      <span className={styles.cornerSuit} aria-hidden="true">
        {symbol}
      </span>
    </span>
  )
}
