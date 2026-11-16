import type { ComponentType } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'

import { useAuth } from '../../auth/AuthContext'
import { games } from '../../games'
import {
  ClockIcon,
  HomeIcon,
  LogoMark,
  LogoutIcon,
  ShieldIcon,
  TrophyIcon,
  UserIcon,
  WalletIcon,
} from '../icons'
import Badge from '../ui/Badge'
import { gameIcons } from './gameIcons'
import styles from './Sidebar.module.css'

type Icon = ComponentType<{ className?: string }>

// Account pages do not exist yet; until they do, these links show the not found page.
const accountLinks: { to: string; label: string; Icon: Icon }[] = [
  { to: '/ranking', label: 'Ranking', Icon: TrophyIcon },
  { to: '/historia', label: 'Historia gier', Icon: ClockIcon },
  { to: '/portfel', label: 'Portfel', Icon: WalletIcon },
  { to: '/profil', label: 'Profil', Icon: UserIcon },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export default function Sidebar() {
  const navigate = useNavigate()
  const { logOut } = useAuth()

  // Leave the player pages first; otherwise ProtectedRoute would send us to the login page
  // as soon as the session is gone.
  async function handleLogOut() {
    await navigate('/')
    try {
      await logOut()
    } catch {
      // Request failed: the app forgets the player anyway (see AuthProvider.logOut).
    }
  }

  return (
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.logo}>
        <LogoMark className={styles.logoMark} />
        ZeroRisk
      </Link>

      <nav className={styles.nav} aria-label="Menu gracza">
        <p className={styles.section}>Gry</p>
        <ul className={styles.list}>
          <li>
            <NavLink to="/lobby" end className={linkClass}>
              <HomeIcon className={styles.icon} />
              Lobby
            </NavLink>
          </li>
          {games.map((game) => {
            const Icon = gameIcons[game.id]
            return (
              <li key={game.id}>
                {game.available ? (
                  <NavLink to={game.path} className={linkClass}>
                    <Icon className={styles.icon} />
                    {game.name}
                  </NavLink>
                ) : (
                  <span className={`${styles.link} ${styles.disabled}`} aria-disabled="true">
                    <Icon className={styles.icon} />
                    {game.name}
                    <Badge dot={false} className={styles.soon}>
                      wkrótce
                    </Badge>
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        <p className={styles.section}>Konto</p>
        <ul className={styles.list}>
          {accountLinks.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass}>
                <Icon className={styles.icon} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.bottom}>
        <div className={styles.note}>
          <p className={styles.noteTitle}>
            <ShieldIcon className={styles.icon} />
            Zero prawdziwych pieniędzy
          </p>
          <p className={styles.noteText}>Grasz wyłącznie wirtualnymi żetonami.</p>
        </div>
        <button type="button" className={styles.link} onClick={handleLogOut}>
          <LogoutIcon className={styles.icon} />
          Wyloguj się
        </button>
      </div>
    </aside>
  )
}
