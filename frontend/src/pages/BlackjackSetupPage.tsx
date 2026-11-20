import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { getTable, openTable, SEATS } from '../api/blackjack'
import { ApiError } from '../api/client'
import { toFormErrors } from '../api/errors'
import { TABLE_PATH } from '../blackjack'
import SeatPicker from '../components/blackjack/SeatPicker'
import TableRules from '../components/blackjack/TableRules'
import styles from './BlackjackSetupPage.module.css'

type Check = 'checking' | 'open-table' | 'no-table'

// Page 09: open a blackjack table. The player picks a seat (1–5); bots come in a separate task.
// A player who already has an open table goes straight back to it.
export default function BlackjackSetupPage() {
  const navigate = useNavigate()
  const [check, setCheck] = useState<Check>('checking')
  const [seat, setSeat] = useState<number>(3)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getTable()
      .then(() => active && setCheck('open-table'))
      // 404 = no open table. Other errors: let the player try to open one; that shows the error.
      .catch(() => active && setCheck('no-table'))
    return () => {
      active = false
    }
  }, [])

  if (check === 'open-table') return <Navigate to={TABLE_PATH} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(undefined)
    setSubmitting(true)
    try {
      await openTable(seat)
      navigate(TABLE_PATH)
    } catch (err) {
      // 409 = a table is already open (e.g. in another tab): go to it.
      if (err instanceof ApiError && err.status === 409) {
        navigate(TABLE_PATH)
        return
      }
      const { fields, form } = toFormErrors(err, ['seat'])
      setError(fields.seat ?? form)
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Blackjack</h1>
        <p className={styles.subtitle}>Ustaw stół: wybierz swoje miejsce</p>
      </header>

      {check === 'checking' ? (
        <p role="status" className={styles.loading}>
          Sprawdzanie stołu…
        </p>
      ) : (
        <form className={styles.layout} onSubmit={handleSubmit}>
          <section className={styles.panel}>
            <SeatPicker seats={SEATS} value={seat} onChange={setSeat} disabled={submitting} />
          </section>

          <aside className={`${styles.panel} ${styles.side}`}>
            <TableRules />

            <div className={styles.summary}>
              <p className={styles.summaryLabel}>Przy stole</p>
              <p className={styles.summaryValue}>Ty (miejsce {seat})</p>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Otwieranie stołu…' : 'Usiądź przy stole'}
            </button>
          </aside>
        </form>
      )}
    </>
  )
}
