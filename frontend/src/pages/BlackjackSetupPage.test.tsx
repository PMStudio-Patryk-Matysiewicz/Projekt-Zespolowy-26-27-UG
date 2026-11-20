import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { blackjackServer, makeTable } from '../test/blackjackApi'
import { json } from '../test/fakeApi'
import { renderRoute } from '../test/renderRoute'

async function openSetup() {
  const result = renderRoute('/gry/blackjack')
  await screen.findByRole('group', { name: 'Wybierz miejsce przy stole' })
  return result
}

describe('BlackjackSetupPage', () => {
  it('offers seats 1–5, with seat 3 chosen at first', async () => {
    blackjackServer(null)
    await openSetup()

    const seats = within(screen.getByRole('group', { name: 'Wybierz miejsce przy stole' })).getAllByRole('radio')
    expect(seats.map((seat) => (seat as HTMLInputElement).value)).toEqual(['1', '2', '3', '4', '5'])
    expect(screen.getByRole('radio', { name: /Miejsce 3/ })).toBeChecked()
    expect(screen.getByText('Ty (miejsce 3)')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Zasady stołu' })).toHaveTextContent('10 – 1 000 żetonów')
  })

  it('opens a table at the chosen seat and shows it', async () => {
    const api = blackjackServer(null)
    const { router } = await openSetup()

    fireEvent.click(screen.getByRole('radio', { name: /Miejsce 5/ }))
    expect(screen.getByText('Ty (miejsce 5)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Usiądź przy stole' }))

    expect(await screen.findByText('Miejsce 5', { selector: 'li span' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/gry/blackjack/stol')
    const [, init] = api.callsTo('/api/blackjack/table').find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(String(init!.body))).toEqual({ seat: 5 })
    expect(api.server.table?.seat).toBe(5)
  })

  it('shows the error when the table cannot be opened', async () => {
    blackjackServer(null, {
      '/api/blackjack/table': (init) =>
        init?.method === 'POST' ? json({ seat: ['To miejsce jest zajęte.'] }, 400) : json({ detail: 'Not found.' }, 404),
    })
    await openSetup()

    fireEvent.click(screen.getByRole('button', { name: 'Usiądź przy stole' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('To miejsce jest zajęte.')
    expect(screen.getByRole('button', { name: 'Usiądź przy stole' })).toBeEnabled()
  })

  it('goes straight back to a table that is already open', async () => {
    blackjackServer(makeTable({ round_no: 4 }))
    const { router } = renderRoute('/gry/blackjack')

    expect(await screen.findByText('Runda 4')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/gry/blackjack/stol')
  })
})
