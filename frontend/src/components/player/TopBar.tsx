import { useAuth } from '../../auth/AuthContext'
import { useWallet, type WalletState } from '../../hooks/useWallet'
import { CoinIcon, UserIcon } from '../icons'
import styles from './TopBar.module.css'

const chips = new Intl.NumberFormat('pl-PL')

function balanceText(wallet: WalletState) {
  if (wallet.status === 'ready') return chips.format(wallet.balance)
  if (wallet.status === 'loading') return '…'
  return '—'
}

export default function TopBar() {
  const wallet = useWallet()
  const auth = useAuth()
  const name = auth.status === 'authenticated' ? auth.player.display_name || auth.player.username : undefined

  return (
    <header className={styles.topBar}>
      <div>
        <p className={styles.greeting}>{name ? `Cześć, ${name}!` : 'Cześć!'}</p>
        <p className={styles.subtitle}>Wybierz grę i graj bez ryzyka</p>
      </div>

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
