import { Outlet } from 'react-router'

import styles from './PlayerLayout.module.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

// Layout for pages of a logged-in player: sidebar on the left, top bar with the balance.
// Wallet, history, profile and game pages can be added as children of this route.
export default function PlayerLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <TopBar />
        <div className={styles.page}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
