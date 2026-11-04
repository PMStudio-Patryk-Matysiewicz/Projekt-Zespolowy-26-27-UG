import type { ComponentType } from 'react'

import styles from './FeatureTiles.module.css'
import { BotIcon, CardsIcon, FlagIcon } from './icons'

type Feature = {
  title: string
  description: string
  Icon: ComponentType<{ className?: string }>
}

const features: Feature[] = [
  {
    title: 'Boty AI jako przeciwnicy',
    description:
      'Q-learning w blackjacku i ISMCTS w makao. Trzy poziomy trudności, bez czekania na innych graczy.',
    Icon: BotIcon,
  },
  {
    title: 'Symulacja wyścigów konnych',
    description:
      'Przebieg ze zdarzeniami losowymi, kursy liczone metodą Monte Carlo i pięć typów zakładów.',
    Icon: FlagIcon,
  },
  {
    title: 'Gry karciane',
    description:
      'Blackjack ze shoe 6 talii, splitem i krupierem oraz klasyczne makao z żądaniami.',
    Icon: CardsIcon,
  },
]

export default function FeatureTiles() {
  return (
    <section id="jak-to-dziala" className={styles.section} aria-label="Jak to działa">
      {features.map(({ title, description, Icon }) => (
        <article key={title} className={styles.tile}>
          <span className={styles.iconBox}>
            <Icon className={styles.icon} />
          </span>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
