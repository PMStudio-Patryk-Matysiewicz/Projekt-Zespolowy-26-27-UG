import { Link } from 'react-router'

import styles from './Hero.module.css'
import HeroTable from './HeroTable'
import { CheckIcon } from '../icons'

const perks = ['Bez wpłat', 'Legalnie', 'Boty AI zamiast graczy']

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          100% wirtualne żetony
        </span>

        <h1 className={styles.title}>
          Emocje kasyna. <span className={styles.titleAccent}>Zero ryzyka.</span>
        </h1>

        <p className={styles.lead}>
          Blackjack, makao i wyścigi konne na wirtualne żetony. Grasz z botami AI, ćwiczysz strategię
          i rywalizujesz w rankingu — bez prawdziwych pieniędzy i bez kłopotów prawnych.
        </p>

        <div className={styles.actions}>
          <Link to="/rejestracja" className={styles.primary}>
            Odbierz 5&nbsp;000 żetonów na start
          </Link>
          <Link to="/ranking" className={styles.secondary}>
            Zobacz ranking
          </Link>
        </div>

        <ul className={styles.perks}>
          {perks.map((perk) => (
            <li key={perk}>
              <CheckIcon className={styles.check} />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <HeroTable />
    </section>
  )
}
