import { formatChipValue } from './chipValues'
import styles from './Chip.module.css'

type ChipProps = {
  value: number
  size?: 'small' | 'medium'
  // With onClick the chip is a button (e.g. "add 25 to the bet"); otherwise just a picture.
  onClick?: () => void
  disabled?: boolean
  label?: string
}

// Colour follows the casino convention: 5 blue, 25 green, 100 gold, 500 red, other values grey.
const tones: Record<number, string> = { 5: styles.blue, 25: styles.green, 100: styles.gold, 500: styles.red }

export default function Chip({ value, size = 'medium', onClick, disabled, label }: ChipProps) {
  const className = `${styles.chip} ${styles[size]} ${tones[value] ?? styles.grey}`
  const text = formatChipValue(value)

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} disabled={disabled} aria-label={label ?? `Żeton ${value}`}>
        {text}
      </button>
    )
  }
  return (
    <span role="img" className={className} aria-label={label ?? `Żeton ${value}`}>
      <span aria-hidden="true">{text}</span>
    </span>
  )
}
