import type { CSSProperties } from 'react'

import { cardName, isRed, parseCard, SUIT_SYMBOLS } from '../../cards'
import { LogoMark } from '../icons'
import styles from './PlayingCard.module.css'

type PlayingCardProps = {
  // Engine card code ('AS', '10H'); null or omitted = face down.
  code?: string | null
  size?: 'small' | 'medium' | 'large'
  className?: string
  // Plays once: 'deal' slides the card in from the shoe, 'flip' turns it face up,
  // 'discard' sends it away to the discard tray (--discard-to-x / --discard-to-y of a parent).
  // Where the shoe is comes from the CSS variables --deal-from-x / --deal-from-y of a parent.
  animation?: 'deal' | 'flip' | 'discard'
  delay?: number // ms before the animation starts; the card stays hidden until then
}

// One card of a standard 52-card deck, or its back. Screen readers hear its name ("As kier").
export default function PlayingCard({ code, size = 'medium', className = '', animation, delay = 0 }: PlayingCardProps) {
  const card = code ? parseCard(code) : undefined
  const classes = [styles.card, styles[size], animation ? styles[animation] : '', className].filter(Boolean).join(' ')
  const style: CSSProperties | undefined = animation && delay ? { animationDelay: `${delay}ms` } : undefined

  if (!card) {
    return (
      <span role="img" aria-label="Karta zakryta" className={`${classes} ${styles.back}`} style={style}>
        <LogoMark className={styles.backMark} />
      </span>
    )
  }

  const symbol = SUIT_SYMBOLS[card.suit]
  return (
    <span role="img" aria-label={cardName(card)} className={`${classes} ${isRed(card.suit) ? styles.red : styles.black}`} style={style}>
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
