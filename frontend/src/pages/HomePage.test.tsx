import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '../test/renderRoute'

describe('HomePage', () => {
  it('shows the header with log in and sign up links', async () => {
    renderRoute('/')

    const header = await screen.findByRole('banner')
    expect(within(header).getByRole('link', { name: 'ZeroRisk' })).toHaveAttribute('href', '/')
    expect(within(header).getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/logowanie')
    expect(within(header).getByRole('link', { name: 'Załóż konto' })).toHaveAttribute('href', '/rejestracja')
  })

  it('shows the hero with its calls to action', async () => {
    renderRoute('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Emocje kasyna. Zero ryzyka.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Odbierz 5\s000 żetonów na start$/ })).toHaveAttribute('href', '/rejestracja')
    expect(screen.getByRole('link', { name: 'Zobacz ranking' })).toHaveAttribute('href', '/ranking')
  })

  it('shows three feature tiles', async () => {
    renderRoute('/')

    const features = await screen.findByRole('region', { name: 'Jak to działa' })
    const titles = within(features)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual(['Boty AI jako przeciwnicy', 'Symulacja wyścigów konnych', 'Gry karciane'])
  })
})
