import { useMatches } from 'react-router'

import { useAuth } from '../../auth/AuthContext'
import { formatChips } from '../../format'
import { useWallet, type WalletState } from '../../hooks/useWallet'
import { CoinIcon, UserIcon } from '../icons'
import styles from './TopBar.module.css'

// `handle` of a player route: the page title shown (as the page's h1) in the top bar.
// Routes without it (the lobby) show a greeting instead.
export type PageHandle = {
  title: string
  subtitle?: string
}

function balanceText(wallet: WalletState) {
  if (wallet.status === 'ready') return formatChips(wallet.balance)
  if (wallet.status === 'loading') return '…'
  return '—'
}

function usePageHandle(): PageHandle | undefined {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as Partial<PageHandle> | undefined
    if (handle?.title) return handle as PageHandle
  }
  return undefined
}

export default function TopBar() {
  const wallet = useWallet()
  const auth = useAuth()
  const page = usePageHandle()
  const name = auth.status === 'authenticated' ? auth.player.display_name || auth.player.username : undefined

  return (
    <header className={styles.topBar}>
      {page ? (
        <div>
          <h1 className={styles.greeting}>{page.title}</h1>
          {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
        </div>
      ) : (
        <div>
          <p className={styles.greeting}>{name ? `Cześć, ${name}!` : 'Cześć!'}</p>
          <p className={styles.subtitle}>Wybierz grę i graj bez ryzyka</p>
        </div>
      )}

      <div className={styles.right}>
        <p
          className={styles.balance}
          title={wallet.status === 'error' ? 'Nie udało się pobrać salda' : undefined}
        >
          <CoinIcon className={styles.coin} />
          <span className={styles.amount}>{balanceText(wallet)}</span>
          <span className={styles.unit}>żetonów</span>
        </p>
        <span className={styles.avatar}>
          <UserIcon className={styles.avatarIcon} />
        </span>
      </div>
    </header>
  )
}
