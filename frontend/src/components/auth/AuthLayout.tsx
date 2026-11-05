import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { CheckIcon, LogoMark } from '../icons'
import styles from './AuthLayout.module.css'

const perks = ['Start z pulą 5 000 żetonów', 'Bonus dzienny za każdy powrót', 'Ranking graczy liczony z salda i wygranych']

// Split screen for sign-up and log-in: a green showcase on the left, the form on the right.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <aside className={styles.showcase}>
        <Link to="/" className={styles.logo}>
          <LogoMark className={styles.logoMark} />
          ZeroRisk
        </Link>

        <div className={styles.art} aria-hidden="true">
          <span className={styles.arc} />
          <span className={`${styles.card} ${styles.cardQ}`}>
            <span className={styles.rank}>Q</span>
            <span className={styles.suit}>♦</span>
          </span>
          <span className={`${styles.card} ${styles.cardBack}`}>
            <LogoMark className={styles.backMark} />
          </span>
          <span className={`${styles.card} ${styles.cardJ}`}>
            <span className={styles.rank}>J</span>
            <span className={styles.suit}>♣</span>
          </span>
          <span className={styles.chips}>
            <span className={`${styles.chip} ${styles.chipRed}`} />
            <span className={`${styles.chip} ${styles.chipGold}`} />
            <span className={`${styles.chip} ${styles.chipGreen}`}>25</span>
          </span>
        </div>

        <div className={styles.copy}>
          <p className={styles.headline}>Graj dla emocji, nie dla pieniędzy.</p>
          <p className={styles.lead}>
            Blackjack, makao i wyścigi konne z botami AI. Bez wpłat, bez wypłat i bez ryzyka finansowego.
          </p>
          <ul className={styles.perks}>
            {perks.map((perk) => (
              <li key={perk}>
                <CheckIcon className={styles.check} />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.formBox}>{children}</div>
      </div>
    </div>
  )
}
