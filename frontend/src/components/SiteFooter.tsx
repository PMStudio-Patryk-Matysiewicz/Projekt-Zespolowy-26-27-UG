import styles from './SiteFooter.module.css'

// Computed once when the page loads, not on every render.
const year = new Date().getFullYear()

export default function SiteFooter() {
  // Read at render time so tests can stub it; 'dev' outside of a deployed build.
  const version = import.meta.env.VITE_GIT_SHA || 'dev'

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© {year} ZeroRisk · wirtualne żetony, bez prawdziwych pieniędzy</span>
        <span>
          Wersja <code className={styles.version}>{version}</code>
        </span>
      </div>
    </footer>
  )
}
