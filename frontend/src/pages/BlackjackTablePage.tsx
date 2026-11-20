import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { getTable, leaveTable, placeBet, playAction, type Action, type BlackjackTable } from '../api/blackjack'
import { ApiError } from '../api/client'
import { toFormErrors } from '../api/errors'
import { SETUP_PATH, validateBet } from '../blackjack'
import ActionBar from '../components/blackjack/ActionBar'
import BetBar from '../components/blackjack/BetBar'
import TableFelt from '../components/blackjack/TableFelt'
import TableHeader from '../components/blackjack/TableHeader'
import styles from './BlackjackTablePage.module.css'

type Load = { status: 'loading' } | { status: 'ready'; table: BlackjackTable } | { status: 'missing' } | { status: 'error' }

// Page 10: the blackjack table. Everything comes from the server (GET /api/blackjack/table),
// so a page refresh shows the same table, round and cards.
export default function BlackjackTablePage() {
  const navigate = useNavigate()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [bet, setBet] = useState(0)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    getTable()
      .then((table) => active && setLoad({ status: 'ready', table }))
      .catch((err) => {
        if (!active) return
        setLoad(err instanceof ApiError && err.status === 404 ? { status: 'missing' } : { status: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

  // No open table (never opened, or closed in another tab): pick a seat first.
  if (load.status === 'missing') return <Navigate to={SETUP_PATH} replace />

  if (load.status !== 'ready') {
    return (
      <div className={styles.center}>
        {load.status === 'loading' ? (
          <p role="status">Ładowanie stołu…</p>
        ) : (
          <p role="alert">Nie udało się wczytać stołu. Odśwież stronę, aby spróbować ponownie.</p>
        )}
      </div>
    )
  }

  const { table } = load

  // Sends one request; the answer is the whole new table.
  async function run(request: () => Promise<BlackjackTable>) {
    if (pending) return
    setError(undefined)
    setPending(true)
    try {
      const next = await request()
      setLoad({ status: 'ready', table: next })
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLoad({ status: 'missing' })
        return false
      }
      const { fields, form } = toFormErrors(err, ['amount', 'hand'])
      setError(fields.amount ?? fields.hand ?? form)
      return false
    } finally {
      setPending(false)
    }
  }

  async function deal(amount: number) {
    const message = validateBet(amount, table)
    if (message) {
      setError(message)
      return
    }
    if (await run(() => placeBet(amount))) setBet(0)
  }

  function act(action: Action) {
    const hand = table.turn?.hand ?? 0
    void run(() => playAction(action, hand))
  }

  async function leave() {
    if (pending) return
    setError(undefined)
    setPending(true)
    try {
      await leaveTable()
      navigate('/lobby')
    } catch (err) {
      setError(toFormErrors(err, []).form)
      setPending(false)
    }
  }

  const betting = table.phase !== 'player_turns'

  return (
    <div className={styles.page}>
      <TableHeader table={table} onLeave={leave} canLeave={betting && !pending} />

      <TableFelt table={table} />

      <div className={styles.controls}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {betting ? (
          <BetBar table={table} bet={bet} onBetChange={setBet} onDeal={deal} pending={pending} />
        ) : (
          <ActionBar actions={table.actions} onAction={act} pending={pending} />
        )}
      </div>
    </div>
  )
}
