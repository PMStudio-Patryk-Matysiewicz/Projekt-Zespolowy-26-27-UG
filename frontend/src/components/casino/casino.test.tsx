import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { cardName, fullDeck, parseCard } from '../../cards'
import Chip from './Chip'
import { toChips } from './chipValues'
import PlayingCard from './PlayingCard'

describe('cards', () => {
  it('has a standard deck of 52 different cards, without jokers', () => {
    expect(fullDeck).toHaveLength(52)
    expect(new Set(fullDeck).size).toBe(52)
    expect(fullDeck.every((code) => parseCard(code))).toBe(true)
  })

  it('names cards in Polish', () => {
    expect(cardName(parseCard('AH')!)).toBe('As kier')
    expect(cardName(parseCard('10C')!)).toBe('10 trefl')
    expect(cardName(parseCard('QS')!)).toBe('Dama pik')
    expect(cardName(parseCard('JD')!)).toBe('Walet karo')
    expect(cardName(parseCard('KH')!)).toBe('Król kier')
  })

  it('does not accept codes outside the deck', () => {
    for (const code of ['1H', '11S', 'AX', 'JOKER', '', 'H']) expect(parseCard(code)).toBeUndefined()
  })
})

describe('PlayingCard', () => {
  it('draws every card of the deck with its rank and suit', () => {
    for (const code of fullDeck) {
      const { unmount } = render(<PlayingCard code={code} />)
      const card = screen.getByRole('img', { name: cardName(parseCard(code)!) })
      expect(card).toHaveTextContent(code.slice(0, -1))
      unmount()
    }
  })

  it('draws hearts and diamonds red, clubs and spades black', () => {
    render(
      <>
        <PlayingCard code="AH" />
        <PlayingCard code="AS" />
      </>,
    )
    const red = screen.getByRole('img', { name: 'As kier' }).className
    const black = screen.getByRole('img', { name: 'As pik' }).className
    expect(red).not.toBe(black)
    expect(screen.getByRole('img', { name: 'As kier' })).toHaveTextContent('♥')
  })

  it('shows the back of a face-down card', () => {
    render(
      <>
        <PlayingCard code={null} />
        <PlayingCard />
      </>,
    )
    expect(screen.getAllByRole('img', { name: 'Karta zakryta' })).toHaveLength(2)
  })
})

describe('Chip', () => {
  it('is a picture by default and a button with onClick', () => {
    const onClick = vi.fn()
    render(
      <>
        <Chip value={100} />
        <Chip value={25} onClick={onClick} />
      </>,
    )

    expect(screen.getByRole('img', { name: 'Żeton 100' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Żeton 25' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('splits an amount into chips, biggest first', () => {
    expect(toChips(150)).toEqual([100, 25, 25])
    expect(toChips(1130)).toEqual([500, 500, 100, 25, 5])
    expect(toChips(3)).toEqual([])
  })
})
