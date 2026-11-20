import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import * as icons from '../icons'
import Badge from './Badge'
import Button from './Button'

// <Button to> renders a router <Link>, which needs a router around it.
function renderWithRouter(element: React.ReactElement) {
  const router = createMemoryRouter([{ path: '*', element }])
  return render(<RouterProvider router={router} />)
}

describe('Button', () => {
  it('is a button of type "button" by default, so it never submits a form by accident', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Przycisk</Button>)

    const button = screen.getByRole('button', { name: 'Przycisk' })
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('can submit a form', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Wyślij</Button>
      </form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('does nothing when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Wkrótce
      </Button>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Wkrótce' }))
    expect(screen.getByRole('button', { name: 'Wkrótce' })).toBeDisabled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is a link when given `to`', () => {
    renderWithRouter(
      <Button to="/rejestracja" variant="secondary">
        Załóż konto
      </Button>,
    )

    expect(screen.getByRole('link', { name: 'Załóż konto' })).toHaveAttribute('href', '/rejestracja')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('gives each variant and size its own look', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'gold'] as const
    render(
      <>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button size="large">duży</Button>
      </>,
    )

    const classes = variants.map((variant) => screen.getByRole('button', { name: variant }).className)
    expect(new Set(classes).size).toBe(variants.length)
    expect(screen.getByRole('button', { name: 'duży' }).className).not.toBe(classes[0])
  })

  it('keeps extra props and classes', () => {
    render(
      <Button className="extra" aria-describedby="hint">
        Przycisk
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Przycisk' })
    expect(button).toHaveClass('extra')
    expect(button).toHaveAttribute('aria-describedby', 'hint')
  })
})

describe('Badge', () => {
  it('shows its text in one of five tones', () => {
    const tones = ['neutral', 'green', 'gold', 'red', 'blue'] as const
    render(
      <>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </>,
    )

    const classes = tones.map((tone) => screen.getByText(tone).className)
    expect(new Set(classes).size).toBe(tones.length)
  })

  it('can leave out the dot', () => {
    render(
      <>
        <Badge>z kropką</Badge>
        <Badge dot={false}>bez kropki</Badge>
      </>,
    )

    expect(screen.getByText('z kropką').className).not.toBe(screen.getByText('bez kropki').className)
  })
})

describe('icons', () => {
  it('has every icon from the design, all hidden from screen readers', () => {
    const names = [
      'HomeIcon',
      'SpadeIcon',
      'CardsIcon',
      'FlagIcon',
      'TrophyIcon',
      'ClockIcon',
      'WalletIcon',
      'UserIcon',
      'LogoutIcon',
      'GiftIcon',
      'CoinIcon',
      'ArrowLeftIcon',
      'ChevronRightIcon',
      'CheckIcon',
      'InfoIcon',
      'BoltIcon',
      'ShieldIcon',
      'BotIcon',
    ] as const

    const { container } = render(
      <>
        {names.map((name) => {
          const Icon = icons[name]
          return <Icon key={name} className={name} />
        })}
      </>,
    )

    for (const name of names) {
      const svg = container.querySelector(`svg.${name}`)
      expect(svg, name).not.toBeNull()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
