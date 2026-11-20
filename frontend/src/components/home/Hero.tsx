import { CheckIcon } from '../icons'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import styles from './Hero.module.css'
import HeroTable from './HeroTable'

const perks = ['Bez wpłat', 'Legalnie', 'Boty AI zamiast graczy']

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <Badge tone="green" size="medium">
          100% wirtualne żetony
        </Badge>

        <h1 className={styles.title}>
          Emocje kasyna. <span className={styles.titleAccent}>Zero ryzyka.</span>
        </h1>

        <p className={styles.lead}>
          Blackjack, makao i wyścigi konne na wirtualne żetony. Grasz z botami AI, ćwiczysz strategię
          i rywalizujesz w rankingu — bez prawdziwych pieniędzy i bez kłopotów prawnych.
        </p>

        <div className={styles.actions}>
          <Button to="/rejestracja" size="large">
            Odbierz 5&nbsp;000 żetonów na start
          </Button>
          <Button to="/ranking" variant="secondary" size="large">
            Zobacz ranking
          </Button>
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
