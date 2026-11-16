import { Outlet } from 'react-router'

import styles from './App.module.css'
import AuthProvider from './auth/AuthProvider'
import SiteFooter from './components/SiteFooter'

export default function App() {
  return (
    <AuthProvider>
      <div className={styles.layout}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </AuthProvider>
  )
}
