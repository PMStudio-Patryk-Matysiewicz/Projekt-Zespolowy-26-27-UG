import { useEffect, useState } from 'react'

import { getWallet } from '../api/wallet'

export type WalletState =
  | { status: 'loading' }
  | { status: 'ready'; balance: number }
  | { status: 'error' }

// Loads the player's balance once when the component mounts.
export function useWallet(): WalletState {
  const [state, setState] = useState<WalletState>({ status: 'loading' })

  useEffect(() => {
    // Ignore a response that arrives after unmount (or after StrictMode's extra mount in dev).
    let active = true
    getWallet()
      .then(({ balance }) => {
        if (active) setState({ status: 'ready', balance })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
