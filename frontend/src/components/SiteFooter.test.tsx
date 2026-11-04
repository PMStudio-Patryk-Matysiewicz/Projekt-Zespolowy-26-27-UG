import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SiteFooter from './SiteFooter'

describe('SiteFooter', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('shows the short commit hash of the build', () => {
    vi.stubEnv('VITE_GIT_SHA', 'a1b2c3d')
    render(<SiteFooter />)

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Wersja a1b2c3d')
  })

  it('shows "dev" when the build has no commit hash', () => {
    vi.stubEnv('VITE_GIT_SHA', '')
    render(<SiteFooter />)

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Wersja dev')
  })
})
