import { Link } from 'react-router'

import { LogoMark } from '../icons'
import Button from '../ui/Button'
import styles from './SiteHeader.module.css'

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <LogoMark className={styles.logoMark} />
        ZeroRisk
      </Link>

      <nav className={styles.nav} aria-label="Główna nawigacja">
        <a href="#jak-to-dziala" className={styles.navLink}>
          Jak to działa
        </a>
        <Link to="/ranking" className={styles.navLink}>
          Ranking
        </Link>
        <div className={styles.account}>
          <Button to="/logowanie" variant="ghost" size="small">
            Zaloguj się
          </Button>
          <Button to="/rejestracja" size="small">
            Załóż konto
          </Button>
        </div>
      </nav>
    </header>
  )
}
