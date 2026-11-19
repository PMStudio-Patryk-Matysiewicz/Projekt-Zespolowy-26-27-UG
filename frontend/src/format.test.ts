import { describe, expect, it } from 'vitest'

import { formatChips, formatDateTime, formatDuration, formatSignedChips } from './format'

// Intl puts a non-breaking space between thousands; compare with a plain one.
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('format', () => {
  it('groups thousands, also in 4-digit numbers', () => {
    expect(plain(formatChips(950))).toBe('950')
    expect(plain(formatChips(9510))).toBe('9 510')
    expect(plain(formatChips(12450))).toBe('12 450')
  })

  it('shows the sign of an amount', () => {
    expect(plain(formatSignedChips(2840))).toBe('+2 840')
    expect(plain(formatSignedChips(-100))).toBe('-100')
    expect(formatSignedChips(0)).toBe('0')
  })

  it('formats a date as day.month, hour:minute', () => {
    expect(formatDateTime(new Date(2026, 9, 19, 9, 5))).toBe('19.10, 09:05')
  })

  it('formats a countdown', () => {
    const minute = 60_000
    expect(formatDuration((19 * 60 + 47) * minute)).toBe('19 h 47 min')
    expect(formatDuration(3 * 60 * minute)).toBe('3 h')
    expect(formatDuration(47 * minute + 30_000)).toBe('47 min')
    expect(formatDuration(20_000)).toBe('mniej niż minutę')
  })
})
