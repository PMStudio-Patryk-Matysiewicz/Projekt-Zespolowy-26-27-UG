import { Link } from 'react-router'

import { LogoMark } from './icons'
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
        <Link to="/logowanie" className={styles.login}>
          Zaloguj się
        </Link>
        <Link to="/rejestracja" className={styles.signup}>
          Załóż konto
        </Link>
      </nav>
    </header>
  )
}
