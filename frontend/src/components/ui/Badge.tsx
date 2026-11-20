import type { ReactNode } from 'react'

import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'green' | 'gold' | 'red' | 'blue'

type BadgeProps = {
  tone?: BadgeTone
  size?: 'small' | 'medium'
  dot?: boolean // the coloured dot before the text
  className?: string
  children: ReactNode
}

// Small rounded label for a status or a tag: "Wkrótce", "Odebrany", "3:2"…
export default function Badge({ tone = 'neutral', size = 'small', dot = true, className = '', children }: BadgeProps) {
  const classes = [styles.badge, styles[tone], styles[size], dot ? styles.dot : '', className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}
