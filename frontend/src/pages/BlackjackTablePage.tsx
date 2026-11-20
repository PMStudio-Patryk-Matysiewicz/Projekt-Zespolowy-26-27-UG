import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { getTable, leaveTable, placeBet, playAction, type Action, type BlackjackTable } from '../api/blackjack'
import { ApiError } from '../api/client'
import { toFormErrors } from '../api/errors'
import { lastBaseBet, playerHands, resultDelay, SETUP_PATH, validateBet } from '../blackjack'
import ActionBar from '../components/blackjack/ActionBar'
import BetBar from '../components/blackjack/BetBar'
import ResultBar from '../components/blackjack/ResultBar'
import RoundPanel from '../components/blackjack/RoundPanel'
import TableFelt from '../components/blackjack/TableFelt'
import TableHeader from '../components/blackjack/TableHeader'
import { motionAllowed } from '../motion'
import styles from './BlackjackTablePage.module.css'

type Load = { status: 'loading' } | { status: 'ready'; table: BlackjackTable } | { status: 'missing' } | { status: 'error' }

// Pages 10–12: the blackjack table — betting (10), the player's move (11) and the settled round (12).
// Everything comes from the server (GET /api/blackjack/table),
// so a page refresh shows the same table, round and cards.
export default function BlackjackTablePage() {
  const navigate = useNavigate()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [bet, setBet] = useState(0)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  // After a round: "Zmień stawkę" swaps the result bar for the bet bar.
  const [changingBet, setChangingBet] = useState(false)
  // When a round ends, the felt reveals the result after the dealer's cards have landed. Until
  // then the header, the panel and the bottom bar keep showing the table from before the result
  // (`held`), so the new balance and the outcome do not give it away.
  const [held, setHeld] = useState<{ table: BlackjackTable; ms: number } | null>(null)

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

  useEffect(() => {
    if (!held) return
    const timer = setTimeout(() => setHeld(null), held.ms)
    return () => clearTimeout(timer)
  }, [held])

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
      const roundJustEnded =
        next.phase === 'settled' && table.phase === 'player_turns' && next.round_no === table.round_no
      if (roundJustEnded && motionAllowed()) setHeld({ table, ms: resultDelay(next.dealer.cards.length) })
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
    if (await run(() => placeBet(amount))) {
      setBet(0)
      setChangingBet(false)
    }
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

  // Everything outside the felt shows `shown`: the table from before the result while it is held.
  const shown = held?.table ?? table
  const busy = pending || held !== null
  const betting = shown.phase !== 'player_turns'
  const hands = playerHands(shown)
  const nextBet = lastBaseBet(shown)

  // Bottom bar: the moves during the player's round (11), the result after it (12),
  // otherwise building a bet (10). While the result is held, the moves stay, disabled.
  let controls
  if (shown.phase === 'player_turns') {
    const hand = shown.turn?.seat === String(shown.seat) ? hands[shown.turn.hand] : undefined
    controls = <ActionBar hand={hand} actions={shown.actions} onAction={act} pending={busy} />
  } else if (shown.phase === 'settled' && !changingBet && nextBet !== undefined) {
    controls = (
      <ResultBar
        hands={hands}
        nextBet={nextBet}
        onNextRound={() => deal(nextBet)}
        onChangeBet={() => setChangingBet(true)}
        pending={busy}
      />
    )
  } else {
    controls = <BetBar table={shown} bet={bet} onBetChange={setBet} onDeal={deal} pending={busy} />
  }

  return (
    <div className={styles.page}>
      <TableHeader table={shown} onLeave={leave} canLeave={betting && !busy} />

      <div className={styles.main}>
        <TableFelt table={table} balance={shown.balance} />
        <RoundPanel table={shown} />
      </div>

      <div className={styles.controls}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {controls}
      </div>
    </div>
  )
}
