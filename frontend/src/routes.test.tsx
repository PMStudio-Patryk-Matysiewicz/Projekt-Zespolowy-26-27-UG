import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from './test/renderRoute'

describe('routes', () => {
  it('shows the home page at /', async () => {
    renderRoute('/')

    expect(await screen.findByRole('heading', { name: 'ZeroRisk' })).toBeInTheDocument()
  })

  it('shows the not found page for an unknown URL', async () => {
    renderRoute('/nie-ma-takiej-strony')

    expect(await screen.findByRole('heading', { name: 'Nie znaleziono strony' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wróć na stronę główną' })).toHaveAttribute('href', '/')
  })
})
