// Polish number and date formats used by the player pages.

// 'always': Polish skips the separator for 4-digit numbers by default ("9510"); we want "9 510".
const chips = new Intl.NumberFormat('pl-PL', { useGrouping: 'always' })
const dayMonth = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' })
const time = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' })

export function formatChips(amount: number): string {
  return chips.format(amount)
}

// "+200", "-100", "0"
export function formatSignedChips(amount: number): string {
  if (amount > 0) return `+${chips.format(amount)}`
  if (amount < 0) return `-${chips.format(-amount)}`
  return '0'
}

// "19.10, 13:02"
export function formatDateTime(date: Date): string {
  return `${dayMonth.format(date)}, ${time.format(date)}`
}

// "09:15"
export function formatTime(date: Date): string {
  return time.format(date)
}

// "19.10"
export function formatDayMonth(date: Date): string {
  return dayMonth.format(date)
}

// "19 h 47 min", "47 min", "mniej niż minutę"
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'mniej niż minutę'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
